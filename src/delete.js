const TxsModel       = require('./transactions/models/transactions.model');
const RequestModel   = require('./requests/models/requests.model');

(async () => {
  console.log (' ====== DELETE transactions')
  const x = await TxsModel.deleteMany({});
  
  console.log (' ====== DELETE requests')
  const y = await RequestModel.deleteMany({});

  console.log('END o_O');
})();

