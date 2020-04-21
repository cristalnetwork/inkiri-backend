module.exports = {
    "jwt_secret":                        "<JWT_SECRET>",
    "mongo" : {
      "useUnifiedTopology":              false,
      "connection_uri":                  "<MONGOBD_CONNECTION_URI>"
      // "connection_uri": "mongodb://localhost:27017,localhost:27017,localhost:27017/?replicaSet=rs&retryWrites=true&w=majority"
    },
    "eos" : {
        "history_provider":            "hyperion",
        "blockchain_currency_symbol":  "<BLOCKCHAIN_CURRENCY_SYMBOL>",  //TLOS for TELOS blockchain, EOS for EOS blockchain, SYS for local blockchain
        "blockchain_endpoint_prod":    "http://localhost:8888",         // http://localhost:8888 for Local Single Node testnet, https://telos.eoscafeblock.com for TELOS
        "blockchain_endpoint_dev":     "http://localhost:8888",         // http://localhost:8888 for Local Single Node testnet, https://testnet.telosusa.io
        "hyperion" :{
          "history_endpoint_prod":      "https://telos.caleos.io",      // http://localhost:8888 for Local Single Node testnet , https://telos.caleos.io for TELOS
          "history_endpoint_dev" :      "https://testnet.telosusa.io"   // http://localhost:8888 for Local Single Node testnet , https://testnet.telosusa.io for TELOS
        },
        
        "token": {
            "contract":                "<BLOCKCHAIN_ACCOUNT_NAME>",
            "account":                 "<BLOCKCHAIN_ACCOUNT_NAME>",
            "code":                    "<BLOCKCHAIN_TOKEN_SYMBOL>"
        },
        "bank": {
            "contract":                "<BLOCKCHAIN_ACCOUNT_NAME>",
            "account":                 "<BLOCKCHAIN_ACCOUNT_NAME>",
            "issuer":                  "<BLOCKCHAIN_ACCOUNT_NAME>",
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
        "root_folder_id"              : "<GOOGLE_DRIVE_ID>" // Drive ID
    },
    "iugu":
    {
      "api":{
          "endpoint"                  : "https://api.iugu.com/v1"
      }
    }
};
