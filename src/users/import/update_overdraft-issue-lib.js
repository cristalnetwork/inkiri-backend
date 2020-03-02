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

//'{"to":"tutinopablo1", "fee":"0.0000 INK", "overdraft":"1500.0000 INK", "account_type":1, "state":1, "memo":""}'
const getNumber = (x) => {
  try{
    return Number(x.split(' ')[0]);
  }
  catch(e)
  {
    return 0;
  }
}
module.exports = async (account) => { 
  
  const {account_name}   = account;
  const balance          = Number(account.balance)
  const account_type     = accountDescToId(account.account_type);  
  const overdraft_string = formatAmount(Math.abs(balance));
  const balance_string   = formatAmount(balance);
  const zero_string      = formatAmount(0);


  let action = null;
  if(balance<0)  
    action = {
      account:           config.eos.bank.account,
      name:              config.eos.bank.table_customers_action,
      authorization: [{
        actor:           config.eos.bank.account,
        permission:      'active',
      }],
      data: {
        to              : account_name
        , fee           : zero_string
        , overdraft     : overdraft_string
        , account_type  : account_type
        , state         : 1
        , memo          : 'Initial balance'
      },
    }
  else
    if(balance>0)  
      action = {
        account: config.eos.bank.account,
        name: "issue",
        authorization: [
          {
            actor: config.eos.bank.account,
            permission: "active"
          }
        ],
        data: {
          to:       account_name,
          quantity: balance_string,
          memo: ('oft|initial balance')
        }
      };
    
  if(!action)
    return '';


  console.log(balance);
  if(balance<0)
  {
    console.log('(balance<0)')
    const x = await eosHelper.getCustomerInfo(account.account_name);
    console.log(x);
    if(getNumber(x.overdraft)>0)
      return null;

  }
  if(balance>0)
  {
    console.log('(balance>0)')
    const y = await eosHelper.getAccountBalance(account.account_name);
    console.log(y);
    if(getNumber(y)>0)
      return null;
  }

  actions = [action]
  
  return eosHelper.issue_oft(actions);
  
}
