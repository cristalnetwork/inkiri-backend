// $ node

// {password: "1234", confirm_password: "1234", public_key: "EOS5bZt32JBtESDZkNnfBaxcgy17dD8xJyqWpoeFgS4VHcY2FUkBZ", account_name: "aranadalmiro"}

const ecc     = require('eosjs-ecc');
ecc.isValidPublic("EOS5bZt32JBtESDZkNnfBaxcgy17dD8xJyqWpoeFgS4VHcY2FUkBZ") 
// ecc.privateToPublic(wif)


// cleos --print-request  -u http://jungle2.cryptolions.io:80 set account permission pablotutino1 tripa '{"threshold": 1,"keys": [{"permission":{"key":"EOS5bZt32JBtESDZkNnfBaxcgy17dD8xJyqWpoeFgS4VHcY2FUkBZ","permission":"active"},"weight":1}], "accounts": []}' owner -p pablotutino1@owner -j -d


