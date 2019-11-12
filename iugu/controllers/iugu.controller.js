const config       = require('../../common/config/env.config.js');
const IuguModel    = require('../models/iugu.model');
const importer     = require('../services/importer');
// const issuer       = require('../services/issuer');

const iugu_config = require('../../common/config/iugu.config.js');

exports.import = (req, res) => {

  // importer.import()
  //   .then( (result) => {
  //       res.status(200).send({message: 'OK', result: result});
  //   }, (err)=>{
  //     console.log('#import::ERROR1', JSON.stringify(err))
  //     res.status(500).send({error:JSON.stringify(err)});
  //     return;
  //   });

  // importer.save(invoices)
  //   .then( (result2) => {
  //       res.status(200).send({message: 'OK', result: result2});
  //       return;
  //   }, (err2)=>{
  //       console.log('#import::ERROR2', JSON.stringify(err2))
  //       res.status(500).send({error:err2});
  //       return;
  //   });

  // importer.import()
  //   .then( (result) => {
  //       importer.save(result)
  //         .then( (result2) => {
  //             res.status(200).send({message: 'OK', count: result2.length, result: result2});
  //             return;
  //         }, (err2)=>{
  //             console.log('#import::ERROR2', JSON.stringify(err2))
  //             res.status(500).send({error:err2});
  //             return;
  //         });
  //
  //   }, (err)=>{
  //     console.log('#import::ERROR1', JSON.stringify(err))
  //     res.status(500).send({error:err});
  //     return;
  //   });

  importer.importAndSave()
    .then( (result) => {
        res.status(200).send({message: 'OK', result: result});
        return;
    }, (err)=>{
        console.log('#import::ERROR2', JSON.stringify(err))
        res.status(500).send({error:err});
        return;
    });
};

exports.issue = (req, res) => {

}

exports.insert = (req, res) => {

  req.body.state = IuguModel.STATE_NOT_PROCESSED;

  IuguModel.createIugu(req.body)
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
        if (req.query.from) {
            filter = {...filter, from: req.query.from};
        }
        if (req.query.to) {
            filter = {...filter, to: req.query.to};
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
                res.status(404).send({error:'NOT FOUND'});
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
          return res.status(404).send({error:'NOT FOUND'});
        return res.status(200).send(result[0]);
      },
       (err)=> {
        return res.status(404).send({error:JSON.stringify(err)});
      });

    };

exports.patchById = (req, res) => {
    console.log(' ABOUT TO PATCH REQUEST ', req.params.requestId)
    console.log(JSON.stringify(req.body));

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
