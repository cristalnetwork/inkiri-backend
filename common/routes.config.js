const CommonController = require('./controllers/common.controller');
const ValidationMiddleware = require('../common/middlewares/auth.validation.middleware');
const config = require('../common/config/env.config');

exports.routesConfig = function (app) {

    app.get(config.api_version+'/common', [
        ValidationMiddleware.validJWTNeeded,
        CommonController.getConfig
    ]);

};
