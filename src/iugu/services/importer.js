const fetch             = require('node-fetch');
const IuguModel         = require('../models/iugu.model');
const UserModel         = require('../../users/models/users.model');
const config            = require('../../common/config/env.config.js');
const base64Helper      = require('./base64-helper');
const alreadyIssued     = require('./issued');
var moment              = require('moment');

const iugu_config       = config.iugu;

const issuer            = require('./issuer');

const iugu_date_format = config.iugu.date_format || 'YYYY-MM-DDTHH:mm:ss-03:00';

const LogModel = require('../../iugu_log/models/iugu_log.model');
const log      = (ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs) => {
  LogModel.createEx(ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs);
}

/* *************************************************************** */
/* *************************************************************** */
/* MULTI ACCOUNT IMPORTER **************************************** */

const importAccountImpl = async (iugu_account, days_before) => {

    const _days_before = isNaN(days_before)?1:days_before;
    let from = moment().subtract(_days_before, 'days');  

    // const lastImported = await IuguModel.lastImportedOrNull(iugu_account.key);
    // if(lastImported)
    //   from = lastImported.paid_at;
    
    // const _from_query_param   = moment(from).format(iugu_date_format);
    // console.log(' ** iugu-importer::importAccountImpl::', iugu_account.key, _from_query_param);
    // const _now_query_param    = moment().format(iugu_date_format);
    // const url     = config.iugu.api.endpoint + '/invoices';
    // const method  = 'GET';
    // const qs      = { limit :          100
    //                   , start :        0
    //                   , paid_at_from : _from_query_param
    //                   , paid_at_to:    _now_query_param
    //                   , status_filter: 'paid'
    //                   , 'sortBy[paid_at]' : 'ASC'};

    const _from_query_param          = moment(from).format(iugu_date_format);
    const paid_at_from_query_param   = '2020-03-03T00:00:00-03:00';
    
    // console.log('IUGU:IMPORTER::paid_at_from_query_param:', paid_at_from_query_param);
    // console.log('IUGU:IMPORTER::_from_query_param:', _from_query_param);
    // console.log('IUGU:IMPORTER::_days_before:', _days_before);


    const url     = config.iugu.api.endpoint + '/invoices';
    const method  = 'GET';
    const qs      = { limit :          100
                      , start :        1
                      , updated_since : _from_query_param
                      , status_filter: 'paid'
                      , paid_at_from: paid_at_from_query_param
                      , 'sortBy[created_at]' : 'ASC'};
                      // , 'sortBy[paid_at]' : 'ASC'};
    
    //sortBy[created_at]=ASC ex2: sortBy[paid_at]=DESC ex3: sortBy[due_date]=ASC
    //https://dev.iugu.com/reference#listar-faturas

    const qs_string = '?' + Object.keys(qs).map(key => `${key}=${qs[key]}`).join('&')
    // console.log(' ** import_account.log#4')
    const auth = base64Helper.toBase64(iugu_account.token);
    const options   = { method: method, headers: { Authorization: auth }};
    // console.log(' ** import_account.log#5')
    const response     = await fetch(url+qs_string, options);
    // console.log(' ** import_account.log#6')
    const responseJSON = await response.json();
    // console.log(' ** import_account.log#7')
    if(!responseJSON || responseJSON.error || responseJSON.errors)
    {
      // console.log(' ** import_account.log#8 ERROR')
      return null;
    }
    // console.log(' ** import_account.log#8 OK')
    return responseJSON.items.map(item=>{
      return {...item, iugu_account_key:iugu_account.key};
    });
}

const error_alias_not_found   = 'Can not get ALIAS from IUGU invoice. Invoice has no description or description does not accomplish required pattern *<alias>*. or custom variable *projeto* not exists.';
const error_account_not_found = 'Can not get account from alias/projeto.';
    
const findAlias = (raw_invoice_param) => {
  
  if(!raw_invoice_param)
    return null;
  let raw_invoice = raw_invoice_param;
  
  if(typeof raw_invoice !== 'object')
    raw_invoice = JSON.parse(raw_invoice_param);

  // En custom variables?
  if(raw_invoice.custom_variables)
  {  
    const projeto = raw_invoice.custom_variables.find(_custom_var => _custom_var.name=='projeto')
    if(projeto && projeto.value && projeto.value.trim()!='')
    {
      // console.log('***findAlias::projeto::', projeto.value)
      return projeto.value.trim();
    }
  }

  // En desc?
  if(raw_invoice&&raw_invoice.items&&raw_invoice.items.length>0)
  {
    const splited_description = raw_invoice.items[0].description.split('*');
    const alias_name = splited_description.length>=2
      ?splited_description[1].trim()
      :'';
    if(alias_name&&alias_name.length>0)
    {
      // console.log('***findAlias::description::', alias_name)
      return alias_name;
    }
  }
  // console.log('***findAlias::NOT-FOUND::', raw_invoice.id)
  return null;
}

exports.importAndNotSave = async (days_before) => importImpl(false, days_before);

exports.importAllSince = async (days_before) => importImpl(true, days_before);

exports.importAll = async () => importImpl(true);

const importImpl = async (do_save, days_before) => {  
  
  if(!iugu_config.accounts || iugu_config.accounts.lenght==0)
    return;
  const _days_before = isNaN(days_before)?1:days_before;

  try{
   
    // console.log('iugu.import.all.log#1')
    const invoicesPromises = iugu_config.accounts.map( (iugu_account) => {
      return importAccountImpl(iugu_account, _days_before);  
    });
    // console.log('iugu.import.all.log#2')
    const invoicesByAccount = await Promise.all(invoicesPromises);

    // console.log('iugu.import.all.log#3')
    const invoices = [...invoicesByAccount[0], ...invoicesByAccount[1]]
    
    // iugu_config.accounts.map((item, idx)=>{
    //   console.log('#######', iugu_config.accounts[idx].key, invoicesByAccount[idx].length)
    // })
    // console.log(iugu_config.accounts[0].key, invoicesByAccount[0].length)
    // console.log(iugu_config.accounts[1].key, invoicesByAccount[1].length)

    // console.log('iugu.import.all.log#4')
    const importedInvoicesPromises = invoices.map(invoice => IuguModel.byIuguIdOrNull(invoice.id) )

    // console.log('iugu.import.all.log#5')
    const importedInvoices = await Promise.all(importedInvoicesPromises);

    // console.log('iugu.import.all.log#6')
    const newInvoices =  invoices.filter((invoice, idx)=>{
      return importedInvoices[idx]==null && !alreadyIssued.includes(invoices[idx].id)
    });
    
    if(newInvoices.length>0)
      console.log(' == IUGU.SERVICES.IMPORTER::importImpl() About to insert: ', newInvoices.length)
    else
      console.log(' == IUGU.SERVICES.IMPORTER::importImpl() NOTHING to insert. ')
    
    // console.log(' ++++ ids to insert :', newInvoices.map(x=>x.id))
    // console.log('iugu.import.all.log#7')
    const invoicesUserPromises = newInvoices.map(invoice=>{
          // 1 get receiver by alias or project
          const alias = findAlias(invoice);
          if(!alias || alias==null || alias=='')
            return null; 
          return UserModel.byAliasOrBizNameOrNull(alias);      
        });

    // console.log('iugu.import.all.log#8')
    const invoicesUser = await Promise.all(invoicesUserPromises);

    // console.log('iugu.import.all.log#9')
    
    const toInsert = invoicesUser.map((user, idx)=>{
      // console.log('*****************************', user?user.account_name:'user', idx)
      const raw_invoice = newInvoices[idx];
      const alias       = findAlias(raw_invoice);
      const error       = !alias
        ?error_alias_not_found
        :(!user
          ?error_account_not_found
          :null);
      return {
        iugu_id:                raw_invoice.id
        , iugu_account:         raw_invoice.iugu_account_key
        , amount :              raw_invoice.total_paid_cents/100
        , paid_at:              moment(raw_invoice.paid_at)
        , receipt:              user
        , receipt_alias:        alias
        , receipt_accountname:  user ? user.account_name : null
        , original:             raw_invoice
        , error:                error
        , state:                error ? IuguModel.STATE_ERROR : IuguModel.STATE_NOT_PROCESSED
      }
        
    });

    // console.log('iugu.import.all.log#10');
    // console.log('toInsert:', toInsert);
    
    if(do_save===false)
      return toInsert;

    const result = await IuguModel.model.create(toInsert);
    return result;
    // return {};
  }
  catch(e){
    console.log(' == IUGU.SERVICES.IMPORTER::importImpl() ERROR#1: ', e)
    // console.log('iugu-importer::importAndSave ERROR => ', e);
    //rej({error:err2, qs:result.qs});
    // rej({error:err});
    return {error:e};
  }
}

// exports.importAccount 

// exports.saveAccountInvoices

// exports.getInvoiceAlias 

// exports.buildInvoice


exports.reProcessInvoice = async (invoice_id) => reProcessInvoiceImpl(invoice_id);

const reProcessInvoiceImpl = async (invoice_id) => {

  if(!iugu_config.accounts || iugu_config.accounts.lenght==0)
    return;

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
    console.log('iugu-importer::reProcessInvoiceImpl ERROR:: ', err)
    throw({error:err})
    return;
  }

  // 2.- Obtengo el alias
  let new_invoice_obj = invoice_obj;
  if(!invoice_obj.receipt)
    try {
      const alias = findAlias(invoice_obj.original);
      if(!alias || alias==null || alias=='')
      {
        console.log('iugu-importer::reProcessInvoiceImpl ERROR:: ', error_alias_not_found)
        throw({error:error_alias_not_found});
        return;
      }
      new_invoice_obj.receipt = await UserModel.byAliasOrBizNameOrNull(alias);      
    } catch (e) {
      const err = `Error while parsing original IUGU invoice. ${JSON.stringify(e)}`;
      console.log('iugu-importer::reProcessInvoiceImpl ERROR:: ',  e, err)
      throw({error:err})
      return;
    }

  // 3.- Verifico el user a partir del alias
  if(!new_invoice_obj || !new_invoice_obj.receipt)
  {
    const err = `Error while finding account by IUGU alias. Can NOT issue if no account is related to alias. ${new_invoice_obj.error}`;
    console.log('iugu-importer::reProcessInvoiceImpl ERROR:: ',  e, err)
    throw({error:err})
    return;
  }

  // 4.- "Clone" invoice
  invoice_obj.iugu_id             = new_invoice_obj.iugu_id;
  invoice_obj.amount              = new_invoice_obj.amount;
  invoice_obj.paid_at             = new_invoice_obj.paid_at;
  invoice_obj.receipt             = new_invoice_obj.receipt;
  invoice_obj.receipt_alias       = new_invoice_obj.receipt.receipt_alias;
  invoice_obj.receipt_accountname = new_invoice_obj.receipt.account_name;
  invoice_obj.original            = new_invoice_obj.original;
  invoice_obj.error               = null;
  invoice_obj.state               = IuguModel.STATE_NOT_PROCESSED;

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
