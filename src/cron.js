const TxsModel       = require('./transactions/models/transactions.model');
const RequestModel   = require('./requests/models/requests.model');

const importer = require('./transactions/services/importer');

const processor = require('./transactions/services/processor');

const _do = async () => {
  // Import transactions
  console.log (' ====== Import transactions')
  const y = await importer.import();
  console.log (' == Transactions imported!!')

  
  // Process imported transactions
  console.log (' ====== Process transactions')
  const z = await processor.process();
  console.log (' == Transactions processed!!')
  console.log('END o_O');

} 
const tick  = 10000;
const loops = 3600 * 1000 / 10000; 
(async () => {
  
  let i = 0;
  _do();
  const interval_id = setInterval(function() {
    i++;
    if (i < loops) {
      _do();
    }
    else{
      clearInterval(interval_id );
      return process.exit(0);
    }
  }, 10000);  
  
  
})();

