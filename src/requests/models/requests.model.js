const config = require('../../common/config/env.config.js');
const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
// if(global.mongoose_connected!==undefined && global.mongoose_connected!=true)
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri, {useNewUrlParser: true, useUnifiedTopology: true });

exports.TYPE_DEPOSIT                  = 'type_deposit';
exports.TYPE_EXCHANGE                 = 'type_exchange';
exports.TYPE_PAYMENT                  = 'type_payment';
exports.TYPE_PROVIDER                 = 'type_provider';
exports.TYPE_SEND                     = 'type_send';
exports.TYPE_WITHDRAW                 = 'type_withdraw';
exports.TYPE_SERVICE                  = 'type_service';
exports.TYPE_PAD                      = 'type_pad';
exports.TYPE_SALARY                   = 'type_salary';
exports.TYPE_IUGU                     = 'type_iugu';

exports.STATE_REQUESTED               = 'state_requested';
exports.STATE_RECEIVED                = 'state_received';
exports.STATE_PROCESSING              = 'state_processing';
exports.STATE_REJECTED                = 'state_rejected';
exports.STATE_ACCEPTED                = 'state_accepted';
exports.STATE_ERROR                   = 'state_error';
exports.STATE_CANCELED                = 'state_canceled';
exports.STATE_REFUNDED                = 'state_refunded';
exports.STATE_REVERTED                = 'state_reverted';

exports.ATTACH_NOTA_FISCAL            = 'attach_nota_fiscal';
exports.ATTACH_BOLETO_PAGAMENTO       = 'attach_boleto_pagamento';
exports.ATTACH_COMPROBANTE            = 'attach_comprobante';

exports.ATTACH_NOTA_FISCAL_ID         = 'attach_nota_fiscal_id';
exports.ATTACH_BOLETO_PAGAMENTO_ID    = 'attach_boleto_pagamento_id';
exports.ATTACH_COMPROBANTE_ID         = 'attach_comprobante_id';

const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const requestSchema = new Schema({
    created_by:           { type: Schema.Types.ObjectId, ref: 'Users', required : true},
    requested_by:         { type: Schema.Types.ObjectId, ref: 'Users', required : true},
    from:                 { type: String, required : true},
    requested_type:       {
                            type: String
                            , enum: [exports.TYPE_DEPOSIT, exports.TYPE_EXCHANGE, exports.TYPE_PAYMENT, exports.TYPE_PROVIDER, exports.TYPE_SEND, exports.TYPE_WITHDRAW, exports.TYPE_SERVICE
                                    , exports.TYPE_IUGU, exports.TYPE_SALARY, exports.TYPE_PAD]
                          },

    amount:               { type: String },
    requested_to:         {
                            type: Schema.Types.ObjectId
                            , ref: 'Users'
                            , required: function() {
                              // return (this.requested_type == exports.TYPE_SEND || this.requested_type == exports.TYPE_PAYMENT || this.requested_type == exports.TYPE_SERVICE);
                              return (this.requested_type == exports.TYPE_SERVICE);
                            }
                          },
    to:                   { type: String },
    state:                {
                            type: String
                            , enum: [ exports.STATE_REQUESTED,
                                      exports.STATE_RECEIVED,
                                      exports.STATE_PROCESSING,
                                      exports.STATE_REJECTED,
                                      exports.STATE_ACCEPTED,
                                      exports.STATE_ERROR,
                                      exports.STATE_CANCELED,
                                      exports.STATE_REFUNDED,
                                      exports.STATE_REVERTED
                                    ]
    },
    tx_id:                { type: String },
    refund_tx_id:         { type: String ,
      required: function() {
        // return ([exports.STATE_REJECTED, exports.STATE_REVERTED, exports.STATE_REFUNDED].includes(this.requested_type));
        return ([exports.STATE_REVERTED].includes(this.requested_type));
      }
    },

    requestCounterId:     { type: Number,  unique : true},

    description:          { type: String }, // or MEMO

    [exports.ATTACH_NOTA_FISCAL_ID]:       { type: String , default:'' },
    [exports.ATTACH_BOLETO_PAGAMENTO_ID]:  { type: String , default:'' ,
      required: function() {
        return this.requested_type == exports.TYPE_PROVIDER && this.provider_extra.payment_mode==exports.PAYMENT_MODE_BOLETO;
      }
    },
    [exports.ATTACH_COMPROBANTE_ID]:       { type: String , default:''
      // , required: function() {
      //   return (this.requested_type == exports.TYPE_PROVIDER || this.requested_type == exports.TYPE_EXCHANGE) && this.state==exports.STATE_ACCEPTED;
      // }
    },

    // *********************************************************************************
    // Pre Authorized Debit
    pad: {
                period:   { type:  String, trim:true},
    },

    // *********************************************************************************
    // Deposit
    deposit_currency:     {
                            type: String,
                            required: function() {
                              return this.requested_type == exports.TYPE_DEPOSIT;
                            }
    },

    // *********************************************************************************
    // User Exchange
    bank_account:         {
                            bank_name:        { type:  String
                              , required: function() {
                                return this.requested_type == exports.TYPE_EXCHANGE;
                              }
                            }
                            , bank_keycode:        { type:  String
                              , required: function() {
                                return this.requested_type == exports.TYPE_EXCHANGE;
                              }
                            }
                            , agency:           { type:  String
                              , required: function() {
                                return this.requested_type == exports.TYPE_EXCHANGE;
                              }
                            }
                            , cc:               { type:  String
                              , required: function() {
                                return this.requested_type == exports.TYPE_EXCHANGE;
                              }
                            }
                            // type: Schema.Types.ObjectId
                            // , ref: 'BankAccounts'

    },

    // *********************************************************************************
    // Provider payment
    wages: [
            {
                account_name:   { type:  String, trim:true},
                member:         { type: Schema.Types.ObjectId, ref: 'Users'},
                position:       { type: String },
                wage:           { type: Number },
                description:    { type:  String, trim:true},
                period:         { type:  String, trim:true},
            }],
    
    // *********************************************************************************
    // Provider payment
    provider:             {
                            type: Schema.Types.ObjectId,
                            ref: 'Providers',
                            required: function() {
                              return this.requested_type == exports.TYPE_PROVIDER;
                            }
                          }, // FOR exchange
    provider_extra:       {
      // payment_vehicle:      { type: String, enum: [exports.PAYMENT_VEHICLE_INKIRI, exports.PAYMENT_VEHICLE_INSTITUTO] }
      // , payment_category:   { type: String, enum: [exports.PAYMENT_CATEGORY_ALUGEL, exports.PAYMENT_CATEGORY_INVESTIMENTO, exports.PAYMENT_CATEGORY_INSUMOS, exports.PAYMENT_CATEGORY_ANOTHER]}
      // , payment_type:       { type: String, enum: [exports.PAYMENT_TYPE_DESPESA, exports.PAYMENT_TYPE_INVESTIMENTO] }
      // , payment_mode:       { type: String, enum: [exports.PAYMENT_MODE_TRANSFER, exports.PAYMENT_MODE_BOLETO]}
      payment_vehicle:      { type: String, required: function() { return this.requested_type == exports.TYPE_PROVIDER; } } 
      , payment_category:   { type: String, required: function() { return this.requested_type == exports.TYPE_PROVIDER; } } 
      , payment_type:       { type: String, required: function() { return this.requested_type == exports.TYPE_PROVIDER; } } 
      , payment_mode:       { type: String, required: function() { return this.requested_type == exports.TYPE_PROVIDER; } } 
    },

    // *********************************************************************************
    // Service request
    service:              { type: Schema.Types.ObjectId,
                            ref: 'Services',
                            required: function() {
                              return this.requested_type == exports.TYPE_SERVICE;
                            }
                          },
    service_extra:        {
      begins_at:          { type: Date ,
                            required: function() {
                              return this.requested_type == exports.TYPE_SERVICE;
                            }
                          },
      expires_at:         { type: Date ,
                            required: function() {
                              return this.requested_type == exports.TYPE_SERVICE;
                            }
                          }
    },
    
    // *********************************************************************************
    // IUGU payment & issuing
    iugu:                 { type: Schema.Types.ObjectId, ref: 'Iugu' },

  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });


requestSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
requestSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        ret.id = ret._id;
        // delete ret._id;
        // ret.__typename = ret.requested_type;
        delete ret.__v;
        return ret;
    }
});


requestSchema.plugin(AutoIncrement, {inc_field: 'requestCounterId'});

const Request = mongoose.model('Requests', requestSchema);

exports.findById = (id) => {
  return new Promise((resolve, reject) => {
      Request.findById(id)
          .populate('created_by')
          .populate('requested_by')
          .populate('requested_to')
          .populate('provider')
          .populate('service')
          .exec(function (err, result) {
              if (err) {
                  reject(err);
              } else {
                  if(!result)
                  {
                    reject('NOT FOUND!!!!!!!!!');
                    return;
                  }
                  const req_json  = result.toJSON();
                  let xxx         = requestToUIDict(result);
                  resolve (Object.assign(req_json, xxx));

              }
          })
  });
};

exports.findByCounterId = (counterId) => {
  return new Promise((resolve, reject) => {
      Request.find({ requestCounterId : counterId})
          .populate('created_by')
          .populate('requested_by')
          .populate('requested_to')
          .populate('provider')
          .populate('service')
          .exec(function (err, result) {
              if (err) {
                  reject(err);
              } else {
                  if(!result)
                  {
                    reject('NOT FOUND!!!!!!!!!');
                    return;
                  }
                  const req_json  = result.toJSON();
                  let xxx         = requestToUIDict(result);
                  resolve (Object.assign(req_json, xxx));

              }
          })
  });

};


exports.findByIdEx = (id) => {
    return new Promise((resolve, reject) => {
      Request.findById(id)
      .exec(function (err, result) {
              if (err) {
                  reject(err);
              } else {
                  if(!result)
                  {
                    reject('request NOT FOUND!!!!!!!!!');
                    return;
                  }
                  const req_json  = result.toJSON();
                  let xxx         = requestToUIDict(result);
                  resolve (Object.assign(req_json, xxx));
              }
          })
  });
};


exports.createRequest = (requestData) => {
    const _request = new Request(requestData);
    return _request.save();
};

// exports.newRequest = (data) => {
//     let requestData = {...data,
//         requestCounterId : CounterModel.getNextSequence("requestCounterId"),
//     }
//     return Request.create(requestData);
// }

exports.list = (perPage, page, query) => {
    return new Promise((resolve, reject) => {
        Request.find(query)
            .populate('created_by')
            .populate('requested_by')
            .populate('requested_to')
            .populate('provider')
            .populate('service')
            .populate('service.created_by')
            .populate('iugu')
            .populate('wages.member')
            .limit(perPage)
            .skip(perPage * page)
            .sort({requestCounterId: -1 })
            .exec(function (err, requests) {
              if (err) {
                  reject(err);
              } else {
                const x = requests.map((req) => {
                    const req_json  = req.toJSON();
                    let xxx         = requestToUIDict(req);
                    return Object.assign(req_json, xxx);
                })
                resolve(x);
              }
            })
    });
};

const req_types = {
    [exports.TYPE_DEPOSIT] :  'DEPOSIT',
    [exports.TYPE_EXCHANGE]:  'EXCHANGE',
    [exports.TYPE_PAYMENT]:   'PAYMENT',
    [exports.TYPE_PROVIDER]:  'PROVIDER PAYMENT',
    [exports.TYPE_SEND]:      'SEND',
    [exports.TYPE_WITHDRAW]:  'WITHDRAW',
    [exports.TYPE_SERVICE]:   'SERVICE AGREEMENT'
}

getHeader = (request) => {
    return {
            header:               `${req_types[request.requested_type]}`
            , sub_header:         `You have requested a ${req_types[request.requested_type]}`
            , sub_header_ex:      `${req_types[request.requested_type]} request`
            , sub_header_admin:   `${request.requested_by.account_name} has requested a ${req_types[request.requested_type]} ${ request.to?(' to '+request.to):''}`
    }
}

getSimpleState = (request) =>
{
//   REQUESTED
// PROCESSING
// DONE
// CANCELADO
  const simpleStates = {
    [exports.STATE_REQUESTED]      : exports.STATE_REQUESTED
    , [exports.STATE_RECEIVED]     : exports.STATE_PROCESSING 
    , [exports.STATE_PROCESSING]   : exports.STATE_PROCESSING
    , [exports.STATE_REJECTED]     : exports.STATE_CANCELED 
    , [exports.STATE_ACCEPTED]     : exports.STATE_ACCEPTED
    , [exports.STATE_ERROR]        : exports.STATE_CANCELED
    , [exports.STATE_CANCELED]     : exports.STATE_CANCELED
    , [exports.STATE_REFUNDED]     : exports.STATE_CANCELED
    , [exports.STATE_REVERTED ]    : exports.STATE_CANCELED
  }
}
requestToUIDict  = (request) => {
  const headers = getHeader(request)
  let flag = { ok:true, message:'', tag:''};

  if([exports.TYPE_PROVIDER, exports.TYPE_EXCHANGE].includes(request.requested_type)
    && ![exports.STATE_REJECTED, exports.STATE_ERROR, exports.STATE_CANCELED, exports.STATE_REFUNDED, exports.STATE_REVERTED].includes(request.state)
    && (!request[exports.ATTACH_NOTA_FISCAL_ID] || request[exports.ATTACH_NOTA_FISCAL_ID].length<=0) )
  {
    flag = {
             ok:        false
             , tag:     'PENDING'
             , message: 'NOTA_FISCAL_PENDING'
            }
  }
  if([exports.TYPE_PROVIDER, exports.TYPE_EXCHANGE, exports.TYPE_WITHDRAW].includes(request.requested_type) && request.state==exports.STATE_REQUESTED && !request.tx_id)
  {
    flag = {
             ok:        false
             , tag:     'PENDING' // 'INVALID'
             , message: 'WAITING_FOR_MONEY_TRANSACTION' //'NO MONEY RECEIVED FOR THIS OPERATION!'
            }
  }

  if([exports.TYPE_PAYMENT].includes(request.requested_type) && request.state==exports.STATE_ACCEPTED && !request.tx_id)
  {
    flag = {
             ok:        false
             , tag:     'PENDING' // 'INVALID'
             , message: 'WAITING_FOR_MONEY_TRANSACTION' //'NO MONEY RECEIVED FOR THIS OPERATION!'
            }
  }
  
  if([exports.TYPE_PROVIDER, exports.TYPE_EXCHANGE, exports.TYPE_WITHDRAW].includes(request.requested_type) && request.state==exports.STATE_REFUNDED && !request.refund_tx_id)
  {
    flag = {
             ok:        false
             , tag:     'PENDING' // 'INVALID'
             , message: 'WAITING_FOR_REFUND_TRANSACTION' //'NO MONEY RECEIVED FOR THIS OPERATION!'
            }
  }

  return {
    ...headers
    , simple_state      : getSimpleState(request)
    , key               : request.id
    , block_time        : request.created_at.toISOString().split('.')[0]
    , quantity          : request.amount
    , quantity_txt      : Number(request.amount).toFixed(2) + ' ' + config.eos.token.code
    , tx_type           : request.requested_type
    , i_sent            : true
    , flag              : flag
  }
}

exports.patchRequest = (id, requestData) => {
    return Request.findOneAndUpdate({
        _id: id
        }, requestData);
};

exports.patchRequestByCounter = (counter_id, requestData) => {
    return Request.findOneAndUpdate({
        requestCounterId: counter_id
        }, requestData);
};

exports.removeById = (requestId) => {
    return new Promise((resolve, reject) => {
        Request.remove({_id: requestId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};

exports.byIdOrNull = async (_id) => {
    if(!_id)
      return null;
    const  request = await Request.findOne({_id: _id}).exec();
    return request;
};

exports.byCounterOrNull = async (counter_id) => {
    if(!counter_id)
      return null;
    const  request = await Request.findOne({requestCounterId: counter_id}).exec();
    return request;
};

exports.deleteMany = async (query) => {
  return Request.deleteMany(query)
}

exports.model = Request;