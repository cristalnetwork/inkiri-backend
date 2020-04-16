const config   = require('../../common/config/env.config.js');
const mongoose = require('../../common/ddbb/mongo_connection.js');

const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;


const UserNotificationSchema = new Schema({
    account_name:   { type: String, required : true, unique : true, index: true },
    tokens:         [{ type: String , index: true,}],
   },
   { timestamps:
      { createdAt: 'created_at'
      , updatedAt: 'updated_at' }
    }
 );


UserNotificationSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
UserNotificationSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
    }
});

UserNotificationSchema.plugin(AutoIncrement, {inc_field: 'userNotificationCounterId'});

const UserNotification = mongoose.model('UserNotification', UserNotificationSchema);

exports.byIdOrNull = async (id) => {
    if(!id)
        return null;
    const  user_notification = await UserNotification.findOne({_id: id}).exec();
    return user_notification;
};

exports.byAccountNameOrNull = async (account_name) => {
    if(!account_name)
        return null;
    const  user_notification = await UserNotification.findOne({account_name: account_name.trim()}).exec();
    return user_notification;
};

exports.createUserNotification = (userNotificationData) => {
    const _user_notification = new UserNotification(userNotificationData);
    return _user_notification.save();
};


exports.list = (perPage, page, query) => {
    return new Promise((resolve, reject) => {
        UserNotification.find(query)
            .limit(perPage)
            .skip(perPage * page)
            .sort({, userNotificationCounterId: -1 })
            .exec(function (err, result) {
                if (err) {
                    reject(err);
                } else {
                  const x = result.map(user_notif => user_notif.toJSON())
                  resolve(x);
                }
            })
    });
};

exports.updateMany = async(filter, update, options, callback) => {
  return UserNotification.updateMany(filter, update, options, callback);
}

exports.insertMany = (user_notifications) => {
  return new Promise((resolve, reject) => {
    UserNotification.create(user_notifications, (error, docs) => {
      if(error)
      {
        reject(error);
        return;
      }
      resolve(docs);
    });
  });
};

exports.removeById = (user_notification_id) => {
    return new Promise((resolve, reject) => {
        UserNotification.remove({_id: user_notification_id}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};

exports.update = (account_name, user_notification) => {
    return UserNotification.findOneAndUpdate({
        account_name: account_name
        }, user_notification);
};

// exports.byNotificationIdOrNull = async (notification_id) => {
//   if(!notification_id)
//     return null;
//   const notification = await Notification.findOne({notification_id: notification_id}).exec();
//   return notification;
// };


exports.model = UserNotification;