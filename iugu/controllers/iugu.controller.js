const config       = require('../../common/config/env.config.js');
const IuguModel    = require('../models/iugu.model');
const importer     = require('../services/importer');
const issuer       = require('../services/issuer');

const TASK_IMPORT           = 'import';
const TASK_ISSUE            = 'issue';
const TASK_IMPORT_AND_ISSUE = 'import_and_issue';

exports.import = (req, res) => {

  if(req.params.task==TASK_IMPORT)
  {
    importer.importAndSave()
      .then( (result) => {
          res.status(200).send({message: 'OK', result: result});
          return;
      }, (err)=>{
          console.log('#import::ERROR', JSON.stringify(err))
          res.status(500).send({error:err});
          return;
      });
    return;
  }

  if(req.params.task==TASK_ISSUE)
  {
    issuer.issue()
      .then( (result) => {
          res.status(200).send({message: 'OK', result: result});
          return;
      }, (err)=>{
          console.log('#issue::ERROR', JSON.stringify(err))
          res.status(500).send({error:err});
          return;
      });
    return;
  }

  if(req.params.task==TASK_IMPORT_AND_ISSUE)
  {
    return;
  }
};

exports.issue = (req, res) => {

}

exports.insert = (req, res) => {

  req.body.state = IuguModel.STATE_NOT_PROCESSED;

  IuguModel.createIugu(req.body)
  .then((result) => {
      res.status(201).send({id: result._id});
  }, (err)=>{
      console.log(' iugu.Controller::ERROR', JSON.stringify(err));
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

        // receipt_alias & receipt_accountname
        if (req.query.alias) {
            filter = {...filter, receipt_alias: req.query.alias};
        }
        if (req.query.account_name) {
            filter = {...filter, receipt_accountname: req.query.account_name};
        }
        if (req.query.iugu_id) {
            filter = {...filter, iugu_id: req.query.iugu_id};
        }

        if (req.query.state) {
            filter = {...filter, state: req.query.state};
        }
    }

    IuguModel
      .list(limit, page, filter)
      .then((result) => {
        res.status(200).send(result);
      },
      (err)=> {
        res.status(404).send({error:JSON.stringify(err)});
      });
    };

exports.getById = async (req, res) => {
      console.log(' >> getById:', req.params.invoiceId);
      IuguModel.findById(req.params.invoiceId)
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
    IuguModel.list(1, 0, filter)
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
    console.log(' ABOUT TO PATCH REQUEST ', req.params.invoiceId)
    console.log(JSON.stringify(req.body));

    IuguModel.patchRequest(req.params.invoiceId, req.body)
        .then((result) => {
            res.status(200).send({});
        });

};

exports.removeById = (req, res) => {
    IuguModel.removeById(req.params.invoiceId)
        .then((result)=>{
            // res.status(204).send({});
            res.status(200).send({});
        });
};
