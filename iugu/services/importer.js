const fetch             = require('node-fetch');
const IuguModel         = require('../models/iugu.model');
const UserModel         = require('../../users/models/users.model');
var iugu_config         = null;
try {
    iugu_config         = require('../../common/config/iugu.config.js');
} catch (ex) {}

const iugu_token       = process.env.IUGU_TOKEN || iugu_config.prod.token;
const issuer           = require('./issuer');

var moment             = require('moment');

const b                = new Buffer.from(iugu_token + ':');
const auth             = 'Basic ' + b.toString('base64');
const iugu_date_format = 'YYYY-MM-DDTHH:mm:ss-03:00';  // 2019-11-01T00:00:00-03:00

const LogModel         = require('../../iugu_log/models/iugu_log.model');
const log = (ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs) => {
  LogModel.createEx(ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs);
}

exports.importAndSave = async () => new Promise(async(res, rej) => {
  importImpl()
    .then( (result) => {
        saveImpl(result.items)
          .then( (result2) => {
              log
              res({...result2, qs:result.qs});
              return;
          }, (err2)=>{
              rej({error:err2, qs:result.qs});
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
      // console.log(' ** ERROR geting last imported:', JSON.stringify(e))
    } finally {
      if(!from)
      {
        from = moment().subtract(1, 'days')
        // return rej(' -- LAST IMPORTED::INVENTADO::'+JSON.stringify(from));
      }
      // return rej(' -- LAST IMPORTED::SEE:'+JSON.stringify(from));
      // console.log(' -- LAST IMPORTED::'+JSON.stringify(from));
    }

    console.log(' ## fetching since: ', from);
    const _from   = moment(from).format(iugu_date_format);
    console.log(' ## since-03 : _from: ', _from);
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
    const qs_string = '?' + Object.keys(qs).map(key => `${key}=${qs[key]}`).join('&')
    fetch(url+qs_string, {
      method: method
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
          res({items:success.items, qs:qs});
        }
      ).catch(
        (error) => {
          console.log(JSON.stringify(error));
          res(error);

        }
      );
});

exports.getInvoiceAlias = async (alias) => getInvoiceAliasImpl(alias);
const getInvoiceAliasImpl = async (alias) => new Promise((res, rej) => {
  //"description": "*Ser Inkiri* - Doação Piracanga Sem Petróleo Roberta Cevada rocevada@gmail.com",
  // if(!invoice.items || invoice.items.length==0 || !invoice.items[0] || !invoice.items[0].description)
  //   return rej('Can not get ALIAS. Invoice has no description.');
  alias = (alias||'').trim();
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

exports.buildInvoice = async (raw_invoice) => buildInvoiceImpl(raw_invoice);
const buildInvoiceImpl = async (raw_invoice) => {

    console.log(' ****** buildInvoiceImpl **** ')
    let alias_name = null;
    let error = null;
    try {
      alias_name = raw_invoice.items[0].description.split('*')[1]
      console.log(` FOUND ALIAS [${alias_name}] !!`)
    } catch (e) {
      error = 'Can not get ALIAS. Invoice has no description or description does not accomplish required pattern *<alias>*. '+JSON.stringify(e);
      console.log(` ERROR#1: ${error} !!`)
    } finally {
      if(!alias_name)
      {
        error = 'Can not get ALIAS. Invoice has no description or description does not accomplish required pattern *<alias>*.';
        console.log(` ERROR#2: ${error} !!`)
      }
    }

    let alias_object = null;
    if(alias_name)
      alias_name = (alias_name||'').trim()
      try {
        alias_object = await getInvoiceAliasImpl(alias_name);
      } catch (e) {
        // console.log('ERROR#A', JSON.stringify(e));
        error = e.error?e.error:e;
        console.log(` ERROR#3: ${error} !!`)
      }

    // console.log('creating my_invoice');
    const my_invoice = {
      iugu_id:                raw_invoice.id
      , amount :              raw_invoice.total_paid_cents/100
      , paid_at:              moment(raw_invoice.paid_at)
      , receipt:              alias_object ? alias_object.user : null
      , receipt_alias:        alias_object ? alias_object.alias : alias_name
      , receipt_accountname:  alias_object ? alias_object.user.account_name : null
      , original:             raw_invoice
      , error:                error ? JSON.stringify(error) : null
      , state:                error ? IuguModel.STATE_ERROR : IuguModel.STATE_NOT_PROCESSED
    }
    console.log(' ****** --------------- **** ')
    return my_invoice;

}

exports.save = async (invoices) => saveImpl(invoices);
const saveImpl = async (raw_invoices) => {
  // console.log(' me llamarin para guardar!!!! >> ', invoices.length);

  return new Promise( async(res, rej) => {

    // Filter raw invoices by status (==paid)
    let _filtered_raw_invoices = raw_invoices
      .filter(raw_invoice => raw_invoice.status=='paid')

    // Filter by id (not imported yet)
    const _already_inserted_p = _filtered_raw_invoices.map(
        async (raw_invoice) => {
          return IuguModel.findByIuguId(raw_invoice.id, true).catch(e => e);
        }
      );

    let _already_inserted         = null;
    try {
      _already_inserted           = await Promise.all(_already_inserted_p);
    } catch (e) {
      console.log('Promise.all ERROR: ', JSON.stringify(e))
    }

    // Remove raw invoices already imported.
    const _already_inserted_ids = _already_inserted.filter(inv=>inv!=null).map(inv=>inv.iugu_id)
    _filtered_raw_invoices      = _filtered_raw_invoices.filter( raw => !_already_inserted_ids.includes(raw.id) )

    // Build IUGU model objects from raw invoices.
    const _to_insert_p = _filtered_raw_invoices
      .map(
        async (raw_invoice) => {
          return buildInvoiceImpl(raw_invoice);
        }
      );

    let to_insert = null;
    try{
      to_insert = await Promise.all(_to_insert_p);
    }
    catch(ex){
      // console.log(' ** await Promise.all EXCEPTION:', JSON.stringify(ex))
    }

    if(!to_insert || to_insert.length==0)
    {
      res({error:'NOTHING TO INSERT!'});
      return
    }

    console.log(' ABOUT to insert :: ',  to_insert)
    IuguModel.insertMany(to_insert)
      .then((result)=>{
        console.log ('INSERT MANY OK!!')
        res({items:result});
      }
      , (error)=>{
        console.log ('INSERT MANY ERROR -> ', JSON.stringify(error))
        rej(error);
      });

  });
};

exports.reProcessInvoice = async (invoice_id) => reProcessInvoiceImpl(invoice_id);
const reProcessInvoiceImpl = async (invoice_id) => {
  console.log( ' importer::reProcessInvoiceImpl -> ', invoice_id )
  return new Promise( async(res, rej) => {
    let invoice_obj = null;
    try {
      invoice_obj = await IuguModel.findById(invoice_id);
    } catch (e) {
      rej({error:'Invoice ID not exists. '+JSON.stringify(e)})
      return;
    }

    // 1.- Veo que el estado no sea ISSUED
    if(!IuguModel.canReprocess(invoice_obj))
    {
      rej({error:`Invoice state/status is ${invoice_obj.state}. Can NOT reprocess invoice.`})
      return;
    }

    // 2.- Obtengo el alias
    let new_invoice_obj = null;
    try {
      new_invoice_obj = await buildInvoiceImpl (invoice_obj.original);;
    } catch (e) {
      rej({error:`Error while parsing original IUGU invoice. ${JSON.stringify(e)}`})
      return;
    }

    // 3.- Verifico el user a partir del alias
    if(!new_invoice_obj || !new_invoice_obj.receipt)
    {
      rej({error:`Error while finding account by IUGU alias. Can NOT issue if no account is related to alias. ${new_invoice_obj.error}`})
      return;
    }

    // 4.- "Clone" invoice
    invoice_obj.iugu_id             = new_invoice_obj.iugu_id;
    invoice_obj.amount              = new_invoice_obj.amount;
    invoice_obj.paid_at             = new_invoice_obj.paid_at;
    invoice_obj.receipt             = new_invoice_obj.receipt;
    invoice_obj.receipt_alias       = new_invoice_obj.receipt_alias;
    invoice_obj.receipt_accountname = new_invoice_obj.receipt_accountname;
    invoice_obj.original            = new_invoice_obj.original;
    // invoice_obj.error               = new_invoice_obj.error;
    // invoice_obj.state               = new_invoice_obj.state;

    // 5.- Issue paid amount
    let issue = null;
    try {
      issue = await issuer.issueOne(invoice_obj);
    } catch (e) {
      rej(e)
      return;
    } finally {
      if(!issue)
        return rej({invoice:new_invoice_obj, error:'Something went wrong!'});
      return res(issue);
    }


  });
};
