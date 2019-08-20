const EosController = require('./controllers/eos.controller');
const EosVerifyMiddleware = require('./middlewares/eos.verify.middleware');
const AuthValidationMiddleware = require('../common/middlewares/auth.validation.middleware');
const config = require('../common/config/env.config');

exports.routesConfig = function (app) {

    app.get(config.api_version+'/eos/challenge/:account_name', [
        EosVerifyMiddleware.hasChallengeValidFields,
        EosController.challenge
    ]);

    // account_name
    // signature
    // challenge
    app.post(config.api_version+'/eos/auth', [
        EosVerifyMiddleware.hasAuthValidFields,
        EosVerifyMiddleware.isChallengeAndUserMatch,
        EosController.auth
    ]);

    app.get(config.api_version+'/eos/account/:account_name/balance', [
        EosController.getBalance
    ]);

    app.get(config.api_version+'/eos/account/:account_name/info', [
        EosController.getAccountInfo
    ]);
};