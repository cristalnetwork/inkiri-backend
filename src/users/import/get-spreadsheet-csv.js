// const { google }         = require('googleapis');
const GoogleDriveHelper  = require('../../files/helper/googledrive.helper');

module.exports = async (spreadsheetId, range) => {
  console.log('Fetching spreadsheet ...');
  const sheets = await GoogleDriveHelper.getSheetReader();
  const request = {spreadsheetId, range};
  try {
    const response = (await sheets.spreadsheets.values.get(request)).data;
    console.log('Spreadsheet loaded');
    return response.values;
  } catch (err) {
    console.error(err);
    return null;
  }
};
