const UserModel     = require('../models/users.model');
const eos_helper    = require('../../eos/helper/helper');
const config        = require('../../common/config/env.config.js');

/*
*
*/
exports.validateWriteAuth = async(req, res, next) => {

  const new_state = req.body.state;
  if(!new_state)
  {
    console.log(' ## STATE MACHINE ISSUE#2 -> NO NEW STATE ON REQUEST')
    return next();
  }

  let user = null;
  try {
      user = await UserModel.findById(req.params.userId)
  } catch (e) {
    return res.status(404).send({error:'Profile/User NOT FOUND'});
  }

  if(!user)
  {
    return res.status(404).send({error:'Profile/User NOT FOUND'});
  }

  const account_name  = req.jwt.account_name;
  const user_owner    = user.account_name;

  let is_authorized   = account_name==user_owner;
  let is_admin        = account_name==config.eos.bank.account;
  if(!is_authorized)
    try {
      let perm = await eos_helper.accountHasWritePermission(account_name, config.eos.bank.account);
      if(perm)
      {
        is_authorized = true;
        is_admin = true;
      }
    } catch (e) { }

  if(!is_authorized)
    try {
      let perm = await eos_helper.accountHasWritePermission(account_name, request_owner);
      if(perm)
      {
        is_authorized = true;
        is_admin = false;
      }
    } catch (e) {}

  if(!is_authorized)
    return res.status(404).send({error:'Account not authorized for this operation. Op requested by:'+account_name+', owner: '+user_owner});

  return next();
}
