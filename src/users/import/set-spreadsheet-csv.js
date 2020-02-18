// const { google }         = require('googleapis');
const GoogleDriveHelper  = require('../../files/helper/googledrive.helper');

module.exports = async (spreadsheetId, range, values) => {

  console.log('**************** Write spreadsheet values', spreadsheetId, range)
  const resource = {
    values:values,
  };

  try{
    const sheets = await GoogleDriveHelper.getSheetReader();
    const res = await sheets.spreadsheets.values.update({
                    spreadsheetId      : spreadsheetId
                    , range            : range
                    , valueInputOption : "RAW"
                    , resource         : resource
                  });
    // console.log(' -- retornoo.....: ', res);
    if(res && res.status==200)
    {
      console.log(' -- OK#2: ');
      // resolve(spreadsheetId)
      // return;
      return {spreadsheetId:spreadsheetId}
    }
    else{
      console.log(' -- write spreadsheet ERROR ');
      return {error:res.data.error||'NO SE QUE PASO'}
    }
  }
  catch(e){
    console.log(' -- write spreadsheet ERROR: ', e);
    return {error:e||'NO SE QUE PASO'}
  }
  
};
