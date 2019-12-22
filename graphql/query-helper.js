
/*
* Operators
* $lt:, $lte: 
* $gt:, $gte:
*/

const makeFilter = (name, value, filter) => {
  
  if(!value || !name)
    return filter;
  
  if(typeof value === 'number')
    return {...filter, [name]: value};

  if (!value.includes(','))
    return {...filter, [name]: value};
  
  if (value.includes(',')) 
    return {...filter,  $or : value.split(',').map(req_item=> {return { [name]: req_item}}) };
  
  return filter;
}

const getLikeFilter = (name, value) => {
  return {[name]: {$regex: '.*' + value + '.*'}}
}

const makeLikeFilter = (name, value, filter) => {
  
  if(!value || !name)
    return filter;
  
  return {...filter, ...getLikeFilter(name, value)}
}

const makeCollectionFilter = (col, name, value, filter, isLike) => {
  
  if(!value || !name || !col)
    return filter;
  
  let _filter = {[name]: value};
  if(isLike) 
    _filter = {[name]: {$regex: '.*' + value + '.*'}};
  
  return {...filter, [col]: {$all: _filter}} 
}


exports.usersQuery  = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {email, account_type, account_name, id, alias, last_name, business_name, bank_name, bank_agency, bank_cc} = args;

  let filter = {};

  filter = makeLikeFilter('email', email, filter)
  filter = makeFilter('account_type', account_type, filter)
  filter = makeLikeFilter('account_name', account_name, filter)
  filter = makeFilter('_id', id, filter)
  filter = makeLikeFilter('alias', alias, filter)
  filter = makeFilter('last_name', last_name, filter)
  filter = makeLikeFilter('business_name', business_name, filter)
  filter = makeLikeFilter('bank_accounts.bank_name', bank_name, filter)
  filter = makeLikeFilter('bank_accounts.bank_agency', bank_agency, filter)
  filter = makeLikeFilter('bank_accounts.bank_cc', bank_cc, filter)
  // filter = makeCollectionFilter('bank_accounts', 'bank_name', bank_name, filter, true);
  // filter = makeCollectionFilter('bank_accounts', 'bank_agency', bank_agency, filter, true);
  // filter = makeCollectionFilter('bank_accounts', 'bank_cc', bank_cc, filter, true);

  return {
    limit:   limit,
    page:    page,
    filter:  filter
  };    
}


exports.requestQuery = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {requested_type, from, to, provider_id, state, id, requestCounterId} = args;

  let filter = {};

  if (from&&to) {
    filter = { $or : [{from: from}, {to: to}] };
  }
  else
  {
    filter = makeFilter('from', from, filter)
    filter = makeFilter('to', to, filter)
  }

  filter = makeFilter('requestCounterId', requestCounterId, filter)
  filter = makeFilter('_id', id, filter)
  filter = makeFilter('provider', provider_id, filter)
  filter = makeFilter('state', state, filter)
  filter = makeFilter('requested_type', requested_type, filter)
  return {
    limit:   limit,
    page:    page,
    filter:  filter
  };    
}

exports.serviceQuery = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {account_name, id, serviceCounterId} = args;

  let filter = {};

  filter = makeFilter('_id', id, filter)
  filter = makeFilter('account_name', account_name, filter)
  filter = makeFilter('serviceCounterId', serviceCounterId, filter)
  return {
    limit:   limit,
    page:    page,
    filter:  filter
  };    
}

exports.teamQuery = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {account_name, id, teamCounterId, created_by, member_position, member_wage, member_account_name, member_name} = args;

  let filter   = {};
  let populate = null;

  filter = makeFilter('members.position', member_position, filter);
  filter = makeFilter('members.wage', member_wage, filter);

  // filter = makeLikeFilter('members.member.account_name', member_account_name, filter);
  if(member_name)
  {
    populate = {...populate||{}, 
      path  : 'members.member',
      match : {$or : [getLikeFilter('first_name', member_name), getLikeFilter('last_name', member_name)] }
    }
  }
  if(account_name)
  {
    populate = {...populate||{}, 
      path  : 'members.member',
      match : getLikeFilter('account_name', member_account_name)
    }
  }

  filter = makeFilter('_id', id, filter)
  filter = makeFilter('account_name', account_name, filter)
  filter = makeFilter('teamCounterId', teamCounterId, filter)
  filter = makeFilter('created_by', created_by, filter)
  return {
    limit:    limit,
    page:     page,
    filter:   filter,
    populate: populate
  };    
}

exports.providerQuery  = (args) => {
  const page  = args.page ? parseInt(args.page) : 0;
  const limit = args.limit ? parseInt(args.limit) : 100;
  const {id, name, cnpj, email, category, products_services, state, providerCounterId, bank_name, bank_agency, bank_cc} = args;
         

  let filter = {};

  filter = makeFilter('_id', id, filter)
  filter = makeLikeFilter('name', name, filter)
  filter = makeLikeFilter('cnpj', cnpj, filter)
  filter = makeLikeFilter('email', email, filter)
  filter = makeLikeFilter('category', category, filter)
  filter = makeLikeFilter('products_services', products_services, filter)
  filter = makeFilter('state', state, filter)
  filter = makeFilter('providerCounterId', providerCounterId, filter)

  // filter = makeCollectionFilter('bank_accounts', 'bank_name', bank_name, filter, true);
  // filter = makeCollectionFilter('bank_accounts', 'bank_agency', bank_agency, filter, true);
  // filter = makeCollectionFilter('bank_accounts', 'bank_cc', bank_cc, filter, true);

  filter = makeLikeFilter('bank_accounts.bank_name', bank_name, filter)
  filter = makeLikeFilter('bank_accounts.bank_agency', bank_agency, filter)
  filter = makeLikeFilter('bank_accounts.bank_cc', bank_cc, filter)
  
  return {
    limit:   limit,
    page:    page,
    filter:  filter
  };    
}
