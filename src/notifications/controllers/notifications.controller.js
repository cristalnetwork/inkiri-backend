const config                = require('../../common/config/env.config.js');
// const NotificationModel     = require('../models/notifications.model');
const UserNotificationModel = require('../models/user_notifications.model');
const UserModel             = require('../../users/models/users.model');

exports.subscribe = async (req, res) => {
  const accountName     = req.params.accountName;
  const firebaseToken   = req.params.firebaseToken;

  let user_notif = await UserNotificationModel.byAccountNameOrNull(accountName)
  if(!user_notif || user_notif==null)
  {  
    user_notif = {account_name:accountName, tokens:[firebaseToken]};
    // console.log('notificatinos::subscribe::ABOUT TO CREATE:', user_notif)
  }
  else
  {
    if(user_notif && user_notif.tokens && !user_notif.tokens.includes(firebaseToken))
      user_notif.tokens.push(firebaseToken)
    // console.log('notificatinos::subscribe::ABOUT TO UPDATE:', user_notif)
  }
  if(!user_notif || !user_notif.account_name)
    return res.status(400).send({error:'Account name is not defined!!??'});
  
  try{
    let response = null;
    if(user_notif._id){
      response = await UserNotificationModel.update(accountName, user_notif);
    }  
    else{
      response = await UserNotificationModel.createUserNotification(user_notif);
    }
    return res.status(201).send({id: response._id});
  }
  catch(ex){
    console.log('notificatinos::subscribe::ERROR:', ex)
    return res.status(400).send({error:JSON.stringify(ex)});
  }
  
}

exports.unsubscribe = async (req, res) => {
  const accountName     = req.params.accountName;
  const firebaseToken   = req.params.firebaseToken;

  let user_notif = await UserNotificationModel.byAccountNameOrNull()
  if(!user_notif || !user_notif.tokens.includes(firebaseToken))
    return res.status(400).send({error:'No need to unsuscribe'});

  user_notif.tokens = user_notif.tokens.filter(token=>token!=firebaseToken)
  
  try{
    let response = await UserNotificationModel.update(accountName, user_notif);
    return res.status(201).send({id: response._id});
  }
  catch(ex){
    return res.status(400).send({error:err.errmsg});
  }
}