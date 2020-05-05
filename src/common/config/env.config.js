var local_prod_config         = null;
var local_dev_config          = null;

try {
  local_prod_config         = require('./env.cristaltoken.config.js');
} catch (ex) {
  console.log(' ************* Loading env.cristaltoken.config ERROR:', JSON.stringify(ex))
}

try {
  local_dev_config          = require('./env.cristaltoken.config.js');
  // local_dev_config          = require('./env.test.config.js');
} catch (ex) {
  console.log(' ************* Loading env.test.config ERROR:', JSON.stringify(ex))
}

const PROD_ENV  = "prod";
const DEV_ENV   = "dev";

let the_config = {
    "environment":                     PROD_ENV,
    
    "api_version":                     "/api/v1",
    "port":                            3600,
    "jwt_secret":                      "myS33!!creeeT",
    "jwt_expiration_in_seconds":       2592000,
    "email_domain":                    "inkiri.com",
    "mongo" : {
      "useUnifiedTopology":            false,
      "connection_uri":                "mongodb://localhost/cristal_dfuse?replicaSet=rs",
    },
    "eos" : {
        "history_provider":            "hyperion",
        "blockchain_currency_symbol":  "TLOS",
        "blockchain_endpoint_prod":    "https://telos.caleos.io",
        // "blockchain_endpoint_prod":    "https://mainnet.telosusa.io",
        // "blockchain_endpoint_prod":    "https://telos.eoscafeblock.com",
        "blockchain_endpoint_dev":     "https://testnet.telosusa.io",

        "token": {
            "contract":                "cristaltoken",
            "account":                 "cristaltoken",
            "code":                    "INK"
        },
        "bank": {
            "contract":                "cristaltoken",
            "account":                 "cristaltoken",
            "issuer":                  "cristaltoken",
            "table_balances":          "accounts",
            "table_customers":         "customer",
            "table_customers_action":  "upsertcust",
            "table_customers_delete":  "erasecust",
            "table_paps":              "pap",
            "table_paps_action":       "upsertpap",
            "table_paps_delete":       "erasepap",
            "table_paps_charge":       "chargepap"
        },
        "hyperion" :{
          // "history_endpoint_prod" :        "http://mainnet.telosusa.io",
          "history_endpoint_prod":      "https://telos.caleos.io", 
          // "history_endpoint_prod":      "https://telos.eoscafeblock.com", 
          // "history_endpoint_prod":      "https://node1.us-east.telosglobal.io:8899", 
          "history_endpoint_dev" :      "https://testnet.telosusa.io"
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
        // "root_folder_id":        "1rMKCZUv5KHXv4pfL-Mhx492L2Qkb32d7" // tuti
        "root_folder_id":             "1GErXOWh7WsTCRRG03qIhZRfKj34lPuTP" // inkiri
    },
    "iugu":
    {
      "api":{
          "endpoint":               "https://api.iugu.com/v1"
      },
      "date_format" : 'YYYY-MM-DDTHH:mm:ss-03:00'
    }
};

the_config.eos.blockchain_endpoint       = the_config.eos['blockchain_endpoint_'+the_config.environment];
the_config.eos.hyperion.history_endpoint = the_config.eos.hyperion['history_endpoint_'+the_config.environment];

const _local_config = (the_config.environment == PROD_ENV && local_prod_config)
                       ? local_prod_config 
                       : (the_config.environment == DEV_ENV && local_dev_config)
                         ? local_dev_config
                         : the_config;

// exports_config.jwt_secret = "myS33!!creeeT";
// console.log(exports_config.jwt_secret)
const exports_config = {...the_config, ...(_local_config||{}) };
module.exports       = exports_config;