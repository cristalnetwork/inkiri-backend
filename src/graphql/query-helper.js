var moment          = require('moment');

/*
* Operators
* $lt:, $lte: 
* $gt:, $gte:
*/

const getFilter = (name, value) => {
  
  if(!value || !name)
    return {};
  
  if(typeof value === 'number' || !isNaN(value))
    return {[name]: Number(value)};

  if (!value.includes(','))
  return {[name]: value};
  
  if (value.includes(',')) 
    return value.split(',').map(req_item=> {return { [name]: req_item}})
  
  return {};
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
  return {[name]: {$regex: '.*' + value + '.*'}}
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
  const {email, account_type, account_name, id, alias, last_name, business_name, bank_name, bank_agency, bank_cc} = args;

  let filter = {
    filter:     {},
    or_filter : []
  };

  filter = append(filter, getLikeFilter('email', email) );
  filter = append(filter, getFilter('account_type', account_type) );
  filter = append(filter, getLikeFilter('account_name', account_name) );
  filter = append(filter, getFilter('_id', id) );
  filter = append(filter, getLikeFilter('alias', alias) );
  filter = append(filter, getFilter('last_name', last_name) );
  filter = append(filter, getLikeFilter('business_name', business_name) );
  filter = append(filter, getLikeFilter('bank_accounts.bank_name', bank_name) );
  filter = append(filter, getLikeFilter('bank_accounts.bank_agency', bank_agency) );
  filter = append(filter, getLikeFilter('bank_accounts.bank_cc', bank_cc) );
  
  const the_filter = {...filter.filter, $or: filter.or_filter};
  return {
    limit:   limit,
    page:    page,
    filter:  the_filter
  };    
}

exports.requestQuery = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {requested_type, from, to, provider_id, state, id, requestCounterId, tx_id, refund_tx_id, attach_nota_fiscal_id, attach_boleto_pagamento_id, attach_comprobante_id, deposit_currency, date_from, date_to, service_id, wage_filter} = args;

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

  const the_filter = {...filter.filter, $or: filter.or_filter};
  console.log(' ## graphql-server::requests-query-builder::query:', JSON.stringify(the_filter));
  return {
    limit:   limit,
    page:    page,
    filter:  the_filter
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

  const the_filter = {...filter.filter, $or: filter.or_filter};
  return {
    limit:   limit,
    page:    page,
    filter:  the_filter
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
  
  const the_filter = {...filter.filter, $or: filter.or_filter};
  return {
    limit:   limit,
    page:    page,
    filter:  the_filter,
    populate: populate
  };    
}

exports.providerQuery  = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {id, name, cnpj, email, category, products_services, state, providerCounterId, bank_name, bank_agency, bank_cc} = args;
  
  let filter = {
    filter:     {},
    or_filter : []
  };

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
  
  return {
    limit:   limit,
    page:    page,
    filter:  filter
  };    
}

exports.iuguQuery = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const { iugu_id, id, paid_at_from, paid_at_to, business_name, alias, account_name, iuguCounterId, issued_at_from, issued_at_to, issued_tx_id, state} = args;

  let filter = {
    filter:     {},
    or_filter : []
  };

  filter = append(filter, getFilter('_id', id) );
  filter = append(filter, getFilter('iugu_id', iugu_id) );
  filter = append(filter, getFilter('receipt.business_name', business_name) );
  filter = append(filter, getFilter('receipt_accountname', account_name) );
  filter = append(filter, getFilter('receipt_alias', alias) );
  filter = append(filter, getFilter('iuguCounterId', iuguCounterId) );
  filter = append(filter, getFilter('state', state) );

  filter = append(filter, getBetweenFilter('paid_at', paid_at_from, paid_at_to) );
  filter = append(filter, getBetweenFilter('issued_at', issued_at_from, issued_at_to) );

  filter = append(filter, getFilter('issued_tx_id', issued_tx_id) );

  const the_filter = {...filter.filter, $or: filter.or_filter};
  return {
    limit:   limit,
    page:    page,
    filter:  the_filter,
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

  const the_filter = {...filter.filter, $or: filter.or_filter};
  return {
    limit:   limit,
    page:    page,
    filter:  the_filter,
  };    
}