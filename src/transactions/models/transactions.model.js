const config = require('../../common/config/env.config.js');
const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

// if(global.mongoose_connected!==undefined && global.mongoose_connected!=true)
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri, {useNewUrlParser: true});

const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

exports.STATE_NOT_PROCESSED = 'state_not_processed';
exports.STATE_PROCESSING    = 'state_processing';
exports.STATE_PROCESSED     = 'state_processed';
exports.STATE_ERROR         = 'state_error';

const transactionsSchema = new Schema({
    
    tx_id:                  { type: String, index: true, unique: true },
    block_num:              { type: Number, index: true },
    block_id:               { type: String, index: true },
    block_timestamp:        { type: Date, index: true },       

    trace: {
      id:                   { type: String, index: true, unique: true },
      topLevelActions: [
        {
          account:          { type: String },
          name:             { type: String, index: true },
          authorization: [
            {
              actor:        { type: String },
              permission:   { type: String }
            }
          ],
          data: {
            memo:           { type: String, index: true },
            quantity:       { type: String },
            to:             { type: String, index: true },
            from:           { type: String, index: true },
            begins_at:      { type: String },
            enabled:        { type: String },
            last_charged:   { type: String },
            periods:        { type: String },
            price:          { type: String },
            service_id:     { type: String },
            fee:            { type: String },
            overdraft:      { type: String },
            account_type:   { type: String },
            state:          { type: String },
            
          }
        }
      ]
    },

    from_account_name:    { type: String, index: true },
    from:                 { type: Schema.Types.ObjectId
                            , ref: 'Users'
                          },

    to_account_name:      { type: String, index: true },
    to:                   { type: Schema.Types.ObjectId
                            , ref: 'Users'
                          },

    request:              { type: Schema.Types.ObjectId
                            , ref: 'Request'
                          },

    amount:               { type:  Number },

    state:                {
                            type: String
                            , enum: [ exports.STATE_NOT_PROCESSED
                                      , exports.STATE_PROCESSING
                                      , exports.STATE_PROCESSED
                                      , exports.STATE_ERROR]
                           }
   },
   { timestamps:
      { createdAt: 'created_at'
      , updatedAt: 'updated_at' }
    }
 );


transactionsSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
transactionsSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        delete ret.__v;
        return ret;
    }
});

transactionsSchema.plugin(AutoIncrement, {inc_field: 'transactionCounterId'});

const Transaction = mongoose.model('Transaction', transactionsSchema);

exports.findById = (id) => {
  return new Promise((resolve, reject) => {
      Transaction.findById(id)
          .populate('from')
          .populate('to')
          .populate('request')
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

exports.findTxIds = (tx_ids) => {
  const query = { tx_id : { $in : tx_ids}};
  return Transaction.find(query);
};


exports.createTransaction = (txData) => {
    const _tx = new Transaction(txData);
    _tx.state = exports.STATE_NOT_PROCESSED;
    return _tx.save();
};

exports.lastImported = async () => lastImportedImpl();

const lastImportedImpl = async () => {
  return new Promise((res, rej) => {
      Transaction.findOne()
          .limit(1)
          .skip(0)
          .sort({block_num : -1, transactionCounterId: -1, block_timestamp: -1 })
          .exec(function (err, result) {
              if (err) {
                  return rej(err);
              } else {
                if(!result)
                  // return rej('Empty table/collection!');
                  return res(null);
                return res(result.toJSON());
              }
          })
  });
}

exports.listUnprocessed = async (limit=100, skip=0) => listUnprocessedImpl(limit, skip);

const listUnprocessedImpl = async (limit=100, skip=0) => {
  const query = {state : exports.STATE_NOT_PROCESSED};
  return Transaction.find(query)
            .limit(limit)
            .skip(skip)
            .sort({block_num : 1, transactionCounterId: 1, block_timestamp: 1 })
            .exec()
  
}

exports.list = (perPage, page, query) => {
    return new Promise((resolve, reject) => {
        Transaction.find(query)
            .populate('from')
            .populate('to')
            .populate('request')
            .limit(perPage)
            .skip(perPage * page)
            .sort({block_num : -1, transactionCounterId: -1, block_timestamp: -1 })
            .exec(function (err, result) {
                if (err) {
                    reject(err);
                } else {
                  const x = result.map(tx => tx.toJSON())
                  resolve(x);
                }
            })
    });
};

exports.patchById = async (id, txData) => {
  return new Promise((resolve, reject) => {
    Transaction.findOneAndUpdate(
      {_id: id}
      , txData
      , function (err, result) {
          if (err) {
              reject(err);
          } else {
            resolve(result);
          }
        }
    );
  });
};

exports.updateMany = async(filter, update, options, callback) => {
  return Transaction.updateMany(filter, update, options, callback);
}

exports.insertMany = (txs) => {
  return new Promise( async (resolve, reject) => {

    // let _already_inserted         = null;
    // try {
    //   _already_inserted           = await Promise.all(
    //     txs.map(
    //       async (tx) => {
    //         return exports.byTxIdOrNull(tx.tx_id);
    //       }
    //     )    
    //   );
    // } catch (e) {
    //   console.log('Promise.all ERROR: ', JSON.stringify(e))
    // } 

    // const my_txs = txs.filter( tx => !_already_inserted.includes(tx.tx_id) )
    const my_txs = txs;

    Transaction.create(my_txs, (error, docs) => {
      if(error)
      {
        reject(error);
        return;
      }
      resolve(docs);
    });
  });
};

exports.deleteMany = async (query) => {
  return Transaction.deleteMany(query)
}

exports.removeById = (txId) => {
    return new Promise((resolve, reject) => {
        Transaction.remove({_id: txId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};

exports.byTxIdOrNull = async (tx_id) => {
    if(!tx_id)
      return null;

    const  tx = await Transaction.findOne({tx_id: tx_id}).exec();
    return tx;
};

exports.model = Transaction;