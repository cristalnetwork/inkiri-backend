const TxsModel     = require('../models/transactions.model');
const config       = require('../../common/config/env.config.js');
// const processor    = require('./processor');
const dfuse        = require('./dfuse');

exports.import = async () => {  
  
  console.log(' =============================================================================');
  console.log(' =====    START IMPORT    ====================================================');
  console.log(' =============================================================================');

  // **********************************************************************
  // 0 debug -> deleteMany
  // **********************************************************************
  try{
    // const x = await TxsModel.deleteMany({});
  }
  catch(e){
    console.log(' ******************** Error deletingMany ', e);
  }


  // **********************************************************************
  // 1st: Get last imported block.
  let last_block   = null;
  let lastImported = null;
  try{
    lastImported = await TxsModel.lastImported()
    if(lastImported)
      last_block = parseInt(lastImported.block_num)+1;
    // console.log(' == lastImported:', lastImported)
  }
  catch(e){
    console.log(' ******************** Error getting last imported :( ', e);
  }
  console.log(' =========== last_block:', last_block)
  // return;

  const cfg   = {api_key: config.eos.dfuse.api_key, network: config.eos.dfuse.network};
  let raw_txs = [];
  
  

  // **********************************************************************
  // 2nd: Query dfuse service for transactions for account since last block.
  // **********************************************************************
  try{
    const res = await dfuse.queryTransactions(cfg, config.eos.token.contract, null, last_block||0);
    raw_txs = res.txs;
  }
  catch(e){
    console.log(' ******************** Error getting txs :( ', e);
  }


  const txs = await Promise.all( raw_txs.map( async raw_tx => {
      if(raw_tx.undo)
        return null;
      const from_account_name = (raw_tx.trace && raw_tx.trace.topLevelActions && raw_tx.trace.topLevelActions.length>0 && raw_tx.trace.topLevelActions[0].data && raw_tx.trace.topLevelActions[0].data.from) 
        ? raw_tx.trace.topLevelActions[0].data.from 
        : null;
      const to_account_name   = (raw_tx.trace && raw_tx.trace.topLevelActions && raw_tx.trace.topLevelActions.length>0 && raw_tx.trace.topLevelActions[0].data && raw_tx.trace.topLevelActions[0].data.to) 
        ? raw_tx.trace.topLevelActions[0].data.to 
        : null;
      const amount            = (raw_tx.trace && raw_tx.trace.topLevelActions && raw_tx.trace.topLevelActions.length>0 && raw_tx.trace.topLevelActions[0].data && raw_tx.trace.topLevelActions[0].data.quantity) 
        ? dfuse.quantityToNumber(raw_tx.trace.topLevelActions[0].data.quantity || raw_tx.trace.topLevelActions[0].data.amount || raw_tx.trace.topLevelActions[0].data.price) 
        : 0.0;
      const state             = TxsModel.STATE_NOT_PROCESSED

      return {
        tx_id               : raw_tx.trace.id
        , block_num         : raw_tx.block.num
        , block_id          : raw_tx.block.id
        , block_timestamp   : raw_tx.block.timestamp
        , trace             : raw_tx.trace
        , from_account_name : from_account_name
        , to_account_name   : to_account_name
        , amount            : amount
        , state             : state
      }
    })
  );

  const tx_ids_to_check   = await Promise.all(txs.map(tx=>tx.tx_id));
  const not_to_insert     = await TxsModel.findTxIds(tx_ids_to_check);
  const not_to_insert_ids = await Promise.all(not_to_insert.map(tx=>tx.tx_id))
  
  console.log(' =============================================================================');
  console.log(' ===========not_to_insert_ids : ',not_to_insert_ids.join(' | '));

  const my_txs = txs.filter( tx => !not_to_insert_ids.includes(tx.tx_id) )
  
  // console.log(not_to_insert_ids)
  console.log(' =============================================================================');
  console.log(' =========== txs.length:', txs.length);
  console.log(' =========== not_to_insert_ids.length:', not_to_insert_ids.length);
  console.log(' =============================================================================');

  // console.log(' =========== raw_txs[0]:', raw_txs[0]);
  console.log(' =============================================================================');
  console.log(' =========== txs.length:', txs.length);
  console.log(' =============================================================================');
  console.log(' =========== txs[0]:', (txs&&txs.length>0)
      ?txs[0].tx_id
      :'N/A');
  console.log(' =============================================================================');
  console.log(' =========== txs[x]:', (txs&&txs.length>0)
      ?txs.slice(-1)[0].tx_id 
      :'N/A');
  
  // **********************************************************************
  // 3rd: Store transactions en ddbb for later processing.
  // **********************************************************************
  if(!my_txs || my_txs.length==0)
  {
    console.log(' ====== NOTHING TO SAVE! ');
    console.log(' =============================================================================');
    return;
  }
  try{
    const res = await TxsModel.insertMany(my_txs);
    console.log(' ====== txs Saved[0] ', res[0]._id);
  }
  catch(e){
    console.log(' ******************** Error saving txs :( ', e);
  }

  console.log(' =====    END    =============================================================');
  console.log(' =============================================================================');
};
