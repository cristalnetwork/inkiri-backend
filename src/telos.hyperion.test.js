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



const config                                   = require('./common/config/env.config.js');
const { JsonRpc, RpcError, Api }               = require('eosjs');
const { JsSignatureProvider }                  = require('eosjs/dist/eosjs-jssig');
const fetch                                    = require('node-fetch');
const { TextEncoder, TextDecoder }             = require('util');
var moment        = require('moment');

(async () => {
  
  const rpc = new JsonRpc(config.eos.blockchain_endpoint, { fetch });
  const response = await rpc.get_table_rows({
    json:           true
    , code:         config.eos.bank.account
    , scope:        config.eos.bank.account
    , table:        config.eos.bank.table_customers
    , lower_bound:  '11111111111a'
    , upper_bound:  'zzzzzzzzzzzz'
    , limit:        250
    , reverse:      false
    , show_payer :  false
  });
  console.log(JSON.stringify(response))


  console.log('==================== END o_O');
  return process.exit(0);

})();


// cleos get scope -t accounts myeosiotoken