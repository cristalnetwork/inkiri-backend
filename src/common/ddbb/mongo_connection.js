const config   = require('../../common/config/env.config.js');
const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

// mongoose.connect(process.env.MONGODB_URI || config.mongo.connection_uri , {useNewUrlParser: true, useUnifiedTopology: config.mongo.useUnifiedTopology }); 

exports.getConnection = () => {
  mongoose.connect(process.env.MONGODB_URI || config.mongo.connection_uri , {useNewUrlParser: true, useUnifiedTopology: config.mongo.useUnifiedTopology }); 
  return mongoose;  
}

module.exports = exports.getConnection();