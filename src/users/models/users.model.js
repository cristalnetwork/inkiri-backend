const config = require('../../common/config/env.config.js');

const mongoose = require('../../common/ddbb/mongo_connection.js');

// const mongoose = require('mongoose');
// mongoose.set('useCreateIndex', true);
// mongoose.set('useFindAndModify', false);
// mongoose.connect(process.env.MONGODB_URI || config.mongo.connection_uri , {useNewUrlParser: true, useUnifiedTopology: config.mongo.useUnifiedTopology }); 


exports.ACCOUNT_TYPE_NONE       = 'none';
exports.ACCOUNT_TYPE_PERSONAL   = 'personal';
exports.ACCOUNT_TYPE_BUSINESS   = 'business';
exports.ACCOUNT_TYPE_FOUNDATION = 'foundation';
exports.ACCOUNT_TYPE_BANKADMIN  = 'bankadmin';
exports.ACCOUNT_TYPES_ENUM      = [exports.ACCOUNT_TYPE_NONE
                                    , exports.ACCOUNT_TYPE_PERSONAL
                                    , exports.ACCOUNT_TYPE_BUSINESS
                                    , exports.ACCOUNT_TYPE_FOUNDATION
                                    , exports.ACCOUNT_TYPE_BANKADMIN];

const AutoIncrement = require('mongoose-sequence')(mongoose);
// const AutoIncrementFactory = require('mongoose-sequence');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    account_name:     { type:  String  , unique : true, index: true},
    alias:            { type:  String , index: true, trim:true},
    first_name:       { type:  String , trim:true},
    last_name:        { type:  String , trim:true},
    email:            { type:  String  , unique : true, index: true, trim:true},
    legal_id:         { type:  String , trim:true},
    birthday:         { type:  Date },
    phone:            { type:  String , trim:true},
    address:          {
                        street:   { type:String, trim:true}, // Street and Number, Apt, Suite, Unit, Building
                        city:     { type:String, trim:true}, //
                        state:    { type:String, trim:true}, // State /Province
                        zip:      { type:String, trim:true}, // Postal Code
                        country:  { type:String, trim:true}
                      },
    to_sign:          { type:  String },

    self_created:     { type:  Boolean, default: false },

    account_type:     { type:  String ,
                        enum: exports.ACCOUNT_TYPES_ENUM
                      },
    business_name:    { type:  String, index: true, trim:true,
                        required: function() {
                            return this.account_type == 'business';
                        } },
    userCounterId:    { type: Number, unique : true},

    bank_accounts:    [
            {
                bank_name:        { type:  String, trim:true},
                bank_keycode:     { type:  String, trim:true},
                agency:           { type:  String, trim:true},
                cc:               { type:  String, trim:true},
            }],

    balance:          { type: Number},
    overdraft:        { type: Number},
    fee:              { type: Number},

    exists_at_blockchain: { type: Boolean},
    public_key:           { type: String},

  },
  { timestamps: { createdAt: 'created_at' } });

//const thingSchema = new Schema({..}, { timestamps: { createdAt: 'created_at' } });

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
userSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        delete ret.to_sign;
        delete ret.__v;
        if(!ret.id)
          ret.id = ret._id;
        return ret;
    }
});

userSchema.findById = function (cb) {
    return this.model('Users').find({id: this.id}, cb);
};

userSchema.plugin(AutoIncrement, {inc_field: 'userCounterId'});

const User = mongoose.model('Users', userSchema);

exports.getTypeFromInt = (int_type) => {
    if(isNaN(int_type))
    {
      console.log(`-- users.model::getTypeFromInt int_type (${int_type}) is not a NUMBER!`)
      return null;
    }
    if(exports.ACCOUNT_TYPES_ENUM.includes(int_type))
    {
      console.log(`-- users.model::getTypeFromInt int_type (${int_type}) is not included in ACCOUNT_TYPES_ENUM!`)
      return null;
    }
    return exports.ACCOUNT_TYPES_ENUM[int_type];
};

exports.findByEmail = (email) => {
    return User.find({email: email});
};

exports.byAccountNameOrNull = async (account_name) => {
    if(!account_name)
        return null;
    // console.log(' == >> UsersModel::byAccountNameOrNull:', account_name)
    const  _account_name = account_name?account_name.trim():'';
    const  user = await User.findOne({account_name: _account_name}).exec();
    return user;
};

exports.byAliasOrNull = async (alias) => {
    if(!alias)
        return null;
    // console.log(' == >> UsersModel::byAccountNameOrNull:', alias)
    const  _alias = alias?alias.trim():'';
    if(_alias=='')
        return null;
    const  user = await User.findOne({alias: _alias}).exec();
    return user;
};

exports.byAliasOrBizNameOrNull = async (alias_or_name) => {
    if(!alias_or_name)
        return null;
    // console.log(' == >> UsersModel::byAliasOrBizNameOrNull:', alias_or_name)
    const  _alias_or_name = alias_or_name?alias_or_name.trim():'';
    if(_alias_or_name=='')
        return null;
    try{
        const  user = await User.findOne({$or : [{alias: alias_or_name}, {business_name: alias_or_name}]}).exec();
        return user;    
    }catch(ex){
        console.log('UserModel::byAliasOrBizNameOrNull::', alias_or_name, ' | ERROR:', ex);
        return null;
    }
    
};

exports.findByAccountName = (account_name) => {
    const _account_name = account_name?account_name.trim():'';
    return User.find({account_name: _account_name});
};

exports.findByAlias = (alias) => {
    return User.find({alias: alias});
};

exports.findById = (id) => {
    return User.findById(id)
        .then((result) => {
            result = result.toJSON();
            // delete result._id;
            delete result.__v;
            return result;
        });
};

exports.createUser = (userData) => {
    let user = new User(userData);
    return user.save();
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
        User.find(query)
            .limit(perPage)
            .skip(perPage * page)
            .exec(function (err, users) {
                if (err) {
                    reject(err);
                } else {
                    // resolve(users);
                    // const x = users.map(user => userToUIDict(user))
                    const x = users.map(user => user.toJSON() )
                    resolve(x);
                }
            })
    });
};

// userToUIDict  = (user) => {
//   return{
//     ...user
//     , key               : user._id
//     , block_time        : user.created_at.toISOString().split('.')[0]
//   }
// }


// exports.patchUser = (id, userData) => {
//     return new Promise((resolve, reject) => {
//         User.findById(id, function (err, user) {
//             if (err) reject(err);
//             for (let i in userData) {
//                 user[i] = userData[i];
//             }
//             user.save(function (err, updatedUser) {
//                 if (err) return reject(err);
//                 resolve(updatedUser);
//             });
//         });
//     })

// };

exports.patchUser = (id, userData) => {
    return User.findOneAndUpdate({
        _id: id
        }, userData);
};

exports.patchUserByAccountName = (account_name, userData) => {

    // console.log( ' >> users.model::patchUserByAccountName() params ' , account_name, JSON.stringify(userData))
    return new Promise((resolve, reject) => {
        const filter = { account_name: account_name };
        const update = userData;
        User.findOneAndUpdate(filter, update)
        .then((update_res)=>{
            console.log( ' >> users.model::patchUserByAccountName() OK ' , JSON.stringify(update_res))
            resolve({ok:'ok'})
        },(err)=>{
            console.log( ' >> users.model::patchUserByAccountName() ERROR#1 ' , JSON.stringify(err))
            reject({error:err})
        });
    });
    // return new Promise((resolve, reject) => {
    //     User.find({account_name: account_name})
    //     .then((users)=>{
    //         console.log( 'users.model::patchUserByAccountName() data:' , JSON.stringify(userData))
    //         User.findOneAndUpdate({
    //         _id: users[0]._id
    //         }, userData)
    //         .then((update_res)=>{
    //             console.log( 'users.model::patchUserByAccountName() OK ' , JSON.stringify(update_res))
    //             resolve({vino_user:'xx'})
    //         },(err)=>{
    //             console.log( 'users.model::patchUserByAccountName() ERROR#1 ' , JSON.stringify(err))
    //             reject({error:err})
    //         });

    //     },(err)=>{
    //         console.log( 'users.model::patchUserByAccountName() ERROR#1 ' , JSON.stringify(err))
    //         reject({error:err})
    //     });
    // });


};

exports.removeById = (userId) => {
    return new Promise((resolve, reject) => {
        User.remove({_id: userId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};

exports.bankAccountByIdOrNull = (user, bank_account_id) => {
  if(!user)
    return null;
  if(!user.bank_accounts)
    return null;
  if(user.bank_accounts.length==0)
    return null;
  return user.bank_accounts.find(bank_account => bank_account._id==bank_account_id)
};

exports.model = User;