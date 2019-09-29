const ProvidersController = require('./controllers/providers.controller');
const PermissionMiddleware = require('../common/middlewares/auth.permission.middleware');
const ValidationMiddleware = require('../common/middlewares/auth.validation.middleware');
const VerifyProviderMiddleware = require('./middlewares/verify.provider.middleware');

const config = require('../common/config/env.config');

const ADMIN = config.permission_levels.ADMIN;
const OPS = config.permission_levels.OPS_USER;
const FREE = config.permission_levels.NORMAL_USER;

exports.routesConfig = function (app) {
    
    app.post(config.api_version+'/providers', [
        ValidationMiddleware.validJWTNeeded,
        VerifyProviderMiddleware.validAccountReferences,
        ProvidersController.insert
    ]);
    app.get(config.api_version+'/providers', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(OPS),
        ProvidersController.list
    ]);
    app.get(config.api_version+'/providers/:providerId', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        // PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        ProvidersController.getById
    ]);
    app.patch(config.api_version+'/providers/:providerId', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        // PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        VerifyProviderMiddleware.validAccountReferences,
        ProvidersController.patchById
    ]);
    app.delete(config.api_version+'/providers/:providerId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        ProvidersController.removeById
    ]);
};