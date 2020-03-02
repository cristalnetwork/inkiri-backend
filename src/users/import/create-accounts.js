const UsersModel    = require('../models/users.model');
const accounts      = require('./accounts.js');

if (process.env.TEST_RUN === '1') {
  console.log('=== Test run ===');
}

(async () => {

  const x = await UsersModel.model.deleteMany({exists_at_blockchain:false});
  const accounts_count = accounts.length;
  const promises       = accounts.map( (account, idx) => {
      const target = Object.assign({}, account); 
      
      const email_parts = target.email.split('@')
      target.email = `${email_parts[0]}_${target.idx}@${email_parts[1]}`;

      delete target.password;
      delete target.idx;
      return UsersModel.createUser(target) ;
      
  });

  const values = await Promise.all(promises);

  console.log(values);

  console.log('Done!');
  return process.exit(0);
})();

