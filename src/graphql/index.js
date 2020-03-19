const UserModel         = require('../users/models/users.model');
const RequestModel      = require('../requests/models/requests.model');
const IuguModel         = require('../iugu/models/iugu.model');
const IuguLogModel      = require('../iugu_log/models/iugu_log.model');
const ProviderModel     = require('../providers/models/providers.model');
const ServiceModel      = require('../services/models/services.model');
const TeamModel         = require('../teams/models/teams.model');
const ConfigModel       = require('../configuration/models/configuration.model');

const TransactionModel  = require('../transactions/models/transactions.model');

const config            = require('../common/config/env.config.js');

const GoogleDriveHelper = require('../files/helper/googledrive.helper');

var   _                 = require('lodash');
var flatten             = require('flat')

const queryHelper       = require('./query-helper');
// const { buildSchema }          = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');

const moment            = require('moment');

/*
  type JobPosition{
    key:                        String 
    title:                      String 
    wage:                       Float
  }

  jobPositions: [JobPosition]
*/
// GraphQL Types
exports.typeDefs = `
  type Export{
    file_id:             String
    error:               String
  }
  
    
  type TransactionTraceActionAuth{
    actor:              String 
    permission:         String
  }

  type TransactionTraceActionData{
    memo:           String
    quantity:       String
    to:             String
    from:           String
    begins_at:      String
    enabled:        String
    last_charged:   String
    periods:        String
    price:          String
    service_id:     String
    fee:            String
    overdraft:      String
    account_type:   String
    state:          String
  }


  type TransactionTraceAction{
    account:          String
    name:             String
    authorization:    [TransactionTraceActionAuth]
    data:             TransactionTraceActionData
  }

  type TransactionTrace{
    id:                 String
    topLevelActions:    [TransactionTraceAction]
  }
  
  
  type Transaction{
    tx_id:                String
    block_num:            Int
    block_id:             String
    block_timestamp:      String
    trace:                TransactionTrace
    from_account_name:    String
    from:                 User
    to_account_name:      String
    to:                   User
    request:              Request
    amount:               Float
    state:                String
    created_at:           String
    updatedAt:            String
    transactionCounterId: Int
  }

  type AccountConfig{
    account_type:             String
    fee:                      Float
    overdraft:                Float
  }

  type Configuration{
    _id:                        ID!
    created_by:                 User!
    updated_by:                 User
    configurationCounterId:     Int
    father:                     String
    key:                        String
    value:                      String
    amount:                     Float
    account:                    AccountConfig
    bank_account:               BankAccount
    created_at:                 String
    updated_at:                 String   
  }

  type BankAccount{
    _id:                        ID
    bank_name:                  String!
    bank_keycode:               String
    agency:                     String!
    cc:                         String!
  }

  type Address{
    _id:                        ID
    street:                     String
    city:                       String
    state:                      String
    zip:                        String
    country:                    String
  }

  type User {
    _id:                        ID!
    account_name:               String
    alias:                      String
    first_name:                 String
    last_name:                  String
    email:                      String
    legal_id:                   String
    birthday:                   String
    phone:                      String
    address:                    Address
    bank_accounts:              [BankAccount]
    to_sign:                    String
    account_type:               String
    business_name:              String
    created_at:                 String
    updated_at:                 String
    userCounterId:              Int
    balance:                    String
    overdraft:                  String
    fee:                        String
    exists_at_blockchain:       Boolean
    public_key:                 String
  }
  
  type Iugu{
    _id:                        ID!
    amount:                     Float
    iugu_account:               String
    iugu_id:                    String
    paid_at:                    String
    receipt:                    User
    receipt_alias:              String
    receipt_accountname:        String
    original:                   String
    iuguCounterId:              Int
    issued_at:                  String
    issued_tx_id:               String
    error:                      String
    state:                      String
    created_at:                 String
    updated_at:                 String
  }

  type Contract  {
    _id:                        ID!
    customer:                   User 
    customer_account_name:      String
    amount:                     Float
    begins_at:                  String
    expires_at:                 String
  }
  
  type Pad{
    period:                     String   
  }

  type Wage{
    account_name:               String
    member:                     User
    position:                   String
    wage:                       Float
    description:                String
    period:                     String
  }

  type ServiceExtra  {
    begins_at:                  String
    expires_at:                 String
  }

  type Service{
    _id:                        ID!
    created_by:                 User
    account_name:               String
    serviceCounterId:           Int
    title:                      String
    description:                String
    amount:                     Float
    state:                      String
    customers:                  String
    not_answered:               String
    other:                      String
    none:                       String
  }

  type ProviderExtra{
    payment_vehicle:            String
    payment_category:           String
    payment_type:               String
    payment_mode:               String
  }

  type Provider{
    _id:                        ID!
    name:                       String
    cnpj:                       String
    email:                      String
    phone:                      String
    address:                    Address
    category:                   String
    products_services:          String
    created_by:                 User
    updated_by:                 User
    state:                      String
    bank_accounts:              [BankAccount]
    providerCounterId:          Int
  }
  
  type Flag{
    ok:                         Boolean
    message:                    String 
    tag:                        String
  }
  
  type Request{
    _id:                        ID!
    id:                         String
    created_by:                 User
    requested_by:               User
    from:                       String
    requested_type:             String
    amount:                     String
    requested_to:               User
    to:                         String
    state:                      String
    tx_id:                      String
    refund_tx_id:               String
    requestCounterId:           Int
    description:                String
    cancel_reason:              String
    attach_nota_fiscal_id:      String
    attach_boleto_pagamento_id: String
    attach_comprobante_id:      String
    deposit_currency:           String
    bank_account:               BankAccount
    provider:                   Provider
    provider_extra:             ProviderExtra
    service:                    Service
    service_extra:              ServiceExtra
    pad:                        Pad
    wages:                      [Wage]
    iugu:                       Iugu
    created_at:                 String
    updated_at:                 String
    
    header:                     String
    simple_state:               String
    sub_header:                 String
    sub_header_ex:              String
    sub_header_admin:           String
    key:                        String
    block_time:                 String
    quantity:                   String
    quantity_txt:               String
    tx_type:                    String
    i_sent:                     Boolean
    flag:                       Flag
  }

  type Member{
    _id:                        ID!
    member:                     User
    position:                   String
    wage:                       Float
  }
  type Team{
    _id:                        ID!
    created_by:                 User
    account_name:               String
    teamCounterId:              Int
    members:                    [Member]
  }

  type IuguLogInfo{
    count:                     Int
    ids:                       [String]
    logs:                      [String]
  }
  
  type IuguLogQS{
    qs :                       String
  }
  type IuguLog{
    info:                      IuguLogInfo
    error:                     IuguLogInfo
    function_:                 String
    import_:                   IuguLogQS
    description:               String
    created_at:                String
  }
  
  type ServiceState{
    key:                       String
    title:                     String
  }

  type Query {
    users(page:String, limit:String, balance_status:Int, search_text:String, email:String, account_type:String, account_name:String, id:String, alias:String, last_name:String, business_name:String, bank_name:String, bank_agency:String, bank_cc:String, exists_at_blockchain:Boolean ): [User]
    user(id:String, alias:String, email:String, account_name:String):                User
    
    export_users(page:String, limit:String, balance_status:Int, search_text:String, email:String, account_type:String, account_name:String, id:String, alias:String, last_name:String, business_name:String, bank_name:String, bank_agency:String, bank_cc:String ): Export

    maxRequestId:                                   Int
    request(id:String, requestCounterId:Int):    Request
    requests(account_name:String, page:String, limit:String, requested_type:String, from:String, to:String, provider_id:String, state:String, id:String, requestCounterId:Int, tx_id:String, refund_tx_id:String, attach_nota_fiscal_id:String, attach_boleto_pagamento_id:String, attach_comprobante_id:String, deposit_currency:String, date_from:String, date_to:String, service_id:String, wage_filter:String) : [Request]
    extrato(page:String, limit:String, account_name: String, requested_type:String, from:String, to:String, provider_id:String, state:String, date_from:String, date_to:String) : [Request]
    
    export_requests(account_name:String, page:String, limit:String, requested_type:String, from:String, to:String, provider_id:String, state:String, id:String, requestCounterId:Int, tx_id:String, refund_tx_id:String, attach_nota_fiscal_id:String, attach_boleto_pagamento_id:String, attach_comprobante_id:String, deposit_currency:String, date_from:String, date_to:String, service_id:String, wage_filter:String) : Export
    export_extrato(page:String, limit:String, account_name: String, requested_type:String, from:String, to:String, provider_id:String, state:String, date_from:String, date_to:String) : Export

    service(account_name:String, id:String, serviceCounterId:String):                                                 Service
    services(page:String, limit:String, account_name:String, id:String, serviceCounterId:String):                     [Service]
    servicesWithCustomers(page:String, limit:String, account_name:String, id:String, serviceCounterId:String):        [Service]
    serviceStates: [ServiceState]

    team(account_name:String, id:String, teamCounterId:String, created_by:String):                                    Team
    teams(page:String!, limit:String!, account_name:String, id:String, teamCounterId:String, created_by:String, member_position:String, member_wage:Float, member_account_name:String, member_name:String):      [Team]
  
    providers(page:String, limit:String, search_text:String, id:String, name:String, cnpj:String, email:String, category:String, products_services:String, state:String, providerCounterId:String, bank_name:String, bank_agency:String, bank_cc:String ): [Provider]
    provider(id:String, name:String, cnpj:String, email:String, category:String, products_services:String, state:String, providerCounterId:String, bank_name:String, bank_agency:String, bank_cc:String ):                Provider
  
    export_providers(page:String, limit:String, search_text:String, id:String, name:String, cnpj:String, email:String, category:String, products_services:String, state:String, providerCounterId:String, bank_name:String, bank_agency:String, bank_cc:String ): Export
    
    iugu(id:String, iugu_id:String):   Iugu
    iugus(page:String, limit:String, id:String, iugu_id:String, paid_at_from:String, paid_at_to:String, business_name:String, alias:String, account_name:String, iuguCounterId:String, issued_at_from:String, issued_at_to:String, issued_tx_id:String, state:String, iugu_account:String, amount:Float):  [Iugu]
    
    export_iugus(page:String, limit:String, id:String, iugu_id:String, paid_at_from:String, paid_at_to:String, business_name:String, alias:String, account_name:String, iuguCounterId:String, issued_at_from:String, issued_at_to:String, issued_tx_id:String, state:String, iugu_account:String):  Export

    iuguLog(id:String):   IuguLog
    iuguLogs(page:String!, limit:String!, id:String):  [IuguLog]
    
    transactions(page:String, limit:String, tx_id:String, from_account_name:String, to_account_name:String, amount:Float, block_num_max:Int, block_num_min:Int):  [Transaction]
    

    configuration:                   [Configuration]
    configurationItem(id:String):    Configuration
    configurationsJobPositions:      [Configuration]
    configurationsPayVehicles:       [Configuration]
    configurationsPayCategories:     [Configuration]
    configurationsPayTypes:          [Configuration]
    configurationsPayModes:          [Configuration]
    configurationsExternalTxFees:    [Configuration]
    configurationsAccountConfigs:    [Configuration]
    configurationsTransfersReasons:  [Configuration]
    configurationsBanks:             [Configuration]
  }


`;

// GraphQL resolvers
exports.resolvers = {
  Query: {

    /* 
    *  USERS 
    */
    users: async (parent, args, context) => {
      const query = queryHelper.usersQuery(args)
      const res = await UserModel.list(query.limit, query.page, query.filter);
      return res;
    },
    user: async (parent, args, context) => {
      const query = queryHelper.usersQuery(args)
      const res = await UserModel.list(1, 0, query.filter);
      return (Array.isArray(res))?res[0]:res;
    },

    export_users: async (parent, args, context) => {
      const query   = queryHelper.usersQuery(args)
      const _limit  = query.limit + (query.limit*query.page)
      const res     = await UserModel.list(_limit, 0, query.filter);
      return returnSheet(res, context.account_name, 'users') ;  
    },
    /* 
    *  REQUESTS 
    */
    maxRequestId: async (parent, args, context) => {
      const res = await RequestModel.list(1, 0);
      return (Array.isArray(res))?res[0].requestCounterId:res.requestCounterId;
    },
    request: async (parent, args, context) => {
      const query = queryHelper.requestQuery(args)
      let filter = query.filter;
      if(!context.is_admin)
      {
        filter = queryHelper.appendFromToFilter(context.account_name, filter);
      }
      const res = await RequestModel.list(1, 0, filter);
      return (Array.isArray(res))?res[0]:res;
    },
    requests: async (parent, args, context) => {
      const query   = queryHelper.requestQuery(args)
      const res     = await RequestModel.list(query.limit, query.page, query.filter);
      return res;
    },
    
    extrato: async (parent, args, context) => {
      const query   = queryHelper.extratoQuery(context, args)
      const res     = await RequestModel.list(query.limit, query.page, query.filter);
      return res;
    },
    
    export_requests: async (parent, args, context) => {
      const query   = queryHelper.requestQuery(args)
      const _limit  = query.limit + (query.limit*query.page)
      const res     = await RequestModel.list(_limit, 0, query.filter);
      // const res = await RequestModel.list(query.limit, query.page, query.filter);
      return returnSheet(res, context.account_name, 'requests') ;  
    },
    export_extrato: async (parent, args, context) => {
      const query   = queryHelper.extratoQuery(context, args)
      const _limit  = query.limit + (query.limit*query.page)
      const res     = await RequestModel.list(_limit, 0, query.filter);
      // const res = await RequestModel.list(query.limit, query.page, query.filter);
      return returnSheet(res, context.account_name, 'extrato') ;
    },

    /* 
    *  SERVICES 
    */
    service: async (parent, args, context) => {
      const query = queryHelper.serviceQuery(args)
      const res = await ServiceModel.list(1, 0, query.filter);
      return (Array.isArray(res))?res[0]:res;
    },
    services: async (parent, args, context) => {
      const query = queryHelper.serviceQuery(args)
      const res = await ServiceModel.list(query.limit, query.page, query.filter);
      return res;
    },
    servicesWithCustomers: async (parent, args, context) => {
      const query = queryHelper.serviceQuery(args)

      // SOURCE: https://stackoverflow.com/questions/36459983/aggregation-filter-after-lookup
      const res = await ServiceModel.model.aggregate([
        { $match: { account_name: args.account_name || context.account_name } }
        , { $lookup: {
               from:           'requests',
               localField:     '_id',
               foreignField:   'service',
               as:             'customers'
            }
          }
        , { $unwind: { path: '$customers', preserveNullAndEmptyArrays: true } }
        // , { $match:  { 'customers.requested_type' : RequestModel.TYPE_SERVICE } }
        , { 
            $match: { 
              $expr: { 
                $and: [
                  { $eq: [
                    {$ifNull: ['$customers.requested_type', RequestModel.TYPE_SERVICE]},
                    RequestModel.TYPE_SERVICE
                  ]}, 
                  
                ]
              } 
            } 
          }
        , { $group: {
              _id:                "$_id"
              , customers: {
                "$sum": { $cond: { if:   { $eq : [ '$customers.state', RequestModel.STATE_ACCEPTED ] }, then: 1, else: 0 } }
              }
              , not_answered: {
                "$sum": { $cond: { if:   { $eq : [ '$customers.state', RequestModel.STATE_REQUESTED ] }, then: 1, else: 0 } }
              }
              , other: {
                "$sum": { $cond: { if:   { $ne : [ '$customers.state', RequestModel.STATE_ACCEPTED], 
                                           $ne : [ '$customers.state', RequestModel.STATE_REQUESTED]  }, then: 1, else: 0 } }
              }
              , none: {
                "$sum": { $cond: { if:   { $eq : [ '$customers.state', null] }, then: 1, else: 0 } }
              }
              , created_by:                  { $first : "$created_by"}
              // , created_by:   { _id:              {$first : "$created_by._id"}
              //                   , account_name:   {$first : "$created_by.account_name"}
              //                   , business_name:  {$first : "$created_by.business_name"} }
              , account_name:                { $first : "$account_name"}         
              , serviceCounterId:            { $first : "$serviceCounterId"}         
              , title:                       { $first : "$title"}         
              , description:                 { $first : "$description"}         
              , amount:                      { $first : "$amount"}         
              , state:                       { $first : "$state"}         
          }
        }
        , { $sort: { title : 1} }
        , { $limit : query.limit}
        , { $skip  : (query.limit * query.page) }
        
      ])

      // return res;
      return await UserModel.model.populate( res, {path: 'created_by'});
    },
    serviceStates: async (parent, args, context) => {
      return ServiceModel.services_states;
    },

    /*
    *  TEAMS
    */
    team: async (parent, args, context) => {
      const query   = queryHelper.teamQuery(args)
      const res     = await TeamModel.list(1, 0, query.filter, query.populate);
      return (Array.isArray(res))?res[0]:res;    
    },
    teams: async (parent, args, context) => {
      const query   = queryHelper.teamQuery(args)
      const res     = await TeamModel.list(query.limit, query.page, query.filter, query.populate);
      return res;
    },
    // jobPositions: async (parent, args, context) => {
    //   return TeamModel.job_positions;
    // },
    
    /* 
    *  PROVIDER 
    */
    provider: async (parent, args, context) => {
      const query   = queryHelper.providerQuery(args)
      const res     = await ProviderModel.list(1, 0, query.filter);
      return (Array.isArray(res))?res[0]:res;
    },
    providers: async (parent, args, context) => {
      const query   = queryHelper.providerQuery(args)
      const res     = await ProviderModel.list(query.limit, query.page, query.filter);
      return res;
    },
    export_providers: async (parent, args, context) => {
      const query   = queryHelper.providerQuery(args)
      const _limit  = query.limit + (query.limit*query.page)
      const res     = await ProviderModel.list(_limit, 0, query.filter);
      // const res     = await ProviderModel.list(query.limit, query.page, query.filter);
      return returnSheet(res, context.account_name, 'providers') ;  
    },
    /* 
    *  IUGU 
    */
    iugu: async (parent, args, context) => {
      const query   = queryHelper.iuguQuery(args)
      const res     = await IuguModel.list(1, 0, query.filter);
      const __res   = res.map( item => {
        item.original = JSON.stringify(item.original);
        return item;
      })
      return (Array.isArray(__res))?__res[0]:__res;
    },
    iugus: async (parent, args, context) => {
      const query   = queryHelper.iuguQuery(args)
      const res     = await IuguModel.list(query.limit, query.page, query.filter);
      return res.map( item => {
        item.original = JSON.stringify(item.original);
        return item;
      });
    },

    export_iugus: async (parent, args, context) => {
      const query   = queryHelper.iuguQuery(args)
      const _limit  = query.limit + (query.limit*query.page)
      const res     = await IuguModel.list(_limit, 0, query.filter);
      const the_res = res.map( item => {
        item.original = JSON.stringify(item.original);
        return item;
      });
      return returnSheet(the_res, context.account_name, 'iugus') ;  
    },
    
    iuguLog: async (parent, args, context) => {
      const query   = queryHelper.iuguLogQuery(args)
      const res     = await IuguLogModel.list(1, 0, query.filter);
      return (Array.isArray(res))?res[0]:res;
    },
    iuguLogs: async (parent, args, context) => {
      const query   = queryHelper.iuguLogQuery(args)
      const res     = await IuguLogModel.list(1, 0, query.filter);
      return (Array.isArray(res))?res[0]:res;
    },

    transactions: async (parent, args, context) => {
      const query  = queryHelper.txsQuery(args);
      const res    = await TransactionModel.list(query.limit, query.page, query.filter);
      return (Array.isArray(res))?res:[res];
    },

    /*
    * CONFIGURATION
    */

    configuration: async(parent, args, context) =>
    {
      const res = ConfigModel.getAll();
      return res;
    }, 
    configurationItem: async(parent, args, context) =>
    {
      const res = await ConfigModel.getById(args.id);
      return res;
      
    },
    configurationsJobPositions: async(parent, args, context) =>
    {
      const res = await ConfigModel.getJobPositions();
      return res; 
    }, 
    configurationsPayVehicles: async(parent, args, context) =>
    {
      const res = await ConfigModel.getPayVehicles();
      return res; 
    } ,
    configurationsPayCategories: async(parent, args, context) =>
    {
      const res = await ConfigModel.getPayCategory();
      return res; 
    } ,
    configurationsPayTypes: async(parent, args, context) =>
    {
      const res = await ConfigModel.getPayType();
      return res; 
    } ,
    configurationsPayModes: async(parent, args, context) =>
    {
      const res = await ConfigModel.getPayMode();
      return res; 
    } ,
    configurationsExternalTxFees: async(parent, args, context) =>
    {
      const res = await ConfigModel.getExternalTxFee();
      return res; 
    } ,
    configurationsTransfersReasons: async(parent, args, context) =>
    {
      const res = await ConfigModel.getTransfersReasons();
      return res; 
    } ,
    configurationsAccountConfigs: async(parent, args, context) =>
    {
      const res = await ConfigModel.getAccountConfig();
      return res; 
    },
    configurationsBanks: async(parent, args, context) =>
    {
      const res = await ConfigModel.getBanks();
      return res; 
    } , 

  },
};


const _flatten = function(data) {
    var result = {};
    const excluded_props = ['id', '_id']
    function recurse (cur, prop) {
      if(!excluded_props.includes(prop) && (prop.indexOf('.id')<0) && (prop.indexOf('._id')<0) && typeof cur !== 'function' && typeof prop !== 'function')
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
             for(var i=0, l=cur.length; i<l; i++)
                 recurse(cur[i], prop + "[" + i + "]");
            if (l == 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop+"."+p : p);
            }
            if (isEmpty && prop)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
}

const returnSheet = async (json, account_name, path) => {
  const my_account_name = account_name || config.eos.bank.account;
  const file_name = `${moment().format('YYYY-MM-DD_HH-mm-ss')}.${path}.${my_account_name}`;
  
  if(!json || !Array.isArray(json) || json.length==0)
    return {file_id:'', error:'NO RESULTS FOR QUERY'};

  let content = [];
  let header  = [];
  let values  = [];

  // header  = Object.keys(flatten(json[0])) ;
  const flattened_elements  = json.map(element => 
    {
      let cloned = Object.assign({}, element);
      
      const _id  = cloned._id.toHexString();
      delete cloned._id
      delete cloned.id
      delete cloned.created_by
      cloned.idx = _id;

      // console.log('******** _flatten(element) : ')
      return _flatten(element);
      // return Object.values(flatten(element)).map(val=> val?val.toString():'' )
    }
  )

  header = flattened_elements.map(element => Object.keys(element)).reduce((acc, fields) => _.union(acc, fields), []);

  // console.log(header);

  const getValue = (element, value) => {
    // if(element[value]!== null && element[value]!== undefined)
    if(typeof element[value] === 'string' || typeof element[value] === 'number')
    {
      return element[value];
    }
    return ''
  }
  values = flattened_elements.map(element => {
      return Object.values( header.reduce((acc, field) => {acc[field] = getValue(element, field); return acc}, {}) );
  })
  content = [header, ...values]
  // console.log(content);

  const response = await GoogleDriveHelper.createSheet(content, file_name, my_account_name);
  if(response.error)
  {
    // console.log('--------------ERROR:', response.error)
    return {file_id:'', error: JSON.stringify(response.error)};
  }
  // console.log('----------------------spreadsheetId:', response.spreadsheetId)
  return {file_id:response.spreadsheetId, error:''};
}

// Define a schema
exports.schema = makeExecutableSchema({
  typeDefs: exports.typeDefs,
  resolvers: exports.resolvers
});


