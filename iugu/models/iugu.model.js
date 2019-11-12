const config = require('../../common/config/env.config.js');
const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri || 'mongodb://localhost/inkiri');

exports.STATE_NOT_PROCESSED = 'state_not_processed';
exports.STATE_ISSUED        = 'state_issued';
exports.STATE_ERROR         = 'state_error';

const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const iuguSchema = new Schema({
    amount:               { type: Number },
    iugu_id:              { type: String, unique: true },
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
                                      exports.STATE_ISSUED,
                                      exports.STATE_ERROR
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
        delete ret._id;
        delete ret.__v;
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

exports.createIugu = (iuguData) => {
    const _iugu = new Iugu(iuguData);
    return _iugu.save();
};

exports.lastImported = async () => lastImportedImpl();

const lastImportedImpl = async () => {
  return new Promise((res, rej) => {
      Iugu.findOne()
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

exports.list = (perPage, page, query) => {
    return new Promise((resolve, reject) => {
        Iugu.find(query)
            .populate('receipt')
            .limit(perPage)
            .skip(perPage * page)
            .sort({iuguCounterId: -1 })
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

exports.patchById = (id, iuguData) => {
    return Iugu.findOneAndUpdate({
        _id: id
        }, iuguData);
};

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

exports.findByIuguId = (iugu_id) => {
    return Iugu.find({iugu_id: iugu_id});
};