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
      { name: toTransition(RequestsModel.STATE_REQUESTED,  RequestsModel.STATE_ACCEPTED),
          from: RequestsModel.STATE_REQUESTED,
          to: RequestsModel.STATE_ACCEPTED
          // FOR DEPOSITS!
      },
      { name: toTransition(RequestsModel.STATE_REQUESTED,  RequestsModel.STATE_REJECED),
          from: RequestsModel.STATE_REQUESTED,
          to: RequestsModel.STATE_REJECED
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

const toTransition = (old_state, new_state) => {
  return old_state +'_to_'+ new_state;
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
  const is_admin      = req.body.sender==config.eos.bank.account;
  console.log(' >> is_admin? -> ', is_admin, ' = (',  req.body.sender, ' == ', config.eos.bank.account, ')');
  const permissioner  = is_admin?config.eos.bank.account:request_owner;
  try {
    let perm = await eos_helper.accountHasWritePermission(account_name, request_owner);
    console.log(' >> request_owner: '+request_owner+'; PERMISSIONED: ', account_name, ' TO:', JSON.stringify(perm));

  } catch (e) {
    console.log(' ## STATE MACHINE ERROR#2 -> ', JSON.stringify(e))
    return res.status(404).send({error:'Account not permissioned for this operation', message:JSON.stringify(e)});
  }

  if(new_state==request.state)
  {
    console.log(' ## STATE MACHINE ISSUE#3 -> NO TRANSITION REQUIRED')
    return next();
  }

  const fsm = (is_admin)?
    loadStatesForAdmin(request.state)
    :loadStatesForUser(request.state);
  // fsm.is(s)
  const transition = toTransition(request.state, new_state)
  console.log(' ## STATE MACHINE info : Using admin?->', is_admin, ' for transition:', transition)
  if (!fsm.can(transition))
  {
    console.log(' ## STATE MACHINE ISSUE#4 -> New Request STATE NOT ALLOWED', 'Current state:'+request.state+' - New state: '+new_state );
    return res.status(404).send({error:'New Request STATE NOT ALLOWED', message: 'Current state:'+request.state+' - New state: '+new_state });
  }
  return next();
}
