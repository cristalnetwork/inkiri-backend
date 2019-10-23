const {google}              = require('googleapis');
const config                = require('../../common/config/env.config.js');
const GoogleDriveHelper     = require('../helper/googledrive.helper');

const stream = require('stream');

exports.insert = async (req, res) => {

  const account       = req.body.account;
  const fileObject    = req.file;
  const bufferStream  = new stream.PassThrough();
  bufferStream.end(fileObject.buffer);

  let folder_id = undefined;
  try {
      folder_id = await GoogleDriveHelper.getFolderId(account);
  } catch (e) {
    res.status(404).send({error:' unable to retrieve folder from Google Drive.', message:JSON.stringify(e)});
    return;
  }
  if(!folder_id){
    try {
      folder_id = await GoogleDriveHelper.createFolder(account);
    } catch (e) {
      res.status(404).send({error:' unable to create folder at Google Drive.', message:JSON.stringify(e)});
      return;
    }
  }

  if(!folder_id)
  {
    res.status(404).send({error:' unable to retrieve nor create folder at Google Drive.', message: 'NA'});
    return;
  }

  GoogleDriveHelper.uploadFile(bufferStream, req.file.originalname, folder_id)
    .then((file_id) => {
      res.send({message : 'File uploaded successfuly', file_id:file_id});
    }, (err2)=>{
      res.status(404).send({message : 'File could not be uploaded.',  error: JSON.stringify(err2)});
    });

  // GoogleDriveHelper.getFolderId(account)
  //   .then((folder_id) => {
  //       if(!folder_id){
  //         try {
  //           folder_id = await GoogleDriveHelper.createFolder(account);
  //         } catch (e) {
  //           res.status(404).send({error:' unable to create folder at Google Drive.', message:JSON.stringify(e)});
  //           return;
  //         }
  //         if(!folder_id)
  //           res.status(404).send({error:' unable to create folder at Google Drive.', message: 'NA'});
  //       }
  //
  //       GoogleDriveHelper.uploadFile(bufferStream, req.file.originalname, folder_id)
  //         .then((file_id) => {
  //           res.send({message : 'File uploaded successfuly', file_id:file_id});
  //         }, (err2)=>{
  //           res.status(404).send({message : 'File could not be uploaded.',  error: JSON.stringify(err2)});
  //         });
  //
  //   }, (err)=>{
  //       res.status(404).send({error:' Unable to get folder at Google Drive.', message: JSON.stringify(err)});
  //   });



}

// exports.insertOLD = (req, res) => {
//
//     let account = req.body.account;
//     console.log(' -- req.jwt: ', JSON.stringify(req.jwt));
//     console.log(' -- account: ', account);
//
//     let fileObject = req.file;
//     let bufferStream = new stream.PassThrough();
//     bufferStream.end(fileObject.buffer);
//
//
//     GoogleDriveHelper.drive
//       .files.list({
//         //q: "mimeType = 'application/vnd.google-apps.folder' and name = 'dummy'"
//         q: "mimeType = 'application/vnd.google-apps.folder' and name = '"+account+"'"
//         , fields: 'files(id, name, parents, spaces, driveId, ownedByMe)'
//         // fields => https://developers.google.com/drive/api/v3/reference/files#resource
//         // fields =>
//         , parents : [config.google.root_folder_id]
//         // , driveId : config.google.root_folder_id
//         , spaces: 'drive'
//         // , corpora: 'drive'
//         , includeItemsFromAllDrives:'true'
//         , supportsAllDrives:'true'
//       }, function (err, result) {
//         console.log(JSON.stringify(result))
//         if (err) {
//           // Handle error
//           console.error(' ** getFolderIdOrCreate ERROR: ', err);
//           res.send({error:' -- getFolderIdOrCreate ERROR '+JSON.stringify(err)});
//         } else {
//           let folder_id = undefined;
//           if(result &&  result.data && result.data.files && result.data.files.length>0)
//           {
//             for (let i = 0; i < result.data.files.length; i++) {
//               const file = result.data.files[i];
//               if(file.parents.includes(config.google.root_folder_id))
//               {
//                 folder_id=file.id;
//                 break;
//               }
//             }
//           }
//
//           if(!folder_id)
//           {
//             // Lets create folder
//             var fileMetadata = {
//               'name': account
//               , 'mimeType': 'application/vnd.google-apps.folder'
//               , parents : [config.google.root_folder_id]
//             };
//             GoogleDriveHelper.drive
//               .files.create({
//                 resource: fileMetadata
//                 , fields: 'id'
//                 , parents : [config.google.root_folder_id]
//               }, function (err2, result2) {
//                 console.error(' ** createFolder err2: ', JSON.stringify(err2));
//                 console.error(' ** createFolder result2: ', JSON.stringify(result2));
//
//                 if (err) {
//                   // Handle error
//                   console.error(' ** createFolder ERROR: ',err2);
//                   res.send({error:' ** createFolder ERROR: '+JSON.stringify(err2)});
//                 } else {
//                   // res.send({ok : ' -- createFolder OK.', folder_id:result2.id});
//                   console.log('-- createFolder OK: ', result2.id);
//                   folder_id = result2.id;
//                   uploadFile(bufferStream, req.file.originalname, folder_id, res);
//                 }
//               });
//           }
//           else{
//             uploadFile(bufferStream, req.file.originalname, folder_id, res);
//           }
//         }
//
//       });
//
// };
//
// uploadFile = (bytes, original_name, folder_id, res) => {
//   GoogleDriveHelper.drive
//     .files.create({
//           media: {
//               body: bytes
//           },
//           resource: {
//               name:     GoogleDriveHelper.formatFileName(original_name),
//               parents:  [folder_id]
//               // parents : [config.google.root_folder_id]
//           },
//           fields: 'id',
//       }).then(function (resp) {
//           res.send({ok : 'File uploaded successfuly', folder_id:resp.data.id});
//           // console.log(' FILE CREATED: ', JSON.stringify(resp));
//       }).catch(function (error) {
//           res.send({error : 'File not uploaded. Error: '+JSON.stringify(error)});
//           // console.log(error);
//       })
// }

exports.removeById = (req, res) => {
    res.status(501).send({error:'NOT IMPLEMENTED YET'});
};
