const config      = require('../../common/config/env.config.js');
const mongoose    = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri , {useNewUrlParser: true, useUnifiedTopology: config.mongo.useUnifiedTopology }); 

const AutoIncrement = require('mongoose-sequence')(mongoose);
// const AutoIncrementFactory = require('mongoose-sequence');

const Schema = mongoose.Schema;

const teamSchema = new Schema({
    created_by:       { type: Schema.Types.ObjectId, ref: 'Users', required : true},
    account_name:     { type:  String  , unique : true, index: true},
    teamCounterId:    { type: Number, unique : true},

    members:          [
      {
        member:       { type: Schema.Types.ObjectId, ref: 'Users', required: true },
        // position:     { type: String, enum: [exports.ENUM_JOB_POSITION_RAIZ, exports.ENUM_JOB_POSITION_TRONCO, exports.ENUM_JOB_POSITION_GALHO, exports.ENUM_JOB_POSITION_FOLHA, exports.ENUM_JOB_POSITION_FLOR] },
        position:     { type: String , required: true},
        wage:         { type: Number , required: true }
      }],
  },
  { timestamps: { createdAt: 'created_at' } });

//const thingSchema = new Schema({..}, { timestamps: { createdAt: 'created_at' } });

teamSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
teamSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        delete ret.__v;
        return ret;
    }
});

teamSchema.findById = function (cb) {
    return this.model('Teams').find({id: this.id}, cb);
};

teamSchema.plugin(AutoIncrement, {inc_field: 'teamCounterId'});

const Team = mongoose.model('Teams', teamSchema);


exports.findByAccountName = (account_name) => {
    // return Team.find({account_name: account_name})
    return new Promise((resolve, reject) => {
        Team.find({account_name: account_name})
            .populate('created_by')
            .populate('members.member')
            .exec(function (err, teams) {
                if (err) {
                    reject(err);
                } else {
                  if(!teams || teams.length==0)
                    return reject('Team not found!');
                  resolve(teams[0].toJSON());
                }
            })
    });
};

exports.getById = (id) => {
  return new Promise((resolve, reject) => {
      Team.findById(id)
          .populate('created_by')
          .populate('members.member')
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

exports.createTeam = (teamData) => {
    let team = new Team(teamData);
    return team.save();
};

exports.list = (perPage, page, query, populate) => {
    return new Promise((resolve, reject) => {
        Team.find(query)
            .populate('created_by')
            .populate(populate||'members.member')
            .limit(perPage)
            .skip(perPage * page)
            .exec(function (err, members) {
                if (err) {
                    reject(err);
                } else {
                    const x = members.map(member => member.toJSON() )
                    resolve(x);
                }
            })
    });
};

exports.patchTeam = (id, teamData) => {
    return Team.findOneAndUpdate({
        _id: id
        }, teamData);
};

exports.removeById = (teamId) => {
    return new Promise((resolve, reject) => {
        Team.remove({_id: teamId}, (err) => {
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
    const  team = await Team.findOne({account_name: _account_name}).populate('members.member').exec();
    return team;
};


exports.model = Team;