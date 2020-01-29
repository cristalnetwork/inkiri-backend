const GoogleDriveHelper     = require('./files/helper/googledrive.helper');
var moment                  = require('moment');

(async () => {
  
  const json = [
                [
                  "begins_at",
                  "enabled",
                  "from",
                  "last_charged",
                  "memo",
                  "periods",
                  "price",
                  "service_id",
                  "to",
                ],
                [
                  1577847600,
                  1,
                  "wawrzeniakdi",
                  0,
                  "pap|63",
                  11,
                  "9.9900 INK",
                  3,
                  "centroinkiri"
                ],
                [
                  "begins_at",
                  "enabled",
                  "from",
                  "last_charged",
                  "memo",
                  "periods",
                  "price",
                  "service_id",
                  "to"
                ],
                [  
                  1577847700,
                  0,
                  "tutinopablo1",
                  1,
                  "pap|63",
                  11,
                  "11.9900 INK",
                  2,
                  "organicvegan"
                ]
              ];
  
  const account_name = 'cristaltoken';
  const path         = 'pre-auth-debits'
    
  const my_account_name = account_name || 'cristaltoken';
  const file_name = `${moment().format('YYYY-MM-DD_HH-mm-ss')}.${path}.${my_account_name}`;
  GoogleDriveHelper.createSheet(json, file_name, my_account_name)
    .then((data) => {
      console.log (' OK:', data);
    }, (err)=>{
      console.log (' ERROR:', err);
    })
  
})();



