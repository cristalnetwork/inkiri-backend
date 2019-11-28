const UserModel     = require('../../users/models/users.model');
const eos_helper    = require('../../eos/helper/helper');
const config        = require('../../common/config/env.config.js');
const ProviderModel  = require('../models/providers.model');

exports.validateWriteAuth = async(req, res, next) => {

  let biz                 = null;
  const account_name      = req.jwt.account_name;
  const ref_account_name  = req.body.account_name;

  if(!biz)
    try {
        biz = await UserModel.findByAccountName(ref_account_name);
    } catch (e) {
      return res.status(404).send({error:'Business NOT FOUND #4'});
    }

  if(!biz)
  {
    return res.status(404).send({error:'Business NOT FOUND #5'});
  }

  if(Array.isArray(biz))
    biz=biz[0];

  const biz_account   = biz.account_name;

  if(biz.account_type!=UserModel.ACCOUNT_TYPE_BUSINESS && biz.account_name!=config.eos.bank.account)
    return res.status(500).send({error:'Ref account['+biz.account_name+'] type is not a Business neither the bank #6'});

  let is_admin        = account_name==config.eos.bank.account;
  let is_authorized   = (account_name==biz_account) || is_admin;

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
      let perm = await eos_helper.accountHasWritePermission(account_name, biz_account);
      if(perm)
      {
        is_authorized = true;
        is_admin = false;
      }
    } catch (e) {}

  if(!is_authorized)
    return res.status(404).send({error:'Account not authorized for this operation. Op requested by:'+account_name+', owner: '+biz_account});

  req.biz_reference = biz;
  delete req.body.account_name;
  return next();
}
