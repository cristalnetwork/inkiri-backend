const fetch             = require('node-fetch');
const IuguModel         = require('../models/iugu.model');
const UserModel         = require('../../users/models/users.model');
const config            = require('../../common/config/env.config.js');
const base64Helper      = require('./base64-helper');
var moment              = require('moment');

var iugu_config         = null;
try {
    iugu_config         = require('../../common/config/iugu.config.js');
} catch (ex) {
    
    iugu_config = {
      IUGU_ACCOUNTS   : [
        {
          key     : "INSTITUTO"
          , token : process.env.IUGU_INSTITUTO_TOKEN
        },
        {
          key     : "EMPRESA"
          , token : process.env.IUGU_EMPRESA_TOKEN
        }
      ]
      , ISSUER_KEY      : process.env.IUGU_ISSUER_KEY
    }
    
}

const issuer           = require('./issuer');

const iugu_date_format = 'YYYY-MM-DDTHH:mm:ss-03:00';  // 2019-11-01T00:00:00-03:00

const LogModel = require('../../iugu_log/models/iugu_log.model');
const log      = (ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs) => {
  LogModel.createEx(ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs);
}

/* *************************************************************** */
/* *************************************************************** */
/* MULTI ACCOUNT IMPORTER **************************************** */

exports.importAll = async () => {  
  try{
    
    const importPromises = iugu_config.IUGU_ACCOUNTS.map( (iugu_account) => {
      return importAccountImpl(iugu_account);  
    });

    const importResults = await Promise.all(importPromises);
    
    const savePromises  = importResults.map((result, idx) => {
      if(!result || !result.items)
        return null;
      return saveAccountInvoicesImpl(iugu_config.IUGU_ACCOUNTS[idx], result.items);  
    });

    const saveResults   = await Promise.all(savePromises);

    return saveResults.map((res, idx)=>{
      return {...res, qs:importResults[idx].qs};
    })
  }
  catch(e){
    console.log('iugu-importer::importAndSave ERROR => ', e);
    //rej({error:err2, qs:result.qs});
    // rej({error:err});
    return {error:err};
  }
}

exports.importAccount = async (iugu_account) => importAccountImpl(iugu_account);

const importAccountImpl = async (iugu_account) => {

    let from = moment().subtract(1, 'days');
    // let from = moment().subtract(8, 'days');

    const lastImported = await IuguModel.lastImportedOrNull();

    if(lastImported)
      from = lastImported.paid_at;
    

    const _from_query_param   = moment(from).format(iugu_date_format);
    console.log('iugu-importer::importIml::_from_query_param => ', _from_query_param);
    const _now_query_param    = moment().format(iugu_date_format)
    const url     = config.iugu.api.endpoint + '/invoices';
    const method  = 'GET';
    const qs      = { limit :          100
                      , start :        0
                      , paid_at_from : _from_query_param
                      , paid_at_to:    _now_query_param
                      , status_filter: 'paid'
                      , 'sortBy[paid_at]' : 'ASC'};
    
    // Um hash sendo a chave o nome do campo para ordenação e o valor sendo DESC ou ASC para descendente e ascendente, respectivamente. ex1: sortBy[created_at]=ASC ex2: sortBy[paid_at]=DESC ex3: sortBy[due_date]=ASC
    // https://api.iugu.com/v1/invoices?limit=100&start=0&paid_at_from=2019-11-01T00:00:00-03:00&paid_at_to=2019-11-10T23:59:59-03:00&status_filter=paid
    const qs_string = '?' + Object.keys(qs).map(key => `${key}=${qs[key]}`).join('&')

    const auth = base64Helper.toBase64(iugu_account.token);
    const options   = { method: method, headers: { Authorization: auth }};

    const response     = await fetch(url+qs_string, options);
    const responseJSON = await response.json();

    if(!responseJSON || responseJSON.error || responseJSON.errors)
      return null;
    
    return ({items:responseJSON.items, qs:qs});
}


exports.saveAccountInvoices = async (account, invoices) => saveAccountInvoicesImpl(account, invoices);

const saveAccountInvoicesImpl = async (account, raw_invoices) => {
  
  const _filtered_raw_invoices = raw_invoices
                    .filter(raw_invoice => raw_invoice.status=='paid');

  console.log('iugu-importer::save IUGUs to insert:', JSON.stringify(_filtered_raw_invoices.map(raw_invoice=>raw_invoice.id)))

  const _already_inserted_invoices    = await IuguModel.model.find({iugu_id: {$in : _filtered_raw_invoices.map(raw_invoice=>raw_invoice.id) }}).exec()
  
  // console.log('iugu-importer::saveImpl already inserted IUGUs:', JSON.stringify(_already_inserted_invoices.map(inserted_invoice=>inserted_invoice.iugu_id)))

  const _already_inserted_invoices_id = _already_inserted_invoices.map(invoice => invoice.iugu_id)

  console.log('iugu-importer::saveImpl already inserted IUGUs:', JSON.stringify(_already_inserted_invoices_id))

  const _built_invoices_p = _filtered_raw_invoices
      .filter( invoice => !_already_inserted_invoices_id.includes(invoice.id) )
      .map( (raw_invoice) => buildInvoiceImpl(account, raw_invoice) );

  let _built_invoices = null;
  try{
    _built_invoices = await Promise.all(_built_invoices_p);
  }
  catch(ex){
    console.log('iugu-importer::saveImpl ** await Promise.all EXCEPTION:', JSON.stringify(ex))
  }

  console.log('iugu-importer::saveImpl TO INSERT....  IUGUs:', JSON.stringify(_built_invoices.map(built_invoice=>built_invoice.iugu_id)))

  if(!_built_invoices || _built_invoices.length==0)
  {
    // res({error:'NOTHING TO INSERT!'});
    throw {error:'NOTHING TO INSERT!'}
  }

  console.log(`iugu-importer::saveImpl ABOUT to insert :: ${_built_invoices.length} invoices.`)
  try{
    const result = await IuguModel.model.create(_built_invoices);
    return {items:result};
  }
  catch(e)
  {
    console.log('iugu-importer::saveImpl ERROR:: ',  e)
    throw e;
  }
  
};
/* *************************************************************** */
/* *************************************************************** */
/* *************************************************************** */

exports.getInvoiceAlias = async (alias) => getInvoiceAliasImpl(alias);

const getInvoiceAliasImpl = async (alias) => {
  alias = (alias||'').trim();
  const user = await UserModel.byAliasOrNull(alias);
  if(!user)
    throw ({error:alias+' not found'})
  
  return({alias:alias, user:user})
}

exports.buildInvoice = async (account, raw_invoice) => buildInvoiceImpl(account, raw_invoice);
const buildInvoiceImpl = async (account, raw_invoice) => {

    let alias_name          = null;
    let error               = null;
    let splited_description = [];
    try {
      splited_description = (raw_invoice&&raw_invoice.items&&raw_invoice.items.length>0)
        ?raw_invoice.items[0].description.split('*')
        :[];
      alias_name = splited_description.length>0
        ?splited_description[1]
        :'';
      console.log(`iugu-importer::buildInvoiceImpl FOUND ALIAS [${alias_name}] for ${raw_invoice.id}.`)
    } catch (e) {
      error = 'Can not get ALIAS. Invoice has no description or description does not accomplish required pattern *<alias>*. '+JSON.stringify(e);
      console.log(`iugu-importer::buildInvoiceImpl ERROR#1: ${error} !!`)
    } finally {
      if(!alias_name)
      {
        error = 'Can not get ALIAS. Invoice has no description or description does not accomplish required pattern *<alias>*.';
        console.log(`iugu-importer::buildInvoiceImpl ERROR#2: ${error} !!`)
      }
    }

    let alias_object = null;
    if(alias_name)
      alias_name = (alias_name||'').trim()
    try {
      alias_object = await getInvoiceAliasImpl(alias_name);
    } catch (e) {
      error = e.error?e.error:e;
      console.log(`iugu-importer::buildInvoiceImpl ERROR#3: ${JSON.stringify(error)} !!`)
    }

    if('4AE76EFED9CF47639E404D262E8D922C'==raw_invoice.id)
    {
      const __name = (alias_object && alias_object.user)
        ?alias_object.user.account_name
        :'NADA!';
      console.log(` ------------------ 4AE76EFED9CF47639E404D262E8D922C ---------------- `)
      console.log(` splited_description: ${splited_description} `)
      console.log(` alias_object: ${__name} `)
      console.log(` ------------------ 4AE76EFED9CF47639E404D262E8D922C ---------------- `)
      
    }

    // console.log('creating my_invoice');
    const my_invoice = {
      iugu_id:                raw_invoice.id
      , iugu_account:         account
      , amount :              raw_invoice.total_paid_cents/100
      , paid_at:              moment(raw_invoice.paid_at)
      , receipt:              alias_object ? alias_object.user : null
      , receipt_alias:        alias_object ? alias_object.alias : alias_name
      , receipt_accountname:  alias_object ? alias_object.user.account_name : null
      , original:             raw_invoice
      , error:                error ? JSON.stringify(error) : null
      , state:                error ? IuguModel.STATE_ERROR : IuguModel.STATE_NOT_PROCESSED
    }
    return my_invoice;

}

exports.reProcessInvoice = async (invoice_id) => reProcessInvoiceImpl(invoice_id);

const reProcessInvoiceImpl = async (invoice_id) => {
  console.log( ' importer::reProcessInvoiceImpl -> ', invoice_id )
  
  let invoice_obj = null;
  try {
    invoice_obj = await IuguModel.model.findById(invoice_id).populate('receipt').exec()
  } catch (e) {
    throw ({error:'Invoice ID not exists. '+invoice_id+'|'+JSON.stringify(e)})
    return;
  }

  // 1.- Veo que el estado no sea ISSUED
  if(!IuguModel.canReprocess(invoice_obj))
  {
    const err = `Invoice state/status is ${invoice_obj.state}. Can NOT reprocess invoice.`;
    console.log('iugu-importer::saveImpl ERROR:: ', err)
    throw({error:err})
    return;
  }

  // 2.- Obtengo el alias
  let new_invoice_obj = invoice_obj;
  if(!invoice_obj.receipt)
    try {
      new_invoice_obj = await buildInvoiceImpl (invoice_obj.original);;
    } catch (e) {
      const err = `Error while parsing original IUGU invoice. ${JSON.stringify(e)}`;
      console.log('iugu-importer::saveImpl ERROR:: ',  e, err)
      throw({error:err})
      return;
    }

  // 3.- Verifico el user a partir del alias
  if(!new_invoice_obj || !new_invoice_obj.receipt)
  {
    const err = `Error while finding account by IUGU alias. Can NOT issue if no account is related to alias. ${new_invoice_obj.error}`;
    console.log('iugu-importer::saveImpl ERROR:: ',  e, err)
    throw({error:err})
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
    return issue;
  } catch (e) {
    const err = `Error Issuing invoice:${{new_invoice_obj}}. Error: ${JSON.stringify(e)}`;
    console.log('iugu-importer::saveImpl ERROR:: ',  err)
    throw ({invoice:new_invoice_obj, error:e });
  }

};
