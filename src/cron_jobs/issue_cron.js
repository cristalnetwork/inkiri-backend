const config       = require('../common/config/env.config.js');
const issuer       = require('../iugu/services/issuer');
const IuguLogModel = require('../iugu_log/models/iugu_log.model');

console.log(' -- BEGIN CRON --------------------------------------------')
issuer.issuePending()
  .then( (result) => {
      console.log('issue_cron::result-> ', JSON.stringify(result))
      console.log(' END CRON')
      console.log(' -- --------------------------------------------')
      return;
  }, (err)=>{
      console.log('issue_cron::ERROR-> ', JSON.stringify(err))
      IuguLogModel.logImport(err.error, 0, null, null, 0, null, null, err.qs )
      console.log(' END CRON')
      console.log(' -- --------------------------------------------')
      return;
  });
return;
