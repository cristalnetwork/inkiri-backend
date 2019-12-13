const RequestsModel = require('../models/requests.model');
const eos_helper    = require('../../eos/helper/helper');
const config        = require('../../common/config/env.config.js');
var StateMachine    = require('javascript-state-machine');

const loadStatesForAdmin = (current_state) =>{
 return new StateMachine({
    init: current_state,
    transitions: [
      { name: toTransition(RequestsModel.STATE_REQUESTED,  RequestsModel.STATE_PROCESSING),
          from: RequestsModel.STATE_REQUESTED,
          to: RequestsModel.STATE_PROCESSING },
      { name: toTransition(RequestsModel.STATE_REQUESTED,  RequestsModel.STATE_REJECTED),
          from: RequestsModel.STATE_REQUESTED,
          to: RequestsModel.STATE_REJECTED },
      { name: toTransition(RequestsModel.STATE_REQUESTED, RequestsModel.STATE_CANCELED),
          from: RequestsModel.STATE_REQUESTED,
          to: RequestsModel.STATE_CANCELED
          // If I'm an admin and I'm a business GESTOR.
      },

      // HACK FOR DEPOSITS!!!
      { name: toTransition(RequestsModel.STATE_REQUESTED,  RequestsModel.STATE_ACCEPTED),
          from: RequestsModel.STATE_REQUESTED,
          to: RequestsModel.STATE_ACCEPTED
          // FOR DEPOSITS!
      },
      { name: toTransition(RequestsModel.STATE_PROCESSING, RequestsModel.STATE_ACCEPTED),
          from: RequestsModel.STATE_PROCESSING,
          to: RequestsModel.STATE_ACCEPTED },
      { name: toTransition(RequestsModel.STATE_PROCESSING, RequestsModel.STATE_REVERTED),
          from: RequestsModel.STATE_PROCESSING,
          to: RequestsModel.STATE_REVERTED },
      { name: toTransition(RequestsModel.STATE_CANCELED,   RequestsModel.STATE_REFUNDED),
          from: RequestsModel.STATE_CANCELED,
          to: RequestsModel.STATE_REFUNDED }
    ]
  });
}
const loadStatesForUser = (current_state) =>{
 return new StateMachine({
    init: current_state,
    transitions: [
      // { name: 'cancel',  from: RequestsModel.STATE_REQUESTED,  to: RequestsModel.STATE_CANCELED },
      { name: toTransition(RequestsModel.STATE_REQUESTED, RequestsModel.STATE_CANCELED),  from: RequestsModel.STATE_REQUESTED,  to: RequestsModel.STATE_CANCELED },
    ]
  });
}



const loadStatesForRequestedC2CSender = (current_state) =>{
 return new StateMachine({
    init: current_state,
    transitions: [
      { name: toTransition(RequestsModel.STATE_REQUESTED, RequestsModel.STATE_CANCELED),
          from: RequestsModel.STATE_REQUESTED,
          to: RequestsModel.STATE_CANCELED},

    ]
  });
}
const loadStatesForRequestedC2CReceiver = (current_state) =>{
 return new StateMachine({
    init: current_state,
    transitions: [
      { name: toTransition(RequestsModel.STATE_REQUESTED,  RequestsModel.STATE_REJECTED),
          from: RequestsModel.STATE_REQUESTED,
          to: RequestsModel.STATE_REJECTED },
      { name: toTransition(RequestsModel.STATE_REQUESTED,  RequestsModel.STATE_ACCEPTED),
          from: RequestsModel.STATE_REQUESTED,
          to: RequestsModel.STATE_ACCEPTED},
    ]
  });
}
const loadStatesForRequestedC2CAdmin = (current_state) =>{
 return new StateMachine({
    init: current_state,
    transitions: [
      { name: toTransition(RequestsModel.STATE_REQUESTED,  RequestsModel.STATE_REJECTED),
          from: RequestsModel.STATE_REQUESTED,
          to: RequestsModel.STATE_REJECTED },
      { name: toTransition(RequestsModel.STATE_REQUESTED, RequestsModel.STATE_CANCELED),
              from: RequestsModel.STATE_REQUESTED,
              to: RequestsModel.STATE_CANCELED},
      { name: toTransition(RequestsModel.STATE_REQUESTED,  RequestsModel.STATE_ACCEPTED),
          from: RequestsModel.STATE_REQUESTED,
          to: RequestsModel.STATE_ACCEPTED},
    ]
  });
}

const toTransition = (old_state, new_state) => {
  return old_state +'_to_'+ new_state;
}


exports.validateTransitionForAdmin = async(req, res, next) => {
  const new_state = req.body.state;
  if(!new_state)
  {
    console.log(' ## ADMIN STATE MACHINE ISSUE#2 -> NO NEW STATE ON REQUEST')
    return next();
  }

  const account_name  = req.jwt.account_name;
  const request       = req.body.request_object;

  if(!request)
  {
    console.log(' ## ADMIN STATE MACHINE ERROR#1 -> Request NOT FOUND')
    return res.status(404).send({error:'Request NOT FOUND'});
  }

  let is_admin        = account_name==config.eos.bank.account;

  if(!is_admin)
    try {
      let perm = await eos_helper.accountHasWritePermission(account_name, config.eos.bank.account);
      if(perm)
      {
        is_authorized = true;
        is_admin = true;
      }
    } catch (e) { }


  if(!is_authorized)
    return res.status(404).send({error:'Account not authorized for this operation. Only admins!'});

  if(new_state==request.state)
  {
    console.log(' ## ADMIN STATE MACHINE ISSUE#3 -> NO TRANSITION REQUIRED')
    return next();
  }

  const fsm = loadStatesForAdmin(request.state);
  // fsm.is(s)
  const transition = toTransition(request.state, new_state)
  console.log(' ## ADMIN STATE MACHINE info : Using admin?->', is_admin, ' for transition:', transition)
  if (!fsm.can(transition))
  {
    console.log(' ## ADMIN STATE MACHINE ISSUE#4 -> New Request STATE NOT ALLOWED', 'Current state:'+request.state+' - New state: '+new_state );
    return res.status(404).send({error:'New Request STATE NOT ALLOWED', message: 'Current state:'+request.state+' - New state: '+new_state });
  }
  return next();
}
/*
*
*/
exports.validateTransition = async(req, res, next) => {

  const new_state = req.body.state;
  if(!new_state)
  {
    console.log(' ## STATE MACHINE ISSUE#2 -> NO NEW STATE ON REQUEST')
    return next();
  }

  const account_name  = req.jwt.account_name;
  const request       = req.body.request_object;

  if(!request)
  {
    console.log(' ## STATE MACHINE ERROR#1 -> Request NOT FOUND')
    return res.status(404).send({error:'Request NOT FOUND'});
  }

  const request_owner = request.from;

  let is_authorized   = account_name==request_owner;

  if(!is_authorized)
    try {
      let perm = await eos_helper.accountHasWritePermission(account_name, request_owner);
      if(perm)
      {
        is_authorized = true;
      }
    } catch (e) {}


  if(!is_authorized)
    return res.status(404).send({error:'Account not authorized for this operation. Requested by:'+account_name+', owner: '+request_owner});

  if(new_state==request.state)
  {
    console.log(' ## STATE MACHINE ISSUE#3 -> NO TRANSITION REQUIRED')
    return next();
  }

  const fsm = loadStatesForUser(request.state);
  // fsm.is(s)
  const transition = toTransition(request.state, new_state)

  if (!fsm.can(transition))
  {
    console.log(' ## STATE MACHINE ISSUE#4 -> New Request STATE NOT ALLOWED', 'Current state:'+request.state+' - New state: '+new_state );
    return res.status(404).send({error:'New Request STATE NOT ALLOWED', message: 'Current state:'+request.state+' - New state: '+new_state });
  }
  return next();
}

/*
*
*/
exports.validateTransitionC2C = async(req, res, next) => {

  const new_state = req.body.state;
  if(!new_state)
  {
    console.log(' ## STATE MACHINE ISSUE#2 -> NO NEW STATE ON REQUEST')
    return next();
  }

  const account_name  = req.jwt.account_name;
  const request       = req.body.request_object;

  if(!request)
  {
    console.log(' ## STATE MACHINE ERROR#1 -> Request NOT FOUND')
    return res.status(404).send({error:'Request NOT FOUND'});
  }

  const request_sender = request.from;
  const request_receiver = request.to;

  let is_sender       = account_name==request_sender;
  let is_receiver     = account_name==request_receiver;
  let is_admin        = account_name==config.eos.bank.account;
  let is_authorized   = is_admin || is_sender || is_receiver;

  if(!is_admin)
    try {
      let perm = await eos_helper.accountHasWritePermission(account_name, config.eos.bank.account);
      if(perm)
      {
        is_authorized   = true;
        is_admin        = true;
      }
    } catch (e) { }

  if(!is_authorized)
    try {
      let perm = await eos_helper.accountHasWritePermission(account_name, request_sender);
      if(perm)
      {
        is_authorized     = true;
        is_sender         = false;
      }
    } catch (e) {}

  if(!is_authorized)
    try {
      let perm = await eos_helper.accountHasWritePermission(account_name, request_receiver);
      if(perm)
      {
        is_authorized   = true;
        is_receiver     = false;
      }
    } catch (e) {}

  if(!is_authorized)
    return res.status(404).send({error:`Account not authorized for this operation. Operation by: +${account_name}, request sender: ${request_sender}, request receiver: ${request_receiver}` });

  if(new_state==request.state)
  {
    console.log(' ## STATE MACHINE ISSUE#3 -> NO TRANSITION REQUIRED')
    return next();
  }

  const fsm = (is_admin)
    ?loadStatesForRequestedC2CAdmin(request.state)
    : (is_sender)
        ?loadStatesForRequestedC2CSender(request.state)
        :loadStatesForRequestedC2CReceiver(request.state);

  const transition = toTransition(request.state, new_state)
  console.log(' ## STATE MACHINE info : Using admin?->', is_admin, ' for transition:', transition)
  if (!fsm.can(transition))
  {
    console.log(' ## STATE MACHINE ISSUE#4 -> New Request STATE NOT ALLOWED', 'Current state:'+request.state+' - New state: '+new_state );
    return res.status(404).send({error:'New Request STATE NOT ALLOWED', message: 'Current state:'+request.state+' - New state: '+new_state });
  }
  return next();
}


exports.REQUEST_USER_SENDER   = 'REQUEST_USER_SENDER';
exports.REQUEST_USER_RECEIVER = 'REQUEST_USER_RECEIVER';
exports.REQUEST_USER_ADMIN    = 'REQUEST_USER_ADMIN';
exports.validateC2CTransitionFor = (_type_) => {
    return async (req, res, next) => {
          const new_state = req.body.state;
          if(!new_state)
          {
            console.log(' ## STATE MACHINE ISSUE#2 -> NO NEW STATE ON REQUEST')
            return next();
          }

          const account_name  = req.jwt.account_name;
          const request       = req.body.request_object;

          if(!request)
          {
            console.log(' ## STATE MACHINE ERROR#1 -> Request NOT FOUND')
            return res.status(404).send({error:'Request NOT FOUND'});
          }

          let is_authorized = false;
          let is_admin      = false;

          switch(_type_){
            case exports.REQUEST_USER_SENDER:

              is_authorized   = account_name==request.from;
              if(!is_authorized)
                try {
                  let perm = await eos_helper.accountHasWritePermission(account_name, request.from);
                  if(perm)
                  {
                    is_authorized = true;
                    is_admin = false;
                  }
                } catch (e) {}


            break;
            case exports.REQUEST_USER_RECEIVER:
              is_authorized   = account_name==request.to;
              if(!is_authorized)
                try {
                  let perm = await eos_helper.accountHasWritePermission(account_name, request.to);
                  if(perm)
                  {
                    is_authorized = true;
                    is_admin = false;
                  }
                } catch (e) {}

            break;
            case exports.REQUEST_USER_ADMIN:
              is_admin        = account_name==config.eos.bank.account;
              if(!is_admin)
                try {
                  let perm = await eos_helper.accountHasWritePermission(account_name, config.eos.bank.account);
                  if(perm)
                  {
                    is_authorized = true;
                    is_admin = true;
                  }
                } catch (e) { }

            break;
          }

          if(!is_authorized)
            return res.status(404).send({error:`Account not authorized for this operation. Operation by: +${account_name}, request sender: ${request_sender}, request receiver: ${request_receiver}` });

          if(new_state==request.state)
          {
            console.log(' ## STATE MACHINE ISSUE#3 -> NO TRANSITION REQUIRED')
            return next();
          }

          let fsm = null;
          if(_type_ == exports.REQUEST_USER_SENDER)
            fsm = loadStatesForRequestedC2CAdmin(request.state)
          if(_type_ == exports.REQUEST_USER_RECEIVER)
            fsm = loadStatesForRequestedC2CReceiver(request.state);
          if(_type_ == exports.REQUEST_USER_ADMIN)
            fsm = loadStatesForRequestedC2CSender(request.state)

          const transition = toTransition(request.state, new_state)
          console.log(' ## STATE MACHINE info : Using admin?->', is_admin, ' for transition:', transition)
          if (!fsm.can(transition))
          {
            console.log(' ## STATE MACHINE ISSUE#4 -> New Request STATE NOT ALLOWED', 'Current state:'+request.state+' - New state: '+new_state );
            return res.status(404).send({error:'New Request STATE NOT ALLOWED', message: 'Current state:'+request.state+' - New state: '+new_state });
          }
          return next();
    };
};
