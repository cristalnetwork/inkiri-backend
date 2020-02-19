const UsersModel        = require('../models/users.model');


const cols              = ['idx', 'account_name','alias','first_name','last_name','email','legal_id','business_name','account_type','exists_at_blockchain','balance','overdraft','password','public_key'   ];

const col_idx_idx           = 0;
const col_idx_account_name  = 1;
const col_idx_alias         = 2;
const col_idx_first_name    = 3;
const col_idx_last_name     = 4;
const col_idx_email         = 5;
const col_idx_legal_id      = 6;
const col_idx_business_name = 7;
const col_idx_account_type  = 8;
const col_idx_exists_at_blockchain = 9;
const col_idx_balance       = 10;
const col_idx_overdraft     = 11;
const col_idx_password      = 12;
const col_idx_public_key    = 13;

// module.exports = (rows) => {
exports.download = (rows) => {
  console.log('Parsing spreadsheet data ...');
  
  const account_types = {
    'pessoal' : UsersModel.ACCOUNT_TYPE_PERSONAL,
    'projeto' : UsersModel.ACCOUNT_TYPE_BUSINESS,
    'fundo'   : UsersModel.ACCOUNT_TYPE_FOUNDATION
  };
  
  let account_names_array = [];
  const users = rows
    .map((row, idx) => {
      const account_type = row[col_idx_account_type];
      const email        = row[col_idx_email];
      
      const is_personal = account_type==UsersModel.ACCOUNT_TYPE_PERSONAL;
      return{
        idx                   : row[col_idx_idx],
        account_name          : row[col_idx_account_name],
        alias                 : is_personal?'':row[col_idx_alias],
        first_name            : is_personal?row[col_idx_first_name]:'',
        last_name             : is_personal?row[col_idx_last_name]:'',
        email                 : email,
        legal_id              : is_personal?(nullOrEmpty(row[col_idx_legal_id])?'111111111111':row[col_idx_legal_id]):'',
        business_name         : is_personal?'':row[col_idx_business_name],
        account_type          : account_type,
        exists_at_blockchain  : false,
        balance               : 0,
        overdraft             : 0,
        password              : row[col_idx_password],
        public_key            : row[col_idx_public_key]
      }  
    })
  
  return users;
};

exports.sort = (users) => {
  return users.sort((a, b) => {
      if(a.account_type==UsersModel.ACCOUNT_TYPE_PERSONAL) 
        return -1;
      if(a.account_type==UsersModel.ACCOUNT_TYPE_BUSINESS &&
        b.account_type!=UsersModel.ACCOUNT_TYPE_PERSONAL) 
        return -1;
      return 1;
    })
}
const nullOrEmpty = (str) => {
  return !str || str.trim()=='';
}


