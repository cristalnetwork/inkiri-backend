/**
 * Validate mimetypes
 * @param  {req.file.mimetype} string Uploaded file Mimetype
 */
exports.validMimeTypes = async(req, res, next) => {
  if(!req.file || req.fileValidationError)
    return res.status(415).send({error:req.fileValidationError + ' Unsupported Media Type.'});
  return next();
}
