const RequestModel      = require('../../requests/models/requests.model');
const IuguModel         = require('../../iugu/models/iugu.model');
const IuguLogModel      = require('../../iugu_log/models/iugu_log.model');
const ProviderModel     = require('../../providers/models/providers.model');
const ServiceModel      = require('../../services/models/services.model');
const TeamModel         = require('../../teams/models/teams.model');
const TransactionsModel = require('../../transactions/models/transactions.model');


(async () => {
  console.log (' ====== DELETE ALL')
  
  // const f = await ServiceModel.model.deleteMany({});
  // console.log( 'ServiceModel ', f );
  
  // const g = await TeamModel.model.deleteMany({});
  // console.log( 'TeamModel ', g );
  
  const h = await TransactionsModel.model.deleteMany({});
  console.log( 'TransactionsModel ', h );
  
  // const a = await RequestModel.model.deleteMany({});
  // console.log( 'RequestModel ', a );
  
  // const b = await IuguModel.model.deleteMany({});
  // console.log( 'IuguModel ', b );
  
  // const c = await IuguLogModel.model.deleteMany({});
  // console.log( 'IuguLogModel ', c );
  
  console.log('END o_O');

  return process.exit(0);
})();

