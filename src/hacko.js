const TxsModel       = require('./transactions/models/transactions.model');
const RequestModel   = require('./requests/models/requests.model');
const ConfigModel    = require('./configuration/models/configuration.model');
const importer       = require('./transactions/services/importer');

const processor = require('./transactions/services/processor');

(async () => {
  // const y = await ConfigModel.init();

  // "_id": ObjectId("5e189c2be7c02e3df75db2ae")
  // const y = await TxsModel.patchById('5e189c2be7c02e3df75db2ae', {'state':TxsModel.STATE_NOT_PROCESSED});
   console.log(y)

   return process.exit(0);
   
})();

