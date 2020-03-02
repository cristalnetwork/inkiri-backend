var local_config         = null;

try {
    local_config         = require('./env.cristaltoken.config.js');
} catch (ex) {}

const the_config = {
    "api_version": '/api/v1',
    "port": 3600,
    "appEndpoint": "http://localhost:3600",
    "apiEndpoint": "http://localhost:3600",
    "jwt_secret": "myS33!!creeeT",
    "jwt_expiration_in_seconds": 2592000,
    "environment": "dev",
    "email_domain": "inkiri.com",
    "mongodb_uri": "mongodb://localhost/cristal_dfuse?replicaSet=rs",
    "mongo" : {
      "useUnifiedTopology": false
    },
    "eos" : {
        "history_provider": "hyperion",
        // "blockchain_endpoint": "https://jungle.eos.dfuse.io",
        // "blockchain_endpoint": "https://jungle2.cryptolions.io:443",
        "blockchain_endpoint": "https://testnet.telosusa.io",
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
          "history_endpoint" : "https://testnet.telosusa.io"
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
        "root_folder_id":"1rMKCZUv5KHXv4pfL-Mhx492L2Qkb32d7"
    },
    "iugu":
    {
      "api":{
          "endpoint"    : "https://api.iugu.com/v1"
      }
    }
};

const exports_config = local_config || the_config;

module.exports = exports_config;