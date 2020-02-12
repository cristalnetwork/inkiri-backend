//const credentials   = require('../../common/config/credentials.json');
const {google}      = require('googleapis');
const config        = require('../../common/config/env.config.js');
var moment          = require('moment');
var credentials     = null;
try {
    credentials   = require('../../common/config/credentials.json');
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
exports.auth = auth;
// console.log(' ** process.env.GDRIVE_CLIENT_EMAIL ** >> ', process.env.GDRIVE_CLIENT_EMAIL);

const drive = google.drive({ version: 'v3', auth });
exports.drive = drive;

const formatFileNameImpl = (original_filename) => {
  return moment().format('YYYY-MM-DD.HH:mm:ss') + ' ' + original_filename;
}
exports.formatFileName = (original_filename) => formatFileNameImpl(original_filename);

exports.getFolderId = async(folder_name) => {
  return new Promise( (resolve, reject) => {
    drive
      .files.list({
        q: "mimeType = 'application/vnd.google-apps.folder' and name = '"+folder_name+"'"
        , fields: 'files(id, name, parents, spaces, driveId, ownedByMe)'
        , parents : [config.google.root_folder_id]
        , spaces: 'drive'
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
    }, async function (err, result) {
      console.error(' GoogleDriveHelper >> createFolder err: ', JSON.stringify(err));
      console.error(' GoogleDriveHelper >> createFolder result: ', JSON.stringify(result));

      if (err) {
        reject(err);
        // res.send({error:' ** createFolder ERROR: '+JSON.stringify(err)});
      } else {
        // res.send({ok : ' -- createFolder OK.', folder_id:result.id});
        console.log('-- createFolder OK: ', result.data.id);

        const share_file=  await drive.permissions.create({
          fileId: result.data.id,
          resource: {
            role:"reader",
            type: "anyone",
            allowFileDiscovery: true
          }
        });

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

exports.createSheet = async (json, original_name, account_name, folder_id) => {
  console.log(' GoogleDriveHelper::createSheet: ' )
  console.log(' -- original_name: ' , original_name);
  console.log(' -- folder_id: ' , folder_id );

  // 1.- Validate if customer's account  folder exists in drive.
  if(!folder_id)
  {
    let my_folder_id = undefined;
    try {
        my_folder_id = await exports.getFolderId(account_name);
    } catch (e) {
      // reject({error:' unable to retrieve folder from Google Drive #1.', original:e});
      // return;
      return {error:' unable to retrieve folder from Google Drive #1.', original:e};
    }
    if(!my_folder_id){
      try {
        // 1.1.- Create customer's account folder in drive.
        my_folder_id = await exports.createFolder(account_name);
      } catch (e) {
        // reject({error:' unable to create folder at Google Drive #2.', original:e});
        // return;
        return {error:' unable to create folder at Google Drive #2.', original:e};
      }
    }

    if(!my_folder_id)
    {
      // reject({error:' unable to retrieve nor create folder at Google Drive #3.', message: 'NA'});
      // return;
      return {error:' unable to retrieve nor create folder at Google Drive #3.', message: 'NA'};
    }
    folder_id = my_folder_id;
  }
  
  console.log(' -- folder_id: ' , folder_id );

  // 2.- Create sheet
  console.log('**************** 2.- Create sheet')
  const sheets = await google.sheets({ version: 'v4', auth });
  var request = {
    resource: {
      properties: {
          title: original_name,
        }
    },
    fields: 'spreadsheetId'
  };

  let spreadsheetId = null;
  
  try{
    const res = await sheets.spreadsheets.create(request);
    if(res && res.data && res.data.spreadsheetId)
    {
      console.log(' -- OK#1: ', res);
      spreadsheetId = res.data.spreadsheetId;
    };
  }catch(e1){
    // reject(e1);
    // return;
    return {error:e1};
  }

  // 3.- Add sharing permission to file (anyone with the link can view)
  console.log('**************** 3.- Add sharing permission to file')
  let share_file = null;
  try{
    share_file = await drive.permissions.create({
      fileId: spreadsheetId,
      resource: {
        role:"reader",
        type: "anyone",
        allowFileDiscovery: true
      }
    });
  }
  catch(e){
    return {error:e};
  }
  
  
  // 4.-  Move file to user's drive folder
  console.log('**************** 4.-  Move file to users drive folder')
  let moved_file = null;
  try{
    moved_file = await drive.files.update({
      fileId: spreadsheetId,
      addParents: folder_id,
      fields: 'id, parents'
    });
  }
  catch(e){
    return {error:e};
  }
  
  // 5.- Write json values
  console.log('**************** 5.-  Write json values')
  const resource = {
    values:json,
  };

  try{
    const res = await sheets.spreadsheets.values.update({
                    spreadsheetId:      spreadsheetId
                    , range:            "Sheet1!A1"
                    , valueInputOption: "RAW"
                    , resource
                  });
    // console.log(' -- retornoo.....: ', res);
    if(res && res.status==200)
    {
      console.log(' -- OK#2: ');
      // resolve(spreadsheetId)
      // return;
      return {spreadsheetId:spreadsheetId}
    }
    else{
      console.log(' -- ERROR???#FINAL: ');
      return {error:res.data.error||'NO SE QUE PASO'}
    }
  }catch(e2){
    // reject(e2);
    return {error:e2};
  }            
};

exports.getSheetReader = async () => {
  const sheets = await google.sheets({ version: 'v4', auth });
  return sheets;
}