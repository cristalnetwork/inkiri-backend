var env_config         = null;
try {
  // env_config             = require('./env.cristaltoken.config.js');
  env_config             = require('./env.labis.config.js');
} catch (ex) {
  console.log(' ************* Loading env.cristaltoken.config ERROR:', JSON.stringify(ex))
}

const PROD_ENV           = "prod";
const DEV_ENV            = "dev";

const EOS_TESTNET        = 'eos_testnet';
const TELOS_TESTNET      = 'telos_testnet';
const TELOS_MAINNET      = 'telos_mainnet';
const LOCAL_TESTNET      = 'local_testnet';

const env                = PROD_ENV;
const BLOCKCHAIN_NETWORK = EOS_TESTNET;
// const BLOCKCHAIN_NETWORK = TELOS_MAINNET;

const eosio_net = {
  [EOS_TESTNET]:  {
    endpoint                  : 'https://jungle2.cryptolions.io:443',
    // history_endpoint          : 'https://junglehistory.cryptolions.io/', 
    history_endpoint          : 'https://jungle.eossweden.org',
    info                      : 'EOS TESTNET',
    currency_symbol           : 'EOS',

  },
  [TELOS_TESTNET]: {
    endpoint                  : 'https://testnet.telosusa.io',
    history_endpoint          : 'https://testnet.telosusa.io',
    info                      : 'TELOS TESTNET',
    currency_symbol           : 'TLOS'
  },
  [TELOS_MAINNET]: {
    endpoint                  : 'https://telos.caleos.io',
    history_endpoint          : 'https://telos.caleos.io',
    // 'https://telos.eoscafeblock.com',
    // 'https://mainnet.telosusa.io',
    info                      : 'TELOS MAINNET',
    currency_symbol           : 'TLOS'
  },
  [LOCAL_TESTNET]:  {
    endpoint                  : 'http://localhost:8888',
    history_endpoint          : 'http://localhost:8080',
    info                      : 'EOS Local Single-Node Testnet',
    currency_symbol           : 'EOS',
  },
}

const contract_account = 'labisteste21';
// const contract_account = 'cristaltoken';

let the_config = {
    "environment":                     env
    , "api_version":                     "/api/v1"
    , "port":                            3600
    , "jwt_secret":                      "myS33!!creeeT"
    , "jwt_expiration_in_seconds":       2592000
    , "email_domain":                    "inkiri.com"
    
    , "cron" :{
      "mode":                          "auto", // "manual"
      "log":                           false
    }
    , "mongo" : {
      "useUnifiedTopology":            false,
      "connection_uri":                "mongodb://localhost/cristal_ddbb?replicaSet=rs",
    },
    
    "eos" : {
        "history_provider":            "hyperion", //"dfuse"
        "token": {
            "contract":                contract_account,
            "account":                 contract_account,
            "code":                    "INK"
        },
        "bank": {
            "contract":                contract_account,
            "account":                 contract_account,
            "issuer":                  contract_account,
            "table_balances":          "accounts",
            "table_customers":         "customer",
            "table_customers_action":  "upsertcust",
            "table_customers_delete":  "erasecust",
            "table_paps":              "pap",
            "table_paps_action":       "upsertpap",
            "table_paps_delete":       "erasepap",
            "table_paps_charge":       "chargepap"
        },
        "dfuse" : {
          "api_key"                   : 'web_8a50f2bc42c1df1a41830c359ba74240',
          "network"                   : 'jungle',
          "auth_url"                  : 'https://auth.dfuse.io/v1/auth/issue',
          "base_url"                  : 'https://jungle.eos.dfuse.io',
          "chain_id"                  : 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473',
          "websocket_url"             : 'wss://jungle.eos.dfuse.io/v1/stream',
          "default_page_size"         : 25,
        },

    },
    
    "google":{
        "root_folder_id":        "1rMKCZUv5KHXv4pfL-Mhx492L2Qkb32d7" // tuti
        // "root_folder_id"              : process.env.GDRIVE_FOLDER_ID || ""
    },
    
    "firebase":
    {
      "sender_id"                     : ""
      , "server_key"                  : ""
    },
    
    "iugu":
    {
      "api":{
          "endpoint"                  : "https://api.iugu.com/v1"
      },
      "date_format"                   : "YYYY-MM-DDTHH:mm:ss-03:00"
    }
};

the_config.eos      = {...the_config.eos, ...eosio_net[BLOCKCHAIN_NETWORK]}
const _local_config = (env_config)
                       ? env_config 
                       : the_config;

let iugu_config = {};
if(process.env.IUGU_INSTITUTO_TOKEN || process.env.IUGU_EMPRESA_TOKEN || process.env.IUGU_ISSUER_PRIVATE_KEY)
{
  iugu_config = {
    "iugu":{
      "accounts": [
        // {
        //   "key"     :   "INSTITUTO"
        //   , "token" :   process.env.IUGU_INSTITUTO_TOKEN
        // },
        // {
        //   "key"     :   "EMPRESA"
        //   , "token" :   process.env.IUGU_EMPRESA_TOKEN
        // }
      ]
      , "issuer_key":   process.env.IUGU_ISSUER_PRIVATE_KEY
      , "date_format":  "YYYY-MM-DDTHH:mm:ss-03:00"
      , "api":{
          "endpoint"    : "https://api.iugu.com/v1"
      }
    }
  }
}


const exports_config = {...the_config, ...(_local_config||{}), ...(iugu_config||{}) };
// console.log(exports_config.google)
module.exports       = exports_config;