const config         = require('../../common/config/env.config.js');
const mongoose       = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri, {useNewUrlParser: true});
global.mongoose_connected = true;


const TxsModel       = require('../models/transactions.model');
const UserModel      = require('../../users/models/users.model');
const IuguModel      = require('../../iugu/models/iugu.model');
const RequestModel   = require('../../requests/models/requests.model');
const helper         = require('./txs-helper.js');

const REQUEST_CONTEXT = 'request';
const USER_CONTEXT    = 'user';
const TX_CONTEXT      = 'tx';

exports.process = async () => {  

  console.log(' =============================================================================');
  console.log(' =====    START PROCESS    ===================================================');
  console.log(' =============================================================================');

  // 1.- Get unprocessed txs 
  const txs = await TxsModel.listUnprocessed(100, 0);

  if(!txs || txs.length==0)
  {
    console.log('Nothing to process!');
    return;
  }

  // 2.- Process 
  const actions = await Promise.all ( txs.map(
      async (tx) => {
        const operation      = tx.trace.topLevelActions[0];
        const operation_data = helper.expand(operation)
        let action = await getAction(operation, operation_data, tx);
        action.tx = tx;
        action.operation_data = operation_data;
        return action;
      }
    )
  );

  if(!actions || !Array.isArray(actions) || actions.length==0)
    return null;

  const contexts = { REQUEST_CONTEXT : RequestModel.model 
                    , USER_CONTEXT   : UserModel.model
                    , TX_CONTEXT     : TxsModel.model}

  const session = await mongoose.startSession();

  console.log(` == About to process ${actions.length} actions.`);

  for(var i = 0; i<actions.length;i++)
  { 
    const action     = actions[i];

    if(!action || !action.context)
    {
      console.log(` == Action ${i}/${actions.length} is not configured. Continuing...`);
      console.log(' ====================================================================') 
      continue;
    }

    console.log(` == RUNNING action ${action.operation_data.tx_type} ${i}/${actions.length}...`);
    const context    = contexts[action.context];
    // session.withTransaction(() => {
    // })
    session.startTransaction()
    const opts    = { session: session };
    
    try {
      let res       = true;
      let update_tx = null;
      // console.log( ' == Trying to process: ', action.operation_data)
      // console.log('action.action:', action.action)
      if(action.action)
      {
        console.log(' == Trying to process: ', action.action);
        console.log(' ==== with params: ', toLog(action.params));
        console.log(' ==== query:', action.query);
        console.log(' ====== tx: ', action.tx.block_num);
        console.log(' ====== ts: ', action.tx.block_timestamp);

        if(action.query)
        {
          res = await RequestModel.model[action.action](action.query, action.params, opts)
        }
        else
        {  
          res = await RequestModel.model[action.action](action.params, opts)
        }
        if(Array.isArray(action.params) && Array.isArray(res))
          res = res[0];
      }
      if(res)
      {
        // console.log( '=== ABOUT TO UPDATE REQUEST: (action.tx.request:', action.tx.request, ') ( res._id:', res._id, '}-' )
        // const data = 
        // update_tx = await contexts[TX_CONTEXT].findOneAndUpdate({tx_id: action.tx.tx_id}, {state: TxsModel.STATE_PROCESSED, request: tx.request||res._id}, { session: session });
        update_tx = await TxsModel.model.findOneAndUpdate(
            {tx_id: action.tx.tx_id}
            , {state: TxsModel.STATE_PROCESSED, request: action.tx.request||res._id}
            , { session: session });
      }
      // console.log(' ...........res:', res)
      // console.log(' ...........update_tx:', update_tx)
      // console.log(' ...........about to commit')
      const tx_res = await session.commitTransaction()
      console.log(' commit tx')
      console.log(' ====================================================================') 
    } catch (err) {
      console.log(' +++ error:', err)
      await session.abortTransaction()
      // throw err
    }
  }

  await session.endSession()
  console.log(' =====    END PROCESS    =====================================================');
  console.log(' =============================================================================');

  return actions;
}

const toLog = (params) => {
  const filterKeys = (obj) => {
    let to_ret = {};
    const keys = Object.keys(obj);
    for(var i =0; i<keys.length;i++)
       if(!['created_by', 'requested_by', 'iugu'].includes(keys[i]))
         to_ret[keys[i]] = obj[keys[i]];
    return to_ret;
  }
  if(Array.isArray(params))
  {
    return filterKeys(params[0]);
  }
  return filterKeys(params);
}
const getAction = async (operation, operation_data, tx) => {
  
  const memo_parts  = helper.splitMemo(operation);
  let request = null;

  switch(operation_data.tx_type) {
    case helper.KEY_ISSUE_DEP:
      // MEMO:     dep|${fiat}|${requestCounterId.toString()}
      // ACTION: UPDATE request de deposito
      return {
        context:    REQUEST_CONTEXT
        , action:   'findOneAndUpdate'
        , query:    { requestCounterId:  parseInt(helper._at(memo_parts, 2)) }
        , params:   { tx_id:             tx.tx_id
                      , state:           RequestModel.STATE_ACCEPTED }
      }
      break;
    case helper.KEY_ISSUE_IUG:
      // MEMO: 'iug|'+Iugu.id
      // ACTION: CREATE request de issue
      // Nota: we use operation.data.to because the receiver is the user/customer that received the issue.
      const iug_account = await UserModel.byAccountNameOrNull(operation.data.to);
      return {
        context:    REQUEST_CONTEXT
        , action:   'create'
        , params:   [{ 
                    created_by:       iug_account
                    , requested_by:   iug_account
                    , from:           operation.data.to
                    , requested_type: RequestModel.TYPE_IUGU
                    , amount:         tx.amount
                    , state:          RequestModel.STATE_ACCEPTED
                    , tx_id:          tx.tx_id 
                    , iugu:           await IuguModel.byIdOrNull(helper._at(memo_parts, 1))
                  }]
      }
      break;
    case helper.KEY_TRANSFER_WTH:
      // MEMO:   'wth|' + request_id
      // ACTION: CREATE withdraw request
      const wth_account = await UserModel.byAccountNameOrNull(operation.data.to);
      return {
        context:    REQUEST_CONTEXT
        , action:   'create'
        , params:   [{ 
                    created_by:       wth_account
                    , requested_by:   wth_account
                    , from:           operation.data.from
                    , requested_type: RequestModel.TYPE_WITHDRAW
                    , amount:         tx.amount
                    , state:          RequestModel.STATE_REQUESTED
                    , tx_id:          tx.tx_id 
                  }]
      }
      break;
    // case helper.KEY_ISSUE_OFT:
    //   return { 
    //         };
    //   break;
    case helper.KEY_TRANSFER_BCK:
      // MEMO: 'bck|' + request_counter_id + '|' + new_state      (bck|55|state_rejected)
      // ACTION: UPDATE request refundeada
      // -old- MEMO: 'bck|' + request_id + '|' + tx_id
      return {
        context:    REQUEST_CONTEXT
        , action:   'findOneAndUpdate'
        , query:    { requestCounterId:  parseInt(helper._at(memo_parts, 1)) }
        , params:   { 
                      state:            helper._at(memo_parts, 2)
                      , refund_tx_id:   tx.tx_id
                    }
      }
      break;
    case helper.KEY_TRANSFER_XCH:
      // MEMO:   'xch|' + requestCounterId + '|' + bank_account_id)
      // ACTION: CREATE exchange request
      const xch_account = await UserModel.byAccountNameOrNull(operation.data.to);
      return {
        context:    REQUEST_CONTEXT
        , action:   'findOneAndUpdate'
        , query:    { requestCounterId:  parseInt(helper._at(memo_parts, 1)) }
        , params: { 
                    created_by:       await UserModel.byAccountNameOrNull(operation.data.from)
                    , requested_by:   await UserModel.byAccountNameOrNull(operation.data.from)
                    , from:           operation.data.from
                    , requested_type: RequestModel.TYPE_EXCHANGE
                    , amount:         tx.amount
                    , state:          RequestModel.STATE_RECEIVED
                    , tx_id:          tx.tx_id
                    , bank_account:   UserModel.bankAccountByIdOrNull(xch_account, helper._at(memo_parts, 2))
                  }
      }
      return  { 
              type:               helper._at(memo_parts, 0)
              , request_id:       helper._at(memo_parts, 1)
              , bank_account_id:  helper._at(memo_parts, 2)
            };
      break;
    case helper.KEY_TRANSFER_PRV:
      // MEMO:   'prv|' + request_id
      // ACTION: CREATE provider payment request
      return  { 
              type:               helper._at(memo_parts, 0)
              , request_id:       helper._at(memo_parts, 1)
            };
      break;
    case helper.KEY_TRANSFER_PAY:
      // MEMO:   'pay|' + request_id + '|' + memo)
      // ACTION: UPDATE ref payment request
      return  { 
              type:               helper._at(memo_parts, 0)
              , request_id:       helper._at(memo_parts, 1)
              , memo:             helper._at(memo_parts, 2)
            };
      break;
    case helper.KEY_TRANSFER_PAP:
      // MEMO:   
      // ACTION: CREATE payment request
      break;
    case helper.KEY_TRANSFER_SLR:
      // MEMO:   'slr|'+(ref||'')+'|'+(month||'');
      // ACTION: CREATE 1 salary request for all wages
      // ACTION2: CREATE salary request for every wage/employee
      return  { 
              type:               helper._at(memo_parts, 0)
              , memo:             helper._at(memo_parts, 1)
              , period:           helper._at(memo_parts, 2)
            };
      break;
    case helper.KEY_TRANSFER_SND:
      // MEMO:   'snd|'+memo
      // ACTION: CREATE request
      return  { 
              type:               helper._at(memo_parts, 0)
              , memo:             helper._at(memo_parts, 1)
            };
      break;
    case helper.KEY_NEW_ACCOUNT:
        const oper = helper.operationByName(tx, helper.KEY_UPSERT_PAP)
        // MEMO:   ?
        // ACTION: CREATE new account request (NEW)
      break;
    case helper.KEY_UPSERT_CUST:
        // MEMO:   ?
        // ACTION: CREATE new account request OR update account request (NEW)
        // to
        // fee
        // overdraft
        // account_type
        // state
        // memo
      break;
    case helper.KEY_ERASE_CUST:
        // MEMO:   ?
        // ACTION: CREATE erasu cust request (NEW)
        // to
        // memo
      break;
    case helper.KEY_UPSERT_PAP:
        // MEMO:   ?
        // ACTION: CREATE upsert pap request (NEW)
        // from
        // to
        // service_id
        // price
        // begins_at
        // periods
        // last_charged
        // enabled
        // memo
      break;
    case helper.KEY_CHARGE_PAP:
        // MEMO:   pap|pay|period_to_charge
        // ACTION: CREATE service payment (pap) request (NEW?)
        return  { 
              type:                helper._at(memo_parts, 0)
              , action:            helper._at(memo_parts, 1)
              , period_to_charge:  helper._at(memo_parts, 2)
            };
        // from
        // to
        // service_id
        // quantity
        // memo
      break;
    case helper.KEY_ERASE_PAP:
        // MEMO:   -
        // ACTION: CREATE delete service request (pap) request (NEW?)
        // from
        // to
        // service_id
        // memo
      break;
    default:
      return {};
  }
}
