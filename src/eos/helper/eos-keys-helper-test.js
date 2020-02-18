const moment         = require('moment');
const eosKeysHelper  = require('./eos-keys-helper');

(async () => {
  // const account_name = 'doacoeseda01';
  // const password     = '1234';
  const account_name = 'cambiodeinki';
  const password     = '1234';

  console.log('account_name:', cambiodeinki)
  console.log('derivada:')
  const date0 = new Date();
  const x = eosKeysHelper.getDerivedKey(account_name, password);
  const date1 = new Date();
  console.log(moment(date1).diff(moment(date0)))

  console.log('simple:')
  const date00 = new Date();
  const y = eosKeysHelper.getKey(account_name, password);
  const date01 = new Date();
  console.log(moment(date01).diff(moment(date00)))

  return process.exit(0);
})();
