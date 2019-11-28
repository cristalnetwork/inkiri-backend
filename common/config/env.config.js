module.exports = {
    "api_version": '/api/v1',
    "port": 3600,
    "appEndpoint": "http://localhost:3600",
    "apiEndpoint": "http://localhost:3600",
    "jwt_secret": "myS33!!creeeT",
    "jwt_expiration_in_seconds": 2592000,
    "environment": "dev",
    "mongodb_uri": "mongodb://localhost/inkiri",
    "eos" : {
        // "blockchain_endpoint": "https://jungle.eos.dfuse.io",
        "blockchain_endpoint": "https://jungle2.cryptolions.io:443",
        "token": {
            "contract": "cristaltoken",
            "account": "cristaltoken",
            "code": "INK"
        },
        "bank": {
            "contract":        "cristaltoken",
            "account":         "cristaltoken",
            "table_accounts":  "customer"
        },
        "dfuse" : {
          "api_key"                   : 'web_8a50f2bc42c1df1a41830c359ba74240',
          "network"                   : 'jungle',
          "auth_url"                  : 'https://auth.dfuse.io/v1/auth/issue',
          "base_url"                  : 'https://jungle.eos.dfuse.io',
          "chain_id"                  : 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473',
          "websocket_url"             : 'wss://jungle.eos.dfuse.io/v1/stream',
          "default_page_size"         : 25,
          "tx_url"                    : 'https://jungle.bloks.io/transaction/'
        }
    },
    "permission_levels": {
        "NORMAL_USER": 1,
        "OPS_USER": 4,
        "ADMIN": 2048
    },
    "google":{
        "root_folder_id":"1rMKCZUv5KHXv4pfL-Mhx492L2Qkb32d7"
    },
    "iugu":
    {
      "api":{
          "endpoint"    : "https://api.iugu.com/v1"
      }
    },
};
