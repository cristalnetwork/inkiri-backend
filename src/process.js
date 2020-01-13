const processor = require('./transactions/services/processor');


(async () => {

  // Process imported transactions
  console.log (' ====== Process transactions')
  const y = await processor.process();
  // console.log (' == Transactions processed!!')
  console.log('END o_O');
  
  return process.exit(0);

})();

