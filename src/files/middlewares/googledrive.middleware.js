const GoogleDriveHelper     = require('../helper/googledrive.helper');
const stream                = require('stream');
const RequestsModel         = require('../../requests/models/requests.model');

/**
 * Validate mimetype
 * @param  {req.file.mimetype} string Uploaded file Mimetype
 */
exports.validMimeType = async(req, res, next) => {
  if(!req.file || req.fileValidationError)
    return res.status(415).send({error:req.fileValidationError + ' Unsupported Media Type.'});
  return next();
}

/**
 * Validate mimetypes
 * @param  {req.files[RequestsModel.ATTACH_NOTA_FISCAL][0].mimetype} string Uploaded file Mimetype
 * @param  {req.files[RequestsModel.ATTACH_BOLETO_PAGAMENTO][0].mimetype} string Uploaded file Mimetype
 * @param  {req.files[RequestsModel.ATTACH_COMPROBANTE][0].mimetype} string Uploaded file Mimetype
 */
exports.validMimeTypes = async(req, res, next) => {
  if(req.fileValidationError)
    return res.status(415).send({error:req.fileValidationError + ' Unsupported Media Type.'});
  return next();
}

/**
 * Upload Attachments
 * @param  {req.body.from} string Account name
 * @param  {req.files[RequestsModel.ATTACH_NOTA_FISCAL][0]} file
 * @param  {req.files[RequestsModel.ATTACH_BOLETO_PAGAMENTO][0]} file
 * @param  {req.files[RequestsModel.ATTACH_COMPROBANTE][0]} file
 */
exports.uploadFiles = async(req, res, next) => {

  // const account           = req.body.from;
  const account           = req.body.request_object ? req.body.request_object.from : req.body.from;
  const fileNota          = req.files[RequestsModel.ATTACH_NOTA_FISCAL];
  const fileBoleto        = req.files[RequestsModel.ATTACH_BOLETO_PAGAMENTO];
  const fileComprobante   = req.files[RequestsModel.ATTACH_COMPROBANTE];

  let folder_id = undefined;
  try {
      folder_id = await GoogleDriveHelper.getFolderId(account);
  } catch (e) {
    return res.status(404).send({error:' unable to retrieve folder from Google Drive.', message:JSON.stringify(e)});
    return;
  }
  if(!folder_id){
    try {
      folder_id = await GoogleDriveHelper.createFolder(account);
    } catch (e) {
      // console.log('********CANT CREATE FOLDER:', JSON.stringify(e));
      return res.status(404).send({error:' unable to create folder at Google Drive.', message:JSON.stringify(e)});
      return;
    }
  }

  if(!folder_id)
  {
    return res.status(404).send({error:' unable to retrieve nor create folder at Google Drive.', message: 'NA'});
  }

  let promises = [
    uploadFile(fileNota, folder_id),
    uploadFile(fileBoleto, folder_id),
    uploadFile(fileComprobante, folder_id),
  ];

  let values;
  try{
    values = await Promise.all(promises);
    // req.body.attachment_ids = {
    //   [RequestsModel.ATTACH_NOTA_FISCAL_ID]         : values[0]
    //   , [RequestsModel.ATTACH_BOLETO_PAGAMENTO_ID]  : values[1]
    //   , [RequestsModel.ATTACH_COMPROBANTE_ID]       : values[2]
    // }
    if(values[0])
      req.body[RequestsModel.ATTACH_NOTA_FISCAL_ID]       = values[0];
    if(values[1])
      req.body[RequestsModel.ATTACH_BOLETO_PAGAMENTO_ID]  = values[1];
    if(values[2])
      req.body[RequestsModel.ATTACH_COMPROBANTE_ID]       = values[2];
  }
  catch(err){
    console.log(' -- ERROR #UPLOADING FILES', JSON.stringify(err))
    return res.status(404).send({error:err});
  }
  return next();
}

const uploadFile = (file, folder_id) =>   new Promise((res,rej)=> {


  if(!file || file.length==0 )
  {
    res(undefined);
    // console.log( ' -- uploadFile > NOT A FILE. ')
    return;
  }
  // console.log( ' -- uploadFile > YES A FILE. ')
  const bufferStream      = new stream.PassThrough();
  bufferStream.end(file[0].buffer);

  GoogleDriveHelper.uploadFile(bufferStream, file[0].originalname, folder_id)
    .then((file_id) => {
      res(file_id);
    }, (err2)=>{
      rej({message : 'File could not be uploaded.',  error: JSON.stringify(err2)});
    });

});
