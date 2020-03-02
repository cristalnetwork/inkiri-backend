const config                                   = require('../../common/config/env.config.js');
const { JsonRpc, RpcError, Api }               = require('eosjs');
const { JsSignatureProvider }                  = require('eosjs/dist/eosjs-jssig');
const fetch                                    = require('node-fetch');
const { TextEncoder, TextDecoder }             = require('util');
const dfuse                                    = require('../../transactions/services/dfuse');
const hyperion                                 = require('../../transactions/services/hyperion');

var iugu_config         = null;
try {
    iugu_config         = require('../../common/config/iugu.config.js');
} catch (ex) {}

const iugu_private_key  = process.env.IUGU_ISSUER_PRIVATE_KEY || iugu_config.prod.private_key;

const rpc = new JsonRpc(config.eos.blockchain_endpoint, { fetch });
const signatureProvider = new JsSignatureProvider([iugu_private_key]);
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

const PERMISSION_VIEWER = 'viewer';
const PERMISSION_PDA    = 'pda';
const PERMISSION_ACTIVE = 'active';
const PERMISSION_OWNER  = 'owner';

const perms_hierarchy = [
  PERMISSION_VIEWER, PERMISSION_PDA, PERMISSION_ACTIVE, PERMISSION_OWNER
]

exports.getAccountInfo = async (account_name) => {
  const resp = await rpc.get_account(account_name);
  return resp;
}

exports.getCustomerInfo = async (account_name) => {
  const response = await rpc.get_table_rows({
    json:           true
    , code:         config.eos.bank.account
    , scope:        config.eos.bank.account
    , table:        config.eos.bank.table_customers
    , lower_bound:  account_name
    , upper_bound:  account_name
    , limit:        1
    , reverse:      false
    , show_payer :  false
  });
  const _found = (response.rows&&response.rows.length>0);
  if(_found)
    console.log(' EOSHelper::getCustomerInfo >> ', JSON.stringify(response.rows[0]));
  else
    console.log(' EOSHelper::getCustomerInfo >> ', 'NOT FOUND');
  return _found?{...response.rows[0]}:undefined;
}

exports.accountHasWritePermission = async (permissioned_account_name, permissioner_account_name) => {
  return exports.getPermissionsForAccount(permissioned_account_name, permissioner_account_name, [PERMISSION_ACTIVE, PERMISSION_OWNER]);
}

exports.accountHasReadPermission = async (permissioned_account_name, permissioner_account_name) => {
  return exports.getPermissionsForAccount(permissioned_account_name, permissioner_account_name, [PERMISSION_VIEWER]);
}

exports.accountHasSellPermission = async (permissioned_account_name, permissioner_account_name) => {
  return exports.getPermissionsForAccount(permissioned_account_name, permissioner_account_name, [PERMISSION_PDA]);
}

exports.accountHasPermission = async (permissioned_account_name, permissioner_account_name) => {
  return exports.getPermissionsForAccount(permissioned_account_name, permissioner_account_name, undefined);
}

exports.getPermissionsForAccount = async (account_name, permissioner_account, permissions) => {
  return new Promise( (resolve, reject) => {

    // const permissioner = await rpc.get_account(permissioner_account)
    rpc.get_account(permissioner_account)
    .then(
      (permissioner) => {
          if(!permissioner || !permissioner || !permissioner.permissions)
          {
            reject({error:'NO PERMISSIONS from account '+permissioner_account})
            return;
          }

          const perms = permissioner.permissions.reduce((_arr, perm) =>  {
            const perm_auths = perm.required_auth.accounts.filter(acc_perm => acc_perm.permission.actor == account_name) ;
            if(perm_auths.length>0)
            {
              _arr.push({ permission: perm_auths[0].permission, perm_name:perm.perm_name, permissioner:permissioner_account});
            };
            return _arr;
          } ,[] );

          if(!permissions)
          {
            if(perms.length<1)
            {
              reject({error:'No permissions#1'})
              return;
            }
            const result = perms.sort(function(a, b){return perms_hierarchy.indexOf(a.perm_name)<perms_hierarchy.indexOf(b.perm_name)});
            resolve(result)  ;
            return;
          }
          if(perms.length<1)
          {
            reject({error:'No permissions#1'})
            return;
          }
          const result = perms.filter(perm => permissions.includes(perm.perm_name))[0];
          resolve(result)
      }, (err) => {
        reject({error:'NO PERMISSIONS from account '+permissioner_account, message:JSON.stringify(err)})
      }
    )

  });
}

exports.issueMoney = async (to, amount, memo) => {

  const issueAction = {
    account: config.eos.token.contract,
    name: "issue",
    authorization: [
      {
        actor:      config.eos.token.account,
        permission: "active"
      }
    ],
    data: {
      to:       to,
      quantity: formatAmount(amount),
      memo:     ('oft|'+memo)
    }
  }

  return pushTX(issueAction);

}

exports.issueIugu = async (to, amount, memo) => {

  const issueAction = {
    account: config.eos.token.contract,
    name: "issue",
    authorization: [
      {
        actor: config.eos.token.account,
        permission: "active"
      }
    ],
    data: {
      to: to,
      quantity: formatAmount(amount),
      memo: ('iug|'+memo)
    }
  }

  return pushTX(issueAction);

}

exports.createAccount = async (tx) => pushTX(tx);

// const pushTX = async (tx, privatekey) => {
const pushTX = async (tx) => {
  // const rpc = new JsonRpc(config.eos.blockchain_endpoint, { fetch });
  // const signatureProvider = new JsSignatureProvider([iugu_private_key]);
  // const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

  try {
	  const result = await api.transact(
	    { actions: Array.isArray(tx)?tx:[tx] },
	    {
	      blocksBehind: 3,
	      expireSeconds: 30
	    }
	  );
	  // console.log(' InkiriApi::pushTX (then#1) >> ', JSON.stringify(result));
    return result;

	} catch (e) {
	  // console.log(' InkiriApi::pushTX (error#1) >>  ', JSON.stringify(e));
    // throw e.json.error.details[0].message;
    throw e;
	}
}

const formatAmount = (amount) => {
  return Number(amount).toFixed(4) + ' ' + config.eos.token.code;
}

const parseAmount = (amount) => {
  return parseFloat(amount.replace(config.eos.token.code, '').trim());
}


exports.listBankAccounts = async () => { 
  const response = await rpc.get_table_rows({
    json:           true                 
    , code:         config.eos.bank.issuer
    , scope:        config.eos.bank.issuer
    , table:        config.eos.bank.table_customers
    , limit:        1000
    , reverse:      false
    , show_payer :  false
  });
  //response.more
  return response.rows.map( row => ({
    account_name:   row.key
    , fee:          parseAmount(row.fee)
    , overdraft:    parseAmount(row.overdraft)
    , account_type: row.account_type
    , state:        row.state
  }) );
}

// exports.listBankBalances = async () => { 
//   // const response = await rpc.get_table_rows({
//   //   json:           true                 
//   //   , code:         config.eos.bank.issuer
//   //   , scope:        config.eos.bank.issuer
//   //   , table:        config.eos.bank.table_balances
//   //   , limit:        1000
//   //   , reverse:      false
//   //   , show_payer :  false
//   // });
//   // return {balances:response.rows, more:response.more};
// }

exports.getAccountBalance = async (account_name) => {
  const response = await rpc.get_currency_balance(config.eos.token.contract, account_name, config.eos.token.code)
  return response[0];
}

exports.listBankBalances = async (account_names_array) => {

    // console.log(' ********* HISTORY PROVIDER: [' , config.eos.history_provider, ']')
    try{
      if(config.eos.history_provider.trim()=='dfuse')
      {
        const path           = config.eos.dfuse.base_url + '/v0/state/tables/scopes';
        const method         = 'GET';
        const currency_token = config.eos.token.contract;
        const table          = config.eos.bank.table_balances;
        const scopes         = account_names_array.join('|');
        const server_key     = config.eos.dfuse.server_api_key || process.env.DFUSE_SERVER_API_KEY;
        
        const balances = await dfuse.stateTablesForScopes(
                    {api_key: server_key, network:config.eos.dfuse.network}
                    , currency_token
                    , account_names_array
                    , table);
        return  (balances.tables.map(row=>{
            return { account_name : row.scope, 
                    balance :       ((row.rows&&row.rows.length>0)
                                      ?parseAmount(row.rows[0].json.balance)
                                      :0)
              }
          } ) );
      }
      else
        if(config.eos.history_provider.trim()=='hyperion')
        {  
          console.log('###1')
          const promises  = account_names_array.map(account_name => exports.getAccountBalance(account_name))
          console.log('###2')
          const responses = await Promise.all(promises);
          console.log('###2')
          return  responses.map((balance, idx)=>{
            return { account_name : account_names_array[idx], 
                    balance       : parseAmount(balance)
              }
          } ) ;
        }
      // balances = await response.json();

    }
    catch(e){
      console.log('ERROR #1', e);
      // console.log(JSON.stringify(e.details.errors.table));
      return [];
    }
    return [];
        
}
