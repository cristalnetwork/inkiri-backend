const ProvidersController      = require('./controllers/providers.controller');
const ProvidersMiddleware      = require('./middlewares/providers.middleware.js');
const ValidationMiddleware     = require('../common/middlewares/auth.validation.middleware');
const VerifyProviderMiddleware = require('./middlewares/verify.provider.middleware');

const config = require('../common/config/env.config');

exports.routesConfig = function (app) {

    app.post(config.api_version+'/providers', [
        ValidationMiddleware.validJWTNeeded,
        ProvidersMiddleware.validateWriteAuth,
        VerifyProviderMiddleware.validAccountReferences,
        ProvidersController.insert
    ]);
    app.get(config.api_version+'/providers', [
        ValidationMiddleware.validJWTNeeded,
        ProvidersController.list
    ]);
    app.get(config.api_version+'/providers/:providerId', [
        ValidationMiddleware.validJWTNeeded,
        ProvidersController.getById
    ]);
    app.patch(config.api_version+'/providers/:providerId', [
        ValidationMiddleware.validJWTNeeded,
        ProvidersMiddleware.validateWriteAuth,
        VerifyProviderMiddleware.validAccountReferences,
        ProvidersController.patchById
    ]);
    app.delete(config.api_version+'/providers/:providerId', [
        ValidationMiddleware.validJWTNeeded,
        ProvidersMiddleware.validateWriteAuth,
        ProvidersController.removeById
    ]);
};
