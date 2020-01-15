var RequestModel   = require('./requests/models/requests.model');
var ProviderModel  = require('./providers/models/providers.model');
var UserModel      = require('./users/models/users.model');
var rem_utils      = require('./rem_utils.js');
var moment         = require('moment');
const utf8         = require('utf8');

/*

eu faço chamadas dessa função:
def criar_arquivo_remessa(caminho_completo, data_pagamento, conta_pagamento, lista_pagamentos)

pagamento['nome'] -> nome fornecedor
pagamento['cpf_cnpj'] -> se tem cpf ou cnpj (tipo de documento brasileiro, cnpj para empresas e cpf não empresas)
pagamento['inscricao'] -> o número do documento acima
pagamento['banco'] -> código do banco
pagamento['ag'] -> número da agência
pagamento['cc'] -> número da conta corrente
pagamento['valor']
*/
const isalpha = (character) =>{
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.indexOf(character) >= 0 ;
}
const isdigit = (character) =>{
  return '0123456789,.'.indexOf(character) >= 0 ;
}
const getMoment = (value) => {
  let moment_value = value;
  if(typeof moment_value === 'object')
    return moment_value;
  if(isNaN(value)==false)
  {
    let my_value = value;
    if(value.toString().length=='1570910442875'.length)
      my_value = value/1000;
    moment_value = moment.unix(my_value)
  }
  else
    if(typeof value === 'string')
      moment_value = moment(value);
  return moment_value;
}
const pad = (pad, str, padLeft) => {
  // pad(padding,123,true)  -> '0000000123'
  // pad(padding,123,false) -> '1230000000'
  if (typeof str === 'undefined') 
    return pad;
  if (padLeft) {
    return (pad + str).slice(-pad.length);
  } else {
    return (str + pad).substring(0, pad.length);
  }
}
const doPad = (_len, char=' ') => {
  // var padding = Array(256).join(' '), // make a string of 255 spaces
  return Array(_len).join(char);
}
const padRight = (str, _len, _char) => {
  // padRight('abc',10,'0')  -> 'abc0000000'
  const _pad = doPad(_len, _char);
  return pad(_pad, str, false);
}
const padLeft  = (str, _len, _char) => {
  // padLeft('abc', 10,'0')  -> '0000000abc'
  const _pad = doPad(_len, _char);
  return pad(_pad, str, true);
}

//padLeft(178410, 10, '0')



const criar_cabecalho = (conta_pagamento) =>{
   // Build file header
    const CONTROLE_BANCO_3      = '001'       // Fixed data - 
    const CONTROLE_LOTE_4       = '0000'      // Fixed data - 
    const CONTROLE_REGISTRO_1   = '0'         // Fixed data - 
    const CNAB_9                = '         ' // Fixed data - 9 spaces

    const EMPRESA_INSCRICAO_TIPO_1  = '2'     // CPF=1 CNPJ=2 nosso caso fixo

    let EMPRESA_INSCRICAO_NUMERO_14 = '16791007000109' // CNPJ
    let EMPRESA_CONVENIO_NUMERO_9   = '000178410'      // NUMERO CONVENIO COM ZEROS A ESQ

    if (conta_pagamento == rem_utils.PAGAMENTO_EMPRESA)
    {
      EMPRESA_INSCRICAO_NUMERO_14 = '25289574000152' // CNPJ
      EMPRESA_CONVENIO_NUMERO_9   = '000156030'      // NUMERO CONVENIO COM ZEROS A ESQ
    }
    

    const EMPRESA_CONVENIO_CODIGO_4    = '0126';   // Fixed data
    const EMPRESA_CONVENIO_RES_BANCO_5 = '     ';  // Fixed data: 5 spaces
    const EMPRESA_CONVENIO_ARQ_TESTE_2 = '  ';     // Fixed data: 2 spaces for production (Branco produção), 'TS' for testing
    
    const EMPRESA_CC_AGENCIA_6         = '04105X' // fixo por nossos bancos serem na mesma agencia

    let EMPRESA_CC_CONTA_13 = '0000000143472';
    // Completar com zeros a esquerda
    if(conta_pagamento == rem_utils.PAGAMENTO_INSTITUTO_PROJETO)
        EMPRESA_CC_CONTA_13 = '0000000143472';
    else if( conta_pagamento == rem_utils.PAGAMENTO_INSTITUTO_PPA)
        EMPRESA_CC_CONTA_13 = '0000000169668';
    else if( conta_pagamento == rem_utils.PAGAMENTO_EMPRESA)
        EMPRESA_CC_CONTA_13 = '0000000166200';

    const EMPRESA_CC_DV_1 = '0' // fixo

    let EMPRESA_NOME_30 = 'INSTITUTO INKIRI              ' // 30 characters
    if(conta_pagamento == rem_utils.PAGAMENTO_EMPRESA)
        EMPRESA_NOME_30 = 'INKIRI EDUCACAO DO SER LTDA   ' // 30 characters
    

    const NOME_BANCO_30           = 'BANCO DO BRASIL S/A           ' // 30 characters

    const CNAB_10                 = Array(10).join(' '); // '          '; // Fixed data: 10 spaces

    const ARQUIVO_CODIGO_1        = '1'; // fixo remessa=1 retorno=2

    const ARQUIVO_DATA_GERACAO_8  = moment().format('DDMMYYYY'); //datetime.now().strftime('%d%m%Y') // 14012020
    
    const ARQUIVO_DATA_HORA_6     = '000000';    // fixo
    const ARQUIVO_SEQUENCIA_6     = '000000';    // sequencial pode ser 0s - controle interno
    const ARQUIVO_LAYOUT_3        = '000';       // pode ser 0s - controle interno versão layout arquivo
    const ARQUIVO_DENSIDADE_5     = '00000';     // fixo

    const ESPACOS_BRANCO_69       = doPad(69,' ');
    // const ESPACOS_BRANCO_69 = '                                                                     '
    const cabecalho = `${CONTROLE_BANCO_3}${CONTROLE_LOTE_4}${CONTROLE_REGISTRO_1}${CNAB_9}${EMPRESA_INSCRICAO_TIPO_1}${EMPRESA_INSCRICAO_NUMERO_14}${EMPRESA_CONVENIO_NUMERO_9}${EMPRESA_CONVENIO_CODIGO_4}${EMPRESA_CONVENIO_RES_BANCO_5}${EMPRESA_CONVENIO_ARQ_TESTE_2}${EMPRESA_CC_AGENCIA_6}${EMPRESA_CC_CONTA_13}${EMPRESA_CC_DV_1}${EMPRESA_NOME_30}${NOME_BANCO_30}${CNAB_10}${ARQUIVO_CODIGO_1}${ARQUIVO_DATA_GERACAO_8}${ARQUIVO_DATA_HORA_6}${ARQUIVO_SEQUENCIA_6}${ARQUIVO_LAYOUT_3}${ARQUIVO_DENSIDADE_5}${ESPACOS_BRANCO_69}\n`;
    
    return cabecalho
}
    


const criar_cabecalho_lote_ab = (conta_pagamento) => {
    //'''Header do arquivo lote AB'''
    const CONTROLE_BANCO_CODIGO_3     = '001';  // fixo
    const CONTROLE_LOTE_4             = '0001'; // numero do lote, vai aumentando de forma sucessiva se tem mais de um lote no mesmo arquivo
    const CONTROLE_REGISTRO_1         = '1';    // fixo

    const SERVICO_OPERACAO_TIPO_1     = 'C';   // fixo
    const SERVICO_TIPO_2              = '20';  // Pagamento a Fornecedor = '20' Pagamento de Salário = '30' Pagamentos Diversos = '98'
    const SERVICO_FORMA_LANCAMENTO_2  = '41';  // Conta Corrente = '01' DOC/TED = '03'* Poupança = '05' TED Outra Titularidade = '41'* TED Mnesma Titularidade = '43'* * Necessidade de complementação de informação do campo 'Código da Câmara de Compensação', posições18 a 20 do Segmento A.
    const SERVICO_LAYOUT_3            = '031';

    const CNAB_1 = ' '; // Fixed: 1 space

    const EMPRESA_INSCRICAO_TIPO_1 = '2'; // CPF=1 CNPJ=2 nosso caso fixo

    let EMPRESA_INSCRICAO_NUMERO_14 = '16791007000109'; // CNPJ
    let EMPRESA_CONVENIO_NUMERO_9   = '000178410';      // NUMERO CONVENIO COM ZEROS A ESQ
    if (conta_pagamento == rem_utils.PAGAMENTO_EMPRESA)
    {    
      EMPRESA_INSCRICAO_NUMERO_14 = '25289574000152'; // CNPJ
      EMPRESA_CONVENIO_NUMERO_9   = '000156030';      // NUMERO CONVENIO COM ZEROS A ESQ
    }
    
    const EMPRESA_CONVENIO_CODIGO_4    = '0126';  // Fixed data
    const EMPRESA_CONVENIO_RES_BANCO_5 = '     '; // Fixed data: 5 spaces
    const EMPRESA_CONVENIO_ARQ_TESTE_2 = '  ';    // Branco produção, 'TS' teste

    const EMPRESA_CC_AGENCIA_6         = '04105X'; // fixo por nossos bancos serem na mesma agencia

    let EMPRESA_CC_CONTA_13            = doPad(13,'0');
    // Completar com zeros a esquerda
    if( conta_pagamento == rem_utils.PAGAMENTO_INSTITUTO_PROJETO)
        EMPRESA_CC_CONTA_13 = '0000000143472'
    else if (conta_pagamento == rem_utils.PAGAMENTO_INSTITUTO_PPA)
        EMPRESA_CC_CONTA_13 = '0000000169668'
    else if (conta_pagamento == rem_utils.PAGAMENTO_EMPRESA)
        EMPRESA_CC_CONTA_13 = '0000000166200'

    const EMPRESA_CC_DV_1 = '0'; //fixo

    let EMPRESA_NOME_30 = 'INSTITUTO INKIRI              ';
    if(conta_pagamento == rem_utils.PAGAMENTO_EMPRESA)
        EMPRESA_NOME_30 = 'INKIRI EDUCACAO DO SER LTDA   ';

    const ESPACOS_EM_BRANCO_152 = doPad(152,' ');
    // const ESPACOS_EM_BRANCO_152 = '                                                                                                                                          ';
    //ESPACOS_EM_BRANCO_152 = '                                                                                                                                              V.PAG20020';

    const cabecalho = `${CONTROLE_BANCO_CODIGO_3}${CONTROLE_LOTE_4}${CONTROLE_REGISTRO_1}${SERVICO_OPERACAO_TIPO_1}${SERVICO_TIPO_2}${SERVICO_FORMA_LANCAMENTO_2}${SERVICO_LAYOUT_3}${CNAB_1}${EMPRESA_INSCRICAO_TIPO_1}${EMPRESA_INSCRICAO_NUMERO_14}${EMPRESA_CONVENIO_NUMERO_9}${EMPRESA_CONVENIO_CODIGO_4}${EMPRESA_CONVENIO_RES_BANCO_5}${EMPRESA_CONVENIO_ARQ_TESTE_2}${EMPRESA_CC_AGENCIA_6}${EMPRESA_CC_CONTA_13}${EMPRESA_CC_DV_1}${EMPRESA_NOME_30}${ESPACOS_EM_BRANCO_152}\n`;

    return cabecalho
}

/*
  'Quelsia da Luz Bonfim'.toUpperCase(),
    rem_utils.IDENTIFICACAO_TIPO_CPF,
    35330444837,
    237,
    3066,
    10790,
    moment('30012019', 'DDMMYYYY'),
    parseFloat('1000.00')
*/

const criar_segmento_ab = (registro, nome, CPF_CNPJ, documento, codigo_banco, agencia, conta, data_pagamento, valor) => {

    const __criar_segmento_a = (registro, nome, CPF_CNPJ, documento, codigo_banco, agencia, conta, data_pagamento, valor) =>{

      // '''Todos os dados somente número'''
      const CONTROLE_BANCO_3                       = '001'      // fixo
      const CONTROLE_LOTE_4                        = '0001'     // numero do lote igual do header
      const CONTROLE_REGISTRO_1                    = '3'        // fixo

      const SERVICO_N_REGISTRO_5                   = padLeft(registro, 5, '0'); //str(registro).zfill(5)
      const SERVICO_SEGMENTO_1                     = 'A';
      const SERVICO_MOVIMENTO_TIPO_1               = '0';   // Inclusão = '0' Exclusão = '9'
      const SERVICO_MOVIMENTO_CODIGO_2             = '00';  // Inclusão = '00' Exclusão = '99'
      const FAVORECIDO_CAMARA_3                    = '018'; // TED (STR, CIP) = '018' DOC (COMPE) = '700' TED (STR/CIP) = '988'
      const FAVORECIDO_BANCO_3                     = codigo_banco.toString()

      // # ATENÇÃO AQUI, ALTERAR SE NÃO TIVER DV
      const FAVORECIDO_CC_AGENCIA_5                = padLeft(agencia, 5, '0');  // str(agencia).zfill(5) # AGENCIA COM DV, SE DV FOR X COLOCAR X MAIUSCULO VAZIO SEM DV
      const FAVORECIDO_CC_AGENCIA_DV_1             = ' ';                       // AGENCIA COM DV, SE DV FOR X COLOCAR X MAIUSCULO VAZIO SEM DV
      const FAVORECIDO_CC_CONTA_13                 = padLeft(conta, 13, '0');   // str(conta).zfill(13) # CONTA COM DV, SE DV FOR X COLOCAR X MAIUSCULO
      const FAVORECIDO_DV_1                        = ' ' //# Banco do Brasil = branco Outros Bancos = Para favorecidos de outros bancos que possuem contas com dois dígitos verificadores (DV), preencher este campo com o segundo dígito verificador.
      const FAVORECIDO_NOME_30                     = padRight(nome.trim(), 30, ' '); //str(nome).ljust(30)

      const CREDITO_SEU_NUMERO_12                  = '000000000000'; // fixo 6 primeiros vao no extrato do favorecido e 6 ultimos no extrato do pagante
      const CREDITO_SEU_NUMERO_8                   = '00000000';     // numero de controle interno, mesmo numero volta no retorno
      const CREDITO_DATA_PAGAMENTO_8               = getMoment(data_pagamento).format('DDMMYYYY'); // data_pagamento.strftime('%d%m%Y')
      const CREDITO_MOEDA_TIPO_3                   = 'BRL'; // fixo
      const CREDITO_MOEDA_QTDE_15                  = '000000000000000'; // fixo
      const CREDITO_VALOR_PAGAMENTO_15             = padLeft( valor.toFixed(2).replace('.', '') , 15, '0'); //str(valor).replace('.', '').zfill(15)
      const CREDITO_NOSSO_NUMERO_20                = '                    '; // fixo
      const CREDITO_DATA_REAL_8                    = '00000000';             //fixo Arquivo Retorno = DDMMAAAA
      const CREDITO_VALOR_REAL_15                  = '000000000000000';       //fixo Arquivo Retorno = Valor do pagamento efetivad
      
      const INFORMACAO_2_40                        = '01                                      '; //FIXO?
      
      const CODIGO_FINALIDADE_DOC_2                = '01';     // FIXO? Compl. Tipo Serviç
      const CODIGO_FINALIDADE_TED_5                = '     ';  // fixo
      const CODIGO_FINALIDADE_COMPLEMENTAR_2       = '  '      // Código Finalidade Complementar

      const CNAB_3                                 = '   ';    // Fixo

      const AVISO_1                                = '0';     // fixo

      const OCORRENCIAS_10                         = '          '; // fixo

      const segmento_a =  `${CONTROLE_BANCO_3}${CONTROLE_LOTE_4}${CONTROLE_REGISTRO_1}${SERVICO_N_REGISTRO_5}${SERVICO_SEGMENTO_1}${SERVICO_MOVIMENTO_TIPO_1}${SERVICO_MOVIMENTO_CODIGO_2}${FAVORECIDO_CAMARA_3}${FAVORECIDO_BANCO_3}${FAVORECIDO_CC_AGENCIA_5}${FAVORECIDO_CC_AGENCIA_DV_1}${FAVORECIDO_CC_CONTA_13}${FAVORECIDO_DV_1}${FAVORECIDO_NOME_30}${CREDITO_SEU_NUMERO_12}${CREDITO_SEU_NUMERO_8}${CREDITO_DATA_PAGAMENTO_8}${CREDITO_MOEDA_TIPO_3}${CREDITO_MOEDA_QTDE_15}${CREDITO_VALOR_PAGAMENTO_15}${CREDITO_NOSSO_NUMERO_20}${CREDITO_DATA_REAL_8}${CREDITO_VALOR_REAL_15}${INFORMACAO_2_40}${CODIGO_FINALIDADE_DOC_2}${CODIGO_FINALIDADE_TED_5}${CODIGO_FINALIDADE_COMPLEMENTAR_2}${CNAB_3}${AVISO_1}${OCORRENCIAS_10}\n`;
      
      return segmento_a;
    }
    
    const __criar_segmento_b = (registro, nome, CPF_CNPJ, documento, codigo_banco, agencia, conta, data_pagamento, valor) =>{
      const CONTROLE_BANCO_3                       = '001';  // fixo
      const CONTROLE_LOTE_4                        = '0001'; // numero do lote igual do header
      const CONTROLE_REGISTRO_1                    = '3';    // fixo

      const SERVICO_N_REGISTRO_5                   = padLeft( (parseInt(registro)+1) , 5, '0'); //str(registro + 1).zfill(5)
      const SERVICO_SEGMENTO_1                     = 'B';

      const CNAB_3                                 = '   ';

      let FAVORECIDO_INSCRICAO_TIPO_1              = '2';
      if (CPF_CNPJ == rem_utils.IDENTIFICACAO_TIPO_CPF)
          FAVORECIDO_INSCRICAO_TIPO_1              = '1';
      // else if (CPF_CNPJ == IDENTIFICACAO_TIPO_CNPJ)
      //     FAVORECIDO_INSCRICAO_TIPO_1 = '2'

      const FAVORECIDO_INSCRICAO_NUMERO_14         = padLeft( documento , 14, '0'); // str(documento).zfill(14)
      const FAVORECIDO_LOGRADOURO_30               = '                              '; // nao obrigatorio deixar em branco
      const FAVORECIDO_LOGRADOURO_NUMERO_5         = '     '; // nao obrigatorio deixar em branco
      const FAVORECIDO_LOGRADOURO_COMP_15          = '               '; // nao obrigatorio deixar em branco
      const FAVORECIDO_LOGRADOURO_BAIRRO_15        = '               '; // nao obrigatorio deixar em branco
      const FAVORECIDO_LOGRADOURO_CIDADE_20        = '                    '; // nao obrigatorio deixar em branco
      const FAVORECIDO_LOGRADOURO_CEP_5            = '     '; // nao obrigatorio deixar em branco
      const FAVORECIDO_LOGRADOURO_COMPL_CEP_3      = '   '; // nao obrigatorio deixar em branco
      const FAVORECIDO_LOGRADOURO_ESTADO_2         = '  '; // nao obrigatorio deixar em branco

      const PAGAMENTO_VENCIMENTO_8                 = getMoment(data_pagamento).format('DDMMYYYY'); // data_pagamento.strftime('%d%m%Y')
      const PAGAMENTO_VALOR_15                     = padLeft( valor.toFixed(2).replace('.', '') , 15, '0'); //str(valor).replace('.', '').zfill(15)
      const PAGAMENTO_ABATIMENTO_15                = '         ';
      const PAGAMENTO_DESCONTO_15                  = '               ';
      const PAGAMENTO_MORA_15                      = '               ';
      const PAGAMENTO_MULTA_15                     = '               ';
      
      const COD_FAVORECIDO_15                      = '         ';
      const AVISO_1                                = ' ';
      // const ESPACOS_EM_BRANCO_26                   = '                          ';
      const ESPACOS_EM_BRANCO_26                   = doPad(26,' ');

      const segmento_b = `${CONTROLE_BANCO_3}${CONTROLE_LOTE_4}${CONTROLE_REGISTRO_1}${SERVICO_N_REGISTRO_5}${SERVICO_SEGMENTO_1}${CNAB_3}${FAVORECIDO_INSCRICAO_TIPO_1}${FAVORECIDO_INSCRICAO_NUMERO_14}${FAVORECIDO_LOGRADOURO_30}${FAVORECIDO_LOGRADOURO_NUMERO_5}${FAVORECIDO_LOGRADOURO_COMP_15}${FAVORECIDO_LOGRADOURO_BAIRRO_15}${FAVORECIDO_LOGRADOURO_CIDADE_20}${FAVORECIDO_LOGRADOURO_CEP_5}${FAVORECIDO_LOGRADOURO_COMPL_CEP_3}${FAVORECIDO_LOGRADOURO_ESTADO_2}${PAGAMENTO_VENCIMENTO_8}${PAGAMENTO_VALOR_15}${PAGAMENTO_ABATIMENTO_15}${PAGAMENTO_DESCONTO_15}${PAGAMENTO_MORA_15}${PAGAMENTO_MULTA_15}${COD_FAVORECIDO_15}${AVISO_1}${ESPACOS_EM_BRANCO_26}\n`;
      return segmento_b
    }

    const segmento_a = __criar_segmento_a(registro, nome, CPF_CNPJ, documento, codigo_banco, agencia, conta, data_pagamento, valor);
    const segmento_b = __criar_segmento_b(registro, nome, CPF_CNPJ, documento, codigo_banco, agencia, conta, data_pagamento, valor);

    return segmento_a.concat(segmento_b);
}

const criar_trailer_lote = (qtde_pagamentos, total_valor) =>{

    const CONTROLE_BANCO_3            = '001'; // fixo
    const CONTROLE_LOTE_4             = '0001'; // numero do lote igual do header
    const CONTROLE_REGISTRO_1         = '5'; // fixo

    const CNAB_9                      = '         '; // fixo

    const TOTAIS_REGISTRO_6           = padLeft( (qtde_pagamentos * 2 + 2) , 6, '0');                 // str(qtde_pagamentos * 2 + 2).zfill(6)
    const TOTAIS_VALOR_18             = padLeft( total_valor.toFixed(2).replace('.', '') , 18, '0');  // str(total_valor).replace('.', '').zfill(18)

    const ESPACOS_BRANCO_199          = doPad(199,' ');
    // const ESPACOS_BRANCO_199 = '                                                                                                                                                                                                       '

    const trailer = `${CONTROLE_BANCO_3}${CONTROLE_LOTE_4}${CONTROLE_REGISTRO_1}${CNAB_9}${TOTAIS_REGISTRO_6}${TOTAIS_VALOR_18}${ESPACOS_BRANCO_199}\n`;

    return trailer
}

const criar_trailer_arquivo = (qtde_pagamentos) => {

    const CONTROLE_BANCO_3     = '001'; //fixo
    const CONTROLE_LOTE_4      = '9999'; //fixo
    const CONTROLE_REGISTRO_1  = '9'; //fixo

    const CNAB_9               = '         '; // fixo

    const TOTAIS_LOTE_6        = '000001'; // quantidade de lotes tipo 1
                                 
    const TOTAIS_VALOR_6       = padLeft( (qtde_pagamentos * 2 + 4) , 6, '0'); //str(qtde_pagamentos * 2 + 4).replace('.', '').zfill(6)

    // const ESPACOS_BRANCO_211 = '                                                                                                                                                                                                                   '
    const ESPACOS_BRANCO_211   = doPad(211,' ');
    
    const trailer = `${CONTROLE_BANCO_3}${CONTROLE_LOTE_4}${CONTROLE_REGISTRO_1}${CNAB_9}${TOTAIS_LOTE_6}${TOTAIS_VALOR_6}${ESPACOS_BRANCO_211}\n`;

    return trailer
}

const nome_valido = (character) => { return isalpha(character) || character == ' ';}

const criar_arquivo_remessa = (data_pagamento, conta_pagamento, lista_pagamentos) => {

    const qtde_pagamentos     = lista_pagamentos.length;
    const cabecalho           = criar_cabecalho(conta_pagamento);
    const cabecalho_lote_ab   = criar_cabecalho_lote_ab(conta_pagamento);
    let remessa               = cabecalho.concat(cabecalho_lote_ab);
    
    const total        = lista_pagamentos.reduce((acc, pagamento) => acc + parseFloat(pagamento['valor'] ), 0);
    const segmentos_ab = lista_pagamentos.map( (pagamento, idx)=>{
      
      let nome = pagamento['nome'];
      console.log(`${idx} - #1 - nome: ${nome}`)
      nome = utf8.encode(nome).split('').filter(  char => nome_valido(char) ).join('');
      console.log(`${idx} - #2 - nome: ${nome}`)
      if(nome.length>30)
        nome = nome.substring(0, 30)
      console.log(`${idx} - #3 - nome: ${nome}`)
      return criar_segmento_ab((2 * (idx + 1) - 1)                
                            , nome.toUpperCase()                
                            , pagamento['cpf_cnpj']                
                            , utf8.encode(pagamento['documento']).split('').map(  char => isdigit(char) ).join('')  // filter(str.isdigit, pagamento['inscricao'].encode('utf8')),                
                            , utf8.encode(pagamento['codigo_banco']).split('').map(  char => isdigit(char) ).join('')      // filter(str.isdigit, pagamento['banco'].encode('utf8'))                
                            , utf8.encode(pagamento['agencia']).split('').map(  char => isdigit(char) ).join('')         // filter(str.isdigit, pagamento['ag'].encode('utf8'))                
                            , utf8.encode(pagamento['conta']).split('').map(  char => isdigit(char) ).join('')         // filter(str.isdigit, pagamento['cc'].encode('utf8'))                
                            , data_pagamento                
                            , parseFloat(pagamento['valor']))                
    })

    remessa = remessa.concat(segmentos_ab)
    /*
      def nome_valido(caracter):
        return caracter.isalpha() or caracter == ' '        
      nome = u'Ateliê Inkiri'
      nome = filter(nome_valido, nome.encode('utf8'))
      print nome
    */

    const _trailer_lote = criar_trailer_lote(qtde_pagamentos, total)
    const _trailer_arquivo = criar_trailer_arquivo(qtde_pagamentos)

    remessa = remessa.concat(_trailer_lote)
    remessa = remessa.concat(_trailer_arquivo)
    // f = open(caminho_completo, 'a')
    // f.write(remessa)
    // f.close()
    return remessa;
}


const test = () => {
    
    let remessa = criar_cabecalho(rem_utils.PAGAMENTO_INSTITUTO_PROJETO)
    remessa = remessa + criar_cabecalho_lote_ab(rem_utils.PAGAMENTO_INSTITUTO_PROJETO)

    remessa = remessa + 
            criar_segmento_ab(1, 
                            'Quelsia da Luz Bonfim'.toUpperCase(),
                            rem_utils.IDENTIFICACAO_TIPO_CPF,
                            35330444837,
                            237,
                            3066,
                            10790,
                            moment('30012019', 'DDMMYYYY'),
                            parseFloat('1000.00'))

    remessa = remessa + 
            criar_segmento_ab(3, 
                            'EMPORIO ILEOS LTDA ME'.toUpperCase(),
                            rem_utils.IDENTIFICACAO_TIPO_CNPJ,
                            12339555000141,
                            237,
                            237,
                            73555,
                            moment('30012019', 'DDMMYYYY'),
                            parseFloat('116.55'))

    remessa = remessa + 
            criar_segmento_ab(5, 
                            'Edimilson Moreira Santos ME'.toUpperCase(),
                            rem_utils.IDENTIFICACAO_TIPO_CNPJ,
                            10303498000115,
                            237,
                            3522,
                            387827,
                            moment('30012019', 'DDMMYYYY'),
                            parseFloat('207.00'))

    remessa = remessa + 
        criar_trailer_lote(3, parseFloat('1000.00') + parseFloat('116.55') + parseFloat('207.00'))

    remessa = remessa + criar_trailer_arquivo(3)

    // f = open(datetime.now().strftime("%Y-%m-%d") + "remessa.REM", 'a')
    // f.write(remessa)
    // f.close()
    return remessa;
}

const test2 = () => {
    
    const data_pagamento     = moment();
    const conta_pagamento    = rem_utils.PAGAMENTO_EMPRESA;
    // const conta_pagamento    = rem_utils.PAGAMENTO_INSTITUTO_PROJETO;
    // const conta_pagamento    = rem_utils.PAGAMENTO_INSTITUTO_PPA;
    const lista_pagamentos   = [
      {
        nome           : 'Quelsia da Luz Bonfim'.toUpperCase()
        , cpf_cnpj       : rem_utils.IDENTIFICACAO_TIPO_CPF
        , documento      : 35330444837
        , codigo_banco   : 237
        , agencia        : 3066
        , conta          : 10790
        , valor          : parseFloat('1000.00')
      },
      {
        nome           : 'EMPORIO ILEOS LTDA ME'.toUpperCase()
        , cpf_cnpj       : rem_utils.IDENTIFICACAO_TIPO_CNPJ
        , documento      : 12339555000141
        , codigo_banco   : 237
        , agencia        : 237
        , conta          : 73555
        , valor          : parseFloat('116.55')
      },
      {
        nome           : 'Edimilson Moreira Santos ME'.toUpperCase()
        , cpf_cnpj       : rem_utils.IDENTIFICACAO_TIPO_CNPJ
        , documento      : 10303498000115
        , codigo_banco   : 237
        , agencia        : 3522
        , conta          : 387827
        , valor          : parseFloat('207.00')
      }
    ];
    const arquivo_remessa = criar_arquivo_remessa(data_pagamento, conta_pagamento, lista_pagamentos)
    
    // f = open(datetime.now().strftime("%Y-%m-%d") + "remessa.REM", 'a')
    // f.write(remessa)
    // f.close()
    return arquivo_remessa;
}

const trimAndUppercase = (str) => {
  if(!str)
    return '';
  return str.trim().toUpperCase();
}
const _trim = (str) => {
  if(!str)
    return '';
  return str.trim();
}
exports.generateREMForRequests = async (requests_ids, payer_account) =>{
  const requests = await RequestModel.model.find({_id: {$in : requests_ids.split(',')}}).populate('created_by').populate('requested_by').populate('requested_to').populate('provider').exec()
  if(!requests)
    return null;

  console.log(' == about to loop:', requests.length)
  const request_list = requests.map( request => {
    console.log(' ====== request._id:', request._id)
    const is_biz       = request.requested_type == RequestModel.TYPE_PROVIDER;
    const provider     = request.provider;
    const customer     = request.requested_by;
    if(is_biz && (!provider || !provider.bank_accounts || !provider.bank_accounts.length>0) )
      return null;
    if(!is_biz && (!customer || !request.bank_account) )
      return null;
    const bank_account = is_biz?provider.bank_accounts[0]:request.bank_account;
    const legal_id = (is_biz  ? provider.cnpj : customer.legal_id)||'';
    return {
      nome             : is_biz  ? trimAndUppercase(provider.name) : `${trimAndUppercase(customer.name)} ${trimAndUppercase(customer.last_name) }` 
      , cpf_cnpj       : is_biz  ? rem_utils.IDENTIFICACAO_TIPO_CNPJ : rem_utils.IDENTIFICACAO_TIPO_CPF
      , documento      : legal_id
      , codigo_banco   : 237
      , agencia        : _trim(bank_account.agency)
      , conta          : _trim(bank_account.cc)
      , data_pagamento : moment().format('DDMMYYYY')
      , valor          : parseFloat(request.amount)      
    }
  }).filter(req => req!=null)
  console.log(' == about to respond...')
  const res = await criar_arquivo_remessa(moment(), parseInt(payer_account), request_list);
  return res;
}

// (async () => {
    
//   // const nome = 'tripanosoma'
//   // console.log(utf8.encode(nome).split('').filter(  char => nome_valido(char) ).join(''))
//   // console.log('padR:', padRight(nome.trim(), 30, ' '))
//   // return;

//   // const x1 = await test();
//   // console.log('---------------------------------------');
//   // console.log('test1:');
//   // console.log('---------------------------------------');
//   // console.log(x1);
//   // console.log('---------------------------------------');

//   const x2 = await test2();
//   console.log('---------------------------------------');
//   console.log('test2: --');
//   console.log(x2);
//   console.log('---------------------------------------');

//   const x3 = await exports.generateREMForRequests('5e1ee8b9d4fb5f00175029f8,5e1ee88dd4fb5f00175029f7', 0);
//   console.log('---------------------------------------');
//   console.log('generateREMForRequests: --');
//   console.log(x3);
//   console.log('---------------------------------------');

//   return process.exit(0);
  
  
// })();
