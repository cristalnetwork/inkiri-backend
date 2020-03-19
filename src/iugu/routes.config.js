const IuguController            = require('./controllers/iugu.controller');
const IuguModel                 = require('./models/iugu.model');
const config                    = require('../common/config/env.config');
const ValidationMiddleware      = require('../common/middlewares/auth.validation.middleware');
const PermissionMiddleware      = require('../common/middlewares/auth.permission.middleware');

exports.routesConfig = function (app) {

    // app.get(config.api_version+'/iugu_importer/:task', [
    //     ValidationMiddleware.validJWTNeeded,
    //     PermissionMiddleware.loggedHasAdminWritePermission,
    //     IuguController.import
    // ]);

    app.post(config.api_version+'/iugu', [
      ValidationMiddleware.validJWTNeeded,
      PermissionMiddleware.loggedHasAdminWritePermission,
      IuguController.insert
    ]);

    app.get(config.api_version+'/iugu', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        IuguController.list
    ]);

    app.get(config.api_version+'/iugu/:invoiceId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        IuguController.getById
    ]);

    app.get(config.api_version+'/iugu_process/:invoiceId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        IuguController.reprocess
    ]);

    app.post(config.api_version+'/iugu_alias/:invoiceId/:accountName', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        IuguController.updateAlias
    ]);

    app.delete(config.api_version+'/iugu/:invoiceId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        IuguController.removeById
    ]);

};
