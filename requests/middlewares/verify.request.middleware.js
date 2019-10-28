const RequestModel  = require('../models/requests.model');
const UserModel     = require('../../users/models/users.model');
const crypto        = require('crypto');


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

exports.validRequiredFields = async(req, res, next) => {

  // const validRequests = [RequestModel.TYPE_DEPOSIT, RequestModel.TYPE_EXCHANGE, RequestModel.TYPE_PAYMENT, RequestModel.TYPE_PROVIDER, RequestModel.TYPE_SEND, RequestModel.TYPE_WITHDRAW, RequestModel.TYPE_SERVICE];
  const validRequests = [RequestModel.TYPE_DEPOSIT, RequestModel.TYPE_PROVIDER];
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

  // let default_
  // created_by
  // requested_by
  // from
  // requested_type
  // amount
  // requested_to
  // to
  // state
  // tx_id
  // description
  // nota_fiscal_url
  // comprobante_url

  return next();
}

exports.onlySameUserOrAdminCanDoThisAction = async (req, res, next) => {

  // let user_permission_level = parseInt(req.jwt.permission_level);
  // let userId = req.jwt.userId;
  // if (req.params && req.params.userId && userId === req.params.userId) {
  //   return next();
  // } else {
  //   if (user_permission_level == config.permission_levels.ADMIN) {
  //     return next();
  //   } else {
  //     return res.status(403).send();
  //   }
  // }
};

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
