const UserModel     = require('../../users/models/users.model');
const config        = require('../../common/config/env.config.js');
const ConfigModel   = require('../models/configuration.model');

exports.validAccountReferences = async(req, res, next) => {

  let is_update = (req.body._id || req.body.id)
  
  const _account = await UserModel.findByAccountName(req.jwt.account_name);

  if(!_account || _account===undefined)
  {
    return res.status(404).send({error:'not a valid creator'});
  }
  
  if(is_update)
    req.body.created_by = _account[0]
  else
    req.body.updated_by = _account[0]

  return next();

};

