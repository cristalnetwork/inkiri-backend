// const config       = require('../common/config/env.config.js');
// const importer     = require('../iugu/services/importer');
// const IuguLogModel = require('../iugu_log/models/iugu_log.model');
// console.log(' -- BEGIN CRON --------------------------------------------')

// importer.importAndSave()
//   .then( (result) => {

//       if(!result.error)
//         IuguLogModel.logImport('', result.items.length, result.items.map(obj => obj.id), null, 0, null, null, result.qs)
//       else
//         IuguLogModel.logImport(result.error, 0, null, null, 0, null, null, result.qs)

//       console.log('import_cron::result-> ', JSON.stringify(result))
//       console.log(' END CRON')
//       console.log(' -- --------------------------------------------')
//       return;
//   }, (err)=>{
//       console.log('import_cron::ERROR-> ', JSON.stringify(err))
//       IuguLogModel.logImport(err.error, 0, null, null, 0, null, null, err.qs )
//       console.log(' END CRON')
//       console.log(' -- --------------------------------------------')

//       return;
//   });
// return;
