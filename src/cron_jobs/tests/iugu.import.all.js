const config         = require('../../common/config/env.config.js');
const iugu_config    = require('../../common/config/iugu.config.js');
const IuguModel      = require('../../iugu/models/iugu.model');
const UserModel      = require('../../users/models/users.model');
const base64Helper   = require('../../iugu/services/base64-helper');
const moment         = require('moment');
const fetch          = require('node-fetch');

const iugu_date_format = 'YYYY-MM-DDTHH:mm:ss-03:00';  // 2019-11-01T00:00:00-03:00

const importAccountImpl = async (iugu_account) => {

    let from = moment().subtract(20, 'days');

    // const lastImported = await IuguModel.lastImportedOrNull(iugu_account.key);
    // if(lastImported)
    //   from = lastImported.paid_at;
    
    // console.log(' ** import_account.log#2')
    const _from_query_param   = moment(from).format(iugu_date_format);
    console.log(' ** iugu-importer::importAccountImpl::', iugu_account.key, _from_query_param);
    const _now_query_param    = moment().format(iugu_date_format);
    // console.log(' ** import_account.log#3')
    const url     = config.iugu.api.endpoint + '/invoices';
    const method  = 'GET';
    const qs      = { limit :          100
                      , start :        0
                      , paid_at_from : _from_query_param
                      , paid_at_to:    _now_query_param
                      , status_filter: 'paid'
                      , 'sortBy[paid_at]' : 'ASC'};
    
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

const importAll = async () => {  
  try{
    
    console.log('iugu.import.all.log#1')
    const invoicesPromises = iugu_config.IUGU_ACCOUNTS.map( (iugu_account) => {
      return importAccountImpl(iugu_account);  
    });
    console.log('iugu.import.all.log#2')
    const invoicesByAccount = await Promise.all(invoicesPromises);

    console.log('iugu.import.all.log#3')
    const invoices = [...invoicesByAccount[0], ...invoicesByAccount[1]]
    
    console.log(iugu_config.IUGU_ACCOUNTS[0].key, invoicesByAccount[0].length)
    console.log(iugu_config.IUGU_ACCOUNTS[1].key, invoicesByAccount[1].length)

    console.log('iugu.import.all.log#4')
    const importedInvoicesPromises = invoices.map(invoice => IuguModel.byIuguIdOrNull(invoice.id) )

    console.log('iugu.import.all.log#5')
    const importedInvoices = await Promise.all(importedInvoicesPromises);

    console.log('iugu.import.all.log#6')
    const newInvoices =  invoices.filter((invoice, idx)=>importedInvoices[idx]==null);
    
    // const oldInvoices =  invoices.filter((invoice, idx)=>importedInvoices[idx]!=null);
    // console.log(' ++++ ids to insert :', newInvoices.map(x=>x.id))
    // console.log(' ---- ids already inserted :', oldInvoices.map(x=>x.id))

    console.log('iugu.import.all.log#7')
    const invoicesUserPromises = newInvoices.map(invoice=>{
          // 1 get receiver by alias or project
          const alias = findAlias(invoice);
          if(!alias || alias==null || alias=='')
            return null; 
          return UserModel.byAliasOrBizNameOrNull(alias);      
        });

    console.log('iugu.import.all.log#8')
    const invoicesUser = await Promise.all(invoicesUserPromises);

    console.log('iugu.import.all.log#9')
    
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

    console.log('iugu.import.all.log#10');
    console.log('toInsert:', toInsert);
    
    const result = await IuguModel.model.create(toInsert);
    return result;
  }
  catch(e){
    console.log('iugu-importer::importAndSave ERROR => ', e);
    //rej({error:err2, qs:result.qs});
    // rej({error:err});
    return {error:err};
  }
}


(async () => {

  console.log('iugu.import.all::BEGIN --------------------------------------------')

  
  // const test_invoice = await IuguModel.byIuguIdOrNull('1BA4DC1943EC4D4CB1477BEABA91108A');
  // console.log(typeof test_invoice.original)
  // return process.exit(0);
  // return;
  const x = await importAll();

        
  console.log('iugu.import.all::END --------------------------------------------')
  return process.exit(0);

})();