const UsersController         = require('./controllers/users.controller');
const UsersMiddleware         = require('./middlewares/users.middleware.js');
const PermissionMiddleware    = require('../common/middlewares/auth.permission.middleware');
const ValidationMiddleware    = require('../common/middlewares/auth.validation.middleware');
const config                  = require('../common/config/env.config');

const ADMIN = config.permission_levels.ADMIN;
const OPS = config.permission_levels.OPS_USER;
const FREE = config.permission_levels.NORMAL_USER;

exports.routesConfig = function (app) {
    app.get('/ping', [
        UsersController.ping
    ]);
    app.get(config.api_version+'/ping', [
        UsersController.ping
    ]);

    app.post(config.api_version+'/users', [
        ValidationMiddleware.validJWTNeeded,

        UsersController.insert
    ]);

    app.get(config.api_version+'/users', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(OPS),
        UsersController.list
    ]);

    app.get(config.api_version+'/users/:userId', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        // PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        UsersController.getById
    ]);
    app.patch(config.api_version+'/users/:userId', [
        ValidationMiddleware.validJWTNeeded,
        //UsersMiddleware.validateWriteAuth,
        PermissionMiddleware.loggedHasWritePermissionOnUser,
        UsersController.patchById
    ]);
    app.delete(config.api_version+'/users/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        UsersController.removeById
    ]);

    app.get(config.api_version+'/users_by_account/:accountName', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        // PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        UsersController.getByAccountName
    ]);


};
