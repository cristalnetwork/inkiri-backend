const UsersModel        = require('../models/users.model');
const AccountChecker    = require('./check-blockchain-accounts.js');

(async () => {

  // const update_users = [
  //   {original: 'doacoeseda01', new_name: 'doacoeseda11'},
  //   {original: 'casasol00001', new_name: 'casasol11111'},
  //   {original: 'imersoes0001', new_name: 'imersoes1111'},
  //   {original: 'cafelotus001', new_name: 'cafelotus111'}
  // ]
  // const prom = update_users.map( user => UsersModel.patchUserByAccountName(user.original, {account_name:user.new_name}) )
  
  const update_users = await AccountChecker.getMissingAccounts();
  const prom = update_users.map( user => UsersModel.patchUserByAccountName(user.account_name, {exists_at_blockchain:!user.missing}) )

  const res  = await Promise.all(prom);
  
  console.log(res);
  
  console.log('Done!');
  return process.exit(0);
})();

