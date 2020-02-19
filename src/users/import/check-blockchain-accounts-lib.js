const UsersModel    = require('../models/users.model');
const eosHelper     = require('../../eos/helper/helper.js');


exports.getMissingAccounts = async () => {
  // 1) Get DDBB accounts
  const accounts  = await UsersModel.list(200, 0, {});
  
  // 2_ Iterate and verify blockchain existence
  const check_promises = accounts.map(
    async (account) => {
      if(account.account_name.indexOf('0')>=0)
        return 'ERROR -> TIENE 0' + account.account_name;
      else
      {
        try{
          const exists = await eosHelper.getAccountInfo(account.account_name);
          return exists;
        }
        catch(e){
          return ' ooops... NO EXISTE: '+account.account_name;
        }
      }
        
      
      // try {
      //     accountInfo = await helper.getAccountInfo(req.body.account_name);
      // } catch (e) {
      //   console.log('============= eos::auth::error#1')
      //   res.status(400).send({error: 'Account not found on blockchain!'});
      //   return;
      // }
    })

  const res = await Promise.all(check_promises);

  return accounts.map(
    (account, idx) => 
      {
        return {
              account_name : account.account_name
              ,  result    : res[idx]
              , missing    : typeof res[idx] === 'string'
        };
      }
    );
}

// (async () => {
//     const missing_account = await exports.getMissingAccounts();
//     console.log(missing_account.length);
//     console.log(missing_account);
//     return process.exit(0);
// })();

