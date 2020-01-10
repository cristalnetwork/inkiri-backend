const IuguModel     = require('../models/iugu.model');
const UserModel     = require('../../users/models/users.model');


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
