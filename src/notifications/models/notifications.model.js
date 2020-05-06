const config   = require('../../common/config/env.config.js');
const mongoose = require('../../common/ddbb/mongo_connection.js');

const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

exports.STATE_NOT_PROCESSED = 'state_not_processed';
exports.STATE_PROCESSING    = 'state_processing';
exports.STATE_SENT          = 'state_sent';
exports.STATE_ERROR         = 'state_error';


const notificationSchema = new Schema({
    account_name:   { type: String },
    notification:   { title:                 String
                      , message:             String
                      , request_counter_id:  Number
                      , amount:              Number
                    },
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


notificationSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
notificationSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        ret.id = ret._id;
        // delete ret._id;
        delete ret.__v;
        ret.original = JSON.stringify(ret.original);
        return ret;
    }
});

notificationSchema.plugin(AutoIncrement, {inc_field: 'notificationCounterId'});

const Notification = mongoose.model('Notification', notificationSchema);

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
    return _notification.save();
};


exports.list = (perPage, page, query) => {
    return new Promise((resolve, reject) => {
        Notification.find(query)
            .limit(perPage)
            .skip(perPage * page)
            .sort({notificationCounterId: -1 })
            .exec(function (err, result) {
                if (err) {
                    reject(err);
                } else {
                  const x = result.map(notif => notif.toJSON())
                  resolve(x);
                }
            })
    });
};

exports.listUnProcessed = () => exports.list(100, 0, {state:exports.STATE_NOT_PROCESSED});

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

exports.patchById = (_id, notificationData) => {
    return Notification.findOneAndUpdate({
        _id: _id
        }, notificationData);
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