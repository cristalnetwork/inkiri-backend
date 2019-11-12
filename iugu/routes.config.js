const IuguController            = require('./controllers/iugu.controller');
const IuguModel                 = require('./models/iugu.model');
const config                    = require('../common/config/env.config');
const ValidationMiddleware      = require('../common/middlewares/auth.validation.middleware');

exports.routesConfig = function (app) {

    app.get(config.api_version+'/iugu_importer/:task', [
        IuguController.import
    ]);

    app.post(config.api_version+'/iugu', [
        IuguController.insert
    ]);

    app.get(config.api_version+'/iugu', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(OPS),
        IuguController.list
    ]);

    app.get(config.api_version+'/iugu/:invoiceId', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        // PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        IuguController.getById
    ]);

    app.patch(config.api_version+'/iugu/:invoiceId', [
        ValidationMiddleware.validJWTNeeded,
        IuguController.patchById
    ]);

    app.delete(config.api_version+'/iugu/:invoiceId', [
        ValidationMiddleware.validJWTNeeded,
        IuguController.removeById
    ]);

};
