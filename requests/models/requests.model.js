const config = require('../../common/config/env.config.js');
const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri || 'mongodb://localhost/inkiri');

exports.TYPE_DEPOSIT                  = 'type_deposit';
exports.TYPE_EXCHANGE                 = 'type_exchange';
exports.TYPE_PAYMENT                  = 'type_payment';
exports.TYPE_PROVIDER                 = 'type_provider';
exports.TYPE_SEND                     = 'type_send';
exports.TYPE_WITHDRAW                 = 'type_withdraw';
exports.TYPE_SERVICE                  = 'type_service';

exports.STATE_REQUESTED               = 'state_requested';
exports.STATE_PROCESSING              = 'state_processing';
exports.STATE_REJECTED                = 'state_rejected';
exports.STATE_ACCEPTED                = 'state_accepted';
exports.STATE_ERROR                   = 'state_error';
exports.STATE_CONCLUDED               = 'state_concluded';
exports.STATE_CANCELED                = 'state_canceled';

exports.PAYMENT_VEHICLE               = 'payment_vehicle';
exports.PAYMENT_VEHICLE_INKIRI        = 'payment_vehicle_inkiri';
exports.PAYMENT_VEHICLE_INSTITUTO     = 'payment_vehicle_institute';

exports.PAYMENT_CATEGORY              = 'payment_category';
exports.PAYMENT_CATEGORY_ALUGEL       = 'payment_category_alugel';
exports.PAYMENT_CATEGORY_INVESTIMENTO = 'payment_category_investimento';
exports.PAYMENT_CATEGORY_INSUMOS      = 'payment_category_insumos';
exports.PAYMENT_CATEGORY_ANOTHER      = 'payment_category_another';

exports.PAYMENT_TYPE                  = 'payment_type';
exports.PAYMENT_TYPE_DESPESA          = 'payment_type_despesa';
exports.PAYMENT_TYPE_INVESTIMENTO     = 'payment_type_investimento';

exports.PAYMENT_MODE                  = 'payment_mode';
exports.PAYMENT_MODE_TRANSFER         = 'payment_mode_transfer';
exports.PAYMENT_MODE_BOLETO           = 'payment_mode_boleto';

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
                            , enum: [exports.TYPE_DEPOSIT, exports.TYPE_EXCHANGE, exports.TYPE_PAYMENT, exports.TYPE_PROVIDER, exports.TYPE_SEND, exports.TYPE_WITHDRAW, exports.TYPE_SERVICE]
                          },


    amount:               { type: String },

    requested_to:         {
                            type: Schema.Types.ObjectId
                            , ref: 'Users'
                            , required: function() {
                              return (this.requested_type == exports.TYPE_SEND || this.requested_type == exports.TYPE_PAYMENT || this.requested_type == exports.TYPE_SERVICE);
                            }
                          },
    to:                   { type: String },

    state:                {
                            type: String
                            , enum: [ exports.STATE_REQUESTED,
                                      exports.STATE_PROCESSING,
                                      exports.STATE_REJECTED,
                                      exports.STATE_ACCEPTED,
                                      exports.STATE_ERROR,
                                      exports.STATE_CONCLUDED,
                                      exports.STATE_CANCELED]
                          },

    tx_id:                { type: String },

    requestCounterId:     { type: Number,  unique : true},

    description:          { type: String }, // or MEMO

    // nota_fiscal_url:      { type: String , default:'' },    // FOR exchange, provider
    // boleto_pagamento:     { type: String , default:'' },    // FOR exchange, provider
    // comprobante_url:      { type: String , default:'' },    // FOR exchange, provider

    [exports.ATTACH_NOTA_FISCAL_ID]:       { type: String , default:'' },
    [exports.ATTACH_BOLETO_PAGAMENTO_ID]:  { type: String , default:'' ,
      required: function() {
        return this.requested_type == exports.TYPE_PAYMENT && this.provider_extra.payment_mode==exports.PAYMENT_MODE_BOLETO;
      }
    },
    [exports.ATTACH_COMPROBANTE_ID]:       { type: String , default:'' ,
      required: function() {
        return (this.requested_type == exports.TYPE_PROVIDER || this.requested_type == exports.TYPE_EXCHANGE) && this.state==exports.STATE_ACCEPTED;
      }
    },

    //deposit
    deposit_currency:     {
                            type: String,
                            required: function() {
                              return this.requested_type == exports.TYPE_DEPOSIT;
                            }
    },
    // User Exchange
    bank_account:         {
                            type: Schema.Types.ObjectId
                            , ref: 'BankAccounts'
                            , required: function() {
                              return this.requested_type == exports.TYPE_EXCHANGE;
                            }
    },
    // Provider payment
    provider:             {
                            type: Schema.Types.ObjectId,
                            ref: 'Providers',
                            required: function() {
                              return this.requested_type == exports.TYPE_PROVIDER;
                            }
                          }, // FOR exchange
    provider_extra:       {
      payment_vehicle:      { type: String, enum: [exports.PAYMENT_VEHICLE_INKIRI, exports.PAYMENT_VEHICLE_INSTITUTO] }
      , payment_category:   { type: String, enum: [exports.PAYMENT_CATEGORY_ALUGEL, exports.PAYMENT_CATEGORY_INVESTIMENTO, exports.PAYMENT_CATEGORY_INSUMOS, exports.PAYMENT_CATEGORY_ANOTHER]}
      , payment_type:       { type: String, enum: [exports.PAYMENT_TYPE_DESPESA, exports.PAYMENT_TYPE_INVESTIMENTO] }
      , payment_mode:       { type: String, enum: [exports.PAYMENT_MODE_TRANSFER, exports.PAYMENT_MODE_BOLETO]}

    }
    // service:              { type: Schema.Types.ObjectId, ref: 'Services'}, // FOR service

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
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

// /**
//  * toJSON implementation
//  */
// requestSchema.options.toJSON = {
//     transform: function(doc, ret, options) {
//         ret.id = ret._id;
//         delete ret._id;
//         delete ret.__v;
//         return ret;
//     }
// };

// requestSchema.findById = function (cb) {
//     return this.model('Requests').find({id: this.id}, cb);
// };

requestSchema.plugin(AutoIncrement, {inc_field: 'requestCounterId'});

const Request = mongoose.model('Requests', requestSchema);

// exports.TYPE_DEPOSIT     = 'type_deposit';
// exports.TYPE_EXCHANGE    = 'type_exchange';
// exports.TYPE_PAYMENT     = 'type_payment';
// exports.TYPE_PROVIDER    = 'type_provider';
// exports.TYPE_SEND        = 'type_send';
// exports.TYPE_WITHDRAW    = 'type_withdraw';
// exports.TYPE_SERVICE     = 'type_service';
// exports.STATE_REQUESTED  = 'state_requested';
// exports.STATE_PROCESSING = 'state_processing';
// exports.STATE_REJECTED   = 'state_rejected';
// exports.STATE_ACCEPTED   = 'state_accepted';
// exports.STATE_ERROR      = 'state_error';
// exports.STATE_CONCLUDED  = 'state_concluded';
// exports.STATE_CANCELED   = 'state_canceled';
exports.findByIdXX = (id) => {
  return new Promise((resolve, reject) => {
      Request.findById(id)
          .populate('created_by')
          .populate('requested_by')
          .populate('requested_to')
          .populate('provider')
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

exports.findById = (id) => {
    // return Request.findOne({
    //     _id: id
    //     });
    return new Promise((resolve, reject) => {
      Request.findById(id)    .exec(function (err, result) {
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
            .limit(perPage)
            .skip(perPage * page)
            .sort({requestCounterId: -1 })
            .exec(function (err, requests) {
                if (err) {
                    reject(err);
                } else {
                //   resolve(requests);
                //   const x = requests.map(req => toUIDict(req))
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

getHeader = (request) => {
    const req_types = {
        [exports.TYPE_DEPOSIT] : ' DEPOSIT',
        [exports.TYPE_EXCHANGE]: ' EXCHANGE',
        [exports.TYPE_PAYMENT]: ' PAYMENT',
        [exports.TYPE_PROVIDER]: ' PROVIDER PAYMENT',
        [exports.TYPE_SEND]: ' SEND',
        [exports.TYPE_WITHDRAW]: ' WITHDRAW',
        [exports.TYPE_SERVICE]: ' SERVICE AGREEMENT',
    }

    if(request.state==exports.STATE_REQUESTED)
        return {
                sub_header:         'You have requested a '+ req_types[request.requested_type]
            ,   sub_header_admin:   request.requested_by.account_name + ' has requested a ' + req_types[request.requested_type]}
    if(request.state==exports.STATE_CONCLUDED)
        return {
                sub_header:         'Your '+req_types[request.requested_type] + ' request concluded succesfully!'
            ,   sub_header_admin:   req_types[request.requested_type] + ' requested by ' + request.requested_by.account_name + ' concluded succesfully!'}

    // if(request.state==STATE_PROCESSING)
    // if(request.state==STATE_REJECTED)
    // if(request.state==STATE_ACCEPTED)
    // if(request.state==STATE_ERROR)
    return {
        sub_header:          'You have requested a '+request.requested_type
        , sub_header_admin:  request.requested_by.account_name + ' has requested a ' + request.requested_type
    }

}
requestToUIDict  = (request) => {
  const headers = getHeader(request)
  return {
     ...headers
    , key               : request.id
     , block_time        : request.created_at.toISOString().split('.')[0]
     , quantity          : request.amount
     , quantity_txt      : Number(request.amount).toFixed(2) + ' ' + request._doc.deposit_currency
     , tx_type           : request.requested_type
     , i_sent            : true
    // , tx_name
    // , tx_code
    // , tx_subcode
  }
}
// [{"nota_fiscal_url":"","comprobante_url":"","deposit_currency":"IK$","_id":"5d5c152c8c3a466b65e3c2f3","requested_type":"type_deposit","amount":"44.00","created_by":{"_id":"5d5bf05ffe092b38101f018f","account_name":"inkpersonal1","first_name":"fn","last_name":"ln","email":"inkpersonal1@gmail.com","created_at":"2019-08-20T13:06:39.506Z","updatedAt":"2019-08-20T14:08:04.153Z","userCounterId":6,"__v":0,"to_sign":"5KHxDfqZBrHgR5i1Nw82LB8J2TcyveRh9ZndzaMhzUvyQEwiaW7","id":"5d5bf05ffe092b38101f018f"},"from":"inkpersonal1","requested_by":{"_id":"5d5bf05ffe092b38101f018f","account_name":"inkpersonal1","first_name":"fn","last_name":"ln","email":"inkpersonal1@gmail.com","created_at":"2019-08-20T13:06:39.506Z","updatedAt":"2019-08-20T14:08:04.153Z","userCounterId":6,"__v":0,"to_sign":"5KHxDfqZBrHgR5i1Nw82LB8J2TcyveRh9ZndzaMhzUvyQEwiaW7","id":"5d5bf05ffe092b38101f018f"},"state":"state_requested","created_at":"2019-08-20T15:43:40.266Z","updatedAt":"2019-08-20T15:43:40.266Z","requestCounterId":1,"__v":0,"id":"5d5c152c8c3a466b65e3c2f3"}]


exports.patchRequest = (id, requestData) => {
    return Request.findOneAndUpdate({
        _id: id
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
