// const { JsonRpc } = require("@eoscafe/hyperion")
// const fetch                                    = require('node-fetch');
// const endpoint    = "https://testnet.telosusa.io"
// const rpc         = new JsonRpc(endpoint, { fetch })
// var moment        = require('moment');

// (async () => {
  
//   const response1 = await rpc.get_actions("cristaltoken", {
//     filter: "cristaltoken:*",
//     skip: 0,
//     limit: 100,
//     sort: 'asc',
//     after: moment().subtract(1, 'hours').toISOString()
//   });
  
//   console.log(JSON.stringify(response1))  
//   console.log('END o_O');
//   return process.exit(0);

// })();






// const hyperion    = require('./transactions/services/hyperion');
// var moment        = require('moment');

// (async () => {
  
//   const response1 = await hyperion.queryTransactions({}, null, null, moment().subtract(1, 'days').toISOString());
  
//   console.log('========================== PROCESS');
//   console.log(JSON.stringify(response1))  
//   console.log('==================== END o_O');
//   return process.exit(0);

// })();



// const config                                   = require('./common/config/env.config.js');
// const { JsonRpc, RpcError, Api }               = require('eosjs');
// const { JsSignatureProvider }                  = require('eosjs/dist/eosjs-jssig');
// const fetch                                    = require('node-fetch');
// const { TextEncoder, TextDecoder }             = require('util');
// var moment        = require('moment');

// (async () => {
  
//   const rpc = new JsonRpc(config.eos.blockchain_endpoint, { fetch });
  
//   const response2 = await rpc.get_currency_balance(config.eos.token.contract, 'tutinopablo1', config.eos.token.code)
//   console.log(response2);

//   // const response = await rpc.get_table_rows({
//   //   json:           true
//   //   , code:         config.eos.bank.account
//   //   , scope:        config.eos.bank.account
//   //   , table:        config.eos.bank.table_balances
//   //   , lower_bound:  '11111111111a'
//   //   , upper_bound:  'zzzzzzzzzzzz'
//   //   , limit:        250
//   //   , reverse:      false
//   //   , show_payer :  false
//   // });

//   // console.log(JSON.stringify(response))


//   console.log('==================== END o_O');
//   return process.exit(0);

// })();





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

