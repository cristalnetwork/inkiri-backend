const UserModel = require('../../users/models/users.model');
const crypto = require('crypto');

exports.hasChallengeValidFields = (req, res, next) => {
    let errors = [];

    if (!req.params.account_name) {
        errors.push('Missing account_name field');
    }
    if (errors.length) {
        return res.status(400).send({errors: errors.join(',')});
    } else {
        return next();
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
              res.status(404).send({});
            }else{
              let challenge = user[0].to_sign;
              if (challenge != req.body.challenge) {
                return res.status(400).send({errors: ['Invalid something']});
              }
              else{    
                req.body.userId           = user[0]._id;
                req.body.permission_level = user[0].permission_level;
                return next();
              }
            }
        },
        (error) => {
          return res.status(400).send({errors: ['Something went wrong my dear friend!']});        
        });
};