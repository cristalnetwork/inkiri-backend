const UsersModel        = require('../models/users.model');
const AccountChecker    = require('./check-blockchain-accounts-lib.js');
const accounts          = require('./accounts.js');
const buildAccounts     = require('./build-accounts');

(async () => {

  // const update_users = [
  //   {original: 'doacoeseda01', new_name: 'doacoeseda11'},
  //   {original: 'casasol00001', new_name: 'casasol11111'},
  //   {original: 'imersoes0001', new_name: 'imersoes1111'},
  //   {original: 'cafelotus001', new_name: 'cafelotus111'}
  // ]
  // const prom = update_users.map( user => UsersModel.patchUserByAccountName(user.original, {account_name:user.new_name}) )


  

  // const update_users = [
  //   {original: 'doacoeseda01', new_name: 'doacoeseda11'},
  //   {original: 'casasol00001', new_name: 'casasol11111'},
  //   {original: 'imersoes0001', new_name: 'imersoes1111'},
  //   {original: 'cafelotus001', new_name: 'cafelotus111'}
  // ]
  // const prom = update_users.map( user => UsersModel.patchUserByAccountName(user.new_name, {account_name:user.original}) )
  
  

  // const update_users = await AccountChecker.getMissingAccounts();
  // const prom = update_users.map( user => UsersModel.patchUserByAccountName(user.account_name, {exists_at_blockchain:!user.missing}) )

  

  // const update_users = await UsersModel.list(100, 0, {exists_at_blockchain:false, account_name: {$regex: '.*0.*',  $options : "i"} } );
  // const clean_users  = update_users.map( user => 
  //   {
  //     // 1) retrive password by old account_name
  //     user.password     = accounts.find( account => account.account_name==user.account_name).password 
  //     // 2) clean account_name
  //     user.old_account_name = user.account_name;
  //     user.account_name = null;
  //     return user;
  //   }
  // );
  // const ready_users = buildAccounts(clean_users);
  // const prom         = ready_users.map(user=>{
  //   const old_account_name = user.old_account_name;
  //   delete user.password;
  //   delete user.old_account_name;
  //   // return user.account_name + ' - ' + user.public_key;
  //   return UsersModel.patchUserByAccountName(old_account_name, {account_name:user.account_name, public_key:user.public_key}) 
  // })


  const prom = await UsersModel.list(100, 0, {exists_at_blockchain:false, account_name: { $ne: 'xasaflorestx' } } );

  const res  = await Promise.all(prom);
  
  console.log(res);
  
  console.log('Done!');
  return process.exit(0);
})();

