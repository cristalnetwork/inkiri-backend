const config     = require('./common/config/env.config.js');
const express    = require('express');
const app        = express();
const bodyParser = require('body-parser');

const AuthorizationRouter = require('./authorization/routes.config');
const UsersRouter         = require('./users/routes.config');
const EosRouter           = require('./eos/routes.config');
const RequestsRouter      = require('./requests/routes.config');
const ProvidersRouter     = require('./providers/routes.config');
const BankAccountsRouter  = require('./bank_accounts/routes.config');
const CommonRouter        = require('./common/routes.config');
const IuguRouter          = require('./iugu/routes.config');
const TeamsRouter         = require('./teams/routes.config');
const ServicesRouter      = require('./services/routes.config');

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
AuthorizationRouter.routesConfig(app);
UsersRouter.routesConfig(app);
EosRouter.routesConfig(app);
RequestsRouter.routesConfig(app);
ProvidersRouter.routesConfig(app);
BankAccountsRouter.routesConfig(app);
CommonRouter.routesConfig(app);
IuguRouter.routesConfig(app);
TeamsRouter.routesConfig(app);
ServicesRouter.routesConfig(app);

const PORT = process.env.PORT || config.port || 5000

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
