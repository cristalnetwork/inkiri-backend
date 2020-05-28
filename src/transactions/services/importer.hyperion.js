const TxsModel     = require('../models/transactions.model');
const config       = require('../../common/config/env.config.js');
const hyperion     = require('./hyperion');

exports.import = async () => {  
  
  // console.log(' =============================================================================');
  // console.log(' =====    START IMPORT    ====================================================');
  // console.log(' =============================================================================');

  // **********************************************************************
  // 0 debug -> deleteMany
  // **********************************************************************
  // try{
  //   // const x = await TxsModel.deleteMany({});
  // }
  // catch(e){
  //   console.log(' ******************** Error deletingMany ', e);
  // }


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
    raw_txs = res.txs;
  }
  catch(e){
    console.log(' ******************** Error getting txs :( ', e);
  }

  const txs = await Promise.all( raw_txs.map( async raw_tx => {
      const state             = TxsModel.STATE_NOT_PROCESSED;
      return {
        ...raw_tx
        , state             : state
      }
    })
  );

  const tx_ids_to_check   = await Promise.all(txs.map(tx=>tx.tx_id));
  const not_to_insert     = await TxsModel.findTxIds(tx_ids_to_check);
  const not_to_insert_ids = await Promise.all(not_to_insert.map(tx=>tx.tx_id))
  
  const my_txs = txs.filter( tx => !not_to_insert_ids.includes(tx.tx_id) )
  
  // console.log(' =============================================================================');
  console.log(' == new transactions : ', my_txs.length);
  console.log(' == old transactions : ', not_to_insert_ids.length); 
  // console.log(' == not_to_insert_ids : ', not_to_insert_ids.join(' | '));
  
  // **********************************************************************
  // 3rd: Store transactions en ddbb for later processing.
  // **********************************************************************
  if(!my_txs || my_txs.length==0)
  {
    // console.log(' ====== NOTHING TO SAVE! ');
    // console.log(' =============================================================================');
    return;
  }
  try{
    const res = await TxsModel.insertMany(my_txs);
    // console.log('............INSERTARIA', JSON.stringify(my_txs));
  }
  catch(e){
    console.log(' ******************** Error saving txs :( ', e);
  }

  // console.log(' =====    END    =============================================================');
  // console.log(' =============================================================================');
};
