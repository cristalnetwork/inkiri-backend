/*
  https://firebase.google.com/docs/cloud-messaging/send-message
*/

const fetch                 = require('node-fetch');
const NotificationModel     = require('../models/notifications.model');
const UserNotificationModel = require('../models/user_notifications.model');
const UserModel             = require('../../users/models/users.model');
const config                = require('../../common/config/env.config.js');
var moment                  = require('moment');
var admin                   = require("firebase-admin");

let serviceAccount          = null;
try{
  serviceAccount            = require("../../common/config/firebase.credentials.json");
}catch(ex){}

const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || (serviceAccount && serviceAccount.client_email) || null;
const FIREBASE_PRIVATE_KEY  = process.env.FIREBASE_PRIVATE_KEY || (serviceAccount && serviceAccount.private_key) || null;

if(serviceAccount)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://cristalnetwork-a4720.firebaseio.com"
  });

const getAccessToken = ()  => {
  return new Promise(function(resolve, reject) {
    var key = serviceAccount;
    var jwtClient = new google.auth.JWT(
      FIREBASE_CLIENT_EMAIL, // key.client_email,
      null,
      FIREBASE_PRIVATE_KEY, //key.private_key,
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

const pushNotifications = async (notification, userNotification) => new Promise((resolve, reject) => {
  
  if(!serviceAccount)
  {
    // return reject({error:'No firebase credentials!'});
    resolve({error:'No firebase credentials!'});
    return;
  }

  if(!userNotification || !userNotification.tokens || userNotification.tokens.length==0)
  {
    resolve({error:'No tokens'});
    return;
  }
  const notif = {
      ...notification.request.toJSON()
      , account_name :       notification.account_name
      // , created_at:          `${notification.created_at}`
      , title :              notification.notification.title
      , message :            notification.notification.message
      , body :               notification.notification.message
      , image:               'https://cristalnetwork.org/images/favicon-32x32.png'
                      
    };
  const message = {
    data:   notif,
    tokens: userNotification.tokens
  };

  console.log(' ************ SENDING PUSH NOTIF TO:', notification.account_name, message);
  console.log(' ************ PUSH NOTIF JSON:', JSON.stringify(notif));
  // Send a message to the device corresponding to the provided
  // registration token.
  admin.messaging().sendMulticast(message)
    .then((response) => {
      console.log(' ************ SENDING PUSH NOTIF OK! ==>', notification.account_name, response.successCount + ' messages were sent successfully');
      resolve(true)
      return;
    })
    .catch((error) => {
      console.log(' ************ SENDING PUSH NOTIF ERROR ==>:', error, notification.account_name);
      resolve({error:error});
      return;
    });

});


exports.pushAll = async () => {  
  
  if(!serviceAccount)
    return;
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
  const notificationsAndTokens       = await Promise.all(notificationsAndTokensProms);
  const notificationsProms           = notifications.map((pn, index) => pushNotifications(pn, notificationsAndTokens[index]))
  const notificationsResponses       = await Promise.all(notificationsProms);
  const updateDDBBProms              = notificationsResponses.map((resp, index) => 
      {
        let state = NotificationModel.STATE_SENT;
        let error = null;
        if(resp!==true)
        {
          state = NotificationModel.STATE_ERROR;
          error = JSON.stringify(resp.error);
        }
        return NotificationModel.patchById(notifications[index]._id, {state:state, error:error});
      });
  const updateDDBBResponses          = await Promise.all(updateDDBBProms);
  console.log('Done', )
}

