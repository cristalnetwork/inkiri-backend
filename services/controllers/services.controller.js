const config        = require('../../common/config/env.config.js');
const ServiceModel  = require('../models/services.model');

exports.insert = (req, res) => {

    ServiceModel.createService(req.body)
        .then((result) => {
            res.status(201).send({id: result._id});
        }, (err)=>{
            console.log(' ERROR# 1', JSON.stringify(err))
            res.status(400).send({error:err.errmsg});
        });
};

exports.getById = (req, res) => {
    ServiceModel.getById(req.params.serviceId)
        .then((result) => {
            res.status(200).send(result);
        }, (err)=>{
            console.log(' ERROR# 1', JSON.stringify(err))
            res.status(404).send({error:JSON.stringify(err), message:err.errmsg});
        });
};

exports.getStates = (req, res) => {
  res.status(200).send({services_states:ServiceModel.services_states});
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

        if (req.query.state) {
            filter = {...filter, state: req.query.state};
        }

        if (req.query.account_name) {
            filter = {...filter, account_name: req.query.account_name};
        }

        if (req.query.id || req.query._id) {
            filter = {...filter, _id: (req.query.id || req.query._id)};
        }
    }

    ServiceModel
      .list(limit, page, filter)
      .then((result) => {
        res.status(200).send(result);
      },
      (err)=> {
        res.status(404).send({error:JSON.stringify(err)});
      });
};

exports.patchById = (req, res) => {
    ServiceModel.patchService(req.params.serviceId, req.body)
        .then((result) => {
            // res.status(204).send({});
            res.status(200).send({});
        });

};

exports.removeById = (req, res) => {
    ServiceModel.removeById(req.params.serviceId)
        .then((result)=>{
            // res.status(204).send({});
            res.status(200).send({});
        });
};
