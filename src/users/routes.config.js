const UsersController         = require('./controllers/users.controller');
const UsersMiddleware         = require('./middlewares/users.middleware.js');
const PermissionMiddleware    = require('../common/middlewares/auth.permission.middleware');
const ValidationMiddleware    = require('../common/middlewares/auth.validation.middleware');
const config                  = require('../common/config/env.config');

exports.routesConfig = function (app) {
    app.get('/ping', [
        UsersController.ping
    ]);
    app.get(config.api_version+'/ping', [
        UsersController.ping
    ]);

    app.post(config.api_version+'/users', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        UsersController.insert
    ]);

    app.get(config.api_version+'/users', [
        ValidationMiddleware.validJWTNeeded,
        UsersController.list
    ]);

    app.get(config.api_version+'/users/:userId', [
        ValidationMiddleware.validJWTNeeded,
        UsersController.getById
    ]);
    app.patch(config.api_version+'/users/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasWritePermissionOnUser,
        UsersController.patchById
    ]);
    app.delete(config.api_version+'/users/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        UsersController.removeById
    ]);

    app.get(config.api_version+'/users_by_account/:accountName', [
        ValidationMiddleware.validJWTNeeded,
        UsersController.getByAccountName
    ]);


};
