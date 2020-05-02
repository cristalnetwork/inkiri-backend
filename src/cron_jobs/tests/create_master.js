
const UserModel     = require('../../users/models/users.model');

(async () => {

  const x = await UserModel.createUser({
    account_name  :   'labisteste21'
    , alias  :          'labisteste21'
    , first_name  :     'labisteste21'
    , last_name  :      'labisteste21'
    , email  :          'labisteste21@xx.com'
    , public_key  :     'EOS7wB5NGGnDcw676aSqwe5tmmND1ZffDr2qehbxUCGwoXfbrBAbR'
    , account_type  :   'bankadmin'
  });
  console.log(x);

  return process.exit(0);
  
})();

