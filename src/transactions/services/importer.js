const config             = require('../../common/config/env.config.js');
// const importer_dfuse     = require('./importer.dfuse');
const importer_hyperion  = require('./importer.hyperion');

exports.import = async () => {  
  
  if(config.eos.history_provider.trim()=='hyperion')
  {
    return importer_hyperion.import();
  }

  if(config.eos.history_provider.trim()=='dfuse')
  {
    return importer_dfuse.import();
  }  
};
