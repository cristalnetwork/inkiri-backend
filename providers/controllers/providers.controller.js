const config = require('../../common/config/env.config.js');
const ProviderModel = require('../models/providers.model');
const crypto = require('crypto');


exports.insert = (req, res) => {
    ProviderModel.createProvider(req.body)
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
        console.log(' ** PROVIDERS :: Filtering by .....')
        if (req.query.name && req.query.cnpj) {
            console.log('Filtering by NAME or CNPJ')
            // filter = {...filter, $or: [ { name: new RegExp('^'+req.query.name+'$', "i") }, { cnpj: new RegExp('^'+req.query.cnpj+'$', "i") } ] } 
            filter = {...filter, $or: [ { name: { $regex: new RegExp('.*' + req.query.name + '.*' , "i") } }, { cnpj: { $regex: new RegExp('.*' + req.query.cnpj + '.*' , "i") } } ] } 
            
        }
        else
        {
            if (req.query.name) {
                console.log('Filtering by NAME ONLY')
                filter = {...filter, name: { $regex: new RegExp('.*' + req.query.name + '.*' , "i") } };
                
                // db.providers.find()
                // db.providers.find( {name:  { $regex: new RegExp('.*' + "veed" + '.*' , "i") } } )
                // ! db.providers.find( {name:  { $regex: new RegExp("^" + "pro"          , "i")  } } )
            }
            if (req.query.cnpj) {
                console.log('Filtering by CNPJ ONLY')
                filter = {...filter, cnpj: { $regex: new RegExp('.*' + req.query.cnpj + '.*' , "i") }};
            }
        }
    }
    ProviderModel.list(limit, page, filter)
        .then((result) => {
            res.status(200).send(result);
        })
};

exports.getById = (req, res) => {
    ProviderModel.findById(req.params.providerId)
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

    ProviderModel.patchProvider(req.params.providerId, req.body)
        .then((result) => {
            // res.status(204).send({});
            res.status(200).send({});
        });

};

exports.removeById = (req, res) => {
    ProviderModel.removeById(req.params.providerId)
        .then((result)=>{
            // res.status(204).send({});
            res.status(200).send({});
        });
};