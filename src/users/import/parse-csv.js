const UsersModel        = require('../models/users.model');
const utf8              = require('utf8');
const latinise          = require('./latinise.min.js');

const cols              = ['nomes', 'sobrenomes', 'cpf', 'email', 'nome projeto/negocio', 'IUGU alias', 'tipo conta', 'balance', 'ACCOUNT NAME'];
const cols_nomes        = 0;
const cols_sobrenomes   = 1;
const cols_cpf          = 2;
const cols_email        = 3;
const cols_nome_projeto = 4;
const cols_iugu_alias   = 5;
const cols_tipo_conta   = 6;
const cols_balance      = 7;
const cols_ACCOUNT_NAME = 8;


module.exports = (rows) => {
  console.log('Parsing spreadsheet data ...');
  
  const account_types = {
    'pessoal' : UsersModel.ACCOUNT_TYPE_PERSONAL,
    'projeto' : UsersModel.ACCOUNT_TYPE_BUSINESS,
    'fundo'   : UsersModel.ACCOUNT_TYPE_FOUNDATION
  };
  
  let account_names_array = [];
  const users = rows
    .map((row, idx) => {
      const account_type = account_types[row[cols_tipo_conta]];
      const email        = row[cols_email].split(',')[0];
      const email_prefix = (!nullOrEmpty(email) && email.includes('@'))
        ? email.split('@')[0]
        : '';

      const seed         = (account_type==UsersModel.ACCOUNT_TYPE_PERSONAL )
        ?[row[cols_nomes], row[cols_sobrenomes], email_prefix]
        :[row[cols_nome_projeto]];

      const account_name = generateAccountName( seed, account_names_array);
      account_names_array.push(account_name);
      const is_personal = account_type==UsersModel.ACCOUNT_TYPE_PERSONAL;
      return{
        idx                   : idx,
        account_name          : account_name,
        alias                 : is_personal?'':row[cols_iugu_alias],
        first_name            : is_personal?row[cols_nomes]:'',
        last_name             : is_personal?row[cols_sobrenomes]:'',
        email                 : email,
        legal_id              : is_personal?(nullOrEmpty(row[cols_cpf])?'111111111111':row[cols_cpf]):'',
        business_name         : is_personal?'':row[cols_nome_projeto],
        account_type          : account_type,
        exists_at_blockchain  : false,
        balance               : 0,
        overdraft             : 0
      }  
    })

  const account_names = users.map((user) => user.account_name)

  const sorted_users = users.sort((a, b) => {
      if(a.account_type==UsersModel.ACCOUNT_TYPE_PERSONAL) 
        return 1;
      if(a.account_type==UsersModel.ACCOUNT_TYPE_BUSINESS &&
        b.account_type!=UsersModel.ACCOUNT_TYPE_PERSONAL) 
        return 1;
      return -1;
    })
    
  return {
    users         : sorted_users,
    account_names : account_names
  };

};

const nullOrEmpty = (str) => {
  return !str || str.trim()=='';
}

// const genAccountName = ({first_name='', last_name='', email='', nome_projeto=''}) => {
//   if(!nullOrEmpty(nome_projeto)) 
// }

const generateAccountName = (seed_array, generated_names) => {

  console.log(' ----- generateAccountName -> ', seed_array)
  if(!seed_array || seed_array.length==0)
    return '';

  let name         = seed_array.join('.').latinise() ;
  let account_name = cleanString(name);
  // account_name  = name.split('').map( _char => emptyIfInvalid(_char)).join('');
  while(account_name.length>0 && emptyIfInvalid(account_name.charAt(0), start_with_map) === '')
    account_name = account_name.substr(1);
  
  let the_account_name = account_name;
  if(account_name.length!=12)
    if(account_name.length>12)
    {
      the_account_name = account_name.slice(0, 12)
    }
    else{
      the_account_name = (account_name+'000000000000').substring(0, 11) + '1';
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

const charmap            = '.12345abcdefghijklmnopqrstuvwxyz';
const start_with_map     = 'abcdefghijklmnopqrstuvwxyz';
const end_with_map       = '12345abcdefghijklmnopqrstuvwxyz';
const end_with_map_array = end_with_map.split(''); 
const alphanumeric       = '.12345ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const isAlphanumeric = (character) =>{
  return alphanumeric.indexOf(character) >= 0 ;
}