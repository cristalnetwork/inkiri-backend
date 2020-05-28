const config       = require('../../common/config/env.config.js');
const importer     = require('../../iugu/services/importer');
const IuguLogModel = require('../../iugu_log/models/iugu_log.model');

(async () => {

  console.log (' ====== BEGIN Import IUGU')

  try{
    
    const import_result = await importer.importAll()
    for(var i=0; i<import_result.length; i++)
    {
      const import_result_item = import_result[i];
      if(!import_result_item.error)
      {
        // console.log('iugu-cron-jobs::import::import_cron::result-> NOT HAS ERROR')
        if(import_result_item && import_result_item.items && import_result_item.items.length)
        {
          // console.log('iugu-cron-jobs::import::import_cron::result-> HAS RESULT. Loging...')
          const x = await IuguLogModel.logImport('', import_result_item.items.length, import_result_item.items.map(obj => obj.id), null, 0, null, null, import_result_item.qs)
          // console.log('iugu-cron-jobs::import::import_cron::result-> HAS RESULT. logged OK')
        }
        else{
          // console.log('iugu-cron-jobs::import::import_cron::result-> NOT HAS ERROR & NO RESULTS!')
        }
      }
      else
      {
        // console.log('iugu-cron-jobs::import::import_cron::result-> HAS ERROR. Logging...')
        const y = await IuguLogModel.logImport(import_result_item.error, 0, null, null, 0, null, null, import_result_item.qs)
        // console.log('iugu-cron-jobs::import::import_cron::result-> HAS ERROR. logged OK')
      }

      const inserted = import_result_item?import_result_item.length:0;
      console.log('== New IUGUS: ' + inserted)
      // console.log('iugu-cron-jobs::import::import_cron::result-> ' + inserted)
      // console.log('iugu-cron-jobs::import::END-CRON')
      // console.log(' -- --------------------------------------------');
    }
  }
  catch(err){
    console.log('import_cron::ERROR-> ', JSON.stringify(err))
    if(err.qs)
    {
      const z = await IuguLogModel.logImport(err.error, 0, null, null, 0, null, null, err.qs )
    }
    // console.log('iugu-cron-jobs::import::END-CRON')
    // console.log(' -- --------------------------------------------')
  }
        
  console.log (' ====== END Import IUGU')
  return process.exit(0);

})();