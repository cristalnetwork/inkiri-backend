const config = require('../../common/config/env.config.js');
const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri || 'mongodb://localhost/inkiri');

const AutoIncrement = require('mongoose-sequence')(mongoose);
// const AutoIncrementFactory = require('mongoose-sequence');

const Schema = mongoose.Schema;

const bankAccountsSchema = new Schema({
    bank_name:        { type:  String, required: true},
    agency:           { type:  String, required: true},
    cc:               { type:  String  , unique : true},
    
    provider_for:     { type: Schema.Types.ObjectId, ref: 'Providers' },
    user_for:         { type: Schema.Types.ObjectId, ref: 'Users' },

    created_by:       { type: Schema.Types.ObjectId, ref: 'Users', required : true},
    updated_by:       { type: Schema.Types.ObjectId, ref: 'Users'},
    
    bank_accountCounterId:    { type: Number, unique : true},
  }, 
  { timestamps:       { createdAt: 'created_at' } });

//const thingSchema = new Schema({..}, { timestamps: { createdAt: 'created_at' } });

bankAccountsSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
bankAccountsSchema.set('toJSON', {
    virtuals: true
});

bankAccountsSchema.findById = function (cb) {
    return this.model('BankAccounts').find({id: this.id}, cb);
};

bankAccountsSchema.plugin(AutoIncrement, {inc_field: 'bank_accountCounterId'});

const BankAccount = mongoose.model('BankAccounts', bankAccountsSchema);


exports.findById = (id) => {
    return BankAccounts.findById(id)
        .then((result) => {
            result = result.toJSON();
            delete result._id;
            delete result.__v;
            return result;
        });
};

exports.createBankAccount = (bankAccountData) => {
    let bank_account = new BankAccount(bankAccountData);
    return bank_account.save();
};

exports.list = (perPage, page, query, populateProvider, populateUser) => {
    return new Promise((resolve, reject) => {
        BankAccount.find(query)
            .populate(populateProvider | 'provider_for' )
            .populate(populateUser | 'user_for')
            .skip(perPage * page)
            .exec(function (err, bank_accounts) {
                if (err) {
                    reject(err);
                } else {
                    resolve(bank_accounts);
                    // const x = bank_accounts.map(bank_account => toUIDict(bank_account))
                    // resolve(x);
                }
            })
    });
};

toUIDict  = (bank_account) => {
  return{
    ...bank_account
    , key               : bank_account._id
    , block_time        : bank_account.created_at.toISOString().split('.')[0]
  }
}

exports.patchBankAccount = (id, bank_accountData) => {
    return BankAccount.findOneAndUpdate({
        _id: id
        }, bank_accountData);
};

exports.removeById = (bank_accountId) => {
    return new Promise((resolve, reject) => {
        BankAccount.remove({_id: bank_accountId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};

