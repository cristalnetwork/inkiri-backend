const jwt              = require('jsonwebtoken'),
     config            = require('../config/env.config');
const ADMIN_PERMISSION = 4096;

const UserModel        = require('../../users/models/users.model');
const eos_helper    = require('../../eos/helper/helper');

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

exports.loggedUserHasWritePermissionOnUserObject = async (req, res, next) => {

  UserModel.findById(req.params.userId)
    .then((result) => {
      const auth_user    = req.jwt.account_name;
      const editing_user = result.account_name;
      // logged user is updating his profile info
      if (auth_user==editing_user)
        return next();
      // admin user is updating another user profile info
      if(auth_user==config.eos.bank.account)
        return next();

      // admin permissioned user is updating another user profile info
      eos_helper.accountHasWritePermission(auth_user, config.eos.bank.account)
        .then(
          (result)=>{
            return next();
          }
          , (error)=>{
              // user permissioned user is updating another user profile info
              eos_helper.accountHasWritePermission(auth_user, editing_user)
              .then(
                (result)=>{
                  return next();
                }
                , (error)=>{
                  return res.status(404).send({error:'Unauthorized action', message:'You are not allowed to update user profile.'});
                }
              );
          }
      );
      // try {
      //   let perm = await eos_helper.accountHasWritePermission(auth_user, config.eos.bank.account);
      //   if(perm)
      //     return next();
      // } catch (e) { }
      // user permissioned user is updating another user profile info
      // try {
      //   let perm = await eos_helper.accountHasWritePermission(auth_user, editing_user);
      //   if(perm)
      //     return next();
      // } catch (e) {}
      //
      // return res.status(404).send({error:'Unauthorized action', message:'You are not allowed to update user profile.'});
    }, (err)=>{
        console.log(' ERROR# 1', JSON.stringify(err))
        return res.status(404).send({error:JSON.stringify(err), message:err.errmsg});
    });
};
