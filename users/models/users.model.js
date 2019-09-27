const config = require('../../common/config/env.config.js');
const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri || 'mongodb://localhost/inkiri');

const AutoIncrement = require('mongoose-sequence')(mongoose);
// const AutoIncrementFactory = require('mongoose-sequence');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    account_name:     { type:  String  , unique : true},
    first_name:       { type:  String },
    last_name:        { type:  String },
    email:            { type:  String  , unique : true},
    legal_id:         { type:  String },
    birthday:         { type:  Date },
    phone:            { type:  String },
    address:          { 
                        street:   { type:String}, // Street and Number, Apt, Suite, Unit, Building
                        city:     { type:String}, //
                        state:    { type:String}, // State /Province
                        zip:      { type:String}, // Postal Code
                        country:  { type:String}
                      },
    to_sign:          { type:  String },
    permission_level: { type:  Number },

    self_created:     { type:  Boolean, default: true },

    account_type:     { type:  String ,
                        enum: ['none', 'personal', 'business', 'foundation', 'bankadmin']
                      }, 
    business_name:    { type:  String,
                        required: function() {
                            return this.account_type == 'business';
                        } },
    userCounterId:    { type: Number, unique : true},
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
        // ret.id = ret._id;
        // delete ret._id;
        delete ret.to_sign;
        delete ret.__v;
        return ret;
    }
});

userSchema.findById = function (cb) {
    return this.model('Users').find({id: this.id}, cb);
};

userSchema.plugin(AutoIncrement, {inc_field: 'userCounterId'});

const User = mongoose.model('Users', userSchema);


exports.findByEmail = (email) => {
    return User.find({email: email});
};

exports.findByAccountName = (account_name) => {
    return User.find({account_name: account_name});
};

exports.findById = (id) => {
    return User.findById(id)
        .then((result) => {
            result = result.toJSON();
            delete result._id;
            delete result.__v;
            return result;
        });
};

exports.createUser = (userData) => {
    let user = new User(userData);
    if(!user.email)
        user.email = `${user.account_name}@inkiri.com`;
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

    return new Promise((resolve, reject) => {
        const filter = { account_name: account_name };
        const update = userData;
        User.findOneAndUpdate(filter, update)
        .then((update_res)=>{
            // console.log( 'users.model::patchUserByAccountName() OK ' , JSON.stringify(update_res))
            resolve({ok:'ok'})
        },(err)=>{
            // console.log( 'users.model::patchUserByAccountName() ERROR#1 ' , JSON.stringify(err))
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

