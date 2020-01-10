const ConfigController      = require('./controllers/configuration.controller');
const ConfigMiddleware      = require('./middlewares/configuration.middleware.js');
const ValidationMiddleware  = require('../common/middlewares/auth.validation.middleware');
const config                = require('../common/config/env.config');
const PermissionMiddleware  = require('../common/middlewares/auth.permission.middleware');

exports.routesConfig = function (app) {

    app.get(config.api_version+'/config_init', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        ConfigController.init
    ]);

    app.post(config.api_version+'/config', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        ConfigMiddleware.validAccountReferences,
        ConfigController.insert
    ]);

    app.patch(config.api_version+'/config/:configId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        ConfigMiddleware.validAccountReferences,
        ConfigController.patchById
    ]);

    app.delete(config.api_version+'/config/:configId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        ConfigController.removeById
    ]);

};
