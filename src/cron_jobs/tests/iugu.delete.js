const IuguModel      = require('./iugu/models/iugu.model');

(async () => {
  console.log (' ====== DELETE IUGUs')
  const x = await IuguModel.model.deleteMany({});
  
  console.log('END o_O');
  return process.exit(0);
})();

