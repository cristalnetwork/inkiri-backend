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

// exports.getPositions = (req, res) => {
//   res.status(200).send({job_positions:ServiceModel.job_positions});
// };

exports.list = (req, res) => {

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

exports.getByAccountName = (req, res) => {
    ServiceModel.findByAccountName(req.params.accountName)
        .then((result) => {
            if(result)
              return res.status(200).send(result);
            return res.status(404).send({error:'Not Found', message:'Not Found'});
        }, (err)=>{
            console.log(' ERROR# 1', JSON.stringify(err))
            return res.status(404).send({error:JSON.stringify(err), message:err.errmsg});
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
