const jwt              = require('jsonwebtoken'),
     config            = require('../config/env.config');
const UserModel        = require('../../users/models/users.model');
const eos_helper       = require('../../eos/helper/helper');

exports.loggedHasAdminWritePermission = async (req, res, next) => {

    const auth_user    = req.jwt.account_name;

    let is_admin        = auth_user==config.eos.bank.account;

    if(!is_admin)
      try {
        let perm = await eos_helper.accountHasWritePermission(auth_user, config.eos.bank.account);
        if(perm)
        {
          is_admin = true;
        }
      } catch (e) { }

    if(!is_admin)
      return res.status(404).send({error:'Account not authorized for this operation. Requested by:'+auth_user});

    return next();
};

/*
* Required -> req.params.userId
*/
exports.loggedHasWritePermissionOnUser = async (req, res, next) => {

  UserModel.findById(req.params.userId)
    .then( async (result) => {
      const auth_user    = req.jwt.account_name;
      const editing_user = result.account_name;

      let is_admin        = auth_user==config.eos.bank.account;
      let is_authorized   = (auth_user==editing_user) || is_admin;

      if(!is_authorized)
        try {
          let perm = await eos_helper.accountHasWritePermission(auth_user, config.eos.bank.account);
          if(perm)
          {
            is_authorized = true;
            is_admin = true;
          }
        } catch (e) { }

      // if(!is_authorized)
      //   try {
      //     let perm = await eos_helper.accountHasWritePermission(auth_user, editing_user);
      //     if(perm)
      //     {
      //       is_authorized = true;
      //       is_admin = false;
      //     }
      //   } catch (e) {}

      if(!is_authorized)
        return res.status(404).send({error:'Account not authorized for this operation. Requested by:'+auth_user+', owner: '+editing_user});

      return next();

    }, (err)=>{
        console.log(' ERROR# 1', JSON.stringify(err))
        return res.status(404).send({error:JSON.stringify(err), message:err.errmsg});
    });
};
