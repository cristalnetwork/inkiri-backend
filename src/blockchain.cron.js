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

const tick  = 30000;
// const loops = 3600 * 1000 / 10000; 
const loops = 2; 
(async () => {
  
  let i = 0;
  let x = await _do();
  const interval_id = setInterval(
    async() => {
    i++;
    if (i < loops) {
      x = await _do();
    }
    else{
      clearInterval(interval_id );
      return process.exit(0);
    }
  }, tick);  
  
  
})();

