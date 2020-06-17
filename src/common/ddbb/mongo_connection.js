const config   = require('../../common/config/env.config.js');
const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

// mongoose.connect(process.env.MONGODB_URI || config.mongo.connection_uri , {useNewUrlParser: true, useUnifiedTopology: config.mongo.useUnifiedTopology }); 

const my_conn = process.env.MONGODB_URI || config.mongo.connection_uri;

// console.log(my_conn);

exports.getConnection = () => {
  mongoose.connect(my_conn , {useNewUrlParser: true, useUnifiedTopology: config.mongo.useUnifiedTopology }); 
  return mongoose;  
}

module.exports = exports.getConnection();