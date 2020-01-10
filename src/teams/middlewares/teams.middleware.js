const UserModel     = require('../../users/models/users.model');
const eos_helper    = require('../../eos/helper/helper');
const config        = require('../../common/config/env.config.js');
const TeamModel     = require('../models/teams.model');

exports.setAccounts = async(req, res, next) => {

  if(req.biz_reference)
  {
    req.body.created_by = req.biz_reference;
    return next();
  }

  if(!req.body.account_name)
    return next();
  let biz = null;
  try {
      biz = await UserModel.findByAccountName(req.body.account_name);
  } catch (e) {
    return res.status(404).send({error:'Team/Business NOT FOUND'});
  }

  if(biz.account_type!=UserModel.ACCOUNT_TYPE_BUSINESS)
    return res.status(500).send({error:'Ref account type is not a Business'});

  req.biz_reference   = biz;
  req.body.created_by = biz;
  return next();

}
exports.validateWriteAuth = async(req, res, next) => {

  let biz = null;
  let ref_account = req.params.accountName;

  if(!ref_account)
    ref_account = req.body.account_name;

  if(!ref_account)
  {
    const team_id = req.params.teamId;
    if(!team_id)
      return res.status(404).send({error:'Team/Business NOT SET #1'});

    let team = null;

    try {
        team = await TeamModel.findById(team_id);
    } catch (e) {
        return res.status(404).send({error:'Team/Business NOT SET #2'});
    }
    ref_account = team.account_name;
    biz         = team.created_by;
  }
  if(!ref_account)
    return res.status(404).send({error:'Team/Business NOT SET #3'});

  if(!biz)
    try {
        biz = await UserModel.findByAccountName(ref_account);
    } catch (e) {
      return res.status(404).send({error:'Team/Business NOT FOUND #4'});
    }

  if(!biz)
  {
    return res.status(404).send({error:'Team/Business NOT FOUND #5'});
  }

  if(Array.isArray(biz))
    biz=biz[0];

  const account_name  = req.jwt.account_name;
  const biz_account   = biz.account_name;

  if(biz.account_type!=UserModel.ACCOUNT_TYPE_BUSINESS && biz.account_name!=config.eos.bank.account)
    return res.status(500).send({error:'Ref account['+biz.account_name+'] type is not a Business neither the bank #6'});

  let is_authorized   = account_name==biz_account;
  let is_admin        = account_name==config.eos.bank.account;
  if(!is_admin)
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

  return next();
}
