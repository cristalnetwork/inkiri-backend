const config                = require('../../common/config/env.config.js');
// const NotificationModel     = require('../models/notifications.model');
const UserNotificationModel = require('../models/user_notification.model');
const UserModel             = require('../../users/models/users.model');

exports.subscribe = async (req, res) => {
  const accountName     = req.params.accountName;
  const firebaseToken   = req.params.firebaseToken;

  let user_notif = UserNotificationModel.byAccountNameOrNull()
  if(!user_notif)
    user_notif = {account_name:accountName, tokens:[firebaseToken]}
  else
  {
    if(!user_notif.tokens.includes(firebaseToken))
      user_notif.tokens.push(firebaseToken)
  }
  
  try{
    let response = null;
    if(user_notif._id){
      response = UserNotificationModel.update(account_name, user_notif);
    }  
    else{
      response = UserNotificationModel.createUserNotification(user_notif);
    }
    return res.status(201).send({id: response._id});
  }
  catch(ex){
    return res.status(400).send({error:err.errmsg});
  }
  
}

exports.unsubscribe = async (req, res) => {
  const accountName     = req.params.accountName;
  const firebaseToken   = req.params.firebaseToken;

  let user_notif = UserNotificationModel.byAccountNameOrNull()
  if(!user_notif || !user_notif.tokens.includes(firebaseToken))
    return res.status(400).send({error:'No need to unsuscribe'});

  user_notif.tokens = user_notif.tokens.filter(token=>token!=firebaseToken)
  
  try{
    let response = UserNotificationModel.update(account_name, user_notif);
    return res.status(201).send({id: response._id});
  }
  catch(ex){
    return res.status(400).send({error:err.errmsg});
  }
}