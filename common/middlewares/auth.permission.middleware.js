const jwt = require('jsonwebtoken'),
     config = require('../config/env.config');

const ADMIN_PERMISSION = 4096;

exports.minimumPermissionLevelRequired = (required_permission_level) => {
    return (req, res, next) => {
        let user_permission_level = parseInt(req.jwt.permission_level);
        console.log(' user_permission_level ?? >> ', JSON.stringify(req.jwt.permission_level));
        console.log(' required_permission_level ?? >> ', required_permission_level);
        let userId = req.jwt.userId;
        console.log(' userId ?? >> ', JSON.stringify(req.jwt.userId));
        if (user_permission_level >= required_permission_level) {
            console.log(' minimumPermissionLevelRequired ?? >> SI');
            return next();
        } else {
            console.log(' minimumPermissionLevelRequired ?? >> NO');
            return res.status(403).send();
        }
    };
};

exports.onlySameUserOrAdminCanDoThisAction = (req, res, next) => {

    let user_permission_level = parseInt(req.jwt.permission_level);
    let userId = req.jwt.userId;
    if (req.params && req.params.userId && userId === req.params.userId) {
        return next();
    } else {
        if (user_permission_level == config.permission_levels.ADMIN) {
            return next();
        } else {
            return res.status(403).send();
        }
    }

};

exports.sameUserCantDoThisAction = (req, res, next) => {
    let userId = req.jwt.userId;

    if (req.params.userId !== userId) {
        return next();
    } else {
        return res.status(400).send();
    }

};
