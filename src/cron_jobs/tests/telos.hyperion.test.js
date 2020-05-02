
const eos_helper    = require('../../eos/helper/helper');

(async () => {

  console.log('ABOUT TO FETCH ACCOUNTS')
  const accounts = await eos_helper.listBankAccounts();
  console.log('accounts:', accounts)

  console.log('ABOUT TO FETCH BALANCES')
  // const balances = await eos_helper.listBankBalances();
  const account_names = accounts.map( account => account.account_name) 
  console.log(' *********** account_names:', account_names)
  
  const balance_list  = await eos_helper.listBankBalances(account_names);
  console.log('balances:', balance_list)

  // console.log('DONE!')
  const balances = balance_list.reduce((acc, obj) => { acc[obj.account_name] = obj.balance; return acc; } , {});
  
  const response = accounts.map( account => { return {
                                                    account_name  : account.account_name,
                                                    fee           : account.fee
                                                    , overdraft   : account.overdraft
                                                    , balance     : balances[account.account_name]    
                                                  } }
                                                );

  console.log(response);

  return process.exit(0);
  
})();

