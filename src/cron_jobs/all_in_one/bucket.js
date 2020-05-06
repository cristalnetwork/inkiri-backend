const all_in_one = require('./index');

(async () => {

  console.log('ALL-IN-ONE JOBS LAUNCHER --------------------------------------------')

  try{
    all_in_one.runAllJobs();
  }
  catch(err){
    console.log(' -- --------------------------------------------')
  }
  
  // return process.exit(0);

})();