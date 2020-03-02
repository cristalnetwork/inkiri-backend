const UsersModel        = require('../models/users.model');

const cols              = ['nomes', 'sobrenomes', 'cpf', 'email', 'nome projeto/negocio', 'IUGU alias', 'tipo conta', 'balance', 'ACCOUNT NAME', 'ACCOUNT NAME'];
const cols_nomes        = 0;
const cols_sobrenomes   = 1;
const cols_cpf          = 2;
const cols_email        = 3;
const cols_nome_projeto = 4;
const cols_iugu_alias   = 5;
const cols_tipo_conta   = 6;
const cols_balance      = 7;
const cols_ACCOUNT_NAME = 8;
const cols_PASSWORD     = 9;

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
      
      const is_personal = account_type==UsersModel.ACCOUNT_TYPE_PERSONAL;
      return{
        idx                   : idx,
        account_name          : row[cols_ACCOUNT_NAME],
        alias                 : is_personal?'':row[cols_iugu_alias],
        first_name            : is_personal?row[cols_nomes]:'',
        last_name             : is_personal?row[cols_sobrenomes]:'',
        email                 : email,
        legal_id              : is_personal?(nullOrEmpty(row[cols_cpf])?'111111111111':row[cols_cpf]):'',
        business_name         : is_personal?'':row[cols_nome_projeto],
        account_type          : account_type,
        exists_at_blockchain  : false,
        balance               : row[cols_balance],
        overdraft             : 0,
        password              : row[cols_PASSWORD]
      }  
    })
  
  return users;
};

exports.sort = (users) => {
  return users.sort((a, b) => {
      if(a.account_type==UsersModel.ACCOUNT_TYPE_PERSONAL) 
        return 1;
      if(a.account_type==UsersModel.ACCOUNT_TYPE_BUSINESS &&
        b.account_type!=UsersModel.ACCOUNT_TYPE_PERSONAL) 
        return 1;
      return -1;
    })
}
const nullOrEmpty = (str) => {
  return !str || str.trim()=='';
}


