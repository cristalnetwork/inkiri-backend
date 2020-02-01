const base64Helper      = require('./base64-helper');

(async () => {
  
  if(!process.argv)
    return;

  var args = process.argv.slice(2)
  
  console.log (base64Helper.toBase64(args[0]));

  return process.exit(0);

})();

