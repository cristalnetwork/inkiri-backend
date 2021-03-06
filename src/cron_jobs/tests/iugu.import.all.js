const config         = require('../../common/config/env.config.js');
const importer       = require('../../iugu/services/importer');
const IuguModel      = require('../../iugu/models/iugu.model');

(async () => {

  console.log('iugu.import.all::BEGIN --------------------------------------------')

  const import_result = await importer.importAndNotSave(10);
  // const import_result = await importer.importAllSince(39);
  // const import_result = await importer.importAll();
  // const import_result = await IuguModel.listUnprocessed();
  
  console.log('----LEN:', (import_result||[]).length);        
  console.log(import_result.map(obj=>obj.iugu_id));        
  console.log('iugu.import.all::END --------------------------------------------')
  return process.exit(0);

})();