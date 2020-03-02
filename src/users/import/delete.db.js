const UsersModel = require('../models/users.model');


(async () => {
  console.log (' ====== DELETE ALL')
  
  const h = await UsersModel.model.deleteMany({'account_name':{$nin : ['tutinopablo1', 'cristaltoken' ]}});
  console.log( 'UsersModel ', h );
  
  console.log('END o_O');

  

  return process.exit(0);
})();

