const utf8              = require('utf8');
const latinise          = require('./latinise.min.js');

exports.generateAccountName = (seed_array, generated_names) => {

  console.log(' ----- generateAccountName -> ', seed_array)
  if(!seed_array || seed_array.length==0)
    return '';

  let name         = seed_array.join('').latinise() ;
  let account_name = cleanString(name);
  
  while(account_name.length>0 && emptyIfInvalid(account_name.charAt(0), start_with_map) === '')
    account_name = account_name.substr(1);
  
  let the_account_name = account_name;
  if(account_name.length!=12)
    if(account_name.length>12)
    {
      the_account_name = account_name.slice(0, 12)
    }
    else{
      the_account_name = (account_name+'111111111111').substring(0, 11) + '1';
      // (account_name+'000000000000').slice(0, 12)
    };
  // account_name = (account_name + end_with_map).slice(0, 12);

  let counter = 0;
  console.log('the_account_name:', the_account_name)
  while(generated_names.includes(the_account_name) || !end_with_map_array.includes(the_account_name.slice(-1)) )
  {
    console.log('ITER#',counter,' the_account_name:', the_account_name)
    counter           = counter+1;
    const counter_str = counter.toString();
    the_account_name  = the_account_name.slice(0, (12-counter_str.length)) + counter_str; 
  }
  return the_account_name;
}

const emptyIfInvalid = (ch, map) => {
  const _charmap = map?map:charmap;
  const idx = _charmap.indexOf(ch);
  if (idx === -1) 
    return ''
  return ch;
};

const cleanString = (str) =>{
  const cleaned_str = utf8.encode(str).split('').filter(  char => isAlphanumeric(char) ).join('');
  return cleaned_str.toLowerCase();
}

const charmap            = '12345abcdefghijklmnopqrstuvwxyz'; //'.'
const start_with_map     = 'abcdefghijklmnopqrstuvwxyz';
const end_with_map       = '12345abcdefghijklmnopqrstuvwxyz';
const end_with_map_array = end_with_map.split(''); 
const alphanumeric       = '12345ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; //'.'

const isAlphanumeric = (character) =>{
  return alphanumeric.indexOf(character) >= 0 ;
}

exports.isValidAccountName = (name) => {
  // const regEx = new RegExp("^([a-z1-5]){12,}$");
  const regEx = new RegExp("(^[a-z1-5.]{0,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)");
  return (name.length == 12 && regEx.test(name)) 
  
}