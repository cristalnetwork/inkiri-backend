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


exports.pushAll = async () => {  
  
  try{
    
  }
  catch(e){
    return {error:err};
  }
}

