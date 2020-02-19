const UsersModel    = require('../models/users.model');
const config        = require('../../common/config/env.config.js');
const createAccount = require('./create-blockchain-accounts-lib');
const accounts          = require('./accounts.js');

const getNameFromTx = (tx) =>{
  try{
    const account_name = tx.processed.action_traces[0].act.data.name;
    console.log(' ---- get name from tx -> ', account_name)
    return account_name;
  }catch(e)
  {
    console.log(' ############################ cant get name from tx:')
    console.log(e)
    console.log(tx)
    return null;
  }
};

const arrayNullOrEmpty = (a, check_values) => {
  if(!a) return true;
  if(!Array.isArray(a)) return true;
  if(a.length==0) return true;
  if(check_values)
  {
    let _emty = true;
    for (var i = 0; i < a.length; ++i) {
      _emty = _emty && (!a[i])
    } 
    if(_emty)
      return true;
  }
  return false;
};

const cleanEmail = (email) => {
  const the_email = email.split(',')[0].trim();
  const prefix = the_email.split('_')[0];
  const suffix = the_email.split('!')[1];
  return prefix+suffix;
}

(async () => {

  const missing_accounts = await UsersModel.list(100, 0, {exists_at_blockchain:false, account_name: { $ne: 'xasaflorestx' } } );
  // const accounts         = await UsersModel.list(150, 0, {exists_at_blockchain:true);
  
  const promises          = missing_accounts.map( (account, idx) => {
    try{
      console.log(' -- about to build permissions for ', account.account_name);
      let permissions = null;
      if(account.account_type!=UsersModel.ACCOUNT_TYPE_PERSONAL)
      {
        const the_email = cleanEmail(account.email);
        const owners    = accounts.find(
            owner =>  {
              if(owner.email==the_email && owner.account_type==UsersModel.ACCOUNT_TYPE_PERSONAL)
                return true;
              return false;
            }
          );
        console.log(owners)

        if(!arrayNullOrEmpty(owners, true))
          permissions={owner:owners.map(account=>account.account_name)};
      }
      console.log(' -- about to create ', account.account_name);
      return createAccount(account.account_name, account.public_key, account.account_type, 0, 0, permissions);
    }
    catch(e)
    {
      console.log('ERROR:', e)
      return {error:e};
    }
  });
  const res = await Promise.all(promises);
  // console.log(JSON.stringify(res));
  const update_users_promises = res.map(
      r => {
        const account_name = getNameFromTx(r);
        if(typeof account_name === 'string')
          return UsersModel.patchUserByAccountName(account_name, {exists_at_blockchain:true});
        else
          return '';
      }
    );
  const updateDDBB = await Promise.all(update_users_promises);
  console.log(' ------------------------------- DDBB RESULTS:')
  console.log(updateDDBB)
  console.log('Done!');
  return process.exit(0);
})();

