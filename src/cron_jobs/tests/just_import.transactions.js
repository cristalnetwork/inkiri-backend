const TxsModel     = require('../../transactions/models/transactions.model');
const config       = require('../../common/config/env.config.js');
const hyperion     = require('../../transactions/services/hyperion');


(async () => {
  
  console.log(' =============================================================================');
  console.log(' =====    START IMPORT    ====================================================');
  console.log(' =============================================================================');


  // **********************************************************************
  // 1st: Get last imported block.
  let last_timestamp = null;
  let lastImported   = null;
  try{
    lastImported = await TxsModel.lastImported()
    if(lastImported)
      last_timestamp = lastImported.block_timestamp;
    // console.log(' == lastImported:', lastImported)
  }
  catch(e){
    console.log(' ******************** Error getting last imported :( ', e);
  }
  
  //HACK!!!!!!!!!!!!!!!!
  // last_timestamp = '2020-03-01T01:18:51.500Z';
  // last_timestamp = '2020-03-06T00:35:24.500Z';
  console.log(' =========== last_timestamp:', last_timestamp)
  
  let raw_txs = [];

  // **********************************************************************
  // 2nd: Query hyperion historical data service for transactions for account since last timestamp.
  // **********************************************************************
  try{
    const res = await hyperion.queryTransactions({}, null, null, last_timestamp||null);
    console.log('=== OK');
    console.log(res.txs);
  }
  catch(e){
    console.log(' ******************** Error getting txs :( ', e);
  }

  
  return process.exit(0);
    
  
})();

