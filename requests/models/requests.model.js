const config = require('../../common/config/env.config.js');
const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri || 'mongodb://localhost/inkiri');

const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;
 
const requestSchema = new Schema({
    created_by:           { type: Schema.Types.ObjectId, ref: 'Users', required : true},
    requested_by:         { type: Schema.Types.ObjectId, ref: 'Users', required : true},
    from:                 { type: String, required : true},
    requested_type:       { type: String },    // deposit, exchange, payment, provider, send, withdraw; service
    amount:               { type: String },
    requested_to:         { type: Schema.Types.ObjectId, ref: 'Users'},   // AccountName or Schema.Types.ObjectId
    to:                   { type: String },
    state:                { type: String },   // 1.- requested, 2.- processing, 4.- rejected, 8.- accepted, 16.- error, 32.- concluded
    tx_id:                { type: String , unique : true},
    description:          { type: String },    // FOR: provider, payment, send, 
    nota_fiscal_url:      { type: String , default:'' },    // FOR exchange, provider
    comprobante_url:      { type: String , default:'' },    // FOR exchange, provider
    
    deposit_currency:     { type: String , default:'' },
    requestCounterId:     { type: Number,  unique : true},
    // bank_account:         { type: Schema.Types.ObjectId, ref: 'BankAccounts'}, // FOR exchange
    // service:              { type: Schema.Types.ObjectId, ref: 'Services'}, // FOR service

  }, 
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });


requestSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
requestSchema.set('toJSON', {
    virtuals: true
});

requestSchema.findById = function (cb) {
    return this.model('Requests').find({id: this.id}, cb);
};

requestSchema.plugin(AutoIncrement, {inc_field: 'requestCounterId'});

const Request = mongoose.model('Requests', requestSchema);

const TYPE_DEPOSIT     = 'type_deposit';
const TYPE_EXCHANGE    = 'type_exchange';
const TYPE_PAYMENT     = 'type_payment';
const TYPE_PROVIDER    = 'type_provider'; 
const TYPE_SEND        = 'type_send';
const TYPE_WITHDRAW    = 'type_withdraw'; 
const TYPE_SERVICE     = 'type_service';

const STATE_REQUESTED  = 'state_requested';
const STATE_PROCESSING = 'state_processing';
const STATE_REJECTED   = 'state_rejected';
const STATE_ACCEPTED   = 'state_accepted';
const STATE_ERROR      = 'state_error';
const STATE_CONCLUDED  = 'state_concluded';

exports.TYPE_DEPOSIT;
exports.TYPE_EXCHANGE;
exports.TYPE_PAYMENT;
exports.TYPE_PROVIDER;
exports.TYPE_SEND;
exports.TYPE_WITHDRAW;
exports.TYPE_SERVICE;
exports.STATE_REQUESTED;
exports.STATE_PROCESSING;
exports.STATE_REJECTED;
exports.STATE_ACCEPTED;
exports.STATE_ERROR;
exports.STATE_CONCLUDED;
exports.findById = (id) => {
    return Request.findById(id)
        .then((result) => {
            result = result.toJSON();
            delete result._id;
            delete result.__v;
            return result;
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
            .limit(perPage)
            .skip(perPage * page)
            .exec(function (err, requests) {
                if (err) {
                    reject(err);
                } else {
                  const x = requests.map(req => toUIDict(req))
                  // console.log(' ** requests:', requests)
                  // console.log(' ** mapped:', x)
                  resolve(x);
                }
            })
    });
};

getHeader = (request) => {
    if(request.state==STATE_REQUESTED)
        return {
            sub_header:'You have requested a '+request.requested_type
            , sub_header_admin:request.requested_by.account_name + ' has requested a ' + request.requested_type}
    if(request.state==STATE_CONCLUDED)
        return {
            sub_header:'You '+request.requested_type + ' request concluded succesfully!'
            , sub_header_admin:request.requested_type + ' requested by ' + request.requested_by.account_name + ' concluded succesfully!'}
    
    // if(request.state==STATE_PROCESSING)
    // if(request.state==STATE_REJECTED)
    // if(request.state==STATE_ACCEPTED)
    // if(request.state==STATE_ERROR)
    return {
        sub_header:'You have requested a '+request.requested_type
        , sub_header_admin:request.requested_by.account_name + ' has requested a ' + request.requested_type}

}
toUIDict  = (request) => {
  const headers = getHeader(request)
  return{
    ...request._doc
    , ...headers
    , block_time        : request.created_at.toISOString().split('.')[0]
    // , sub_header        : 'You have requested a '+request.requested_type
    // , sub_header_admin  : request.requested_by.account_name + ' has requested a ' + request.requested_type
    , quantity          : request.amount
    , tx_type           : request.requested_type  
    // , tx_name
    // , tx_code
    // , tx_subcode
    , i_sent            : true
    , id                : request._id 
    // , header
    , quantity_txt      : Number(request.amount).toFixed(2) + ' ' + request._doc.deposit_currency
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
