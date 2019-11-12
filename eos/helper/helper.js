const config                     = require('../../common/config/env.config.js');
const { JsonRpc, RpcError, Api } = require('eosjs');
const { JsSignatureProvider }    = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const rpc = new JsonRpc(config.eos.blockchain_endpoint, { fetch });
const { TextEncoder, TextDecoder } = require('util');

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
	  console.log(' InkiriApi::pushTX (then#1) >> ', JSON.stringify(result));
    return {data:result};

	} catch (e) {
	  console.log(' InkiriApi::pushTX (error#1) >>  ', JSON.stringify(e));
    // throw e.json.error.details[0].message;
    throw e;
	}
}

const formatAmount = (amount) => {
  return Number(amount).toFixed(4) + ' ' + config.eos.token.code;
}
