const UserModel     = require('../users/models/users.model');
const RequestModel  = require('../requests/models/requests.model');
const IuguModel     = require('../iugu/models/iugu.model');
const IuguLogModel  = require('../iugu_log/models/iugu_log.model');
const ProviderModel = require('../providers/models/providers.model');
const ServiceModel  = require('../services/models/services.model');
const TeamModel     = require('../teams/models/teams.model');
const ConfigModel   = require('../configuration/models/configuration.model');

const queryHelper   = require('./query-helper');
// const { buildSchema }          = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');

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
    account_name:               String!
    alias:                      String
    first_name:                 String
    last_name:                  String
    email:                      String!
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
  }
  
  type Contract  {
    _id:                        ID!
    customer:                   User 
    customer_account_name:      String
    amount:                     Float
    begins_at:                  String
    expires_at:                 String
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

  type Request{
    _id:                        ID!
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
    attach_nota_fiscal_id:      String
    attach_boleto_pagamento_id: String
    attach_comprobante_id:      String
    deposit_currency:           String
    bank_account:               BankAccount
    provider:                   Provider
    provider_extra:             ProviderExtra
    service:                    Service
    service_extra:              ServiceExtra
    created_at:                 String
    updated_at:                 String

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

  type Iugu{
    _id:                        ID!
    amount:                     Float
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
    users(page:String!, limit:String!, email:String, account_type:String, account_name:String, id:String, alias:String, last_name:String, business_name:String, bank_name:String, bank_agency:String, bank_cc:String ): [User]
    user(id:String, alias:String, email:String, account_name:String):                User
  
    maxRequestId:                                   Int
    request(id:String, requestCounterId:String):    Request
    requests(page:String!, limit:String!, requested_type:String, from:String, to:String, provider_id:String, state:String, id:String, requestCounterId:String, tx_id:String, refund_tx_id:String, attach_nota_fiscal_id:String, attach_boleto_pagamento_id:String, attach_comprobante_id:String, deposit_currency:String) : [Request]
    
    service(account_name:String, id:String, serviceCounterId:String):                                    Service
    services(page:String!, limit:String!, account_name:String, id:String, serviceCounterId:String):      [Service]

    serviceStates: [ServiceState]

    team(account_name:String, id:String, teamCounterId:String, created_by:String):                                    Team
    teams(page:String!, limit:String!, account_name:String, id:String, teamCounterId:String, created_by:String, member_position:String, member_wage:Float, member_account_name:String, member_name:String):      [Team]
  
    providers(page:String!, limit:String!, id:String, name:String, cnpj:String, email:String, category:String, products_services:String, state:String, providerCounterId:String, bank_name:String, bank_agency:String, bank_cc:String ): [Provider]
    provider(id:String, name:String, cnpj:String, email:String, category:String, products_services:String, state:String, providerCounterId:String, bank_name:String, bank_agency:String, bank_cc:String ):                Provider

    iugu(id:String, iugu_id:String):   Iugu
    iugus(page:String!, limit:String!, id:String, iugu_id:String, paid_at_from:String, paid_at_to:String, business_name:String, alias:String, account_name:String, iuguCounterId:String, issued_at_from:String, issued_at_to:String, issued_tx_id:String, state:String):  [Iugu]
    
    iuguLog(id:String):   IuguLog
    iuguLogs(page:String!, limit:String!, id:String):  [IuguLog]
    
    configuration:                   [Configuration]
    configurationItem(id:String):    Configuration
    configurationsJobPositions:      [Configuration]
    configurationsPayVehicles:       [Configuration]
    configurationsPayCategories:     [Configuration]
    configurationsPayTypes:          [Configuration]
    configurationsPayModes:          [Configuration]
    configurationsExternalTxFees:    [Configuration]
    configurationsAccountConfigs:    [Configuration]

  }


`;

// GraphQL resolvers
exports.resolvers = {
  Query: {

    /* 
    *  USERS 
    */
    users: async (_, args) => {
      const query = queryHelper.usersQuery(args)
      const res = await UserModel.list(query.limit, query.page, query.filter);
      return res;
    },
    user: async (_, args) => {
      const query = queryHelper.usersQuery(args)
      const res = await UserModel.list(1, 0, query.filter);
      return (Array.isArray(res))?res[0]:res;
    },


    /* 
    *  REQUESTS 
    */
    request: async (_, args) => {
      const query = queryHelper.requestQuery(args)
      const res = await RequestModel.list(1, 0, query.filter);
      return (Array.isArray(res))?res[0]:res;
    },
    requests: async (_, args) => {
      const query = queryHelper.requestQuery(args)
      const res = await RequestModel.list(query.limit, query.page, query.filter);
      return res;
    },
    maxRequestId: async (_, args) => {
      const res = await RequestModel.list(1, 0);
      return (Array.isArray(res))?res[0].requestCounterId:res.requestCounterId;
    },

    /* 
    *  SERVICES 
    */
    service: async (_, args) => {
      const query = queryHelper.serviceQuery(args)
      const res = await ServiceModel.list(1, 0, query.filter);
      return (Array.isArray(res))?res[0]:res;
    },
    services: async (_, args) => {
      const query = queryHelper.serviceQuery(args)
      const res = await ServiceModel.list(query.limit, query.page, query.filter);
      return res;
    },
    serviceStates: async (_, args) => {
      return ServiceModel.services_states;
    },

    /*
    *  TEAMS
    */
    team: async (_, args) => {
      const query = queryHelper.teamQuery(args)
      const res = await TeamModel.list(1, 0, query.filter, query.populate);
      return (Array.isArray(res))?res[0]:res;    
    },
    teams: async (_, args) => {
      const query = queryHelper.teamQuery(args)
      const res = await TeamModel.list(query.limit, query.page, query.filter, query.populate);
      return res;
    },
    // jobPositions: async (_, args) => {
    //   return TeamModel.job_positions;
    // },
    
    /* 
    *  PROVIDER 
    */
    providers: async (_, args) => {
      const query = queryHelper.providerQuery(args)
      const res = await ProviderModel.list(query.limit, query.page, query.filter);
      return res;
    },
    provider: async (_, args) => {
      const query = queryHelper.providerQuery(args)
      const res = await ProviderModel.list(1, 0, query.filter);
      return (Array.isArray(res))?res[0]:res;
    },

    /* 
    *  IUGU 
    */
    iugu: async (_, args) => {
      const query = queryHelper.iuguQuery(args)
      const res = await IuguModel.list(1, 0, query.filter);
      return (Array.isArray(res))?res[0]:res;
    },
    iugus: async (_, args) => {
      const query = queryHelper.iuguQuery(args)
      const res = await IuguModel.list(query.limit, query.page, query.filter);
      return res;
    },
    iuguLog: async (_, args) => {
      const query = queryHelper.iuguLogQuery(args)
      const res = await IuguLogModel.list(1, 0, query.filter);
      return (Array.isArray(res))?res[0]:res;
    },
    iuguLogs: async (_, args) => {
      const query = queryHelper.iuguLogQuery(args)
      const res = await IuguLogModel.list(1, 0, query.filter);
      return (Array.isArray(res))?res[0]:res;
    },

    /*
    * CONFIGURATION
    */

    configuration: async(_, args) =>
    {
      const rest = ConfigModel.getAll();
      return res;
    }, 
    configurationItem: async(_, args) =>
    {
      const res = await ConfigModel.getById(args.id);
      return res;
      
    },
    configurationsJobPositions: async(_, args) =>
    {
      const res = await ConfigModel.getJobPositions();
      return res; 
    }, 
    configurationsPayVehicles: async(_, args) =>
    {
      const res = await ConfigModel.getPayVehicles();
      return res; 
    } ,
    configurationsPayCategories: async(_, args) =>
    {
      const res = await ConfigModel.getPayCategory();
      return res; 
    } ,
    configurationsPayTypes: async(_, args) =>
    {
      const res = await ConfigModel.getPayType();
      return res; 
    } ,
    configurationsPayModes: async(_, args) =>
    {
      const res = await ConfigModel.getPayMode();
      return res; 
    } ,
    configurationsExternalTxFees: async(_, args) =>
    {
      const res = await ConfigModel.getExternalTxFee();
      return res; 
    } ,
    configurationsAccountConfigs: async(_, args) =>
    {
      const res = await ConfigModel.getAccountCconfig();
      return res; 
    } 

  },
};

// Define a schema
exports.schema = makeExecutableSchema({
  typeDefs: exports.typeDefs,
  resolvers: exports.resolvers
});

/*
query getTodo($account_id : String!) {

 userById(id:$account_id) {
    _id 
    account_name
    alias
    address{
      _id
      street
    }
    bank_accounts{
      _id
      bank_name
    }
  
  }
}
{"account_id":     "5de02d0400115e187dbd043d"}
*/