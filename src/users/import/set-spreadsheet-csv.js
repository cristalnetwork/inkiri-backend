// const { google }         = require('googleapis');
const GoogleDriveHelper  = require('../../files/helper/googledrive.helper');

module.exports = async (spreadsheetId, range, values) => {

  console.log('**************** 5.-  Write json values')
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
      console.log(' -- ERROR???#FINAL: ');
      return {error:res.data.error||'NO SE QUE PASO'}
    }
  }
  catch(e){
    return {error:e||'NO SE QUE PASO'}
  }
  
};
