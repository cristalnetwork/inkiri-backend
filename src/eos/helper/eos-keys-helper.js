/*
  https://eosio.stackexchange.com/questions/397/generate-eos-keys-from-mnemonic-seed
  https://github.com/EOSIO/eosjs-ecc#examples-1
  https://iancoleman.io/bip39/
*/
const ecc     = require('eosjs-ecc');
const hdkey   = require('hdkey');
const wif     = require('wif');
// const sha256  = require('js-sha256').sha256;

const derivation_path = "m/44'/194'/0'/0/0";
const loop_count      = 1000;

exports.getKey = (account_name, password, do_log=true) =>{
  const seed        = account_name + '.' + password;
  let private_key = ecc.seedPrivate(seed)
  for(var i=0; i<100000;i++){
    private_key = ecc.seedPrivate(private_key)
  }
  // const master      = hdkey.fromMasterSeed(Buffer(private_key, 'hex'))
  // const node        = master.derive("m/44'/194'/0'/0/0")
  const pub_key =  ecc.privateToPublic(private_key).toString();
  do_log  && console.log("publicKey: "  +  pub_key)
  do_log  && console.log("privateKey: " +  private_key)
  return pub_key;
}
  
exports.getDerivedKey = (account_name, password, do_log=true) =>{
  const seed      = account_name + '.' + password;
  let private_key = ecc.seedPrivate(seed);
  let master      = hdkey.fromMasterSeed(Buffer.from(ecc.sha256(private_key.toString()), 'hex'));
  let node        = master.derive(derivation_path); 
  // console.log('========== 0:', master.privateExtendedKey.toString())
  for(var i=0; i<loop_count;i++){
    // console.log('========== node_'+i+':', node.privateExtendedKey );
    // master = hdkey.fromExtendedKey(node.privateExtendedKey);
    master = hdkey.fromMasterSeed(node.privateExtendedKey);
    node   = master.derive(derivation_path);  
    // console.log('========== '+i+':', master.privateExtendedKey.toString())
  }
  const pub_key = ecc.PublicKey(node._publicKey).toString();
  do_log  && console.log("publicKey: "  +  pub_key)
  do_log  && console.log("privateKey: " +  wif.encode(128, node._privateKey, false))
  if(do_log)
    return pub_key + '-' + seed; 
  return pub_key; 
}