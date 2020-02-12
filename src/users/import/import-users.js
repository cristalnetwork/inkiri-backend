const getSpreadSheetCSV = require('./get-spreadsheet-csv');
const parseCSV = require('./parse-csv');
// const saveToDDBB = require('./save-to-ddbb');
// const saveToBlockchain = require('./save-to-blockchain');

if (process.env.TEST_RUN === '1') {
  console.log('=== Test run ===');
}

const SPREADSHEET_ID    = '1NW0eav806Zx9RBr9MRrqvchL1aNs5opKLmuWJ67mVQU';
const SPREADSHEET_RANGE = '3:134';

(async () => {

  // load spreadsheet
  // const spreadsheet = await getSpreadSheetCSV(process.env.SPREADSHEET_ID, process.env.SPREADSHEET_RANGE);
  const spreadsheet = await getSpreadSheetCSV(SPREADSHEET_ID, SPREADSHEET_RANGE);

  // parse data
  const json = await parseCSV(spreadsheet);

  console.log(json);
  
  console.log('Done!');
})();

