const config                      = require('../../common/config/env.config.js');
const { JsonRpc, RpcError, Api }  = require('eosjs');
const fetch                       = require('node-fetch');
const rpc                         = new JsonRpc(config.eos.blockchain_endpoint, { fetch });



(async () => {
  const account_name = 'cristaltoken';

  // const resp = await rpc.get_account(account_name);
  // console.log(resp);

  const response = await rpc.get_table_rows({
    json:           true                 
    , code:         config.eos.bank.issuer
    , scope:        config.eos.bank.issuer
    , table:        config.eos.bank.table_customers
    , lower_bound:  account_name
    , upper_bound:  account_name
    , limit:        1
    , reverse:      false
    , show_payer :  false
  });

  console.log(response);

  return process.exit(0);
})();


// curl -X GET "https://testnet.telosusa.io/v1/chain/get_table_rows?code=cristaltoken&table=customer&scope=cristaltoken&key_type=name&upper_bound=atomakinnaka&lower_bound=atomakinnaka" -H "accept: */*"
// curl -X GET "https://telos.caleos.io/v1/chain/get_table_rows?code=cristaltoken&table=customer&scope=cristaltoken&key_type=name&upper_bound=atomakinnaka&lower_bound=atomakinnaka" -H "accept: */*"
// curl -X GET "https://ssltelosapi.atticlab.net/v1/chain/get_table_rows?code=cristaltoken&table=customer&scope=cristaltoken&key_type=name&upper_bound=atomakinnaka&lower_bound=atomakinnaka" -H "accept: */*"
// curl -X GET "https://telos.eosdublin.io/v1/chain/get_table_rows?code=cristaltoken&table=customer&scope=cristaltoken&key_type=name&upper_bound=atomakinnaka&lower_bound=atomakinnaka" -H "accept: */*"
// curl -X GET "https://telos.eosvibes.io/v1/chain/get_table_rows?code=cristaltoken&table=customer&scope=cristaltoken&key_type=name&upper_bound=atomakinnaka&lower_bound=atomakinnaka" -H "accept: */*"
// curl -X GET "https://telos.eoscafeblock.com/v1/chain/get_table_rows?code=cristaltoken&table=customer&scope=cristaltoken&key_type=name&upper_bound=atomakinnaka&lower_bound=atomakinnaka" -H "accept: */*"

// curl -X POST "https://testnet.telosusa.io/v1/chain/get_table_rows" -H "accept: */*" -H "Content-Type: application/json" -d "{\"code\":\"cristaltoken\",\"table\":\"customer\",\"scope\":\"cristaltoken\",\"key_type\":\"name\",\"upper_bound\":\"atomakinnaka\",\"lower_bound\":\"atomakinnaka\"}"
// curl -X POST "https://telos.caleos.io/v1/chain/get_table_rows" -H "accept: */*" -H "Content-Type: application/json" -d "{\"code\":\"cristaltoken\",\"table\":\"customer\",\"scope\":\"cristaltoken\",\"key_type\":\"name\",\"upper_bound\":\"atomakinnaka\",\"lower_bound\":\"atomakinnaka\"}"

