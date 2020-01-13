global.fetch     = require("node-fetch");
global.WebSocket = require("ws");
const {createDfuseClient} = require('@dfuse/client');
// import { createDfuseClient, DfuseClient } from "@dfuse/client";

const createClient = (api_key, network) => {
  let client = createDfuseClient({
    apiKey:   api_key,
    network:  network
  })
  return client;
} 

const IMPORT_TXS_INITIAL_BLOCK = 70190562;

exports.queryTransactionsBB = async (config, contract, cursor, last_block) => new Promise(async(res,rej)=> {
  
  const searchTransactions = `query ($limit: Int64, $irreversibleOnly:Boolean, $lowBlockNum:Int64, $cursor:String){
    searchTransactionsBackward(query: "account:${contract}", limit: $limit, irreversibleOnly: $irreversibleOnly, lowBlockNum: $lowBlockNum, cursor:$cursor) {
      cursor 
      results { 
        block { num id timestamp}
        trace { 
          id 
          topLevelActions {
            account
            name
            authorization {
                actor
                permission
            }
            data
        }
        } 
      }
    }
  }`;

  const client = createClient(config.api_key, config.network);

  try {
    const response = await client.graphql(searchTransactions, {
      variables: { limit:             100
                  , irreversibleOnly: false
                  , lowBlockNum:      parseInt(last_block)||IMPORT_TXS_INITIAL_BLOCK
                  , cursor:           cursor||null
        }
    })

    console.log('================================ DFUSE response:', response)
    const results = response.data.searchTransactionsBackward.results || []
    // if (results.length <= 0) {
    //   res ({data:{txs:[], cursor:''}})
    //   console.log("Oups nothing found")
    //   return;
    // }

    // console.log(' dfuse::queryTransactions >> RAW data >>', JSON.stringify(response));

    const txs = results;
    console.log(' ========================== DFUSE txs.length:', txs.length)
    // console.log(' dfuse::listTransactions >> RAW data >>', JSON.stringify(data));
    res ({txs:txs.reverse(), cursor:response.data.searchTransactionsBackward.cursor})
    
  } catch (error) {
    rej(error);
    console.log("An error occurred", error)
  }

  client.release()

});
exports.queryTransactions = async (config, contract, cursor, last_block) => new Promise(async(res,rej)=> {
  
  const searchTransactions = `query ($limit: Int64, $irreversibleOnly:Boolean, $lowBlockNum:Int64, $cursor:String){
    searchTransactionsForward(query: "account:${contract}", limit: $limit, irreversibleOnly: $irreversibleOnly, lowBlockNum: $lowBlockNum, cursor:$cursor) {
      cursor 
      results { 
        undo
        block { num id timestamp}
        trace { 
          id 
          topLevelActions {
            account
            name
            authorization {
                actor
                permission
            }
            data
        }
        } 
      }
    }
  }`;

  const client = createClient(config.api_key, config.network);

  try {
    const response = await client.graphql(searchTransactions, {
      variables: { limit:             100
                  , irreversibleOnly: false
                  , lowBlockNum:      parseInt(last_block)||IMPORT_TXS_INITIAL_BLOCK
                  , cursor:           cursor||null
        }
    })
    const results = response.data.searchTransactionsForward.results || []
    const txs = results;
    res ({txs:txs, cursor:response.data.searchTransactionsForward.cursor})
    
  } catch (error) {
    rej(error);
    console.log("An error occurred", error)
  }

  client.release()

});


exports.quantityToNumber = (value) => {
    if(!value)
      value=0;
    if(isNaN(value))
      value = Number(value.split(' ')[0]); //replace(currency.eos_symbol, '')
    return parseFloat(value);
};