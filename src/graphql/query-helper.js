var moment          = require('moment');
const RequestModel  = require('../requests/models/requests.model');

/*
* Operators
* $lt:, $lte: 
* $gt:, $gte:
*/

const getFilter = (name, value, allowed_values) => {
  
  if(typeof value ==='boolean' && name)
    return {[name]: value};

  if(!value || !name)
    return {};
  
  if(typeof value === 'number' || !isNaN(value))
    return {[name]: Number(value)};

  if (!value.includes(','))
    return {[name]: value};
  
  if (value.includes(',')) 
    // return value.split(',').map(req_item=> {return { [name]: req_item}})
    return { [name]: { $in: value.split(',').filter(item => (allowed_values?allowed_values.includes(item):true) ) } }
  
  return {};
}

const getQuery = (filter, new_or_filter) => {
  if(!filter.or_filter || !Array.isArray(filter.or_filter) || filter.or_filter.length==0)
    return filter.filter;
  return {...filter.filter, $or: [...filter.or_filter, ...(new_or_filter||[])]};
}

exports.appendFromToFilter = (value, filter) => makeOrFilter ('from', 'to', value, filter);

const makeOrFilter = (name1, name2, value) => {
  if(filter[$or])
    return [...filter[$or], {[name1]: value}, {[name2]: value}];
  return {...filter, $or: [{[name1]: value}, {[name2]: value}] };
}

const getLikeFilter = (name, value) => {
  if(!value || !name)
    return {};
  return {[name]: {$regex: '.*' + value + '.*',  $options : "i"}}
}

const getBetweenFilter = (name, from, to) => {
  if(!name || !from || !to)
    return {};
  return {[name]: { $gte: from, $lte: to }}
}

const append = (filter, new_filter) => {
  if(Array.isArray(new_filter))
    filter.or_filter = [...filter.or_filter, ...new_filter]
  else
    filter.filter = {...filter.filter, ...new_filter}
  return filter;
}

exports.usersQuery  = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {balance_status, search_text, email, account_type, account_name, id, alias, last_name, business_name, bank_name, bank_agency, bank_cc, exists_at_blockchain} = args;

  let filter = {
    filter:     {},
    or_filter : []
  };

  if(search_text && search_text.trim()!=''){
    filter.or_filter = [getLikeFilter('account_name', search_text), getLikeFilter('email', search_text), getLikeFilter('business_name', search_text)
      , getLikeFilter('first_name', search_text), getLikeFilter('last_name', search_text), getLikeFilter('legal_id', search_text), getLikeFilter('phone', search_text) ];
  }
  else{
    filter = append(filter, getLikeFilter('email', email) );
    filter = append(filter, getLikeFilter('account_name', account_name) );
    filter = append(filter, getFilter('_id', id) );
    filter = append(filter, getLikeFilter('alias', alias) );
    filter = append(filter, getFilter('last_name', last_name) );
    filter = append(filter, getLikeFilter('business_name', business_name) );
    filter = append(filter, getLikeFilter('bank_accounts.bank_name', bank_name) );
    filter = append(filter, getLikeFilter('bank_accounts.bank_agency', bank_agency) );
    filter = append(filter, getLikeFilter('bank_accounts.bank_cc', bank_cc) );
    // console.log('exists_at_blockchain ', exists_at_blockchain)
    filter = append(filter, getFilter('exists_at_blockchain', exists_at_blockchain) );
  }
  if(balance_status && balance_status!=0){
    if(balance_status>0)
      // filter = append(filter, {balance : {$gte: "$overdraft"}})
      filter = append(filter, { $expr: { $gte: [ "$balance" , "$overdraft" ] } })
      
    else
      // filter = append(filter, {overdraft : {$gt: "$balance"}})
    filter = append(filter, { $expr: { $gt: [ "$overdraft" , "$balance" ] } })
  }
  
  filter = append(filter, getFilter('account_type', account_type) );
  
  const _query = getQuery(filter);
  // console.log(_query)
  return {
    limit:   limit,
    page:    page,
    filter:  _query
  };    
}

exports.extratoQuery = (context, args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {requested_type, from, to, provider_id, state, date_from, date_to, wage_filter, account_name} = args;
  
  // const the_account_name = context.account_name && context.account_name!=''
  //   ?context.account_name
  //   :account_name;

  const the_account_name = account_name && account_name!=''
    ?account_name
    :context.account_name;
    
  let filter = {
    filter:     {},
    or_filter : []
  };
  
  // If one of from/to filters is set, then the other one should be the account_name.
  let account_filter = null;
  // console.log('********** from:', from)
  // console.log('********** to:', to)
  if ((from&&to) && from!=''&&to!='') {
    if (from!=the_account_name)
    {
      // console.log('********** EXTRATO#1')
      filter = append(filter, getFilter('from', from) );
      filter = append(filter, getFilter('to', the_account_name) );
    }
    else
      if (to!=the_account_name)
      {
        // console.log('********** EXTRATO#2')
        filter = append(filter, getFilter('from', the_account_name) );
        filter = append(filter, getFilter('to', to) );
      }
  }
  else
    if (from&&from!='')
    {
      // console.log('********** EXTRATO#3')
      filter = append(filter, getFilter('from', from) );
      filter = append(filter, getFilter('to', the_account_name) );
    }
    else
      if (to&&to!='')
      {
        // console.log('********** EXTRATO#4')
        filter = append(filter, getFilter('from', the_account_name) );
        filter = append(filter, getFilter('to', to) );
      }
      else{
        // console.log('********** EXTRATO#5')
        filter = append(filter, { $or : [{from: the_account_name}, {to: the_account_name}, {wages : { $elemMatch: {account_name: the_account_name} } }] } );
        // account_filter = { $or : [{from: from}, {to: to}, {wages : { $elemMatch: {account_name: wage_filter} } }] };
      }
  
  if(date_from && date_to)
  {
    const my_date_from = moment(date_from);
    const my_date_to = moment(date_to);
    filter = append(filter,  {updated_at: { $gte: my_date_from, $lte: my_date_to }});
    // filter = append(filter,  {updated_at: { $gte: my_date_to, $lte: my_date_from }}, {created_at: { $gte: my_date_from, $lte: my_date_to}});
  }
  filter = append(filter, getFilter('provider', provider_id) );
  
  // const accepted_states = [RequestModel.STATE_REQUESTED, RequestModel.STATE_RECEIVED, RequestModel.STATE_PROCESSING, RequestModel.STATE_ACCEPTED, RequestModel.STATE_REJECTED, RequestModel.STATE_ERROR, RequestModel.STATE_CANCELED, RequestModel.STATE_REFUNDED, RequestModel.STATE_REVERTED];
  const accepted_states = [RequestModel.STATE_RECEIVED, RequestModel.STATE_PROCESSING, RequestModel.STATE_ACCEPTED, RequestModel.STATE_REFUNDED, RequestModel.STATE_REVERTED];
  filter = append(filter, getFilter('state', state) );
  if(!state || state.trim()=='')
    filter = append(filter, { 'state' : { $in : accepted_states } } );

  const accepted_request_types = [RequestModel.TYPE_DEPOSIT, RequestModel.TYPE_EXCHANGE, RequestModel.TYPE_PROVIDER, RequestModel.TYPE_WITHDRAW, RequestModel.TYPE_PAYMENT, RequestModel.TYPE_SEND, RequestModel.TYPE_PAD, RequestModel.TYPE_SALARY, RequestModel.TYPE_ISSUE, RequestModel.TYPE_IUGU];
  filter = append(filter, getFilter('requested_type', requested_type, accepted_request_types) );
  if(!requested_type || requested_type.trim()=='')
    filter = append(filter, { 'requested_type' : { $in : accepted_request_types } } );
  
  const ors_filter = [
        { $and : [ { requested_type : RequestModel.TYPE_IUGU  },    { state : RequestModel.STATE_ACCEPTED} ] },
        { $and : [ { requested_type : RequestModel.TYPE_ISSUE  },   { state : RequestModel.STATE_ACCEPTED} ] },
        { $and : [ { requested_type : RequestModel.TYPE_DEPOSIT  }, { state : RequestModel.STATE_ACCEPTED} ] },
        { $and : [ { requested_type : RequestModel.TYPE_EXCHANGE }, { state : { $in : [RequestModel.STATE_RECEIVED, RequestModel.STATE_PROCESSING, RequestModel.STATE_ACCEPTED] } } ] },
        { $and : [ { requested_type : RequestModel.TYPE_PROVIDER }, { state : { $in : [RequestModel.STATE_RECEIVED, RequestModel.STATE_PROCESSING, RequestModel.STATE_ACCEPTED] } } ] },
        { $and : [ { requested_type : RequestModel.TYPE_WITHDRAW }, { state : { $in : [RequestModel.STATE_RECEIVED, RequestModel.STATE_PROCESSING, RequestModel.STATE_ACCEPTED] } } ] },
        { $and : [ { requested_type : RequestModel.TYPE_PAYMENT },  { state : { $in : [RequestModel.STATE_RECEIVED, RequestModel.STATE_ACCEPTED] } } ] },
        { $and : [ { requested_type : RequestModel.TYPE_SEND },     { state : { $in : [RequestModel.STATE_RECEIVED, RequestModel.STATE_ACCEPTED] } } ] },
        { $and : [ { requested_type : RequestModel.TYPE_PAD },      { state : { $in : [RequestModel.STATE_RECEIVED, RequestModel.STATE_PROCESSING, RequestModel.STATE_ACCEPTED] } } ] },
        { $and : [ { requested_type : RequestModel.TYPE_SALARY },   { state : { $in : [RequestModel.STATE_RECEIVED, RequestModel.STATE_PROCESSING, RequestModel.STATE_ACCEPTED] } } ] },
        { $and : [ { requested_type : RequestModel.TYPE_SALARY },   { from : { $ne: the_account_name } } , { wages : { $elemMatch: {account_name: the_account_name} } } ] }, 
        { $and : [ { requested_type : RequestModel.TYPE_SALARY },   { from : the_account_name  }] }, 
        { $and : [ { state : { $in : [RequestModel.STATE_REFUNDED, RequestModel.STATE_REVERTED] } },  { refund_tx_id: {$in : [null, '' ]} }] },
    ];



    // state: { $in: [  ] } }
    //  $and : [
    //     { $or : [ { price : 0.99 }, { price : 1.99 } ] },
    //     { $or : [ { sale : true }, { qty : { $lt : 20 } } ] }
    // ]


  const query = getQuery(filter, ors_filter);
  
  // console.log(' ## graphql-server::extrato-query-builder::query:', JSON.stringify(query)  );
  return {
    limit:   limit
    , page:    page
    , filter:  query
  };  
}

exports.requestQuery = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {requested_type, from, to, provider_id, state, id, requestCounterId, tx_id, refund_tx_id, attach_nota_fiscal_id, attach_boleto_pagamento_id, attach_comprobante_id, deposit_currency, date_from, date_to, service_id, wage_filter, iugu_id} = args;

  let filter = {
    filter:     {},
    or_filter : []
  };
  
  if (from&&to&&from==to) {
    // console.log(' ## graphql-server::requests-query-builder:wage_filter:', wage_filter);
    // filter = { $or : [{from: from}, {to: to}] };
    filter = append(filter, [{from: from}, {to: to}] ); 
    // if(!wage_filter || wage_filter)
    //   filter = { $or : [{from: from}, {to: to}] };
    // else
    //   filter = { $or : [{from: from}, {to: to}, {wages : { $elemMatch: {account_name: wage_filter} } }] };
  }
  else
  {
    filter = append(filter, getFilter('from', from) );
    filter = append(filter, getFilter('to', to) );
  }
  
  if(date_from && date_to)
  {
    const my_date_from = moment(date_from);
    const my_date_to = moment(date_to);
    filter = append(filter,  {updated_at: { $gte: my_date_from, $lte: my_date_to }});
    // filter = append(filter,  {updated_at: { $gte: my_date_to, $lte: my_date_from }}, {created_at: { $gte: my_date_from, $lte: my_date_to}});
  }
  
  filter = append(filter, getFilter('iugu', iugu_id) );
  filter = append(filter, getFilter('requestCounterId', requestCounterId) );
  filter = append(filter, getFilter('_id', id) );
  filter = append(filter, getFilter('provider', provider_id) );
  filter = append(filter, getFilter('state', state) );
  filter = append(filter, getFilter('requested_type', requested_type) );
  filter = append(filter, getFilter('tx_id', tx_id) );
  filter = append(filter, getFilter('refund_tx_id', refund_tx_id) );
  filter = append(filter, getFilter('attach_nota_fiscal_id', attach_nota_fiscal_id) );
  filter = append(filter, getFilter('attach_boleto_pagamento_id', attach_boleto_pagamento_id) );
  filter = append(filter, getFilter('attach_comprobante_id', attach_comprobante_id) );
  filter = append(filter, getFilter('deposit_currency', deposit_currency) );
  filter = append(filter, getFilter('service', service_id) );

  // console.log(' ## graphql-server::requests-query-builder::query:', JSON.stringify(getQuery(filter)));
  return {
    limit:   limit,
    page:    page,
    filter:  getQuery(filter)
  };    
}

exports.serviceQuery = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {account_name, id, serviceCounterId} = args;

  let filter = {
    filter:     {},
    or_filter : []
  };

  filter = append(filter, getFilter('_id', id) );
  filter = append(filter, getFilter('account_name', account_name) );
  filter = append(filter, getFilter('serviceCounterId', serviceCounterId) );

  return {
    limit:   limit,
    page:    page,
    filter:  getQuery(filter)
  };    
}

exports.teamQuery = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {account_name, id, teamCounterId, created_by, member_position, member_wage, member_account_name, member_name} = args;

  let filter = {
    filter:     {},
    or_filter : []
  };
  let populate = null;

  filter = append(filter, getFilter('members.position', member_position) );
  filter = append(filter, getFilter('members.wage', member_wage) );

  // if(member_name)
  // {
  //   populate = {...populate||{}, 
  //     path  : 'members.member',
  //     match : {$or : [getLikeFilter('first_name', member_name), getLikeFilter('last_name', member_name)] }
  //   }
  // }
  // if(account_name)
  // {
  //   populate = {...populate||{}, 
  //     path  : 'members.member',
  //     match : getLikeFilter('account_name', member_account_name)
  //   }
  // }

  filter = append(filter, getFilter('_id', id) );
  filter = append(filter, getFilter('account_name', account_name) );
  filter = append(filter, getFilter('teamCounterId', teamCounterId) );
  filter = append(filter, getFilter('created_by', created_by) );
  
  return {
    limit:   limit,
    page:    page,
    filter:  getQuery(filter),
    populate: populate
  };    
}

exports.providerQuery  = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {search_text, id, name, cnpj, email, category, products_services, state, providerCounterId, bank_name, bank_agency, bank_cc} = args;
  
  let filter = {
    filter:     {},
    or_filter : []
  };

  if(search_text && search_text.trim()!=''){
    filter.or_filter = [getLikeFilter('email', search_text), getLikeFilter('name', search_text)
      , getLikeFilter('cnpj', search_text), getLikeFilter('products', search_text), getLikeFilter('category', search_text)];
  }
  else{
    filter = append(filter, getFilter('_id', id) );
    filter = append(filter, getLikeFilter('name', name) );
    filter = append(filter, getLikeFilter('cnpj', cnpj) );
    filter = append(filter, getLikeFilter('email', email) );
    filter = append(filter, getLikeFilter('category', category) );
    filter = append(filter, getLikeFilter('products_services', products_services) );
    filter = append(filter, getFilter('state', state) );
    filter = append(filter, getFilter('providerCounterId', providerCounterId) );

    filter = append(filter, getLikeFilter('bank_accounts.bank_name', bank_name) );
    filter = append(filter, getLikeFilter('bank_accounts.bank_agency', bank_agency) );
    filter = append(filter, getLikeFilter('bank_accounts.bank_cc', bank_cc) );
  }
  
  return {
    limit:   limit,
    page:    page,
    filter:  getQuery(filter)
  };    
}

exports.iuguQuery = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const { iugu_ids, iugu_id, id, paid_at_from, paid_at_to, business_name, alias, account_name, iuguCounterId, issued_at_from, issued_at_to, issued_tx_id, state, iugu_account, amount, search_text} = args;

  let filter = {
    filter:     {},
    or_filter : []
  };

  if(search_text && search_text.trim()!=''){
    const _search_text = search_text.trim();
    filter.or_filter = [getLikeFilter('iugu_id', _search_text), getLikeFilter('business_name', _search_text), getLikeFilter('receipt_accountname', _search_text), getLikeFilter('receipt_alias', _search_text) ];
  }
  else
  {
    filter = append(filter, getFilter('_id', id) );
    if(iugu_ids)
      filter = append(filter, getFilter('iugu_id', iugu_ids) );
    else
      filter = append(filter, getFilter('iugu_id', iugu_id) );
    filter = append(filter, getFilter('receipt.business_name', business_name) );
    filter = append(filter, getFilter('receipt_accountname', account_name) );
    filter = append(filter, getFilter('receipt_alias', alias) );
    filter = append(filter, getFilter('iuguCounterId', iuguCounterId) );
    filter = append(filter, getFilter('state', state) );
    filter = append(filter, getFilter('iugu_account', iugu_account) );
  
    filter = append(filter, getFilter('amount', amount) );
  
    filter = append(filter, getBetweenFilter('paid_at', paid_at_from, paid_at_to) );
    filter = append(filter, getBetweenFilter('issued_at', issued_at_from, issued_at_to) );
  
    filter = append(filter, getFilter('issued_tx_id', issued_tx_id) );
  }

  return {
    limit:   limit,
    page:    page,
    filter:  getQuery(filter)
  };   
}

exports.iuguLogQuery = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const { id } = args;

  let filter = {
    filter:     {},
    or_filter : []
  };

  filter = append(filter, getFilter('_id', id) );

  return {
    limit:   limit,
    page:    page,
    filter:  getQuery(filter)
  };    
}

exports.txsQuery = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const { tx_id, from_account_name, to_account_name, amount, block_num_max, block_num_min} = args;

  let filter = {
    filter:     {},
    or_filter : []
  };

  filter = append(filter, getFilter('tx_id', tx_id) );
  filter = append(filter, getFilter('from_account_name', from_account_name) );
  filter = append(filter, getFilter('to_account_name', to_account_name) );
  filter = append(filter, getFilter('amount', amount) );

  if(block_num_min&&block_num_min>0)
    filter = append(filter, {'block_num': { $gte: block_num_min } })
  if(block_num_max&&block_num_max>0)
    filter = append(filter, {'block_num': { $lte: block_num_max } })
  
  return {
    limit:   limit,
    page:    page,
    filter:  getQuery(filter)
  };   
}