const config = require('../../common/config/env.config.js');
const IuguLogModel = require('../models/iugu_log.model');


exports.insert = (req, res) => {
    IuguLogModel.create(req.body)
        .then((result) => {
            res.status(201).send({id: result._id});
        }, (err)=>{
            console.log(' ERROR# 1', JSON.stringify(err))
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
    }
    IuguLogModel.list(limit, page, filter)
        .then((result) => {
            res.status(200).send(result);
        })
};

exports.getById = (req, res) => {
    IuguLogModel.findById(req.params.iuguLogId)
        .then((result) => {
            res.status(200).send(result);
        });
};

exports.patchById = (req, res) => {
    IuguLogModel.patch(req.params.iuguLogId, req.body)
        .then((result) => {
            // res.status(204).send({});
            res.status(200).send({});
        });

};

exports.removeById = (req, res) => {
    IuguLogModel.removeById(req.params.iuguLogId)
        .then((result)=>{
            res.status(200).send({});
        });
};
