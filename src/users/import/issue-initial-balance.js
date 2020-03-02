const UsersModel    = require('../models/users.model');
const config        = require('../../common/config/env.config.js');
const eosHelper     = require('../../eos/helper/helper.js');
        
const ISSUE_AMOUNT = 2000;

const getNameFromTx = (tx) =>{
  try{
    const account_name = tx.processed.action_traces[0].act.data.name || tx.processed.action_traces[0].act.data.to;
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

(async () => {

  const accounts  = await UsersModel.list(200, 0, {exists_at_blockchain:true});
  
  const promises  = accounts.map( (account, idx) => {
    try{
        return eosHelper.issueMoney(account.account_name, ISSUE_AMOUNT, 'Inital test balance');
    }
    catch(e)
    {
      return {error:e}
    }
  });

  const res = await Promise.all(promises);
  // console.log(JSON.stringify(res));
  const x = res.map(
      r => {
        // const account_name = getNameFromTx(r);
        console.log(r)
      }
    );
  
  console.log('Done!');
  return process.exit(0);
})();

