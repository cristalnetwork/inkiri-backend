const NotificationModel = require('../models/notifications.model');
const RequestModel      = require('../../requests/models/requests.model');

const TRANSITION_BLOCKCHAIN     = 'TRANSITION_BLOCKCHAIN';
const TRANSITION_NEW_REQUEST    = 'TRANSITION_NEW_REQUEST';
const TRANSITION_UPDATE_REQUEST = 'TRANSITION_UPDATE_REQUEST';

exports.onBlockchainTx          = async (request, logged_account, session) => exports.createNotification(request, TRANSITION_BLOCKCHAIN, logged_account, session);
exports.onNewRequest            = async (request, logged_account, session) => exports.createNotification(request, TRANSITION_NEW_REQUEST, logged_account, session);
exports.onUpdateRequest         = async (request, logged_account, session) => exports.createNotification(request, TRANSITION_UPDATE_REQUEST, logged_account, session);

exports.createNotification      = async (request, transition, logged_account, session) => {
  
  return 0;
  
  // console.log('NOTIFICATIONS-HELPER::transition:',     transition)   
  // console.log('NOTIFICATIONS-HELPER::logged_account:', logged_account)   
  // // console.log('NOTIFICATIONS-HELPER::request:', request)   

  // const account_name = request.to;
  // if(logged_account && logged_account == request.to) 
  //   account_name = request.from;
  // const mega_text    = `${request.requested_type}@${request.state} by ${request.from} to ${request.to}. Amount: ${request.amount}. `
  // const mega_title   =  `New ${transition}`;
  // const notification = {
  //   account_name:    account_name
  //   , notification:  { 
  //                     title                  : mega_title                 
  //                     , message              : mega_text
  //                     // , request_counter_id   : request.requestCounterId
  //                     // , amount               : request.amount
  //                    }
  //   , state:   NotificationModel.STATE_NOT_PROCESSED
  //   , request: request
  // }
  
  // const x = await NotificationModel.createNotification(notification);

  // return 0;
}
