const UsersModel        = require('../models/users.model');
const getSpreadSheetCSV = require('./get-spreadsheet-csv');
const parseCSV          = require('./parse-csv');
const setSpreadSheetCSV = require('./set-spreadsheet-csv');
const buildAccounts     = require('./build-accounts');
// const saveToDDBB = require('./save-to-ddbb');
// const saveToBlockchain = require('./save-to-blockchain');
const parseUSERs          = require('./parse-users');

if (process.env.TEST_RUN === '1') {
  console.log('=== Test run ===');
}

const SPREADSHEET_ID           = '1NW0eav806Zx9RBr9MRrqvchL1aNs5opKLmuWJ67mVQU';
const SPREADSHEET_RANGE        = '3:134';
const SPREADSHEET_UPDATE_RANGE = 'processed!I3';
const SPREADSHEET_INSERT_RANGE = 'full_users!A2';
const SPREADSHEET_USERS_RANGE  = 'full_users!2:133';

(async () => {

  // const final_spreadsheet    = await getSpreadSheetCSV(SPREADSHEET_ID, SPREADSHEET_USERS_RANGE);
  // if(!final_spreadsheet || final_spreadsheet.error)
  // {
  //   console.log('ERROR#1')
  //   console.log(final_spreadsheet && final_spreadsheet.error)
  //   return process.exit(0);
  // }
  
  // // parse data
  // const final_users           = (await parseUSERs(final_spreadsheet));
  // if(!final_users || final_users.error)
  // {
  //   console.log('ERROR#2')
  //   console.log(final_users && final_users.error)
  //   return process.exit(0);
  // }
  // console.log(JSON.stringify(final_users))
  // return process.exit(0);


  // load spreadsheet
  // const spreadsheet = await getSpreadSheetCSV(process.env.SPREADSHEET_ID, process.env.SPREADSHEET_RANGE);
  const spreadsheet    = await getSpreadSheetCSV(SPREADSHEET_ID, SPREADSHEET_RANGE);
  if(!spreadsheet || spreadsheet.error)
  {
    console.log('ERROR#1')
    console.log(spreadsheet && spreadsheet.error)
    return process.exit(0);
  }
  
  // parse data
  const users           = (await parseCSV(spreadsheet));
  if(!users || users.error)
  {
    console.log('ERROR#2')
    console.log(users && users.error)
    return process.exit(0);
  }

  // build accounts
  const accounts        = await buildAccounts(users);
  if(!accounts || accounts.error)
  {
    console.log('ERROR#3')
    console.log(accounts && accounts.error)
    return process.exit(0);
  }


  // write values
  const accountname_pubkey_pairs = accounts.map(account => [account.account_name, account.public_key]);
  const write_response = await setSpreadSheetCSV(SPREADSHEET_ID, SPREADSHEET_UPDATE_RANGE, accountname_pubkey_pairs);
  if(!write_response || write_response.error)
  {
    console.log('ERROR#4')
    console.log(write_response && write_response.error)
    return process.exit(0);
  }
  
  const accounts_values  = accounts.map(account => Object.values(account));
  const write_response2 = await setSpreadSheetCSV(SPREADSHEET_ID, SPREADSHEET_INSERT_RANGE, accounts_values);
  if(!write_response2 || write_response2.error)
  {
    console.log('ERROR#5')
    console.log(write_response2 && write_response2.error)
    return process.exit(0);
  }
  

  // const accounts_count = accounts.length;
  // const responses      = accounts.forEach( (account, idx) => {
  //     const target = Object.assign({}, account); 
  //     delete account.password;
  //     if(idx==0)
  //     {
  //       return UsersModel.createUser(target) ;
        
  //     }

  // });

  // Promise.all(responses.map(response => {
  //   console.log(response)
  //   console.log('----------------------------------------')
  // }))

  console.log('Done!');
  return process.exit(0);
})();

