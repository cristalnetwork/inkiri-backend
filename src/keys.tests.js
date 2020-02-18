// $ node

// {password: "1234", confirm_password: "1234", public_key: "EOS5bZt32JBtESDZkNnfBaxcgy17dD8xJyqWpoeFgS4VHcY2FUkBZ", account_name: "aranadalmiro"}

const ecc     = require('eosjs-ecc');
ecc.isValidPublic("EOS5bZt32JBtESDZkNnfBaxcgy17dD8xJyqWpoeFgS4VHcY2FUkBZ") 
// ecc.privateToPublic(wif)


cleos --print-request  -u http://jungle2.cryptolions.io:80 set account permission pablotutino1 tripa '{"threshold": 1,"keys": [{"permission":{"key":"EOS5bZt32JBtESDZkNnfBaxcgy17dD8xJyqWpoeFgS4VHcY2FUkBZ","permission":"active"},"weight":1}], "accounts": []}' owner -p pablotutino1@owner -j -d


[{
    "account": "eosio",
    "name": "updateauth",
    "authorization": [
    {
        "actor": "aranadalmiro",
        "permission": "owner"
    }],
    "data":
    {
        "account": "aranadalmiro",
        "permission": "active",
        "auth":
        {
            "threshold": 1,
            "keys": [
            {
                "permission":
                {
                    "key": "EOS5bZt32JBtESDZkNnfBaxcgy17dD8xJyqWpoeFgS4VHcY2FUkBZ",
                    "permission": "active"
                },
                "weight": 1
            }],
            "accounts": [],
            "waits": []
        },
        "parent": "owner"
    }
}]

--
// account

[
{
    "account": "eosio",
    "name": "updateauth",
    "authorization": [
    {
        "actor": "aranadalmiro",
        "permission": "owner"
    }],
    "data":
    {
        "account": "aranadalmiro",
        "permission": "owner",
        "auth":
        {
            "threshold": 1,
            "keys": [
            {
                "key": "EOS789g4bMwbGnoonuzEwJmjZ58ZvP1BMtnb3qz8sZwuLiFbwsJbB",
                "weight": 1
            }],
            "accounts": [
            {
                "permission":
                {
                    "actor": "cristaltoken",
                    "permission": "active"
                },
                "weight": 1
            },
            {
                "permission":
                {
                    "actor": "pablotutino2",
                    "permission": "active"
                },
                "weight": 1
            },
            {
                "permission":
                {
                    "actor": "tutinopablo1",
                    "permission": "active"
                },
                "weight": 1
            }],
            "waits": []
        },
        "parent": ""
    }
}]