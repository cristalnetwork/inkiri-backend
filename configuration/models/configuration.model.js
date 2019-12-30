const config      = require('../../common/config/env.config.js');
const UserModel   = require('../../users/models/users.model');
const mongoose    = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri );

const AutoIncrement = require('mongoose-sequence')(mongoose);
// const AutoIncrementFactory = require('mongoose-sequence');

const Schema = mongoose.Schema;

exports.CONFIG_KEY_JOB_POSITIONS    = 'job_position';
exports.CONFIG_KEY_PAY_VEHICLES     = 'payment_vehicle';
exports.CONFIG_KEY_PAY_CATEGORY     = 'payment_category';
exports.CONFIG_KEY_PAY_TYPE         = 'payment_type';
exports.CONFIG_KEY_PAY_MODE         = 'payment_mode';
exports.CONFIG_KEY_EXTERNAL_TX_FEE  = 'external_tx_fee';
exports.CONFIG_KEY_ACCOUNT_CONFIG   = 'account_config';
exports.CONFIG_KEY_TRANSFER_REASON  = 'transfer_reason';

const configurationSchema = new Schema({
    created_by:                { type: Schema.Types.ObjectId, ref: 'Users', required : true},
    updated_by:                { type: Schema.Types.ObjectId, ref: 'Users'},
    configurationCounterId:    { type: Number, unique : true},
    father:                    { type: String  },
    key:                       { type: String, unique : true},
    value:                     { type: String },
    
    // for job positions & taxes
    amount:                    { type: Number},    

    // for account configurations
    account:                   {
      account_type:             { type: String },
      fee:                      { type: Number },
      overdraft:                { type: Number }
    },

    // for payment vehicles
    bank_account:              {
                bank_name:        { type:  String, trim:true},
                agency:           { type:  String, trim:true},
                cc:               { type:  String, trim:true},
            },

  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

configurationSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
configurationSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        delete ret.__v;
        return ret;
    }
});

configurationSchema.findById = function (cb) {
    return this.model('Configuration').find({id: this.id}, cb);
};

configurationSchema.plugin(AutoIncrement, {inc_field: 'configurationCounterId'});

const Configuration = mongoose.model('Configuration', configurationSchema);


exports.getById = (id) => {
  return new Promise((resolve, reject) => {
      Configuration.findById(id)
          .populate('created_by')
          .populate('updated_by')
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

exports.getJobPositions = () => {
  return exports.getByFather(exports.CONFIG_KEY_JOB_POSITIONS);
}
  
exports.getPayVehicles = () => {
  return exports.getByFather(exports.CONFIG_KEY_PAY_VEHICLES);
}
  
exports.getPayCategory = () => {
  return exports.getByFather(exports.CONFIG_KEY_PAY_CATEGORY);
}
  
exports.getPayType = () => {
  return exports.getByFather(exports.CONFIG_KEY_PAY_TYPE);
}
  
exports.getPayMode = () => {
  return exports.getByFather(exports.CONFIG_KEY_PAY_MODE);
}
  
exports.getExternalTxFee = () => {
  return exports.getByFather(exports.CONFIG_KEY_EXTERNAL_TX_FEE);
}
  
exports.getAccountConfig = () => {
  return exports.getByFather(exports.CONFIG_KEY_ACCOUNT_CONFIG);
}

exports.getTransfersReasons = () => {
  return exports.getByFather(exports.CONFIG_KEY_TRANSFER_REASON);
}

exports.getAll = () => {
  return exports.list(100, 0, {});
};  

exports.getByFather = (father_key) => {
  return exports.list(100, 0, {father:father_key});
};

exports.createConfiguration = (configData) => {
    let config = new Configuration(configData);
    return config.save();
};

exports.list = (perPage, page, query) => {
    return new Promise((resolve, reject) => {
        Configuration.find(query)
            .populate('created_by')
            .populate('updated_by')
            .limit(perPage)
            .sort({father : 1, key: 1 })
            .skip(perPage * page)
            .exec(function (err, configs) {
                if (err) {
                    reject(err);
                } else {
                    const x = configs.map(config => config.toJSON() )
                    resolve(x);
                }
            })
    });
};

exports.patchConfig = (id, configData) => {
    return Configuration.findOneAndUpdate({
        _id: id
        }, configData);
};

exports.removeById = (configId) => {
    return new Promise((resolve, reject) => {
        Configuration.remove({_id: configId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};

const newConfig = (created_by, father, key, value, bank_account, amount, account) => {
  
  const my_amount = amount?amount:undefined;
  return {
    created_by:     created_by
    , father:       father
    , key:          key
    , value:        value
    , amount:       my_amount
    , bank_account: bank_account
    , account:      account
  }    

}

exports.init = async () => {

  try{
    const saved_jobs = await exports.list(0, 1, {'father':exports.CONFIG_KEY_JOB_POSITIONS});
    if(saved_jobs && Array.isArray(saved_jobs) && saved_jobs.length>0)
    {
      const x = await Configuration.deleteMany({});
      // console.log(' -- deleteMany result:', x)  
      // return 'Already intiialized!';
    }
  }
  catch(e){
    console.log('Error loading jobs config', e)  ;
  }
  
  
  let the_architect   = null;
  try {
      the_architect = await UserModel.findByAccountName(config.eos.bank.account);

  } catch (e) {
    return res.status(404).send({error:'Architect NOT FOUND'});
  }
  if(Array.isArray(the_architect))
    the_architect=the_architect[0];
  console.log(`the_architect (${config.eos.bank.account}):`, the_architect)
  
  // JOBS
  let father = exports.CONFIG_KEY_JOB_POSITIONS;
  exports.createConfiguration(newConfig (the_architect, father, `${father}_raiz`,   'Raiz', undefined, 3000));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_tronco`, 'Tronco', undefined, 2000));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_galho`,  'Galho', undefined, 1500));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_folha`,  'Folha', undefined, 1000));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_flor`,   'Flor', undefined, 1000));

  father = exports.CONFIG_KEY_PAY_VEHICLES;
  const bank_account = {
    bank_name: 'BANK'
    , agency:  'AGENCY'
    , cc:      'CC'
  }
  exports.createConfiguration(newConfig (the_architect, father, `${father}_inkiri`,      'Inkiri',    bank_account));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_institute`,   'Institute', bank_account));  
  exports.createConfiguration(newConfig (the_architect, father, `${father}_other`,       'Other',     bank_account));  

  father = exports.CONFIG_KEY_PAY_CATEGORY;
  exports.createConfiguration(newConfig (the_architect, father, `${father}_alugel`,       'Alugel'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_investimento`, 'Investimento'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_insumos`,      'Insumos'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_another`,      'Another'  ));

  father = exports.CONFIG_KEY_PAY_TYPE;
  exports.createConfiguration(newConfig (the_architect, father, `${father}_despesa`,      'Despesa'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_investimento`, 'Investimento'));

  father = exports.CONFIG_KEY_PAY_MODE;
  exports.createConfiguration(newConfig (the_architect, father, `${father}_transfer`, 'Transfer'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_boleto`  , 'Boleto'));

  father = exports.CONFIG_KEY_EXTERNAL_TX_FEE ;
  exports.createConfiguration(newConfig (the_architect, father, `${father}_provider`, 'Provider', undefined, 0));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_exchange`, 'Exchange', undefined, 15));

  father = exports.CONFIG_KEY_ACCOUNT_CONFIG;
  exports.createConfiguration(newConfig (the_architect, father, `${father}_personal`, 'Personal Account', undefined, undefined, {
      account_type:      UserModel.ACCOUNT_TYPE_PERSONAL
      , fee:             0
      , overdraft:       0
    }));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_business`, 'Business Account', undefined, undefined, {
      account_type:      UserModel.ACCOUNT_TYPE_BUSINESS
      , fee:             0
      , overdraft:       0
    }));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_foundation`, 'Fundo Account', undefined, undefined, {
      account_type:      UserModel.ACCOUNT_TYPE_FOUNDATION
      , fee:             0
      , overdraft:       0
    }));

  father = exports.CONFIG_KEY_TRANSFER_REASON ;
  exports.createConfiguration(newConfig (the_architect, father, `${father}_distribute_profit`, 'Distribute profit'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_adjustment`, 'Adjustment'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_rent`, 'Rent'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_investment`, 'Investment'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_supplies`, 'Supplies'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_another`, 'Another...'));
  
  return 'OK';
}