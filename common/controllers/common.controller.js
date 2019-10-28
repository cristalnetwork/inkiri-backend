const config            = require('../../common/config/env.config.js');
const RequestsModel     = require('../../requests/models/requests.model');

exports.getConfig = (req, res) => {
    const config = {
      requests:
        {
          provider_payments : {
              vehicle : {
                key: RequestsModel.PAYMENT_VEHICLE
                , title: 'Vehicle'
                , options: [
                  {
                    key: RequestsModel.PAYMENT_VEHICLE_INKIRI,
                    label:'Alugel'
                  }
                  ,{
                    key: RequestsModel.PAYMENT_VEHICLE_INSTITUTO,
                    label:'Instituto'
                  }
                ]
              }
              , category : {
                key: RequestsModel.PAYMENT_CATEGORY
                , title: 'Category'
                , options: [
                  {
                    key: RequestsModel.PAYMENT_CATEGORY_ALUGEL,
                    label: 'Alugel'
                  },
                  {
                    key: RequestsModel.PAYMENT_CATEGORY_INVESTIMENTO,
                    label: 'Investimento'
                  },
                  {
                    key: RequestsModel.PAYMENT_CATEGORY_INSUMOS,
                    label: 'Insumos'
                  },
                  {
                    key: RequestsModel.PAYMENT_CATEGORY_ANOTHER,
                    label: 'Another...'
                  }
                ]
              }
              , type : {
                key: RequestsModel.PAYMENT_TYPE
                , title : 'Tipo saida'
                , options: [
                  {
                    key: RequestsModel.PAYMENT_TYPE_DESPESA,
                    label: 'Despesa'
                  },
                  {
                    key: RequestsModel.PAYMENT_TYPE_INVESTIMENTO,
                    label: 'Investimento'
                  }
                ]
              }
              , mode : {
                key: RequestsModel.PAYMENT_MODE
                , title : 'Tipo saida'
                , options: [
                  {
                    key: RequestsModel.PAYMENT_MODE_TRANSFER,
                    label: 'Bank transfer'
                  },
                  {
                    key: RequestsModel.PAYMENT_MODE_BOLETO,
                    label: 'Boleto Pagamento'
                  }
                ]
              }
          }
        }
    }
    res.status(200).send(config);

};
