const fetch             = require('node-fetch');
const NotificationModel = require('../models/notifications.model');
const UserModel         = require('../../users/models/users.model');
const config            = require('../../common/config/env.config.js');
var moment              = require('moment');

var admin               = require("firebase-admin");

var serviceAccount = require("../../common/config/firebase.credentials.json");

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

const pushNotification = () => {
  // This registration token comes from the client FCM SDKs.
  var registrationToken = 'YOUR_REGISTRATION_TOKEN';
  var message = {
    data: {
      score: '850',
      time: '2:45'
    },
    token: registrationToken
  };

  // Send a message to the device corresponding to the provided
  // registration token.
  admin.messaging().send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });

}

// // Create a list containing up to 500 registration tokens.
// // These registration tokens come from the client FCM SDKs.
// const registrationTokens = [
//   'YOUR_REGISTRATION_TOKEN_1',
//   // …
//   'YOUR_REGISTRATION_TOKEN_N',
// ];

// const message = {
//   data: {score: '850', time: '2:45'},
//   tokens: registrationTokens,
// }

// admin.messaging().sendMulticast(message)
//   .then((response) => {
//     console.log(response.successCount + ' messages were sent successfully');


exports.pushAll = async () => {  
  
  try{
    
  }
  catch(e){
    return {error:err};
  }
}

