const config     = require('./common/config/env.config.js');
const express    = require('express');
const app        = express();
const bodyParser = require('body-parser');

const UsersRouter         = require('./users/routes.config');
const EosRouter           = require('./eos/routes.config');
const RequestsRouter      = require('./requests/routes.config');
const ProvidersRouter     = require('./providers/routes.config');
const IuguRouter          = require('./iugu/routes.config');
const TeamsRouter         = require('./teams/routes.config');
const ServicesRouter      = require('./services/routes.config');
const ConfigurationRouter = require('./configuration/routes.config');

const ExpressGraphQL      = require("express-graphql");
const { ApolloServer }    = require('apollo-server-express');
const {schema, typeDefs, resolvers}      = require('./graphql/index');

const PermissionMiddleware  = require('./common/middlewares/auth.permission.middleware');
const ValidationMiddleware  = require('./common/middlewares/auth.validation.middleware');


app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    } else {
        return next();
    }
});

app.use(bodyParser.json());

UsersRouter.routesConfig(app);
EosRouter.routesConfig(app);
RequestsRouter.routesConfig(app);
ProvidersRouter.routesConfig(app);
ConfigurationRouter.routesConfig(app);
IuguRouter.routesConfig(app);
TeamsRouter.routesConfig(app);
ServicesRouter.routesConfig(app);

const PORT = process.env.PORT || config.port || 5000

app.use(`${config.api_version}/graphiql`, ExpressGraphQL({
    schema:     schema,
    graphiql:   true
}));

const apollo_server = new ApolloServer({ typeDefs, resolvers , context: ({ req }) => {
    try{
      const jwt = ValidationMiddleware.getLoggedUser(req);
      if(!jwt)
        throw new AuthenticationError('you must be logged in'); 

      const is_admin = PermissionMiddleware.getLoggedPermission(jwt);

      return {
        account_name: jwt.account_name
        , is_admin:   is_admin
      }
    }
    catch(ex){
      console.log(ex)
      throw ex; 
    }
  }
});

const path = `${config.api_version}/graphql`;
apollo_server.applyMiddleware({ app , path});

app.listen(PORT, function () {
    console.log('app listening at port %s', config.port);
});

// if(process.env.MONGODB_URI)
    // app.listen(PORT, function () {
    //     console.log('app listening at port %s', config.port);
    // });
// else
//     app.listen(PORT, '0.0.0.0', function () {
//         console.log('app listening at port %s', config.port);
//     });
