const config = require('../../common/config/env.config.js');
const RequestModel = require('../models/requests.model');
const crypto = require('crypto');

exports.insert = (req, res) => {
  
  req.body.state = RequestModel.STATE_REQUESTED;
  // res.status(201).send({'res':'exports.insert', received: req.body});
  console.log(' request.Controller::ABOUT TO SAVE')
  RequestModel.createRequest(req.body)
  .then((result) => {
      res.status(201).send({id: result._id});
  }, (err)=>{
      console.log(' request.Controller::ERROR', JSON.stringify(err));
      res.status(400).send({error:err.errmsg});            
  });
};

exports.list = (req, res) => {
    let limit = req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10;
    let page = 0;
    let filter = {};
    if (req.query) {
        if (req.query.page) {
            req.query.page = parseInt(req.query.page);
            page = Number.isInteger(req.query.page) ? req.query.page : 0;
        }
        if (req.query.from) {
            filter = {...filter, from: req.query.from};
        }
        if (req.query.to) {
            filter = {...filter, to: req.query.to};
        }
        if (req.query.state) {
            filter = {...filter, state: req.query.state};
        }
        if (req.query.requested_type) {
            filter = {...filter, requested_type: req.query.requested_type};
        }
    }
    
    RequestModel
    .list(limit, page, filter)
    .then((result) => {
        res.status(200).send(result);
    },
     (err)=> {

    });
};

exports.getById = (req, res) => {
    RequestModel.findById(req.params.userId)
        .then((result) => {
            res.status(200).send(result);
        });
};

exports.patchById = (req, res) => {
    // if (req.body.password) {
    //     let salt = crypto.randomBytes(16).toString('base64');
    //     let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
    //     req.body.password = salt + "$" + hash;
    // }

    RequestModel.patchRequest(req.params.requestId, req.body)
        .then((result) => {
            res.status(204).send({});
        });

};

exports.removeById = (req, res) => {
    RequestModel.removeById(req.params.requestId)
        .then((result)=>{
            res.status(204).send({});
        });
};