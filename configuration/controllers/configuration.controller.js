const config       = require('../../common/config/env.config.js');
const ConfigModel  = require('../models/configuration.model');

exports.init = async (req, res) => {
  try{
    const response = await ConfigModel.init();
    console.log('config init: ', response)
    res.status(201).send({status: response});
  }
  catch(e){
    console.log('config init ERROR: ', e)
    res.status(400).send({error:err.errmsg});
  }
}

exports.insert = (req, res) => {
    ConfigModel.createConfiguration(req.body)
        .then((result) => {
            res.status(201).send({id: result._id});
        }, (err)=>{
            console.log(' ERROR# 1', JSON.stringify(err))
            res.status(400).send({error:err.errmsg});
        });
};

exports.patchById = (req, res) => {
    ConfigModel.patchConfig(req.params.configId, req.body)
        .then((result) => {
            res.status(200).send({});
        });

};

exports.removeById = (req, res) => {
    TeamModel.removeById(req.params.teamId)
        .then((result)=>{
            // res.status(204).send({});
            res.status(200).send({});
        });
};
