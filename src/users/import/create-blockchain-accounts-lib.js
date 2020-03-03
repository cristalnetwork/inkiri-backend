const UsersModel    = require('../models/users.model');
const accounts      = require('./accounts.js');
const config        = require('../../common/config/env.config.js');
const eosHelper     = require('../../eos/helper/helper.js');
var   _             = require('lodash');

const CURRENCY_SYMBOL = config.eos.blockchain_currency_symbol;

const formatAmount = (amount) => {
  return Number(amount).toFixed(4) + ' ' + config.eos.token.code;
}

const ACCOUNT_TYPES = ['none', 'personal', 'business', 'foundation', 'bankadmin'];
const accountDescToId = (account_type_string) =>{
    return ACCOUNT_TYPES.indexOf(account_type_string);
};

module.exports = async (new_account_name, new_account_public_key, account_type_string, fee, overdraft, permissions, get_tx) => { 
    
  const account_type     = accountDescToId(account_type_string);
  const fee_string       = formatAmount(fee);
  const overdraft_string = formatAmount(overdraft);
  
  const is_business = account_type_string=='business';
  const ram         = 4096 ;
  const net         = is_business? '0.5000' : '0.2500'; 
  const cpu         = is_business? '1.0000' : '0.5000';

  let actions = [];
  
  let newAccountAction = 
    {
    account:             'eosio',
    name:                'newaccount',
    authorization: [{
      actor:             config.eos.bank.account,
      permission:        'active',
    }],
    data: {
      creator:           config.eos.bank.account,
      name:              new_account_name,
      owner: {
        threshold:       1,
        keys: [{
          key:           new_account_public_key,
          weight:        1
        }],
        accounts: [{
          permission: {
            actor:       config.eos.bank.account,
            permission:  "active"
          },
          weight:        1
        }],
        waits:           []
      },
      active: {
        threshold:       1,
        keys: [{
          key:           new_account_public_key,
          weight:        1
        }],
        accounts:        [],
        waits:           []
      },
    },
  };
  // actions.push(newAccountAction)

  if(permissions)
  {
    // console.log(' ******* HAY PERMISOS')
    Object.keys(permissions).forEach(function (key, idx) {
      if(!(key in newAccountAction.data))
      {
        // console.log(' ******* CREATED PERM: ', key)
        newAccountAction.data[key] = {
          threshold:   1,
          keys:        [],
          accounts:    [],
          waits:       []
        };
      }
      
      // console.log(' ******* ITERANDO: ', key, ' | con items: ', JSON.stringify(permissions[key]))
      permissions[key].forEach(function(auth_account){
        newAccountAction.data[key].accounts.push(
            {
              permission: {
                actor:       auth_account,
                permission:  "active"
              },
              weight:        1
            }
          );
      });

      // SORTING
      // console.log(' ******* SORTING! ')
      const ordered = _.sortBy(newAccountAction.data[key].accounts, function(perm) { return perm.permission.actor; })
      newAccountAction.data[key].accounts = ordered;  
    });
  }

  // console.log(JSON.stringify(newAccountAction));

  const buyRamAction = {
    account:                'eosio',
    name:                   'buyrambytes',
    authorization: [{
      actor:                config.eos.bank.account,
      permission:           'active',
    }],
    data: {
      payer:                config.eos.bank.account,
      receiver:             new_account_name,
      bytes:                ram,
    },
  };
  // actions.push(buyRamAction)

  const delegateBWAction= {
    account:                'eosio',
    name:                   'delegatebw',
    authorization: [{
      actor:                config.eos.bank.account,
      permission:           'active',
    }],
    data: {
      from:                 config.eos.bank.account,
      receiver:             new_account_name,
      stake_net_quantity:   net + ' ' + CURRENCY_SYMBOL,
      stake_cpu_quantity:   cpu + ' ' + CURRENCY_SYMBOL,
      transfer:             false,
    }
  }
  // actions.push(delegateBWAction)

  const createBankAccountAction = {
    account:                config.eos.bank.account,
    name:                   config.eos.bank.table_customers_action,
    authorization: [{
      actor:                config.eos.bank.account,
      permission:           'active',
    }],
    data: {
      to              :     new_account_name
      , fee           :     fee_string
      , overdraft     :     overdraft_string
      , account_type  :     account_type
      , state         :     1
      , memo          :     ''
    },
  }
  
  const issueAction = null;
  // This should be executed at the Smart Contract.
  // const issueAction = (overdraft>0)
  //   ?{
  //     account: globalCfg.currency.token,
  //     name: "issue",
  //     authorization: [
  //       {
  //         actor: globalCfg.currency.issuer,
  //         permission: "active"
  //       }
  //     ],
  //     data: {
  //       to: new_account_name,
  //       quantity: formatAmount(overdraft),
  //       memo: ('oft|create')
  //     }
  //   }
  //   :null;
  // 

  actions = [newAccountAction, buyRamAction, delegateBWAction, createBankAccountAction]
  
  // console.log(' ---- ACTION:');
  // console.log(JSON.stringify(actions));

  if(get_tx)
    return actions;
  return eosHelper.createAccount(actions);
  // return newAccountAction;
}

const getNameFromTx = (tx) =>{
  console.log('*********** getNameFromTx');
  console.log(tx);
  
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

