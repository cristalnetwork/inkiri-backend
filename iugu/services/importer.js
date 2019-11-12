const fetch             = require('node-fetch');
const IuguModel         = require('../models/iugu.model');
const UserModel         = require('../../users/models/users.model');
var iugu_config         = null;
try {
    iugu_config         = require('../../common/config/iugu.config.js');
} catch (ex) {}

const iugu_token       = process.env.IUGU_TOKEN || iugu_config.prod.token;

var moment             = require('moment');

const b                = new Buffer.from(iugu_token + ':');
const auth             = 'Basic ' + b.toString('base64');
const iugu_date_format = 'YYYY-MM-DDTHH:mm:ss-03:00';  // 2019-11-01T00:00:00-03:00


exports.importAndSave = async () => new Promise(async(res, rej) => {
  importImpl()
    .then( (result) => {
        saveImpl(result)
          .then( (result2) => {
              res(result2);
              return;
          }, (err2)=>{
              rej({error:err2});
              return;
          });

    }, (err)=>{
      rej({error:err});
      return;
    });
});

exports.import = async () => importImpl();

const importImpl = () => new Promise(async(res, rej) => {

    let from = null;
    try {
      // console.log('about to call IuguModel.lastImported();')
      const lastImported = await IuguModel.lastImported();
      // console.log('.... called IuguModel.lastImported();')
      from = lastImported.paid_at;
    } catch (e) {
      console.log(' ** ERROR geting last imported:', JSON.stringify(e))
    } finally {
      if(!from)
        from = moment().subtract(1, 'days')
    }

    console.log(' ## fetching since: ', from);
    const _from   = moment(from).format(iugu_date_format);
    console.log(' ## _from: ', _from);
    const _now    = moment().format(iugu_date_format)
    const url     = iugu_config.api.endpoint + '/invoices';
    const method  = 'GET';
    const qs      = { limit :          100
                      , start :        0
                      , paid_at_from : _from
                      , paid_at_to:    _now
                      , status_filter: 'paid'
                      , 'sortBy[paid_at]' : 'ASC'};

    //Um hash sendo a chave o nome do campo para ordenação e o valor sendo DESC ou ASC para descendente e ascendente, respectivamente. ex1: sortBy[created_at]=ASC ex2: sortBy[paid_at]=DESC ex3: sortBy[due_date]=ASC
    //  https://api.iugu.com/v1/invoices?limit=100&start=0&paid_at_from=2019-11-01T00:00:00-03:00&paid_at_to=2019-11-10T23:59:59-03:00&status_filter=paid
    fetch(url, {
      qs:     qs
      , method: method
      , headers: { Authorization: auth }
    })
      .then(
          (response) => response.json() // if the response is a JSON object
        , (ex) => { rej(ex) }
      ).then(
        (success) => {
          if(!success)
          {
            rej('UNKNOWN ERROR!'); return;
          }
          else
          if(success && success.error)
          {
            rej (success.error); return;
          }
          else
          if(success && success.errors)
          {
            rej (success.errors[0] || success.errors); return;
          }
          // console.log(' FETCHED: ', JSON.stringify(success.items));
          res(success.items);
        }
      ).catch(
        (error) => {
          console.log(JSON.stringify(error));
          res(error);

        }
      );
});

const getInvoiceAlias = async (alias) => new Promise((res, rej) => {
  //"description": "*Ser Inkiri* - Doação Piracanga Sem Petróleo Roberta Cevada rocevada@gmail.com",
  // if(!invoice.items || invoice.items.length==0 || !invoice.items[0] || !invoice.items[0].description)
  //   return rej('Can not get ALIAS. Invoice has no description.');

  UserModel.findByAlias(alias)
  .then( async (user)=>{
    if(!user || !user[0]){
        rej({error:alias+' not found'});
        return
    }

    if(Array.isArray(user))
    {
      res({alias:alias, user:user[0]})
      return;
    }
    res({alias:alias, user:user});
    return;
  }, (error)=>{
    rej({error:error});
  })
});

const buildInvoice = async (invoice) => {

    let alias_name = null;
    let error = null;
    try {
      alias_name = invoice.items[0].description.split('*')[1]
    } catch (e) {
      error = 'Can not get ALIAS. Invoice has no description or description does not accomplish required pattern *<alias>*.';
    } finally {
      if(!alias_name)
        error = 'Can not get ALIAS. Invoice has no description or description does not accomplish required pattern *<alias>*.';
    }

    let alias = null;
    if(alias_name)
      try {
        // console.log('alias = await getInvoiceAlias(invoice);');
        alias_object = await getInvoiceAlias(alias_name);
      } catch (e) {
        // console.log('ERROR#A', JSON.stringify(e));
        error = e.error?e.error:e;
      }

    // console.log('creating my_invoice');
    const my_invoice = {
      iugu_id:                invoice.id
      , amount :              invoice.total_paid_cents/100
      , paid_at:              moment(invoice.paid_at)
      , receipt:              alias ? alias.user : null
      , receipt_alias:        alias ? alias.alias : alias_name
      , receipt_accountname:  alias ? alias.user.account_name : ''
      , original:             invoice
      , error:                error ? JSON.stringify(error) : ''
      , state:                error ? IuguModel.STATE_ERROR : IuguModel.STATE_NOT_PROCESSED
    }
    return my_invoice;

}

exports.save = async (invoices) => saveImpl(invoices);

const saveImpl = async (invoices) => {
  // console.log(' me llamarin para guardar!!!! >> ', invoices.length);

  return new Promise( async(res, rej) => {

    const my_invoices_promises = invoices
      .filter(invoice => invoice.status=='paid')
      .map(
        async (invoice) => {
          return buildInvoice(invoice);
        }
      );
    let my_invoices = null;
    try{
      my_invoices = await Promise.all(my_invoices_promises);
    }
    catch(ex){
      console.log(' ** await Promise.all EXCEPTION:', JSON.stringify(ex))
    }
    let to_insert = my_invoices.filter(inv => {return inv ? true : false});
    console.log('about to insert many', JSON.stringify(to_insert));

    // Before bulk insert, remove invoices already inserted. Remember we are getting invoices by date.
    let can_insert = false;
    let idx        = 0;
    while(!can_insert){
      let exists = null;
      try {
        exists = await IuguModel.findByIuguId(to_insert[idx].iugu_id);
      } catch (e) {
        exists = false;
      }
      if(!exists)
      {
        to_insert.splice(0, idx)
        can_insert = true;
      }
      else{
        idx+=1;
      }
    }
    IuguModel.insertMany(to_insert)
      .then((result)=>{
        console.log ('INSERT MANY OK!!')
        res(result);
      }
      , (error)=>{
        console.log ('INSERT MANY ERROR -> ', JSON.stringify(error))
        rej(error);
      });

  });
};
