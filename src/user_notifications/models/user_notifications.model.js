const config   = require('../../common/config/env.config.js');
const mongoose = require('../../common/ddbb/mongo_connection.js');

const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;


const UserNotificationSchema = new Schema({
    account_name:   { type: String },
    state:          {
                      type: String
                      , enum: [ exports.STATE_NOT_PROCESSED,
                                exports.STATE_PROCESSING,
                                exports.STATE_SENT,
                                exports.STATE_ERROR
                              ]

                    },
    error:          { type: String }, 
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
        // delete ret._id;
        delete ret.__v;
        ret.original = JSON.stringify(ret.original);
        return ret;
    }
});

UserNotificationSchema.plugin(AutoIncrement, {inc_field: 'userNotificationCounterId'});

const Notification = mongoose.model('Notification', UserNotificationSchema);

exports.findById = (id) => {
  return new Promise((resolve, reject) => {
      Notification.findById(id)
          .populate('receipt')
          .exec(function (err, result) {
              if (err) {
                  reject(err);
              } else {
                  if(!result)
                  {
                    reject('NOT FOUND!!!!!!!!!');
                    return;
                  }
                  resolve (result.toJSON());
              }
          })
  });
};

exports.byIdOrNull = async (id) => {
    if(!id)
        return null;
    const  notification = await Notification.findOne({_id: id}).exec();
    return notification;
};

exports.createNotification = (notificationData) => {
    const _notification = new Notification(notificationData);
    return Notification.save();
};


exports.list = (perPage, page, query) => {
    return new Promise((resolve, reject) => {
        Notification.find(query)
            .populate('receipt')
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
  return Notification.updateMany(filter, update, options, callback);
}

exports.insertMany = (notifications) => {
  return new Promise((resolve, reject) => {
    Notification.create(notifications, (error, docs) => {
      if(error)
      {
        reject(error);
        return;
      }
      resolve(docs);
    });
  });
};

exports.removeById = (notificationId) => {
    return new Promise((resolve, reject) => {
        Notification.remove({_id: notificationId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};

// exports.byNotificationIdOrNull = async (notification_id) => {
//   if(!notification_id)
//     return null;
//   const notification = await Notification.findOne({notification_id: notification_id}).exec();
//   return notification;
// };


exports.model = Notification;