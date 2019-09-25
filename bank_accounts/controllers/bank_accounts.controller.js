const config = require('../../common/config/env.config.js');
const BankAccountModel = require('../models/bank_accounts.model');
const crypto = require('crypto');


exports.ping = (req, res) => {
    res.status(200).send({ping:'pong'});
}
exports.insert = (req, res) => {
    BankAccountModel.createBankAccount(req.body)
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
    let populateProvider = undefined;
    let populateUser = undefined;
    if (req.query) {
        if (req.query.page) {
            req.query.page = parseInt(req.query.page);
            page = Number.isInteger(req.query.page) ? req.query.page : 0;
        }
        if (req.query.provider_for_id) {
            populateProvider= {
                path  : 'provider_for',
                match : { _id : req.query.provider_for_id }
              }
        }
        if (req.query.user_for_id) {
            populateUser= {
                path  : 'user_for',
                match : { _id : req.query.user_for_id }
              }
        }
    }
    BankAccountModel.list(limit, page, filter, populateProvider, populateUser)
        .then((result) => {
            res.status(200).send(result);
        })
};

exports.getById = (req, res) => {
    BankAccountModel.findById(req.params.bankAccountId)
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

    BankAccountModel.patchProvider(req.params.bankAccountId, req.body)
        .then((result) => {
            // res.status(204).send({});
            res.status(200).send({});
        });

};

exports.removeById = (req, res) => {
    BankAccountModel.removeById(req.params.bankAccountId)
        .then((result)=>{
            // res.status(204).send({});
            res.status(200).send({});
        });
};