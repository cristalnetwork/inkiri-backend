// const { google }         = require('googleapis');
const GoogleDriveHelper  = require('../../files/helper/googledrive.helper');

const cols = ['nomes', 'sobrenomes', 'cpf', 'email', 'nome projeto/negocio', 'IUGU alias', 'tipo conta', 'balance'];


module.exports = async (spreadsheetId, range) => {
  console.log('Fetching spreadsheet ...');
  const sheets = await GoogleDriveHelper.getSheetReader();
  const request = {spreadsheetId, range};
  try {
    const response = (await sheets.spreadsheets.values.get(request)).data;
    // TODO: Change code below to process the `response` object:
    // console.log(JSON.stringify(response, null, 2));
  } catch (err) {
    console.error(err);
    return null;
  }

  console.log('Spreadsheet loaded');
  return response.values;

};
