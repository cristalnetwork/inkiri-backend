const config = require('../../common/config/env.config.js');
const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri || 'mongodb://localhost/inkiri');

const AutoIncrement = require('mongoose-sequence')(mongoose);
// const AutoIncrementFactory = require('mongoose-sequence');

const Schema = mongoose.Schema;

const providerSchema = new Schema({
    name:             { type:  String, required: true},
    cnpj:             { type:  String, required: true},
    email:            { type:  String  , unique : true},
    phone:            { type:  String },
    address:          { 
                        street:   { type:String}, // Street and Number, Apt, Suite, Unit, Building
                        city:     { type:String}, //
                        state:    { type:String}, // State /Province
                        zip:      { type:String}, // Postal Code
                        country:  { type:String}
                      },

    category:           { type:  String },
    products_services:  { type:  String },
    
    created_by:       { type: Schema.Types.ObjectId, ref: 'Users', required : true},
    updated_by:       { type: Schema.Types.ObjectId, ref: 'Users'},
    state:            { type:  String ,
                        enum: ['ok', 'disabled', 'deleted']
                      }, 

    // bank_accounts:    [{ type: Schema.Types.ObjectId, ref: 'BankAccounts' }],
    bank_accounts:    [
            { 
                bank_name:        { type:  String},
                agency:           { type:  String },
                cc:               { type:  String }, 
            }],

    providerCounterId:    { type: Number, unique : true},
  }, 
  { timestamps:       { createdAt: 'created_at' } });

//const thingSchema = new Schema({..}, { timestamps: { createdAt: 'created_at' } });

providerSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
providerSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

providerSchema.findById = function (cb) {
    return this.model('Providers').find({id: this.id}, cb);
};

providerSchema.plugin(AutoIncrement, {inc_field: 'providerCounterId'});

const Provider = mongoose.model('Providers', providerSchema);


exports.findByEmail = (email) => {
    return Provider.find({email: email});
};

exports.searchByName = (name) => {
    return Provider.find({name: new RegExp('^'+name+'$', "i")});
};

exports.findById = (id) => {
    return Provider.findById(id)
        .then((result) => {
            result = result.toJSON();
            delete result._id;
            delete result.__v;
            return result;
        });
};

exports.createProvider = (providerData) => {
    let provider = new Provider(providerData);
    return provider.save();
};

// exports.newUser = (data) => {
//     return CounterModel.getNextSequence("userCounterId")
//         .then((result) => {
//             let userData = {...data,
//                 userCounterId : result.seq,
//             }
//             return User.create(userData);
//         });
    
// }

exports.list = (perPage, page, query) => {
    return new Promise((resolve, reject) => {
        Provider.find(query)
            // .populate('bank_accounts')
            .populate('updated_by')
            .populate('created_by')
            .limit(perPage)
            .skip(perPage * page)
            .exec(function (err, providers) {
                if (err) {
                    reject(err);
                } else {
                    // resolve(providers);
                    const x = providers.map(provider => provider.toJSON())
                    resolve(x);
                }
            })
    });
};

providerToUIDict  = (provider) => {
  return{
    ...provider
    , key               : provider._id
    , block_time        : provider.created_at.toISOString().split('.')[0]
  }
}

exports.patchProvider = (id, providerData) => {
    return Provider.findOneAndUpdate({
        _id: id
        }, providerData);
};

exports.patchProviderByEmail = (email, providerData) => {

    return new Promise((resolve, reject) => {
        const filter = { email: email };
        const update = providerData;
        Provider.findOneAndUpdate(filter, update)
        .then((update_res)=>{
            // console.log( 'users.model::patchUserByAccountName() OK ' , JSON.stringify(update_res))
            resolve({ok:'ok'})
        },(err)=>{
            // console.log( 'users.model::patchUserByAccountName() ERROR#1 ' , JSON.stringify(err))
            reject({error:err})
        });       
    }); 
    
};

exports.removeById = (providerId) => {
    return new Promise((resolve, reject) => {
        Provider.remove({_id: providerId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};

