const EosController = require('./controllers/eos.controller');
const EosVerifyMiddleware = require('./middlewares/eos.verify.middleware');
const AuthValidationMiddleware = require('../common/middlewares/auth.validation.middleware');

exports.routesConfig = function (app) {

    app.get('/eos/challenge/:account_name', [
        EosVerifyMiddleware.hasChallengeValidFields,
        EosController.challenge
    ]);

    app.post('/eos/auth', [
        EosVerifyMiddleware.hasAuthValidFields,
        EosVerifyMiddleware.isChallengeAndUserMatch,
        EosController.auth
    ]);

    app.get('/eos/account/:account_name/balance', [
        EosController.getBalance
    ]);

    app.get('/eos/account/:account_name/info', [
        EosController.getAccountInfo
    ]);
};