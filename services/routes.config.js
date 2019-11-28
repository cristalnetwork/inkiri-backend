const ServicesController      = require('./controllers/services.controller');
const ServicesMiddleware      = require('./middlewares/services.middleware.js');
const ValidationMiddleware    = require('../common/middlewares/auth.validation.middleware');
const config                  = require('../common/config/env.config');

exports.routesConfig = function (app) {

    app.post(config.api_version+'/services', [
        ValidationMiddleware.validJWTNeeded,
        ServicesMiddleware.validateWriteAuth,
        ServicesMiddleware.setAccounts,
        ServicesController.insert
    ]);

    app.get(config.api_version+'/services', [
        ValidationMiddleware.validJWTNeeded,
        // ServicesMiddleware.validateWriteAuth,
        ServicesController.list
    ]);

    app.get(config.api_version+'/services/:serviceId', [
        ValidationMiddleware.validJWTNeeded,
        ServicesMiddleware.validateWriteAuth,
        ServicesController.getById
    ]);
    app.patch(config.api_version+'/services/:serviceId', [
        ValidationMiddleware.validJWTNeeded,
        ServicesMiddleware.validateWriteAuth,
        ServicesMiddleware.setAccounts,
        ServicesController.patchById
    ]);

    app.delete(config.api_version+'/services/:serviceId', [
        ValidationMiddleware.validJWTNeeded,
        ServicesMiddleware.validateWriteAuth,
        ServicesController.removeById
    ]);

    app.get(config.api_version+'/services_states', [
        ValidationMiddleware.validJWTNeeded,
        ServicesController.getStates
    ]);
};
