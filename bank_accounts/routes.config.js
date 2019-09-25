const BankAccountsController = require('./controllers/bank_accounts.controller');
const PermissionMiddleware = require('../common/middlewares/auth.permission.middleware');
const ValidationMiddleware = require('../common/middlewares/auth.validation.middleware');
const config = require('../common/config/env.config');

const ADMIN = config.permission_levels.ADMIN;
const OPS = config.permission_levels.OPS_USER;
const FREE = config.permission_levels.NORMAL_USER;

exports.routesConfig = function (app) {
    
    app.post(config.api_version+'/bank_accounts', [
        BankAccountsController.insert
    ]);
    app.get(config.api_version+'/bank_accounts', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(OPS),
        BankAccountsController.list
    ]);
    app.get(config.api_version+'/bank_accounts/:bankAccountId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        BankAccountsController.getById
    ]);
    app.patch(config.api_version+'/bank_accounts/:bankAccountId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        BankAccountsController.patchById
    ]);
    app.delete(config.api_version+'/bank_accounts/:bankAccountId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        BankAccountsController.removeById
    ]);
};