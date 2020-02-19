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

  const final_spreadsheet    = await getSpreadSheetCSV(SPREADSHEET_ID, SPREADSHEET_USERS_RANGE);
  if(!final_spreadsheet || final_spreadsheet.error)
  {
    console.log('ERROR#1')
    console.log(final_spreadsheet && final_spreadsheet.error)
    return process.exit(0);
  }
  
  // parse data
  const final_users           = (await parseUSERs.download(final_spreadsheet));
  if(!final_users || final_users.error)
  {
    console.log('ERROR#2')
    console.log(final_users && final_users.error)
    return process.exit(0);
  }
  console.log(JSON.stringify(parseUSERs.sort(final_users)))
  return process.exit(0);
  console.log('Done!');
  return process.exit(0);
})();

