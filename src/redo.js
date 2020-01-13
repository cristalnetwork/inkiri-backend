const TxsModel       = require('./transactions/models/transactions.model');
const RequestModel   = require('./requests/models/requests.model');

const importer = require('./transactions/services/importer');

const processor = require('./transactions/services/processor');

(async () => {
  console.log (' ====== DELETE transactions')
  const w = await TxsModel.deleteMany({});
  console.log (' ====== DELETE requests')
  const x = await RequestModel.deleteMany({});
  console.log (' == all DELETED!!')

  // Import transactions
  console.log (' ====== Import transactions')
  const y = await importer.import();
  console.log (' == Transactions imported!!')

  
  // Process imported transactions
  console.log (' ====== Process transactions')
  const z = await processor.process();
  console.log (' == Transactions processed!!')
  console.log('END o_O');

  return process.exit(0);
  
})();

