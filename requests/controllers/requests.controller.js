const config       = require('../../common/config/env.config.js');
const RequestModel = require('../models/requests.model');
const crypto       = require('crypto');

exports.insert = (req, res) => {

  req.body.state = RequestModel.STATE_REQUESTED;
  // res.status(201).send({'res':'exports.insert', received: req.body});
//   console.log(' request.Controller::ABOUT TO SAVE')
  RequestModel.createRequest(req.body)
  .then((result) => {
      res.status(201).send({id: result._id});
  }, (err)=>{
      console.log(' request.Controller::ERROR', JSON.stringify(err));
      res.status(400).send({error:err.errmsg});
  });
};

exports.insert_files = (req, res) => {

  // req.body.state = RequestModel.STATE_REQUESTED;
  // const request = req.body.request;
  // delete req.body.request;
  // console.log(' ABOUT TO PARSE REQUEST:: ', request)
  // req.body = {
  //             ...req.body
  //             , ...JSON.parse(request)
  // };

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

        // From & To, Provider and Excchanges
        if (req.query.from&&req.query.to) {
            filter = { $or : [{from: req.query.from}, {to: req.query.to}] };
        }
        else
        {
          if (req.query.from) {
              filter = {...filter, from: req.query.from};
          }
          if (req.query.to) {
              filter = {...filter, to: req.query.to};
          }
        }
        if (req.query.provider_id) {
            filter = {...filter, provider: req.query.provider_id};
        }

        if (req.query.state) {
            filter = {...filter, state: req.query.state};
        }

        if (req.query.requested_type && !req.query.requested_type.includes('|')) {
            filter = {...filter, requested_type: req.query.requested_type};
        }
        else
          if (req.query.requested_type && req.query.requested_type.includes('|')) {
            filter = {...filter,  $or : req.query.requested_type.split('|').map(req_item=> {return { requested_type: req_item}}) };
          }
    }
    // console.log(req.query.requested_type.split('|').map(req_item=> {return { requested_type: req_item}}))
    // console.log(filter)
    // db.requests.find({requested_type:{$or:['type_deposit']}})
    // db.requests.find( { $or: [ { requested_type: "type_deposit" }, { requested_type: "type_withdraw" } ] } )
    // query.or([{ color: 'red' }, { status: 'emergency' }])

    RequestModel
      .list(limit, page, filter)
      .then((result) => {
        res.status(200).send(result);
      },
      (err)=> {
        res.status(404).send({error:JSON.stringify(err)});
      });
    };

exports.getById = async (req, res) => {
      console.log(' >> getById:', req.params.requestId);
      RequestModel.findById(req.params.requestId)
          .then((result) => {
              if(!result)
              {
                res.status(404).send({error:'Request NOT FOUND #1'});
                return;
              }
              res.status(200).send(result);
          },
          (err)=>{
            res.status(404).send({error:JSON.stringify(err)});
          });
  };


exports.getByCounter = async (req, res) => {
    console.log(' >> getById:', req.params.counterId);
    let filter = { requestCounterId : req.params.counterId};
    RequestModel.list(1, 0, filter)
      .then((result) => {
        if(!result || !result[0])
          return res.status(404).send({error:'Request NOT FOUND #2'});
        return res.status(200).send(result[0]);
      },
       (err)=> {
        return res.status(404).send({error:JSON.stringify(err)});
      });

    };

exports.patchById = (req, res) => {
    // if (req.body.password) {
    //     let salt = crypto.randomBytes(16).toString('base64');
    //     let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
    //     req.body.password = salt + "$" + hash;
    // }
    console.log(' ABOUT TO PATCH REQUEST ', req.params.requestId)
    console.log(JSON.stringify(req.body));

    RequestModel.patchRequest(req.params.requestId, req.body)
        .then((result) => {
            res.status(200).send({});
        });

};

exports.update_files = (req, res) => {

  // const request = req.body.request;
  // delete req.body.request;
  // console.log(' ABOUT TO PARSE REQUEST:: ', request)
  // req.body = {
  //             ...req.body
  //             , ...JSON.parse(request)
  // };
  console.log(' ABOUT TO PATCH REQUEST WITH FILES ', req.params.requestId)
  console.log(' request body data:', JSON.stringify(req.body));


  RequestModel.patchRequest(req.params.requestId, req.body)
      .then((result) => {
          res.status(200).send({});
      });
};

exports.removeById = (req, res) => {
    RequestModel.removeById(req.params.requestId)
        .then((result)=>{
            // res.status(204).send({});
            res.status(200).send({});
        });
};
