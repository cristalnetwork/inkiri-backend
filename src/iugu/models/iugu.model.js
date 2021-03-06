const config   = require('../../common/config/env.config.js');

const mongoose = require('../../common/ddbb/mongo_connection.js');

// const mongoose = require('mongoose');
// mongoose.set('useCreateIndex', true);
// mongoose.set('useFindAndModify', false);
// mongoose.connect(process.env.MONGODB_URI || config.mongo.connection_uri , {useNewUrlParser: true, useUnifiedTopology: config.mongo.useUnifiedTopology }); 

exports.STATE_NOT_PROCESSED = 'state_not_processed';
exports.STATE_PROCESSING    = 'state_processing';
exports.STATE_ISSUED        = 'state_issued';
exports.STATE_ERROR         = 'state_error';
exports.STATE_ISSUE_ERROR   = 'state_issue_error';

const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const iuguSchema = new Schema({
    amount:               { type: Number },
    iugu_id:              { type: String, unique: true },
    iugu_account:         { type: String },
    paid_at:              { type: Date },

    receipt:              { type: Schema.Types.ObjectId
                            , ref: 'Users'
                            , required: function() {
                                return (this.state === exports.STATE_ISSUED);
                            }
                          },
    receipt_alias:        { type: String },
    receipt_accountname:  { type: String },

    original:             { type: Schema.Types.Mixed },

    iuguCounterId:        { type: Number,  unique : true},

    issued_at:            { type: Date },
    issued_tx_id:         { type: String },

    error:                { type: String },
    state:                {
                            type: String
                            , enum: [ exports.STATE_NOT_PROCESSED,
                                      exports.STATE_PROCESSING,
                                      exports.STATE_ISSUED,
                                      exports.STATE_ERROR,
                                      exports.STATE_ISSUE_ERROR
                                    ]

                           }
   },
   { timestamps:
      { createdAt: 'created_at'
      , updatedAt: 'updated_at' }
    }
 );


iuguSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
iuguSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        ret.id = ret._id;
        // delete ret._id;
        delete ret.__v;
        ret.original = JSON.stringify(ret.original);
        return ret;
    }
});

iuguSchema.plugin(AutoIncrement, {inc_field: 'iuguCounterId'});

const Iugu = mongoose.model('Iugu', iuguSchema);

exports.findById = (id) => {
  return new Promise((resolve, reject) => {
      Iugu.findById(id)
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
    const  iugu = await Iugu.findOne({_id: id}).exec();
    return iugu;
};

exports.createIugu = (iuguData) => {
    const _iugu = new Iugu(iuguData);
    return _iugu.save();
};

exports.lastImported = async (iugu_account) => lastImportedImpl(iugu_account);

const lastImportedImpl = async (iugu_account) => {
  return new Promise((res, rej) => {
      Iugu.findOne({iugu_account:iugu_account})
          .populate('receipt')
          .limit(1)
          .skip(0)
          .sort({paid_at : -1, iuguCounterId: -1 })
          .exec(function (err, result) {
              if (err) {
                  return rej(err);
              } else {
                if(!result)
                  return rej('Empty table/collection!');
                return res(result.toJSON());
              }
          })
  });
}

exports.lastImportedOrNull = async (iugu_account) => {

  const iugu = await Iugu.findOne({iugu_account:iugu_account})
          .populate('receipt')
          .limit(1)
          .skip(0)
          .sort({paid_at : -1, iuguCounterId: -1 })
          .exec();

  return iugu;
};

exports.canReprocess = (invoice) => {
  return (invoice)?
    [exports.STATE_NOT_PROCESSED, exports.STATE_ERROR, exports.STATE_ISSUE_ERROR].includes(invoice.state)
    :false;
}
exports.listUnprocessed = async () => listUnprocessedImpl();

const listUnprocessedImpl = async () => {
  console.log(' >> llamarin a listUnprocessedImpl...');
  return new Promise((res, rej) => {
      Iugu.find({
                  amount : { $ne: null , $gt : 0}
                  , paid_at : { $ne: null }
                  , receipt : { $ne: null }
                  , receipt_alias : { $ne: null }
                  , receipt_accountname : { $ne: null }
                  , issued_at : null
                  , issued_tx_id : null
                  , state : exports.STATE_NOT_PROCESSED
          })
          .populate('receipt')
          .limit(25)
          // .limit(100)
          .sort({paid_at : -1, iuguCounterId: -1 })
          .exec(function (err, result) {
              if (err) {
                  return rej(err);
              } else {
                if(!result)
                  return rej('Empty table/collection!');
                return res(result.map( invoice => invoice.toJSON()));
              }
          })
  });
}

exports.list = (perPage, page, query) => {
    return new Promise((resolve, reject) => {
        Iugu.find(query)
            .populate('receipt')
            .limit(perPage)
            .skip(perPage * page)
            .sort({updated_at : -1, iuguCounterId: -1 })
            .exec(function (err, result) {
                if (err) {
                    reject(err);
                } else {
                  const x = result.map(invoice => invoice.toJSON())
                  resolve(x);
                }
            })
    });
};

exports.patchById = async (id, iuguData) => {
  // return new Promise((resolve, reject) => {
  //   Iugu.findOneAndUpdate(
  //     {_id: id}
  //     , iuguData
  //     , function (err, result) {
  //         if (err) {
  //             reject(err);
  //         } else {
  //           resolve(result);
  //         }
  //       }
  //   );
  // });
  const res = await Iugu.findOneAndUpdate({_id: id}, iuguData).exec();
  return res;
  
};

exports.updateMany = async(filter, update, options, callback) => {
  return Iugu.updateMany(filter, update, options, callback);
}

exports.insertMany = (invoices) => {
  return new Promise((resolve, reject) => {
    Iugu.create(invoices, (error, docs) => {
      if(error)
      {
        reject(error);
        return;
      }
      resolve(docs);
    });
  });
};

exports.removeById = (iuguId) => {
    return new Promise((resolve, reject) => {
        Iugu.remove({_id: iuguId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};

exports.byAccountNameOrNull = async (account_name) => {
    if(!account_name)
        return null;
    // console.log(' == >> UsersModel::byAccountNameOrNull:', account_name)
    const  _account_name = account_name?account_name.trim():'';
    const  user = await User.findOne({account_name: _account_name}).exec();
    return user;
};


exports.byIuguIdOrNull = async (iugu_id) => {
  if(!iugu_id)
    return null;
  const iugu = await Iugu.findOne({iugu_id: iugu_id}).exec();
  return iugu;
};

exports.findByIuguId = (iugu_id, null_if_not_found) => {
  return new Promise((resolve, reject) => {
      Iugu.findOne({iugu_id: iugu_id})
          .exec(function (err, result) {
              if (err) {
                reject(err);
              } else {
                  if(!result)
                  {

                    null_if_not_found?resolve(null):reject('NOT FOUND!!!!!!!!!');
                    return;
                  }
                  resolve (result.toJSON());
              }
          })
  });

};

exports.model = Iugu;