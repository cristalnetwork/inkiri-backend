const config               = require('../../common/config/env.config.js');
const IUGUImporter         = require('../../iugu/services/importer');
const IUGUIssuer           = require('../../iugu/services/issuer');
const NotificationService  = require('../../notifications/services/push');
const UserService          = require('../../users/services/blockchain_import');
const TxImporter           = require('../../transactions/services/importer');
const TxProcessor          = require('../../transactions/services/processor');

const CronJob              = require('cron').CronJob;
// https://github.com/kelektiv/node-cron#readme

const moment               = require('moment');

const tripa = {
  the_function : () => {
    console.log('llamaron a TRIPA::THE_FUNCTION:', moment().format('YYYY-MM-DD_HH-mm-ss'));
  }
}
const cron_jobs = [
  // {
  //   key:      'TEST_TASK'
  //   , time:   '*/5 * * * * *'
  //   , tasks:  [ {context:tripa, function:'the_function'}, {context:tripa, function:'the_function'} ]
  // }
  
  // {
  //   key:      'IUGU_IMPORTER'
  //   , time:   '0 */3 * * * *'
  //   , tasks:  [ {context:IUGUImporter, function:'importAll'}, IUGUIssuer.issuePending ]
  // },
  
  {
    key:      'PUSH_NOTIFICATION'
    , time:    '0 */1 * * * *'
    , tasks:  [ {context:NotificationService, function:'pushAll'}]
  },
  {
    key:      'BALANCES_IMPORTER'
    , time:   '0 */5 * * * *'
    , tasks:  [ {context:UserService, function:'balances'}]
  },
  {
    key:      'TRANSACTIONS_IMPORTER'
    , time:   '*/20 * * * * *'
    , tasks:  [ {context:TxImporter, function:'import'}, {context:TxProcessor, function:'process'} ]
  }
];

const runJob = async (job_config) => {
  const job = new CronJob(job_config.time, async () => {
    
    for(var i=0; i<job_config.tasks.length;i++)
    {  
      const task = job_config.tasks[i];
      console.log('** ....executing job:', job_config.key, task.function);
      const data = await task.context[task.function]();  
      console.log('** Job executed:', job_config.key, task.function);
      console.log('** ********************************************************************** ');
    }
    
  });
  console.log('** Job configurated:', job_config.key);
  job.start();
}

exports.runAllJobs = () => cron_jobs.map(job_config=>runJob(job_config));

