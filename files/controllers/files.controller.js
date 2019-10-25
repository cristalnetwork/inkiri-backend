const config                = require('../../common/config/env.config.js');
const GoogleDriveHelper     = require('../helper/googledrive.helper');

const stream                = require('stream');

const RequestsModel         = require('../../requests/models/requests.model');


exports.insert_multi = async (req, res) => {

  console.log( ' ** insert_multi IDs: ',
                  'ATTACH_NOTA_FISCAL_ID >> ', req.body[RequestsModel.ATTACH_NOTA_FISCAL_ID]
                  , '|| ATTACH_BOLETO_PAGAMENTO_ID >> ', req.body[RequestsModel.ATTACH_BOLETO_PAGAMENTO_ID]
                  , '|| ATTACH_COMPROBANTE_ID >> :', req.body[RequestsModel.ATTACH_COMPROBANTE_ID]
                  , req.body.request)

  res.send({
    message     : 'Files uploaded successfuly'
    , file_ids  :  [req.body[RequestsModel.ATTACH_NOTA_FISCAL_ID]
                    , req.body[RequestsModel.ATTACH_BOLETO_PAGAMENTO_ID]
                    , req.body[RequestsModel.ATTACH_COMPROBANTE_ID]]
    , request   : req.body.request
  });
};

exports.insert = async (req, res) => {

  const account       = req.body.from;
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

}

exports.removeById = (req, res) => {
    res.status(501).send({error:'NOT IMPLEMENTED YET'});
};
