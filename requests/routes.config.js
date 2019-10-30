const VerifyRequestMiddleware = require('./middlewares/verify.request.middleware');
const RequestStateMachineMiddleware = require('./middlewares/state_machine.middleware');
const RequestsController      = require('./controllers/requests.controller');
const RequestsModel           = require('./models/requests.model');
const PermissionMiddleware    = require('../common/middlewares/auth.permission.middleware');
const ValidationMiddleware    = require('../common/middlewares/auth.validation.middleware');
const config                  = require('../common/config/env.config');
const GoogleDriveMiddleware   = require('../files/middlewares/googledrive.middleware');
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
    app.post(config.api_version+'/requests', [
        ValidationMiddleware.validJWTNeeded,
        VerifyRequestMiddleware.validAccountReferences,
        VerifyRequestMiddleware.validRequiredFields,
        RequestsController.insert
    ]);

    app.get(config.api_version+'/requests', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(OPS),
        RequestsController.list
    ]);
    app.get(config.api_version+'/requests/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        // PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        RequestsController.getById
    ]);
    app.patch(config.api_version+'/requests/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        VerifyRequestMiddleware.validRequestObject,
        RequestStateMachineMiddleware.validateTransition,
        // PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        // PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        RequestsController.patchById
    ]);
    app.delete(config.api_version+'/requests/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(OPS),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        RequestsController.removeById
    ]);


    app.post(config.api_version+'/requests_files'
        , multer_multi_file_conf
        ,[
          ValidationMiddleware.validJWTNeeded,
          VerifyRequestMiddleware.validAccountReferences,
          VerifyRequestMiddleware.validRequiredFields,
          VerifyRequestMiddleware.explodeFormData,
          GoogleDriveMiddleware.validMimeTypes,
          GoogleDriveMiddleware.uploadFiles,
          RequestsController.insert_files
        ]
    );

    app.post(config.api_version+'/requests_files/:requestId'
        , multer_multi_file_conf
        ,[
          ValidationMiddleware.validJWTNeeded,
          // VerifyRequestMiddleware.validAccountReferences,
          // VerifyRequestMiddleware.validRequiredFields,
          VerifyRequestMiddleware.explodeFormData,
          GoogleDriveMiddleware.validMimeTypes,
          RequestStateMachineMiddleware.validateTransition,
          GoogleDriveMiddleware.uploadFiles,
          RequestsController.update_files
        ]
    );

};
