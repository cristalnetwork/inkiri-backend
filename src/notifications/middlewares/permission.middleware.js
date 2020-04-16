const eos_helper    = require('../../eos/helper/helper');
const config        = require('../../common/config/env.config.js');


exports.loggedHasPermissionOnAccount = async (req, res, next) => {

  const logged_account  = req.jwt.account_name;
  const account_to_edit = req.params.accountName;
  
  let is_authorized   = logged_account==account_to_edit;
  let is_admin        = logged_account==config.eos.bank.account;
  if(!is_admin && !is_authorized)
    try {
      let perm = await eos_helper.accountHasWritePermission(logged_account, config.eos.bank.account);
      if(perm)
      {
        is_authorized = true;
        is_admin = true;
      }
    } catch (e) { }

  if(!is_authorized)
    try {
      let perm = await eos_helper.accountHasWritePermission(logged_account, account_to_edit);
      if(perm)
      {
        is_authorized = true;
        is_admin = false;
      }
    } catch (e) {}

  if(!is_authorized)
    return res.status(404).send({error:'Account not authorized for this operation. Requested by:'+logged_account+', owner: '+account_to_edit});
  return next();

};
