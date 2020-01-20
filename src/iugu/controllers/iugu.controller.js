const config       = require('../../common/config/env.config.js');
const IuguModel    = require('../models/iugu.model');
const IuguLogModel = require('../../iugu_log/models/iugu_log.model');
const importer     = require('../services/importer');
const issuer       = require('../services/issuer');
const UserModel    = require('../../users/models/users.model');

const TASK_IMPORT            = 'import';
const TASK_ISSUE             = 'issue';
const TASK_IMPORT_AND_ISSUE  = 'import_and_issue';
const TASK_GET_LAST_IMPORTED = 'get_last_imported';

exports.import = async(req, res) => {

  if(req.params.task==TASK_GET_LAST_IMPORTED)
  {
    const lastImported = await IuguModel.lastImported();
    // from = lastImported.paid_at;
    res.status(200).send({paid_at: lastImported.paid_at, result: lastImported});
    return;
  }

  if(req.params.task==TASK_IMPORT)
  {
    importer.importAndSave()
      .then( (result) => {
          res.status(200).send({message: 'OK', result: result});

          if(!result.error)
            IuguLogModel.logImport('', result.items.length, result.items.map(obj => obj.id), null, 0, null, null, result.qs)
          else
            IuguLogModel.logImport(result.error, 0, null, null, 0, null, null, result.qs)

          console.log('importController::importAndSave()::result-> ', JSON.stringify(result))
          return;
      }, (err)=>{
          console.log('importController::importAndSave()::ERROR-> ', JSON.stringify(err))
          res.status(500).send({error:err});
          IuguLogModel.logImport(err.error, 0, null, null, 0, null, null, err.qs )
          return;
      });
    return;
  }

  if(req.params.task==TASK_ISSUE)
  {
    issuer.issuePending()
      .then( (result) => {
          console.log('importController::issue()::result-> ', JSON.stringify(result))
          res.status(200).send({message: 'OK', result: result});
          return;
      }, (err)=>{
          console.log('importController::issue()::ERROR-> ', JSON.stringify(err))
          res.status(500).send({error:err});
          IuguLogModel.logImport(err.error, 0, null, null, 0, null, null, err.qs )
          return;
      });
    return;
  }

  if(req.params.task==TASK_IMPORT_AND_ISSUE)
  {
    console.log('#issue::ERROR -> TASK_IMPORT_AND_ISSUE NOT ALLOWED')
    res.status(405).send({error:'TASK_IMPORT_AND_ISSUE NOT ALLOWED!'});
    return;
  }
};

exports.reprocess = async (req, res) => {
  
  try{
    const result = await importer.reProcessInvoice(req.params.invoiceId)
    console.log('importController::reprocess()::result-> ', JSON.stringify(result));
    
    res.status(200).send({message: 'OK', result: result});

    const issued_ok    = [result];
    const issued_error = [];
    IuguLogModel.logIssue('', issued_ok.length, issued_ok.map(obj => obj.invoice && obj.invoice._id), null,
                               issued_error.length,    issued_error.map(obj => obj.invoice && obj.invoice._id),    issued_error.map(obj => obj.error)
                               , false)
    return;
  }catch(err)
  {
    console.log('importController::reprocess()::ERROR', req.params.invoiceId, JSON.stringify(err))
    res.status(500).send({error:err});

    const issued_ok    = [];
    const issued_error = [err];
    IuguLogModel.logIssue('', issued_ok.length, issued_ok.map(obj => obj.invoice && obj.invoice._id), null,
                               issued_error.length,    issued_error.map(obj => obj.invoice && obj.invoice._id),    issued_error.map(obj => obj.error)
                               , false)

  }
  
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

// exports.getByCounter = async (req, res) => {
//     console.log(' >> getById:', req.params.counterId);
//     let filter = { requestCounterId : req.params.counterId};
//     IuguModel.list(1, 0, filter)
//       .then((result) => {
//         if(!result || !result[0])
//           return res.status(404).send({error:'NOT FOUND'});
//         return res.status(200).send(result[0]);
//       },
//        (err)=> {
//         return res.status(404).send({error:JSON.stringify(err)});
//       });

//     };

// exports.patchById = (req, res) => {
//     console.log(' ABOUT TO PATCH REQUEST ', req.params.invoiceId)
//     console.log(JSON.stringify(req.body));

//     IuguModel.patchRequest(req.params.invoiceId, req.body)
//         .then((result) => {
//             res.status(200).send({});
//         });

// };

// /iugu_alias/:invoiceId/:accountName
exports.updateAlias = async (req, res) => {
    console.log(' ABOUT TO UPDATE ALIAS ', req.params.invoiceId, req.params.accountName)
    
    const user = await UserModel.byAccountNameOrNull(req.params.accountName);
    if(!user)
      return res.status(500).send({error:'User not found'});
    const fields = {
      receipt               : user
      , receipt_alias       : user.alias
      , receipt_accountname : user.account_name
      , error               : null
    };
    console.log(fields);
    try{
      const update_res = IuguModel.patchById(req.params.invoiceId, fields);
      return res.status(200).send({res:update_res});
    }
    catch(ex)
    {
      console.log('Error updating alias:', ex)
      return res.status(500).send({error: ex});
    }

};

exports.removeById = (req, res) => {
    IuguModel.removeById(req.params.invoiceId)
        .then((result)=>{
            // res.status(204).send({});
            res.status(200).send({});
        });
};
