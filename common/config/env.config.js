module.exports = {
    "api_version": '/api/v1',
    "port": 3600,
    "appEndpoint": "http://localhost:3600",
    "apiEndpoint": "http://localhost:3600",
    "jwt_secret": "myS33!!creeeT",
    "jwt_expiration_in_seconds": 86400,
    "environment": "dev",
    "mongodb_uri": "mongodb://localhost/inkiri",
    "eos" : {
        "blockchain_endpoint": "https://jungle.eos.dfuse.io",
        "token": {
            "contract": "inkiritoken1",
            "account": "inkiritoken1",
            "code": "INK"
        },
        "bank": {
            "contract":        "ikmasterooo1",
            "account":         "ikmasterooo1",
            "table_accounts":  "ikaccounts"
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
    }
};
