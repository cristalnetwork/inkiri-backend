const config = require('../../common/config/env.config.js');
const { JsonRpc } = require('eosjs');
const fetch = require('node-fetch');           // node only; not needed in browsers
const rpc = new JsonRpc(config.eos.blockchain_endpoint, { fetch });
const UserModel = require('../../users/models/users.model');
const ecc = require('eosjs-ecc')

const jwtSecret = require('../../common/config/env.config.js').jwt_secret,
    jwt = require('jsonwebtoken');
const crypto = require('crypto');


exports.challenge = async(req, res) => {
  
  ecc.unsafeRandomKey().then((privateKey) => {
    const _privateKey = privateKey.toString();
    // console.log('Private Key:\t', _privateKey) // wif
    // console.log('Public Key:\t', ecc.privateToPublic(privateKey)).toString();
    UserModel.patchUserByAccountName(req.params.account_name, {to_sign: _privateKey})
    .then((update_res)=>{
      // console.log(' == update_res :\t', JSON.stringify(update_res)) 
      res.status(201).send({account_name:req.params.account_name, to_sign: _privateKey });
    }, (error)=>{
      res.status(400).send({errors: [JSON.stringify(error), 'Something went wrong my dear friend!']});        
    });
    
  })
}

/* *********************
{
  "signature"    : "SIG_K1_KfRwAqPFuUmKEE7JvQo6a9yfdRY6TQu4fgrKFpWLam4cgD3uKdFnDC6hKodbcaboW63dfmVGcxp723FXgYHkTvwqrMihVc"
  , "challenge"    : "5J71N15h7KcmfSWsDYb7tPZGoURitBEkKmVTMGbVmRw2YpV1Brd"
  , "account_name" : "inkiritoken1"
}

{
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWduYXR1cmUiOiJTSUdfSzFfS2ZSd0FxUEZ1VW1LRUU3SnZRbzZhOXlmZFJZNlRRdTRmZ3JLRnBXTGFtNGNnRDN1S2RGbkRDNmhLb2RiY2Fib1c2M2RmbVZHY3hwNzIzRlhnWUhrVHZ3cXJNaWhWYyIsImNoYWxsZW5nZSI6IjVKNzFOMTVoN0tjbWZTV3NEWWI3dFBaR29VUml0QkVrS21WVE1HYlZtUncyWXBWMUJyZCIsImFjY291bnRfbmFtZSI6Imlua2lyaXRva2VuMSIsInVzZXJJZCI6IjVkNTQ0MWQyOWJmZDY0NTc4NzM5YzQ2NSIsInBlcm1pc3Npb25fbGV2ZWwiOjIwNDgsInJlZnJlc2hLZXkiOiJDajZiWTVUV0grM050UnFydkRlZ0VRPT0iLCJpYXQiOjE1NjU4MDk2ODh9.fJ13PU5zJRXkYe5JDU521tKRhZRnT4nKHSVkmIJ0aO4",
    "refreshToken": "c3hHMThmNDRxQ1JiVDVQTEFSQVlYVFFSM1JyRmhwYU5CdVJlYW9VU3MwQ2g4Q3FPOS8rRmV0TmpTS2gySzQ2WXB2MDVvNTJ0ckU1bVFjWG9uRG1zUXc9PQ=="
}

delete 5d545c2b8bb30d7d05ac2350
********************* */

exports.auth = async(req, res) => { 
  // 1.- validamos que el challenge es el que tenemos guardado
  // DONE en el middleware
  // 2.- traemos la publica de la cuenta y verificamos que es el quien firmo 
  const accountInfo = await _getAccountInfo(req.body.account_name);
  const active_perm = accountInfo.permissions.filter( perm => perm.perm_name == 'active' )[0];
  const valid_perm =active_perm.required_auth.keys.filter( 
    (key) => ecc.verify(req.body.signature, req.body.challenge, key.key))
  
  // 4.- le damos el token?
  if(!valid_perm || valid_perm.length==0)
  {
    res.status(400).send({errors: ['Something went wrong my dear friend!']});        
  }
  else{
    let refreshId = req.body.account_name + jwtSecret;
    let salt = crypto.randomBytes(16).toString('base64');
    let hash = crypto.createHmac('sha512', salt).update(refreshId).digest("base64");
    req.body.refreshKey = salt;
    let token = jwt.sign(req.body, jwtSecret);
    let b = new Buffer(hash);
    let refresh_token = b.toString('base64');
    res.status(201).send({accessToken: token, refreshToken: refresh_token});
    // remove challenge / to_sign
    UserModel.patchUserByAccountName(req.params.account_name, {to_sign: ''})
  }
}


exports.getInkiriUsers = async(req, res) => {
    
    try {
      const resp = await rpc.get_table_rows({
          json: true,                 // Get the response as json
          code: config.eos.bank.contract,           // Contract that we target
          scope: config.eos.bank.account,           // Account that owns the data
          table: config.eos.bank.table_accounts,           // Table name
          ///lower_bound: 'testacc'      // Table primary key value
          limit: 10,                   // Here we limit to 1 to get only the
          // reverse = false,            // Optional: Get reversed data
          // show_payer = false,         // Optional: Show ram payer
      });
      // console.log(resp.rows);

        // req.body = req.jwt;
        // let token = jwt.sign(req.body, jwtSecret);
        res.status(201).send(resp.rows);
    } catch (err) {
        res.status(500).send({errors: err});
    }
};


exports.getBalance = async(req, res) => {
    
    try {
      const resp = await rpc.get_currency_balance(
        config.eos.token.contract
        , req.params.account_name //, req.body.account
        , config.eos.token.code);

        res.status(201).send({balance:resp[0]});
    } catch (err) {
        res.status(500).send({errors: err});
    }
};


exports.getAccountInfo = async(req, res) => {
    
    try {
      // const resp = await rpc.get_currency_balance(config.eos.token.contract
      //   , req.body.account
      //   , config.eos.token.code);
        
        const resp = await _getAccountInfo(req.params.account_name);
        res.status(201).send(resp);
    } catch (err) {
        res.status(500).send({errors: err});
    }
};

_getAccountInfo = async (account_name) => {
  const resp = await rpc.get_account(account_name);
  return resp;
}