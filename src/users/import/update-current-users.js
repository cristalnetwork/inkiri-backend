const UsersModel        = require('../models/users.model');


(async () => {

  const res = await UsersModel.model.updateMany({}, {exists_at_blockchain:true})
  console.log('Done!');
  console.log(res);
  return process.exit(0);
})();

