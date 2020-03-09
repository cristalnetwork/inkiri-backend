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
    let b                   = new Buffer(req.body.refresh_token, 'base64');
    let refresh_token       = b.toString();
    const config_jwt_secret = process.env.JWT_SECRET || config.jwt_secret;
    let hash = crypto.createHmac('sha512', req.jwt.refreshKey).update(req.jwt.userId + config_jwt_secret).digest("base64");
    if (hash === refresh_token) {
        req.body = req.jwt;
        return next();
    } else {
        return res.status(400).send({error: 'Invalid refresh token'});
    }
};


exports.validJWTNeeded = (req, res, next) => {
    try{
      req.jwt = exports.getLoggedUser(req);
      next();
    }
    catch (err) {
      console.log('validJWTNeeded()::getLoggedUser() -->> ', JSON.stringify(err));
      return res.status(403).send({error: 'JWT Authentication error: ' + err.message});
    }
    
};

exports.getLoggedUser = (req) => {

  if (!req.headers['authorization']) 
    throw new Error('Unauthorized');

  // try {
  const authorization = req.headers['authorization'].split(' ');
  if (authorization[0] !== 'Bearer') {
      throw new Error('No Bearer');
  } 
  const config_jwt_secret = process.env.JWT_SECRET || config.jwt_secret;
  const _jwt              = jwt.verify(authorization[1], config_jwt_secret);

  if (_jwt.expires_at < Math.floor((new Date()).getTime() / 1000)){
      throw new Error('Expired session');
  }
  
  // console.log('getLoggedUser >> verification >>', JSON.stringify(_jwt));
  return _jwt;
      
  // validJWTNeeded?? >>  {"name":"JsonWebTokenError","message":"invalid signature"}

}
