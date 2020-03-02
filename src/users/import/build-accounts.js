// const UsersModel        = require('../models/users.model');
const eosAccountName    = require('../../eos/helper/eos-account-name-helper');
const eosKeys           = require('../../eos/helper/eos-keys-helper');

module.exports = (users) => {
  console.log('Building account names and public keys ...');
  
  let account_names_array = [];
  const accounts = users
    .map((user, idx) => {
      const email        = user.email.split(',')[0];
      const email_prefix = (!nullOrEmpty(email) && email.includes('@'))
        ? email.split('@')[0]
        : '';

      // const is_personal  = user.account_type==UsersModel.ACCOUNT_TYPE_PERSONAL;
      const is_personal  = user.account_type=='personal';
      const seed         = (is_personal)
        ?[user.first_name, user.last_name, user.email]
        :[user.business_name];

      const account_name = 
        (!nullOrEmpty(user.account_name) && eosAccountName.isValidAccountName(user.account_name)) 
        ? user.account_name
        : eosAccountName.generateAccountName( seed, account_names_array);
      account_names_array.push(account_name);
      
      user.exists_at_blockchain = false;
      user.account_name         = account_name;
      user.public_key           = eosKeys.getDerivedKey(user.account_name, user.password, false)
      
      return user;

    })
  return accounts;
  // const passwords     = users.reduce((acc, obj) => { acc[obj.account_name] = obj.password; return acc; } , {});
  // const account_names = users.map((user) => user.account_name)


};

const nullOrEmpty = (str) => {
  return !str || str.trim()=='';
}

