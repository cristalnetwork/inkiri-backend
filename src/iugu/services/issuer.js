const IuguLogModel      = require('../../iugu_log/models/iugu_log.model');
const UserModel         = require('../../users/models/users.model');
const IuguModel         = require('../models/iugu.model');
const eos_helper        = require('../../eos/helper/helper');
var  moment             = require('moment');

exports.issuePending = async () => issuePendingImpl();
const issuePendingImpl = async () => new Promise(async(res, rej) => {
  console.log(' >> llamarin a issuePending');
  IuguModel.listUnprocessed()
    .then( async (invoices) => {

      console.log(' >> issuer::issuePending #1');
      const invoices_ids = invoices.map( invoice => invoice.id );
      IuguModel.updateMany(
                            {
                              state: exports.STATE_NOT_PROCESSED
                              ,  _id: { $in: invoices_ids }
                            }
                            , {"state": exports.STATE_PROCESSING}
                            , null
                            , (err, writeResult) => {

                            });

      let _issue_p = invoices.map(async (invoice) => { return issueOneImpl(invoice).catch(e => e); } )

      let _issue         = null;
      try {
        _issue           = await Promise.all(_issue_p);
      } catch (e) {
        console.log('Promise.all ERROR: ', JSON.stringify(e))
      }

      const issued_ok    = _issue.filter(resp => !resp.error && resp.invoice && resp.invoice.issued_tx_id)
      const issued_error = _issue.filter(resp => resp.error || !resp.invoice || !resp.invoice.issued_tx_id)
      IuguLogModel.logIssue('', issued_ok.length, issued_ok.map(obj => obj.invoice.id), null,
                                 issued_error.length,    issued_error.map(obj => obj.invoice.id),    issued_error.map(obj => obj.error)
                                 , false)
      console.log(' ** Issue Response: ', _issue)
      res(_issue)
    }, (err)=>{
      IuguLogModel.logIssue(JSON.stringify(err), 0, null, null,0,    null,    null, false)
      rej({error:err});
      return;
    });
});

exports.issueOne = async (invoice) => issueOneImpl(invoice);
const issueOneImpl = async (invoice) => new Promise(async(res, rej) => {
  let tx = null;
  try {
      tx = await eos_helper.issueIugu(invoice.receipt_accountname, invoice.amount, invoice.id)
  } catch (e) {

    invoice.state         = IuguModel.STATE_ISSUE_ERROR
    invoice.error         = JSON.stringify(e);
    try {
      const x = await IuguModel.patchById(invoice.id, invoice);
    } catch (e) {
      rej({error:'An error occurred while saving process result error. Error: '+JSON.stringify(e), invoice:invoice});
      return;
    }
    tx = null;
    rej({error:invoice.error, invoice:invoice});
    return;
  }

  if(!tx)
  {
    rej({error:'Something went wrong', invoice:invoice});
    return;
  }

  console.log(' ISSUED!! invoice.id->', invoice.id);
  // console.log(JSON.stringify(tx));
  invoice.issued_at     = moment();
  invoice.issued_tx_id  = tx.transaction_id;;
  invoice.state         = IuguModel.STATE_ISSUED;
  invoice.error         = '';

  try {
    const x = await IuguModel.patchById(invoice.id, invoice);
  } catch (e) {
    rej({error:'Money issued!!! But something went wrong saving tx result. '+JSON.stringify(e), invoice:invoice});
    return;
  }

  res({invoice:invoice})
  return;

});
