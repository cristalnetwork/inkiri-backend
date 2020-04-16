const config             = require('../../common/config/env.config.js');
const NotificationModel  = require('../models/notifications.model');
const UserModel          = require('../../users/models/users.model');

exports.subscribe = async (req, res) => {
  res.status(201).send({id: result._id});
  res.status(400).send({error:err.errmsg});
}

exports.unsubscribe = async (req, res) => {
  res.status(201).send({id: result._id});
  res.status(400).send({error:err.errmsg});
}