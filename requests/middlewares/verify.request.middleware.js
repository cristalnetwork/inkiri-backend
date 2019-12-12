const RequestModel  = require('../models/requests.model');
const UserModel     = require('../../users/models/users.model');
const ServiceModel  = require('../../services/models/services.model');
const eos_helper    = require('../../eos/helper/helper');
const config        = require('../../common/config/env.config.js');
var moment          = require('moment');

const getAccountId = (account_name) =>   new Promise((res,rej)=> {

  if(!account_name || account_name.trim().length==0 )
  {
    res(undefined);
    return;
  }
  UserModel.findByAccountName(account_name)
  .then((user)=>{
    if(!user[0]){
        rej({error:account_name+' not found'});
    }else{
      let resp = {};
      resp[account_name] = user[0]._id;
      res(resp)
      return;
    }
  },
  (error) => {
    // console.log(' -- ERROR #3')
    rej({error:error});
  });
});

exports.loggedHasAdminWritePermission = async (req, res, next) => {

  let logged_account = req.jwt.account_name;
  const is_new       = !req.body._id && !req.params.requestId;
  let validate_with  = null;
  if(is_new)
  {
    validate_with = req.body.from;
  }
  else{
    if(!req.params.requestId)
      return res.status(500).send({error:'Can not validate account permissions'});
    let biz = null;
    try {
      biz = await RequestModel.findById(req.params.requestId)
    } catch (e) {
      return res.status(500).send({error:'Business not found. Can not validate account permissions'});
    }
    if(Array.isArray(biz)) biz=biz[0];
    validate_with = biz.account_name;
  }
  if(!validate_with)
    return res.status(500).send({error:'Can not validate account permissions. Something went wrong!'});

  let is_authorized   = logged_account==validate_with;
  let is_admin        = logged_account==config.eos.bank.account;
  if(!is_admin)
    try {
      let perm = await eos_helper.accountHasWritePermission(logged_account, config.eos.bank.account);
      if(perm)
      {
        is_authorized = true;
        is_admin = true;
      }
    } catch (e) { }

  if(!is_authorized)
    try {
      let perm = await eos_helper.accountHasWritePermission(logged_account, validate_with);
      if(perm)
      {
        is_authorized = true;
        is_admin = false;
      }
    } catch (e) {}

  if(!is_authorized)
    return res.status(404).send({error:'Account not authorized for this operation. Requested by:'+logged_account+', owner: '+validate_with});
  return next();

};


exports.validateIfServiceRequestFields = async(req, res, next) => {
  if(req.body.requested_type!=RequestModel.TYPE_SERVICE)
  {
    return next();
  }
  const is_new      = !req.body._id && !req.params.requestId;
  if(is_new)
  {
    try {

      // console.log('--validateIfServiceRequestFields#1', req.body)
      if(!req.body.from)
        return res.status(500).send({error:'not a valid request sender '});
      if(!req.body.requested_by)
        return res.status(500).send({error:'not a valid request sender '});
      let _requested_by = await UserModel.findByAccountName(req.body.from);
      if(Array.isArray(_requested_by)) _requested_by=_requested_by[0];
      if(!_requested_by
          || _requested_by.account_name!=req.body.from
          || (![UserModel.ACCOUNT_TYPE_BUSINESS, UserModel.ACCOUNT_TYPE_BANKADMIN].includes(_requested_by.account_type))
        )
        return res.status(500).send({error:'Requestor not match or is not valid '});
      req.body.requested_by = _requested_by;


      // console.log('--validateIfServiceRequestFields#2')
      if(!req.body.to)
        return res.status(500).send({error:'not a valid request receiver '});
      let _requested_to = await UserModel.findByAccountName(req.body.to);
      if(Array.isArray(_requested_to)) _requested_to=_requested_to[0];
      // console.log(_requested_to)
      if(!_requested_to
          || _requested_to.account_name!=req.body.to)
        return res.status(500).send({error:'Requested not match or is not valid '});
      req.body.requested_to = _requested_to;


      // console.log('--validateIfServiceRequestFields#3')
      if(!req.body.service_id)
        return res.status(500).send({error:'not a valid service '});
      let _service = await ServiceModel.getById(req.body.service_id);
      if(!_service
          || _service.account_name!=req.body.from)
        return res.status(500).send({error:'Service does not belongs to requestor '});
      req.body.service = _service;
      req.body.amount  = _service.amount;


      // console.log('--validateIfServiceRequestFields#4')
      if(!req.body.service_extra.begins_at && !req.body.service_extra.expires_at || moment(req.body.service_extra.begins_at)>moment(req.body.service_extra.expires_at))
        return res.status(500).send({error:'Invalid dates: begins and/or expires.'});

      const invalid_states =  [RequestModel.STATE_REQUESTED, RequestModel.STATE_PROCESSING, RequestModel.STATE_ACCEPTED];

      const filter = {from      : req.body.from
                      , to      : req.body.to
                      , service : req.body.service._id
                      , $or     : invalid_states.map(item=> {return { state: item}}) }
      const exists = await RequestModel.list(1, 0, filter);
      if(exists && exists.length>0)
        return res.status(500).send({error:'Service provising contract already exists or is processing for Provider:Service:Customer. '});
      // console.log(' > exists:');
      // console.log(exists);

    } catch (e) {
      console.log(e)
      return res.status(500).send({error:'Validation error occurs. ' + JSON.stringify(e)});
    }

    delete req.body.service_id

    return next()
  }

  return next();

}

exports.validRequiredFields = async(req, res, next) => {

  // const validRequests = [RequestModel.TYPE_EXCHANGE, RequestModel.TYPE_PAYMENT, RequestModel.TYPE_PROVIDER, RequestModel.TYPE_SEND, RequestModel.TYPE_SERVICE];
  const validRequests = [RequestModel.TYPE_DEPOSIT, RequestModel.TYPE_PROVIDER, RequestModel.TYPE_WITHDRAW, RequestModel.TYPE_EXCHANGE, RequestModel.TYPE_SERVICE];
  const validStates   = [RequestModel.STATE_REQUESTED, RequestModel.STATE_PROCESSING, RequestModel.STATE_REJECTED, RequestModel.STATE_ACCEPTED, RequestModel.STATE_ERROR, RequestModel.STATE_CONCLUDED];

  if(validRequests.indexOf(req.body.requested_type)<0)
  {
    console.log( ' NOT A VALID TYPE')
    return res.status(404).send({error:'not a valid request type ', valid_types:validRequests});
  }

  if(!req.body.state)
    req.body.state = RequestModel.STATE_REQUESTED;

  if(validStates.indexOf(req.body.state)<0)
  {
    console.log( ' NOT A VALID STATE')
    return res.status(404).send({error:'not a valid state'});
  }
  return next();
}

exports.validRequestObject  = async (req, res, next) => {
  RequestModel.findById(req.params.requestId)
    .then((result) => {
        if(!result)
        {
          console.log(' ## REQUEST EXISTS VERIFICATION ERROR#1 -> ')
          return res.status(404).send({error:'Request NOT FOUND'});
        }
        req.body.request_object = result;
        return next();
    },
    (err)=>{
      console.log(' ## REQUEST EXISTS VERIFICATION ERROR#2 -> ', JSON.stringify(err))
      return res.status(404).send({error:JSON.stringify(err)});
    });

}

/**
 * Validate account names and insert private account ids.
 * @param  {req.jwt.account_name} string Logged Account
 * @param  {req.body.from} string Originator of the request
 * @param  {req.body.to} string Originator of the request
 */
exports.validAccountReferences = async(req, res, next) => {

    let promises = [
      getAccountId(req.jwt.account_name) //created_by
      , getAccountId(req.body.from)      //requested_by
      , getAccountId(req.body.to)        //requested_to
    ];

    let values;
    try{
      values = await Promise.all(promises);
      // console.log(JSON.stringify(values));

      if(!values[0] || values[0]===undefined)
      {
        return res.status(404).send({error:'not a valid creator'});
      }
      else{
        req.body.created_by     = values[0][req.jwt.account_name]
      }

      if(req.body.from && (!values[1] || values[1]===undefined))
      {
        return res.status(404).send({error:'not a valid sender'});
      }
      else{
        if(req.body.from)
        {
          req.body.from_id        = values[1][req.body.from]
          req.body.requested_by   = values[1][req.body.from]
        }
      }

      if(!req.body.from)
      {
        req.body.from           = req.jwt.account_name
        req.body.from_id        = req.body.created_by
        req.body.requested_by   = req.body.created_by
      }
      console.log(' >> body.to?');
      if(req.body.to && (!values[2] || values[2]===undefined))
      {
        console.log(' >> body.to ERROR');
        return res.status(404).send({error:'not a valid receiver'});
      }
      else{
        if(req.body.to)
        {
          req.body.to_id          = values[2][req.body.to]
          req.body.requested_to   = values[2][req.body.to]
        }
      }

      // console.log( ' validAccountReferences OK >>' , JSON.stringify(req.body));
      // return res.status(200).send({'resp': req.body});
      return next();

    }
    catch(err){
      console.log(' -- ERROR #4')
      return res.status(200).send({error:err});
    }

};

/**
 * Explodes request param form formData to req.body
 * @param  {req.body.request} string Json request object
 */
exports.explodeFormData = async(req, res, next) => {
  const request = req.body.request;
  delete req.body.request;
  console.log(' ABOUT TO PARSE REQUEST:: ', request)
  req.body = {
              ...req.body
              , ...JSON.parse(request)
  };
  return next();
}
