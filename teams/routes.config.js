const TeamsController      = require('./controllers/teams.controller');
const TeamsMiddleware      = require('./middlewares/teams.middleware.js');
const ValidationMiddleware = require('../common/middlewares/auth.validation.middleware');
const config               = require('../common/config/env.config');

exports.routesConfig = function (app) {

    app.post(config.api_version+'/teams', [
        ValidationMiddleware.validJWTNeeded,
        TeamsMiddleware.validateWriteAuth,
        TeamsMiddleware.setAccounts,
        TeamsController.insert
    ]);

    app.get(config.api_version+'/teams', [
        ValidationMiddleware.validJWTNeeded,
        TeamsMiddleware.validateWriteAuth,
        TeamsController.list
    ]);

    app.get(config.api_version+'/teams/:teamId', [
        ValidationMiddleware.validJWTNeeded,
        TeamsMiddleware.validateWriteAuth,
        TeamsController.getById
    ]);
    app.patch(config.api_version+'/teams/:teamId', [
        ValidationMiddleware.validJWTNeeded,
        TeamsMiddleware.validateWriteAuth,
        TeamsMiddleware.setAccounts,
        TeamsController.patchById
    ]);

    app.delete(config.api_version+'/teams/:teamId', [
        ValidationMiddleware.validJWTNeeded,
        TeamsMiddleware.validateWriteAuth,
        TeamsController.removeById
    ]);

    app.get(config.api_version+'/teams_by_account/:accountName', [
        ValidationMiddleware.validJWTNeeded,
        TeamsMiddleware.validateWriteAuth,
        TeamsController.getByAccountName
    ]);

    app.get(config.api_version+'/teams_positions', [
        ValidationMiddleware.validJWTNeeded,
        TeamsController.getPositions
    ]);
};
