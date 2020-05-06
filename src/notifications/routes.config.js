const NotificationsController   = require('./controllers/notifications.controller');
const NotificationsModel        = require('./models/notifications.model');
const config                    = require('../common/config/env.config');
const ValidationMiddleware      = require('../common/middlewares/auth.validation.middleware');
const PermissionMiddleware      = require('./middlewares/permission.middleware');

exports.routesConfig = function (app) {

    app.post(config.api_version+'/notifications/:accountName/:firebaseToken', [
      ValidationMiddleware.validJWTNeeded,
      PermissionMiddleware.loggedHasPermissionOnAccount,
      NotificationsController.subscribe
    ]);

    app.delete(config.api_version+'/notifications/:accountName/:firebaseToken', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasPermissionOnAccount,
        NotificationsController.unsubscribe
    ]);

};
