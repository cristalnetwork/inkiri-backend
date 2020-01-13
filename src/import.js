const importer = require('./transactions/services/importer');


(async () => {
  // Import transactions
  console.log (' ====== Import transactions')
  const x = await importer.import();
  console.log (' == Transactions imported!!')

  console.log('END o_O');

  return process.exit(0);
})();

