const NotificationService  = require('../../notifications/services/push');
const config               = require('../../common/config/env.config.js');

const _do = async () => {
  
  console.log (' == PUSHING NOTIFICATIONS')
  const y = await NotificationService.pushAll();
  console.log (' == PUSHING NOTIFICATIONS DONE!')
} 

const tick  = 15000;
// const loops = 10 * 60 * 1000 / tick; 
const loops = config.environment == 'prod'
    ? 2
    : 10 * 60 * 1000 / tick;
     
(async () => {
  
  let i = 0;
  let x = await _do();
  const interval_id = setInterval(
    async() => {
    i++;
    if (i < loops) {
      x = await _do();
    }
    else{
      clearInterval(interval_id );
      return process.exit(0);
    }
  }, tick);  
  
  
})();

