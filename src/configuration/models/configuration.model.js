const config      = require('../../common/config/env.config.js');
const UserModel   = require('../../users/models/users.model');
const mongoose    = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri , {useNewUrlParser: true, useUnifiedTopology: true });

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
exports.CONFIG_KEY_BANKS            = 'banks';

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

exports.getBanks = () => {
  return exports.getByFather(exports.CONFIG_KEY_BANKS);
}

exports.getAll = () => {
  return exports.list(300, 0, {});
};  

exports.getByFather = (father_key) => {
  return exports.list(300, 0, {father:father_key});
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
            .sort({father : 1, value:1, key: 1 })
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
   
  father = exports.CONFIG_KEY_BANKS ;
  exports.createConfiguration(newConfig (the_architect, father, `${father}_84` , 'Unicred Norte do Paraná'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_091-4` , 'Unicred Central do Rio Grande do Sul'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_230` , 'Unicard Banco Múltiplo S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_409` , 'UNIBANCO - União de Bancos Brasileiros S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_254` , 'Paraná Banco S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_086-8` , 'OBOE Crédito Financiamento e Investimento S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_753` , 'NBC Bank Brasil S.A. - Banco Múltiplo'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_14` , 'Natixis Brasil S.A. Banco Múltiplo'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_488` , 'JPMorgan Chase Bank'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_79` , 'JBS Banco S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_341` , 'Itaú Unibanco S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_652` , 'Itaú Unibanco Holding S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_492` , 'ING Bank N.V.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_168` , 'HSBC Finance (Brasil) S.A. - Banco Múltiplo'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_399` , 'HSBC Bank Brasil S.A. - Banco Múltiplo'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_62` , 'Hipercard Banco Múltiplo S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_64` , 'Goldman Sachs do Brasil Banco Múltiplo S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_751` , 'Dresdner Bank Brasil S.A. - Banco Múltiplo'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_487` , 'Deutsche Bank S.A. - Banco Alemão'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_098-1` , 'Credicorol Cooperativa de Crédito Rural'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_087-6` , 'Cooperativa Unicred Central Santa Catarina'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_089-2` , 'Cooperativa de Crédito Rural da Região de Mogiana'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_090-2` , 'Cooperativa Central de Economia e Crédito Mutuo das Unicreds'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_099-x` , 'Cooperativa Central de Economia e Credito Mutuo das Unicreds'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_085-x` , 'Cooperativa Central de Crédito Urbano-CECRED'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_097-3` , 'Cooperativa Central de Crédito Noroeste Brasileiro Ltda.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_081-7` , 'Concórdia Banco S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_477` , 'Citibank N.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_104` , 'Caixa Econômica Federal'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_092-2` , 'Brickell S.A. Crédito, financiamento e Investimento'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_70` , 'BRB - Banco de Brasília S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_69` , 'BPN Brasil Banco Múltiplo S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_78` , 'BES Investimento do Brasil S.A.-Banco de Investimento'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_73` , 'BB Banco Popular do Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_744` , 'BankBoston N.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_755` , 'Bank of America Merrill Lynch Banco Múltiplo S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_719` , 'Banif-Banco Internacional do Funchal (Brasil)S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_21` , 'BANESTES S.A. Banco do Estado do Espírito Santo'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_370` , 'Banco WestLB do Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_610` , 'Banco VR S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_655` , 'Banco Votorantim S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M23` , 'Banco Volvo (Brasil) S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M14` , 'Banco Volkswagen S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_634` , 'Banco Triângulo S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M13` , 'Banco Tricury S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M20` , 'Banco Toyota do Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_082-5` , 'Banco Topázio S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_464` , 'Banco Sumitomo Mitsui Brasileiro S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_12` , 'Banco Standard de Investimentos S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_637` , 'Banco Sofisa S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_366` , 'Banco Société Générale Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_749` , 'Banco Simples S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_743` , 'Banco Semear S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_250` , 'Banco Schahin S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_33` , 'Banco Santander (Brasil) S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_422` , 'Banco Safra S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_453` , 'Banco Rural S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_72` , 'Banco Rural Mais S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M16` , 'Banco Rodobens S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_741` , 'Banco Ribeirão Preto S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_633` , 'Banco Rendimento S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_356` , 'Banco Real S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_088-4` , 'Banco Randon S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_747` , 'Banco Rabobank International Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M24` , 'Banco PSA Finance Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_638` , 'Banco Prosper S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_735` , 'Banco Pottencial S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_724` , 'Banco Porto Seguro S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_643` , 'Banco Pine S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_094-2` , 'Banco Petra S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_613` , 'Banco Pecúnia S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_611` , 'Banco Paulista S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_623` , 'Banco Panamericano S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M17` , 'Banco Ourinvest S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_45` , 'Banco Opportunity S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_243` , 'Banco Máxima S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_66` , 'Banco Morgan Stanley S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_738` , 'Banco Morada S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M10` , 'Banco Moneo S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_746` , 'Banco Modal S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_389` , 'Banco Mercantil do Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M12` , 'Banco Maxinvest S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_212` , 'Banco Matone S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_600` , 'Banco Luso Brasileiro S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_757` , 'Banco KEB do Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_76` , 'Banco KDB S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_217` , 'Banco John Deere S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_74` , 'Banco J. Safra S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_376` , 'Banco J. P. Morgan S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_479` , 'Banco ItaúBank S.A'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_184` , 'Banco Itaú BBA S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M09` , 'Banco Itaucred Financiamentos S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_249` , 'Banco Investcred Unibanco S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_077-9` , 'Banco Intermedium S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_630` , 'Banco Intercap S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_653` , 'Banco Indusval S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_320` , 'Banco Industrial e Comercial S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_604` , 'Banco Industrial do Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M11` , 'Banco IBM S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_63` , 'Banco Ibi S.A. Banco Múltiplo'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M22` , 'Banco Honda S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_612` , 'Banco Guanabara S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M07` , 'Banco GMAC S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_734` , 'Banco Gerdau S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_233` , 'Banco GE Capital S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M18` , 'Banco Ford S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_626` , 'Banco Ficsa S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_224` , 'Banco Fibra S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M03` , 'Banco Fiat S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_265` , 'Banco Fator S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_4` , 'Banco do Nordeste do Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_41` , 'Banco do Estado do Rio Grande do Sul S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_39` , 'Banco do Estado do Piauí S.A. - BEP'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_37` , 'Banco do Estado do Pará S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_47` , 'Banco do Estado de Sergipe S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_1` , 'Banco do Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_214` , 'Banco Dibens S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_456` , 'Banco de Tokyo-Mitsubishi UFJ Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_24` , 'Banco de Pernambuco S.A. - BANDEPE'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M06` , 'Banco de Lage Landen Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_494` , 'Banco de La Republica Oriental del Uruguay'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_495` , 'Banco de La Provincia de Buenos Aires'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_300` , 'Banco de La Nacion Argentina'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_707` , 'Banco Daycoval S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M21` , 'Banco Daimlerchrysler S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_083-3` , 'Banco da China Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_3` , 'Banco da Amazônia S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_266` , 'Banco Cédula S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_229` , 'Banco Cruzeiro do Sul S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_505` , 'Banco Credit Suisse (Brasil) S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_222` , 'Banco Credit Agricole Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_721` , 'Banco Credibel S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_75` , 'Banco CR2 S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_748` , 'Banco Cooperativo Sicredi S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_756` , 'Banco Cooperativo do Brasil S.A. - BANCOOB'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_215` , 'Banco Comercial e de Investimento Sudameris S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M19` , 'Banco CNH Capital S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_241` , 'Banco Clássico S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M08` , 'Banco Citicard S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_745` , 'Banco Citibank S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_40` , 'Banco Cargill S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_412` , 'Banco Capital S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_473` , 'Banco Caixa Geral - Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_263` , 'Banco Cacique S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_44` , 'Banco BVA S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_208` , 'Banco BTG Pactual S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_M15` , 'Banco BRJ S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_225` , 'Banco Brascan S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_237` , 'Banco Bradesco S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_394` , 'Banco Bradesco Financiamentos S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_204` , 'Banco Bradesco Cartões S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_36` , 'Banco Bradesco BBI S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_65` , 'Banco Bracce S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_218` , 'Banco Bonsucesso S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_248` , 'Banco Boavista Interatlântico S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_752` , 'Banco BNP Paribas Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_318` , 'Banco BMG S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_96` , 'Banco BM&F de Serviços de Liquidação e Custódia S.A'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_739` , 'Banco BGN S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_31` , 'Banco Beg S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_107` , 'Banco BBM S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_740` , 'Banco Barclays S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_0` , 'Banco Bankpar S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_29` , 'Banco Banerj S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_19` , 'Banco Azteca do Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_213` , 'Banco Arbi S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_641` , 'Banco Alvorada S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_25` , 'Banco Alfa S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_246` , 'Banco ABC Brasil S.A.'));
  exports.createConfiguration(newConfig (the_architect, father, `${father}_654 ` , 'Banco A.J.Renner S.A.'));
  
  console.log(' init: OK');

  return 'OK';

}