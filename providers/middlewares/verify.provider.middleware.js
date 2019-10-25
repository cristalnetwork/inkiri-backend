const ProviderModel  = require('../models/providers.model');
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

/**
 * Validate account names and insert private account ids.
 * @param  {req.jwt.account_name} string Logged Account
 */
exports.validAccountReferences = async(req, res, next) => {

    let promises = [
      getAccountId(req.jwt.account_name) //created_by
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
        if(req.params && req.params.providerId)
          /* Update/Patch */
          req.body.updated_by     = values[0][req.jwt.account_name]
        else
          /* Insert */
          req.body.created_by     = values[0][req.jwt.account_name]
      }
      return next();

    }
    catch(err){
      console.log(' -- ERROR #4')
      return res.status(404).send({error:err});
    }

};
