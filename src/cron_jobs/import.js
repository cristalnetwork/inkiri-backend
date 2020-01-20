const config       = require('../common/config/env.config.js');
const importer     = require('../iugu/services/importer');
const IuguLogModel = require('../iugu_log/models/iugu_log.model');



(async () => {

  console.log('iugu-cron-jobs::import::BEGIN-CRON --------------------------------------------')

  try{
    
    const import_result = await importer.importAndSave()
    if(!import_result.error)
    {
      console.log('iugu-cron-jobs::import::import_cron::result-> NOT HAS ERROR')
      if(import_result && import_result.items && import_result.items.length)
      {
        console.log('iugu-cron-jobs::import::import_cron::result-> HAS RESULT. Loging...')
        const x = await IuguLogModel.logImport('', import_result.items.length, import_result.items.map(obj => obj.id), null, 0, null, null, import_result.qs)
        console.log('iugu-cron-jobs::import::import_cron::result-> HAS RESULT. logged OK')
      }
      else{
        console.log('iugu-cron-jobs::import::import_cron::result-> NOT HAS ERROR & NO RESULTS!')
      }
    }
    else
    {
      console.log('iugu-cron-jobs::import::import_cron::result-> HAS ERROR. Logging...')
      const y = await IuguLogModel.logImport(import_result.error, 0, null, null, 0, null, null, import_result.qs)
      console.log('iugu-cron-jobs::import::import_cron::result-> HAS ERROR. logged OK')
    }

    const inserted = import_result?import_result.length:0;
    console.log('iugu-cron-jobs::import::import_cron::result-> ' + inserted)
    console.log('iugu-cron-jobs::import::END-CRON')
    console.log(' -- --------------------------------------------')
  }
  catch(err){
    console.log('import_cron::ERROR-> ', JSON.stringify(err))
    if(err.qs)
    {
      const z = await IuguLogModel.logImport(err.error, 0, null, null, 0, null, null, err.qs )
    }
    console.log('iugu-cron-jobs::import::END-CRON')
    console.log(' -- --------------------------------------------')
  }
        
  
  return process.exit(0);

})();