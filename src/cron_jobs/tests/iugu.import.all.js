const config         = require('../../common/config/env.config.js');
const importer     = require('../../iugu/services/importer');

(async () => {

  console.log('iugu.import.all::BEGIN --------------------------------------------')

  // const import_result = await importer.importAndNotSave();
  const import_result = await importer.importAll();
        
  console.log('iugu.import.all::END --------------------------------------------')
  return process.exit(0);

})();