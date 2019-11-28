const UserModel     = require('../../users/models/users.model');
const crypto        = require('crypto');
const helper        = require('../helper/helper')

exports.createIfNotExists  = async (req, res, next) => {

  const account_name = req.params.account_name.trim();
  let user           = null;

  try {
    user = await UserModel.findByAccountName(account_name);
  } catch (e) {
    user = null;
  }

  if(user!=null && (Array.isArray(user)?user:[user])[0]!=null)
  {
    return next();
  }

  let customerInfo = null;
  try {
    customerInfo = await helper.getCustomerInfo(account_name);
  } catch (e) {
    console.log(' ERROR createIfNotExists#1' , e)
    res.status(404).send({error: 'Account is not a customer!'});
    return;
  }

  const account_type  = UserModel.getTypeFromInt(customerInfo.account_type);
  const alias         = (account_type==UserModel.ACCOUNT_TYPE_BUSINESS)?account_name:'';
  const business_name = (account_type==UserModel.ACCOUNT_TYPE_BUSINESS)?account_name:'';
  const first_name    = (account_type==UserModel.ACCOUNT_TYPE_PERSONAL)?account_name:'';
  const last_name     = (account_type==UserModel.ACCOUNT_TYPE_PERSONAL)?account_name:'';
  const email         = `${account_name}@cristalnetwork.org`;
  if(account_type==null)
  {
    console.log(' ERROR createIfNotExists#2' )
    res.status(404).send({error: 'Account has invalid ACCOUNT TYPE!'});
    return;
  }
  const new_user = {
    account_name:     account_name,
    alias:            alias,
    first_name:       first_name,
    last_name:        last_name,
    email:            email,
    self_created:     true,
    account_type:     account_type ,
    business_name:    business_name};

  let created = null;
  try {
    created = UserModel.createUser(new_user);
  } catch (e) {
    console.log(' ERROR createIfNotExists#4' )
    res.status(404).send({error: 'Something went wrong self creating account/user/profile.' + JSON.stringify(e)});
    return;
  }
  return next();
}

exports.hasChallengeValidFields = (req, res, next) => {
    let errors = [];

    if (!req.params.account_name) {
        errors.push('Missing account_name field');
    }
    if (errors.length) {
      // console.log(' **************** ERROR #1')
      return res.status(400).send({errors: errors.join(',')});
    } else {
        // return next();
      UserModel.findByAccountName(req.params.account_name)
        .then((user)=>{
            if(!user[0]){
              console.log(' ERROR hasChallengeValidFields#1' )
              return res.status(404).send({error:'Account not found man!'});
            }else{
              return next();
            }
        },
        (error) => {
          console.log(' ERROR hasChallengeValidFields#2' )
          return res.status(400).send({errors: ['Something went wrong my dear friend!']});
        });
    }

};

exports.hasAuthValidFields = (req, res, next) => {
    let errors = [];

    if (req.body) {
        if (!req.body.account_name) {
            errors.push('Missing account_name field');
        }
        if (!req.body.challenge || req.body.challenge.trim()=='') {
            errors.push('Missing challenge field');
        }
        if (!req.body.signature) {
            errors.push('Missing signature field');
        }
        if (errors.length) {
            // console.log(' **************** ERROR #3', errors.join(','))
            return res.status(400).send({errors: errors.join(',')});
        } else {
            return next();
        }
    } else {
        return res.status(400).send({errors: 'Missing fields'});
    }
};

exports.isChallengeAndUserMatch = (req, res, next) => {
    UserModel.findByAccountName(req.body.account_name)
      .then((user)=>{
          if(!user[0]){
            return res.status(404).send({error:'Account not found man!'});
          }else{
            let challenge = user[0].to_sign;
            if (challenge != req.body.challenge) {
              return res.status(400).send({errors: ['Invalid something']});
            }
            else{
              req.body.userId           = user[0]._id;
              return next();
            }
          }
      },
      (error) => {
        return res.status(400).send({errors: ['Something went wrong my dear friend!']});
      });
};
