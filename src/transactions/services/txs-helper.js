const config       = require('../../common/config/env.config.js');

/*
* Explode raw event/search result transaction to a human readable format.
*  
*/

exports.TYPE_DEPOSIT      = 'type_deposit';
exports.TYPE_EXCHANGE     = 'type_exchange';
exports.TYPE_PAYMENT      = 'type_payment';
exports.TYPE_PROVIDER     = 'type_provider' ;
exports.TYPE_SEND         = 'type_send';
exports.TYPE_WITHDRAW     = 'type_withdraw' ;
exports.TYPE_SERVICE      = 'type_service';
exports.TYPE_SALARY       = 'type_salary';
exports.TYPE_ISSUE        = 'type_issue';
exports.TYPE_IUGU         = 'type_iugu';
exports.TYPE_REFUND       = 'type_refund';
exports.TYPE_RECEIVE      = 'type_receive';
exports.TYPE_UNKNOWN      = 'type_unknown';
exports.TYPE_NEW_ACCOUNT  = 'type_new_account';
exports.TYPE_UPSERT_CUST  = 'type_upsert_cust';
exports.TYPE_ERASE_CUST   = 'type_erase_cust';
exports.TYPE_UPSERT_PAP   = 'type_upsert_pap';
exports.TYPE_ERASE_PAP    = 'type_erase_pap';
exports.TYPE_CHARGE_PAP   = 'type_charge_pap';

exports.operationByName = (tx, name) => {
  const operation = tx.trace.topLevelActions.filter(oper => oper.name==name);
  if(!Array.isArray(operation) || operation.length<=0)
    return null;
  return operation[0]

}

exports.expand = (tx) =>  {
  const tx_type         = combineTxNameCode(tx);
  const tx_code         = getTxCode(tx);
  const requested_type  = keyCodeToRequestType(tx_type);
 return {
    tx_type:            tx_type
    , tx_code :         tx_code  
    , requested_type:   requested_type
  };
  
}

const getTxMemo         = (tx)  => { return (tx.data && tx.data.memo)?tx.data.memo:''; }
exports.splitMemo       = (tx)  => { return getTxMemo(tx).split('|'); }
const getTxCode         = (tx)  => { return exports.splitMemo(tx)[0]; }
const combineTxNameCode = (tx)  => { 
  const tx_code   = getTxCode(tx);
  const separator = tx_code?'_':''; 
  return `${tx.name}${separator}${tx_code}`; 
};

 
const  MEMO_KEY_DEP =  'dep';
const  MEMO_KEY_IUG =  'iug';
const  MEMO_KEY_OFT =  'oft';
const  MEMO_KEY_BCK =  'bck';
const  MEMO_KEY_WTH =  'wth';
const  MEMO_KEY_XCH =  'xch';
const  MEMO_KEY_PRV =  'prv';
const  MEMO_KEY_SND =  'snd';
const  MEMO_KEY_PAY =  'pay';
const  MEMO_KEY_PAP =  'pap';
const  MEMO_KEY_SLR =  'slr';

exports.KEY_ISSUE_DEP    =  'issue_'+MEMO_KEY_DEP;
exports.KEY_ISSUE_IUG    =  'issue_'+MEMO_KEY_IUG;
exports.KEY_ISSUE_OFT    =  'issue_'+MEMO_KEY_OFT;
exports.KEY_TRANSFER_    =  'transfer_';
exports.KEY_TRANSFER_BCK =  'transfer_'+MEMO_KEY_BCK;
exports.KEY_TRANSFER_WTH =  'transfer_'+MEMO_KEY_WTH;
exports.KEY_TRANSFER_XCH =  'transfer_'+MEMO_KEY_XCH;
exports.KEY_TRANSFER_PRV =  'transfer_'+MEMO_KEY_PRV;
exports.KEY_TRANSFER_SND =  'transfer_'+MEMO_KEY_SND;
exports.KEY_TRANSFER_PAY =  'transfer_'+MEMO_KEY_PAY;
exports.KEY_TRANSFER_PAP =  'transfer_'+MEMO_KEY_PAP;
exports.KEY_TRANSFER_SLR =  'transfer_'+MEMO_KEY_SLR;
exports.KEY_NEW_ACCOUNT  =  `newaccount`;
exports.KEY_UPSERT_CUST  =  `${config.eos.bank.table_customers_action}`;
exports.KEY_ERASE_CUST   =  `${config.eos.bank.table_customers_delete}`;
exports.KEY_UPSERT_PAP   =  `${config.eos.bank.table_paps_action}_${MEMO_KEY_PAP}`;
exports.KEY_ERASE_PAP    =  `${config.eos.bank.table_paps_delete}`;
exports.KEY_CHARGE_PAP   =  `${config.eos.bank.table_paps_charge}_${MEMO_KEY_PAP}`;

const typesMap = {
  [exports.KEY_ISSUE_DEP]     : exports.TYPE_DEPOSIT,
  [exports.KEY_ISSUE_IUG]     : exports.TYPE_IUGU,
  [exports.KEY_ISSUE_OFT]     : exports.TYPE_ISSUE,
  [exports.KEY_TRANSFER_BCK]  : exports.TYPE_REFUND,
  [exports.KEY_TRANSFER_WTH]  : exports.TYPE_WITHDRAW,
  [exports.KEY_TRANSFER_XCH]  : exports.TYPE_EXCHANGE,
  [exports.KEY_TRANSFER_PRV]  : exports.TYPE_PROVIDER,
  [exports.KEY_TRANSFER_SND]  : exports.TYPE_SEND,
  [exports.KEY_TRANSFER_PAY]  : exports.TYPE_PAYMENT,
  [exports.KEY_TRANSFER_PAP]  : exports.TYPE_SERVICE,
  [exports.KEY_TRANSFER_SLR]  : exports.TYPE_SALARY,
  [exports.KEY_NEW_ACCOUNT]   : exports.TYPE_NEW_ACCOUNT,
  [exports.KEY_UPSERT_CUST]   : exports.TYPE_UPSERT_CUST,
  [exports.KEY_ERASE_CUST]    : exports.TYPE_ERASE_CUST,
  [exports.KEY_UPSERT_PAP]    : exports.TYPE_UPSERT_PAP,
  [exports.KEY_ERASE_PAP]     : exports.TYPE_ERASE_PAP,
  [exports.KEY_CHARGE_PAP]    : exports.TYPE_CHARGE_PAP,
  [exports.KEY_TRANSFER_]     : exports.TYPE_SEND,
}
const keyCodeToRequestType = (key_code) => {
  const my_type = typesMap[key_code];
  return my_type || exports.TYPE_UNKNOWN;
}

exports._at = (array, index, _default=null) => { 
  if(!array || array.length<=index) 
    return _default; 
  return array[index];
}
