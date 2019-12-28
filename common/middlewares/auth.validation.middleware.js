const jwt = require('jsonwebtoken'),
    config = require('../config/env.config.js'),
    crypto = require('crypto');

exports.verifyRefreshBodyField = (req, res, next) => {
    if (req.body && req.body.refresh_token) {
        return next();
    } else {
        return res.status(400).send({error: 'need to pass refresh_token field'});
    }
};

exports.validRefreshNeeded = (req, res, next) => {
    let b = new Buffer(req.body.refresh_token, 'base64');
    let refresh_token = b.toString();
    let hash = crypto.createHmac('sha512', req.jwt.refreshKey).update(req.jwt.userId + config.jwt_secret).digest("base64");
    if (hash === refresh_token) {
        req.body = req.jwt;
        return next();
    } else {
        return res.status(400).send({error: 'Invalid refresh token'});
    }
};


exports.validJWTNeeded = (req, res, next) => {
    // if (!req.headers['authorization']) 
    //   return res.status(401).send({error:'Unauthorized.'});

    // try {
    //     const authorization = req.headers['authorization'].split(' ');
    //     if (authorization[0] !== 'Bearer') {
    //         return res.status(401).send({error:'no bearer'});
    //     } 
    //     req.jwt = jwt.verify(authorization[1], config.jwt_secret);

    //     if (req.jwt.expires_at < Math.floor((new Date()).getTime() / 1000)){
    //         return res.status(401).send({error:'expired token'});
    //     }
    //     return next();

    // } catch (err) {
    //     console.log('validJWTNeeded?? >> ', JSON.stringify(err));
    //     return res.status(403).send(err);
    // }
    try{
      req.jwt = exports.getLoggedUser(req);
      next();
    }
    catch (err) {
      console.log('validJWTNeeded?? >> ', JSON.stringify(err));
      return res.status(403).send({error:err.message});
    }
    
};

exports.getLoggedUser = (req) => {

  if (!req.headers['authorization']) 
    throw new Error('Unauthorized');

  try {
    const authorization = req.headers['authorization'].split(' ');
    if (authorization[0] !== 'Bearer') {
        throw new Error('No Bearer');
    } 

    const _jwt = jwt.verify(authorization[1], config.jwt_secret);

    if (_jwt.expires_at < Math.floor((new Date()).getTime() / 1000)){
        throw new Error('Expired session');
    }
    // console.log('validJWTNeeded >> decoded >>', JSON.stringify(req.jwt));
    return _jwt;
      

  } catch (err) {
      console.log('validJWTNeeded?? >> ', JSON.stringify(err));
      throw err;
  }

}
