const getSpreadSheetCSV = require('./get-spreadsheet-csv');
const parseCSV = require('./parse-csv');
const setSpreadSheetCSV = require('./set-spreadsheet-csv');
// const saveToDDBB = require('./save-to-ddbb');
// const saveToBlockchain = require('./save-to-blockchain');

if (process.env.TEST_RUN === '1') {
  console.log('=== Test run ===');
}

const SPREADSHEET_ID           = '1NW0eav806Zx9RBr9MRrqvchL1aNs5opKLmuWJ67mVQU';
const SPREADSHEET_RANGE        = '3:134';
const SPREADSHEET_UPDATE_RANGE = 'processed!I3';
const SPREADSHEET_INSERT_RANGE = 'full_users!A2';

(async () => {

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
  const json           = await parseCSV(spreadsheet);
  if(!json || json.error)
  {
    console.log('ERROR#2')
    console.log(json && json.error)
    return process.exit(0);
  }

  // write values
  const values         = json.account_names.map(account_name => [account_name]);
  const write_response = await setSpreadSheetCSV(SPREADSHEET_ID, SPREADSHEET_UPDATE_RANGE, values);
  if(!write_response || write_response.error)
  {
    console.log('ERROR#3')
    console.log(write_response && write_response.error)
    return process.exit(0);
  }

  const users          = json.users.map(user => Object.values(user));
  const write_response2 = await setSpreadSheetCSV(SPREADSHEET_ID, SPREADSHEET_INSERT_RANGE, users);
  if(!write_response2 || write_response2.error)
  {
    console.log('ERROR#4')
    console.log(write_response2 && write_response2.error)
    return process.exit(0);
  }

  console.log('Done!');
  return process.exit(0);
})();

