var local_prod_config         = null;
var local_dev_config          = null;

try {
  // console.log(' ************* Loading env.cristaltoken.config...')
  local_prod_config         = require('./env.cristaltoken.config.js');
} catch (ex) {
  console.log(' ************* Loading env.cristaltoken.config ERROR:', JSON.stringify(ex))
}

try {
  // console.log(' ************* Loading env.test.config...')
  local_dev_config          = require('./env.test.config.js');
} catch (ex) {
  console.log(' ************* Loading env.test.config ERROR:', JSON.stringify(ex))
}

const the_config = {
    "api_version":                     "/api/v1",
    "port":                            3600,
    "jwt_secret":                      "myS33!!creeeT",
    "jwt_expiration_in_seconds":       2592000,
    "environment":                     "dev",
    "email_domain":                    "inkiri.com",
    "mongo" : {
      "useUnifiedTopology":            false,
      "connection_uri":                "mongodb://localhost/cristal_dfuse?replicaSet=rs",
    },
    "eos" : {
        "history_provider":            "hyperion",
        "blockchain_currency_symbol":  "TLOS",
        
        // "blockchain_endpoint": "https://jungle.eos.dfuse.io",
        // "blockchain_endpoint": "https://jungle2.cryptolions.io:443",
        // https://tools.eosmetal.io/nodestatus/telos
        // "blockchain_endpoint": "https://testnet.telosusa.io",
        // "blockchain_endpoint": "http://mainnet.telosusa.io",
        // "blockchain_endpoint": "https://telos.eoscafeblock.com", 
        "blockchain_endpoint":         "https://telos.caleos.io",
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
          //"history_endpoint" :     "https://testnet.telosusa.io"
          // "history_endpoint" :    "http://mainnet.telosusa.io"
          "history_endpoint"          : "https://telos.caleos.io", 
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
      }
    }
};

const exports_config = (the_config.environment == 'prod' && local_prod_config)
                       ? local_prod_config 
                       : (the_config.environment == 'dev' && local_dev_config)
                         ? local_dev_config
                         : the_config;

// console.log(exports_config.mongo.connection_uri)

module.exports = exports_config;