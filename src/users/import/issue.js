const UsersModel    = require('../models/users.model');
const accounts      = require('./accounts.js');
const config        = require('../../common/config/env.config.js');
const issue_oft     = require('./update_overdraft-issue-lib');

(async () => {

  const process_accounts  = accounts;
  // const process_accounts  = [accounts[0], accounts[1]];

  //2
  // const process_accounts  = accounts.filter( account => account.account_type!=UsersModel.ACCOUNT_TYPE_PERSONAL).filter(account=>!created.includes(account.account_name) );
  
  const promises          = process_accounts.map( (account, idx) => {
    try{
      console.log(' -- about to issue ', account.account_name);
      return issue_oft(account);
    }
    catch(e)
    {
      console.log('ERROR:', e)
      return {error:e};
    }
  });

  const res = await Promise.all(promises);
  
  // console.log(JSON.stringify(res));

  // const update_users_promises = res.map(
  //     (r, idx) => {
  //       const account_name = process_accounts[idx].account_name;
  //       return UsersModel.patchUserByAccountName(account_name, {exists_at_blockchain:true});
  //     }
  //   );
  // const updateDDBB = await Promise.all(update_users_promises);
  // console.log(' ------------------------------- DDBB RESULTS:')
  // console.log(updateDDBB)
  console.log('Done!');
  return process.exit(0);
})();

