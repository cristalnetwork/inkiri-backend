const IuguModel         = require('../models/iugu.model');
const eos_helper        = require('../../eos/helper/helper');
var  moment             = require('moment');


exports.issue = async () => new Promise(async(res, rej) => {
  console.log(' >> llamarin a issue');
  IuguModel.listUnprocessed()
    .then( (invoices) => {

      invoices.forEach( async (invoice) => {
          let tx = null;
          try {
              tx = await eos_helper.issueIugu(invoice.receipt_accountname, invoice.amount, invoice.id)
          } catch (e) {
            invoice.state         = IuguModel.STATE_ISSUE_ERROR
            invoice.error         = JSON.stringify(e);
            IuguModel.patchById(invoice.id, invoice);
          }
          if(tx)
          {
            invoice.issued_at     = moment()
            invoice.issued_tx_id  = tx.transaction_id;
            invoice.state         = IuguModel.STATE_ISSUED
            IuguModel.patchById(invoice.id, invoice);
          }
      });

    }, (err)=>{
      rej({error:err});
      return;
    });
});
