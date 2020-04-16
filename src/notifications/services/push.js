const fetch                 = require('node-fetch');
const NotificationModel     = require('../models/notifications.model');
const UserNotificationModel = require('../models/user_notifications.model');
const UserModel             = require('../../users/models/users.model');
const config                = require('../../common/config/env.config.js');
var moment                  = require('moment');
var admin                   = require("firebase-admin");
var serviceAccount          = require("../../common/config/firebase.credentials.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cristalnetwork-a4720.firebaseio.com"
});

const getAccessToken = ()  => {
  return new Promise(function(resolve, reject) {
    var key = serviceAccount;
    var jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      SCOPES,
      null
    );
    jwtClient.authorize(function(err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
}

// const pushNotification = (token, data) => {
//   // This registration token comes from the client FCM SDKs.
//   var message = {
//     data:  data,
//     token: token
//   };

//   // Send a message to the device corresponding to the provided registration token.
//   admin.messaging().send(message)
//     .then((response) => {
//       // Response is a message ID string.
//       console.log('Successfully sent message:', response);
//     })
//     .catch((error) => {
//       console.log('Error sending message:', error);
//     });
// }

const pushNotifications = async (notification, userNotification) => new Promise((resolve, reject) => {
  // This registration token comes from the client FCM SDKs.
  if(!userNotification || !userNotification.tokens || userNotification.tokens.length==0)
  {
    resolve({error:'No tokens'});
    return;
  }
  
  var message = {
    data:   notification.notification,
    tokens: userNotification.tokens
  };

  // Send a message to the device corresponding to the provided
  // registration token.
  admin.messaging().sendMulticast(message)
    .then((response) => {
      console.log(notification.account_name, response.successCount + ' messages were sent successfully');
      resolve(true)
      return;
    })
    .catch((error) => {
      console.log('Error sending message:', error, notification.account_name);
      resolve({error:error});
      return;
    });

});


exports.pushAll = async () => {  
  
  const notifications = await NotificationModel.listUnProcessed();

  const x  = await NotificationModel.updateMany(
                    {
                      state: NotificationModel.STATE_NOT_PROCESSED
                      ,  _id: { $in: notifications.map(notif=>notif._id) }
                    }
                    , {"state": NotificationModel.STATE_PROCESSING}
                    , null
                    , (err, writeResult) => {

                    });

  const notificationsAndTokensProms  = notifications.map(pn => UserNotificationModel.byAccountNameOrNull(pn.account_name));
  const notificationsAndTokens       = await Promises.all(notificationsAndTokensProms);
  const notificationsProms           = notifications.map((pn, index) => pushNotifications(pn, notificationsAndTokens[index]))
  const notificationsResponses       = await Promises.all(notificationsProms);
  const updateDDBBProms              = notificationsResponses.map((resp, index) => 
      {
        let state = NotificationModel.STATE_SENT;
        let error = null;
        if(resp!==true)
        {
          state = NotificationModel.STATE_ERROR;
          error = JSON.stringify(resp.error);
        }
        return NotificationModel.patchById(notifications._id, {state:state, error:error});
      });
  const updateDDBBResponses          = await Promises.all(updateDDBBProms);
  console.log('Done', )
}

