const config     = require('./src/common/config/env.config.js');
const express    = require('express');
const app        = express();
const bodyParser = require('body-parser');

const UsersRouter         = require('./src/users/routes.config');
const EosRouter           = require('./src/eos/routes.config');
const RequestsRouter      = require('./src/requests/routes.config');
const ProvidersRouter     = require('./src/providers/routes.config');
const IuguRouter          = require('./src/iugu/routes.config');
const TeamsRouter         = require('./src/teams/routes.config');
const ServicesRouter      = require('./src/services/routes.config');
const ConfigurationRouter = require('./src/configuration/routes.config');

const ExpressGraphQL      = require("express-graphql");
const { ApolloServer }    = require('apollo-server-express');
const {schema, typeDefs, resolvers}      = require('./src/graphql/index');

const PermissionMiddleware  = require('./src/common/middlewares/auth.permission.middleware');
const ValidationMiddleware  = require('./src/common/middlewares/auth.validation.middleware');

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

const apollo_server = new ApolloServer({ typeDefs, resolvers , 
  context: ({ req }) => {
    
    let jwt = null;
    try{
      jwt = ValidationMiddleware.getLoggedUser(req);
    }
    catch(ex){
      console.log(ex)
      // throw ex; 
      console.log('.... apollo returning null name')
      return {account_name:'', is_admin:false}
    }

    if(!jwt)
      // throw new AuthenticationError('you must be logged in'); 
      return {account_name:'', is_admin:false}

    const is_admin = PermissionMiddleware.getLoggedPermission(jwt);

    return {
      account_name: jwt.account_name
      , is_admin:   is_admin
    }
  }
});

const path = `${config.api_version}/graphql`;
apollo_server.applyMiddleware({ app , path});

app.listen(PORT, function () {
    console.log('app listening at port %s', config.port);
});
