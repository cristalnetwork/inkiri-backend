const config = require('../../common/config/env.config.js');
const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri, {useNewUrlParser: true});

exports.FUNC_IMPORT             = 'func_import';
exports.FUNC_IMPORT_ISSUE       = 'func_import_issue';
exports.FUNC_ISSUE              = 'func_issue';
exports.FUNC_REPROCESS          = 'func_reprocess';

const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const iuguLogSchema = new Schema({
    info:        { count: Number,
                   ids:[],
                   logs:[]
    },
    error:       { count: Number,
                   ids:[],
                   logs:[]
    },
    function_:     {
                   type: String
                   , enum: [exports.FUNC_IMPORT, exports.FUNC_IMPORT_ISSUE, exports.FUNC_ISSUE, exports.FUNC_REPROCESS]
    },
    import_: {
      qs :        { type: Schema.Types.Mixed }
    },
    description:  { type: String}
  },
  { timestamps:       { createdAt: 'created_at' } });

//const thingSchema = new Schema({..}, { timestamps: { createdAt: 'created_at' } });

iuguLogSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
iuguLogSchema.set('toJSON', {
    virtuals: true
});

iuguLogSchema.findById = function (cb) {
    return this.model('IuguLog').find({id: this.id}, cb);
};

iuguLogSchema.plugin(AutoIncrement, {inc_field: 'iuguLogCounterId'});

const IuguLog = mongoose.model('IuguLog', iuguLogSchema);


exports.findById = (id) => {
    return IuguLog.findById(id)
        .then((result) => {
            result = result.toJSON();
            delete result._id;
            delete result.__v;
            return result;
        });
};

exports.create = (iuguLogData) => {
    let iugu_log = new IuguLog(iuguLogData);
    return iugu_log.save();
};

exports.logImport        = (description, ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs, qs, fire_if_error) => logExImpl(description, ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs, exports.FUNC_IMPORT, {qs:qs}, fire_if_error);
exports.logImportIssue   = (description, ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs, qs, fire_if_error) => logExImpl(description, ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs, exports.FUNC_IMPORT_ISSUE, {qs:qs}, fire_if_error);
exports.logIssue         = (description, ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs, fire_if_error)     => logExImpl(description, ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs, exports.FUNC_ISSUE, null, fire_if_error);
exports.logReprocess     = (description, ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs, fire_if_error)     => logExImpl(description, ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs, exports.FUNC_REPROCESS, null, fire_if_error);

// exports.logEx = (ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs, function_, import_)
//   => logExImpl(ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs, function_, import_, )

const logExImpl = (description, ok_count, ok_ids, ok_logs, error_count, error_ids, error_logs, function_, import_, fire_if_error) => {
    const iugu_log_obj = {
      info :        { ok_count:ok_count, ok_ids:ok_ids, ok_logs:ok_logs },
      error:        { error_count:error_count, error_ids:error_ids, error_logs:error_logs },
      function_ :   function_,
      import_:      import_,
      description:  description
    }
    let iugu_log = new IuguLog(iugu_log_obj);
    return iugu_log.save();
};

exports.list = (perPage, page, query) => {
    return new Promise((resolve, reject) => {
        IuguLog.find(query)
            .skip(perPage * page)
            .exec(function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    // resolve(result);
                    const x = result.map(iugu_log => iugu_log.toJSON())
                    resolve(x);
                }
            })
    });
};

exports.patchById = (id, iugu_logData) => {
    return IuguLog.findOneAndUpdate({
        _id: id
        }, iugu_logData);
};

exports.removeById = (iugu_logId) => {
    return new Promise((resolve, reject) => {
        IuguLog.remove({_id: iugu_logId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};
