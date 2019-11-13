const config = require('../../common/config/env.config.js');
const UserModel = require('../models/users.model');
const crypto = require('crypto');


exports.ping = (req, res) => {
    res.status(200).send({ping:'pong'});
}
exports.insert = (req, res) => {
    // ToDo: validate is a valid EOS account and a Valid Customer.
    if(req.body.account_name=='inkiritoken1' || req.body.account_name=='inkirimaster')
        req.body.permission_level = config.ADMIN;
    else
        req.body.permission_level = config.NORMAL_USER;
    UserModel.createUser(req.body)
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
        if (req.query.email) {
            filter = {...filter, email: req.query.email};
        }
        if (req.query.account_name) {
            filter = {...filter, account_name: req.query.account_name};
        }
    }
    UserModel.list(limit, page, filter)
        .then((result) => {
            res.status(200).send(result);
        })
};

exports.getById = (req, res) => {
    UserModel.findById(req.params.userId)
        .then((result) => {
            res.status(200).send(result);
        }, (err)=>{
            console.log(' ERROR# 1', JSON.stringify(err))
            res.status(404).send({error:JSON.stringify(err), message:err.errmsg});
        });
};

exports.getByAccountName = (req, res) => {
    UserModel.findByAccountName(req.params.accountName)
        .then((result) => {
            if(result && result.length>0)
              return res.status(200).send(result[0]);
            return res.status(404).send({error:'Not Found', message:'Not Found'});
        }, (err)=>{
            console.log(' ERROR# 1', JSON.stringify(err))
            return res.status(404).send({error:JSON.stringify(err), message:err.errmsg});
        });
};

exports.patchById = (req, res) => {
    // if (req.body.password) {
    //     let salt = crypto.randomBytes(16).toString('base64');
    //     let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
    //     req.body.password = salt + "$" + hash;
    // }
    delete req.body.account_name;
    UserModel.patchUser(req.params.userId, req.body)
        .then((result) => {
            // res.status(204).send({});
            res.status(200).send({});
        });

};

exports.removeById = (req, res) => {
    UserModel.removeById(req.params.userId)
        .then((result)=>{
            // res.status(204).send({});
            res.status(200).send({});
        });
};
