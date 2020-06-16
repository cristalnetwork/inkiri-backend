const config       = require('../../common/config/env.config.js');
const issuer       = require('../../iugu/services/issuer');
const IuguLogModel = require('../../iugu_log/models/iugu_log.model');


(async () => {

  console.log (' ====== BEGIN Issue IUGU')
  issuer.issuePending()
    .then( (result) => {
        // console.log('issue_cron::result-> ', JSON.stringify(result))
        // console.log(' END CRON')
        // console.log(' -- --------------------------------------------')
        console.log (' ====== END Import IUGU')
        return process.exit(0);
    }, (err)=>{
        console.log(' == ISSUE Iugu::ERROR-> ', JSON.stringify(err))
        return process.exit(0);
        // console.log(' END CRON')
    });
  
  

})();