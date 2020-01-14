const config         = require('../../common/config/env.config.js');
const mongoose       = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri, {useNewUrlParser: true});
global.mongoose_connected = true;

const dfuse          = require('./dfuse');
const TxsModel       = require('../models/transactions.model');
const UserModel      = require('../../users/models/users.model');
const TeamModel      = require('../../teams/models/teams.model');
const IuguModel      = require('../../iugu/models/iugu.model');
const RequestModel   = require('../../requests/models/requests.model');
const ServiceModel   = require('../../services/models/services.model');
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
      let res       = false;
      let update_tx = null;
      if(action.action)
      {
        console.log(' == Trying to process: ', action.action);
        console.log(' ==== with params: ', toLog(action.params));
        console.log(' ==== query:', action.query);
        // console.log(' ====== tx: ', action.tx.block_num);
        // console.log(' ====== ts: ', action.tx.block_timestamp);

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
      // MEMO:   'wth|' + requestCounterId
      // ACTION: CREATE withdraw request
      const wth_account = await UserModel.byAccountNameOrNull(operation.data.to);
      return {
        context:    REQUEST_CONTEXT
        , action:   'findOneAndUpdate'
        , query:    { requestCounterId:  parseInt(helper._at(memo_parts, 1)) }
        , params:   { 
                      amount:         tx.amount
                      , state:          RequestModel.STATE_RECEIVED
                      , tx_id:          tx.tx_id 
                    }
        // , action:   'create'
        // , params:   [{ 
        //             created_by:       wth_account
        //             , requested_by:   wth_account
        //             , from:           operation.data.from
        //             , requested_type: RequestModel.TYPE_WITHDRAW
        //             , amount:         tx.amount
        //             , state:          RequestModel.STATE_RECEIVED
        //             , tx_id:          tx.tx_id 
        //           }]
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
                    amount:          tx.amount
                    , state:         RequestModel.STATE_RECEIVED
                    , tx_id:         tx.tx_id
                    , bank_account:  UserModel.bankAccountByIdOrNull(xch_account, helper._at(memo_parts, 2))
                  }
      }
      break;
    case helper.KEY_TRANSFER_PRV:
      // MEMO:   'prv|' + request_id
      // ACTION: CREATE provider payment request
      // const prv_account = await UserModel.byAccountNameOrNull(operation.data.to);
      return {
        context:    REQUEST_CONTEXT
        , action:   'findOneAndUpdate'
        , query:    { requestCounterId:  parseInt(helper._at(memo_parts, 1)) }
        , params: { 
                    amount:         tx.amount
                    , state:        RequestModel.STATE_RECEIVED
                    , tx_id:        tx.tx_id
                  }
      }
      break;
    case helper.KEY_TRANSFER_PAY:
      // MEMO:   'pay|' + request_id + '|' + memo)
      // ACTION: UPDATE ref payment request
      // const pay_account = await UserModel.byAccountNameOrNull(operation.data.to);
      return {
        context:    REQUEST_CONTEXT
        , action:   'findOneAndUpdate'
        , query:    { requestCounterId:  parseInt(helper._at(memo_parts, 1)) }
        , params: { 
                    amount:         tx.amount
                    // , state:        RequestModel.STATE_ACCEPTED
                    , tx_id:        tx.tx_id
                  }
      }
      break;
    case helper.KEY_TRANSFER_SLR:
      // MEMO:   slr|Ref. Dezembro 2019|2019/11
      // ACTION: CREATE 1 salary request for all wages
      let wages = [];
      let total_amount = 0;
      const team = await TeamModel.byAccountNameOrNull(operation.data.from)
      for(var i=0; i<tx.trace.topLevelActions.length; i++){
        const oper   = tx.trace.topLevelActions[i];
        const user   = await UserModel.byAccountNameOrNull(oper.data.to);
        const member = await team.members.find( member => member.member.account_name==oper.data.to)
        const amount = dfuse.quantityToNumber(oper.data.quantity);
        const cur_memo_parts  = helper.splitMemo(oper);
        wages.push(
          {
                account_name:   oper.data.to,
                member:         user,
                position:       member.position,
                wage:           amount,
                description:    helper._at(cur_memo_parts, 1),
                period:         helper._at(cur_memo_parts, 2)  
          }
        );
        total_amount+=amount;
      } 
      const slr_account = await UserModel.byAccountNameOrNull(operation.data.from);
      return {
        context:    REQUEST_CONTEXT
        , action:   'create'
        , params:   [{ 
                    created_by:       slr_account
                    , requested_by:   slr_account
                    , from:           operation.data.from
                    , requested_type: RequestModel.TYPE_SALARY
                    , amount:         total_amount
                    , state:          RequestModel.STATE_ACCEPTED
                    , tx_id:          tx.tx_id 
                    , wages:          wages
                    , description:    `${helper._at(memo_parts, 1) + '/' + helper._at(memo_parts, 2)}`
                  }]
      }
      
    case helper.KEY_TRANSFER_PAP:
      // MEMO:   
      // ACTION: CREATE payment request
      return {};
      break;
    case helper.KEY_TRANSFER_SND:
      // MEMO:   'snd|'+memo
      // ACTION: CREATE request
      return {};
      break;
    case helper.KEY_NEW_ACCOUNT:
        const oper = helper.operationByName(tx, helper.KEY_UPSERT_PAP)
        // MEMO:   ?
        // ACTION: CREATE new account request (NEW)
        return {};
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
        return {};
      break;
    case helper.KEY_ERASE_CUST:
        // MEMO:   ?
        // ACTION: CREATE erasu cust request (NEW)
        // to
        // memo
        return {};
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
        return {};
      break;
    case helper.KEY_CHARGE_PAP:
        // MEMO:   pap|pay|period_to_charge
        // ACTION: CREATE service payment (pap) request (NEW?)
        // "from": "wawrzeniakdi",
        // "memo": "pap|pay|1",
        // "quantity": "200.0000 INK",
        // "service_id": 7,
        // "to": "centroinkiri"
        const service = await ServiceModel.byCounterIdOrNull(operation.data.service_id);
        const payer   = await UserModel.byAccountNameOrNull(operation.data.from); 
        const payee   = await UserModel.byAccountNameOrNull(operation.data.to); 
        return {
          context:    REQUEST_CONTEXT
          , action:   'create'
          , params:   [{ 
                      created_by:       payee
                      , requested_by:   payer
                      , from:           payer.account_name
                      , requested_type: RequestModel.TYPE_PAD
                      , amount:         dfuse.quantityToNumber(operation.data.quantity)
                      , state:          RequestModel.STATE_ACCEPTED
                      , tx_id:          tx.tx_id 
                      , pad:            { period: parseInt(helper._at(memo_parts, 2))}
                      
                    }]
        }
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