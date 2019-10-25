const FilesController       = require('./controllers/files.controller');
const RequestsModel         = require('../requests/models/requests.model');
const PermissionMiddleware  = require('../common/middlewares/auth.permission.middleware');
const ValidationMiddleware  = require('../common/middlewares/auth.validation.middleware');
const config                = require('../common/config/env.config');
const GoogleDriveMiddleware = require('./middlewares/googledrive.middleware');

var Multer  = require('multer');
const multer = Multer({
  storage: Multer.MemoryStorage
  , limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
  }
  , fileFilter: function (req, file, cb) {
      const accepted_mime_types = [ "application/pdf", "image/png", "image/jpeg"];
      console.log('** Multer.fileFilter => ', file.mimetype)
      if (!accepted_mime_types.includes(file.mimetype) ) {
          req.fileValidationError = 'Wrong mimetype. Only PDF, PNG ad JPG/JPEG files accepted!';
          return cb(null, false, new Error('Only PDF, PNG ad JPG/JPEG files accepted!'));
      }
      cb(null, true);
    }
});

var multer_multi_file_conf = multer.fields([
  { name: RequestsModel.ATTACH_NOTA_FISCAL, maxCount: 1 },
  { name: RequestsModel.ATTACH_BOLETO_PAGAMENTO, maxCount: 1 },
  { name: RequestsModel.ATTACH_COMPROBANTE, maxCount: 1 }
]);

const ADMIN = config.permission_levels.ADMIN;
const OPS = config.permission_levels.OPS_USER;
const FREE = config.permission_levels.NORMAL_USER;

exports.routesConfig = function (app) {
    app.post(config.api_version+'/files'
        , multer.single('file')
        ,[
          ValidationMiddleware.validJWTNeeded,
          GoogleDriveMiddleware.validMimeType,
          FilesController.insert
        ]
    );

    app.post(config.api_version+'/files_multi'
        , multer_multi_file_conf
        ,[
          ValidationMiddleware.validJWTNeeded,
          GoogleDriveMiddleware.validMimeTypes,
          GoogleDriveMiddleware.uploadFiles,
          FilesController.insert_multi
        ]
    );


    app.delete(config.api_version+'/files/:fileId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        FilesController.removeById
    ]);
};
