const config = require('../../common/config/env.config.js');
const TeamModel = require('../models/teams.model');

exports.insert = (req, res) => {

    TeamModel.createTeam(req.body)
        .then((result) => {
            res.status(201).send({id: result._id});
        }, (err)=>{
            console.log(' ERROR# 1', JSON.stringify(err))
            res.status(400).send({error:err.errmsg});
        });
};

exports.getPositions = (req, res) => {
  res.status(200).send({job_positions:TeamModel.job_positions});
};

exports.list = (req, res) => {

};

exports.getById = (req, res) => {
    TeamModel.getById(req.params.teamId)
        .then((result) => {
            res.status(200).send(result);
        }, (err)=>{
            console.log(' ERROR# 1', JSON.stringify(err))
            res.status(404).send({error:JSON.stringify(err), message:err.errmsg});
        });
};

exports.getByAccountName = (req, res) => {
    TeamModel.findByAccountName(req.params.accountName)
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
    TeamModel.patchTeam(req.params.teamId, req.body)
        .then((result) => {
            // res.status(204).send({});
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
