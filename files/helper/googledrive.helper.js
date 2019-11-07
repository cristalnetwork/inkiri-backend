//const credentials   = require('../../common/config/credentials.json');
const {google}      = require('googleapis');
const config        = require('../../common/config/env.config.js');
var moment = require('moment');
var credentials = null;
try {
    credentials   = require('../../common/config/credentials.json');
    // do stuff
} catch (ex) {

}

/*
* +info at https://developers.google.com/identity/protocols/googlescopes
*/
// const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const GDRIVE_CLIENT_EMAIL = process.env.GDRIVE_CLIENT_EMAIL || credentials.client_email
const GDRIVE_PRIVATE_KEY  = process.env.GDRIVE_PRIVATE_KEY || credentials.private_key

const auth = new google.auth.JWT(
    GDRIVE_CLIENT_EMAIL
    , null
    , GDRIVE_PRIVATE_KEY
    , SCOPES
  );

// console.log(' ** process.env.GDRIVE_CLIENT_EMAIL ** >> ', process.env.GDRIVE_CLIENT_EMAIL);

const drive = google.drive({ version: 'v3', auth });
exports.drive = drive;

const formatFileNameImpl = (original_filename) => {
  return moment().format('YYYY-MM-DD.hh:mm:ss') + ' ' + original_filename;
}
exports.formatFileName = (original_filename) => formatFileNameImpl(original_filename);

exports.getFolderId = async(folder_name) => {
  return new Promise( (resolve, reject) => {
    drive
      .files.list({
        //q: "mimeType = 'application/vnd.google-apps.folder' and name = 'dummy'"
        q: "mimeType = 'application/vnd.google-apps.folder' and name = '"+folder_name+"'"
        , fields: 'files(id, name, parents, spaces, driveId, ownedByMe)'
        // fields => https://developers.google.com/drive/api/v3/reference/files#resource
        // fields =>
        , parents : [config.google.root_folder_id]
        // , driveId : config.google.root_folder_id
        , spaces: 'drive'
        // , corpora: 'drive'
        , includeItemsFromAllDrives:'true'
        , supportsAllDrives:'true'
      }, function (err, result) {
        if (err) {
          reject(err);
        } else {
          let folder_id = undefined;
          if(result &&  result.data && result.data.files && result.data.files.length>0)
          {
            for (let i = 0; i < result.data.files.length; i++) {
              const file = result.data.files[i];
              if(file && file.parents && file.parents.includes(config.google.root_folder_id))
              {
                folder_id=file.id;
                break;
              }
            }
          }
          resolve(folder_id);
        }
    });
  });
};

exports.createFolder = async(folder_name) => {

  return new Promise( (resolve, reject) => {
    var fileMetadata = {
      'name': folder_name
      , 'mimeType': 'application/vnd.google-apps.folder'
      , parents : [config.google.root_folder_id]
    };
    drive
      .files.create({
        resource: fileMetadata
        , fields: 'id'
        , parents : [config.google.root_folder_id]
      }, function (err, result) {
        // console.error(' GoogleDriveHelper >> createFolder err: ', JSON.stringify(err));
        // console.error(' GoogleDriveHelper >> createFolder OK result: ', JSON.stringify(result));

        if (err) {
          reject(err);
          return;
        }

        resolve(result.data.id);


      });
  });

};


exports.createFolderSync = (folder_name) => new Promise((resolve, reject) => {

  var fileMetadata = {
    'name': folder_name
    , 'mimeType': 'application/vnd.google-apps.folder'
    , parents : [config.google.root_folder_id]
  };
  drive
    .files.create({
      resource: fileMetadata
      , fields: 'id'
      , parents : [config.google.root_folder_id]
    }, function (err, result) {
      console.error(' GoogleDriveHelper >> createFolder err: ', JSON.stringify(err));
      console.error(' GoogleDriveHelper >> createFolder result: ', JSON.stringify(result));

      if (err) {
        reject(err);
        // res.send({error:' ** createFolder ERROR: '+JSON.stringify(err)});
      } else {
        // res.send({ok : ' -- createFolder OK.', folder_id:result.id});
        console.log('-- createFolder OK: ', result.data.id);
        resolve(result.data.id);

      }
    });
});

exports.uploadFile = async (bytes, original_name, folder_id) => {
  console.log(' GoogleDriveHelper::uploadFile: ' )
  console.log(' -- original_name: ' , original_name);
  console.log(' -- folder_id: ' , folder_id );

  return new Promise( (resolve, reject) => {
    drive
      .files.create({
            media: {
                body: bytes
            },
            resource: {
                name:     formatFileNameImpl(original_name),
                parents:  [folder_id]
            },
            fields: 'id',
        }, function (err, result) {
          if(err)
          {
            reject(err);
            return;
          }
          if(result && result.data && result.data.id)
          {
            resolve(result.data.id)
            return;
          };
          reject(new Error("Unable to get uploaded file id."))

        })
    });
};
