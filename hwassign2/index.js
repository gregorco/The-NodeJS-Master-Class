"use strict";
/*
* Launch pizza delivery APIs
 */

// dependencies
const http = require('http');
const config = require('./lib/config');
const UnsecureServer = require('./lib/servers/UnsecureServer');
const SecureServer = require('./lib/servers/SecureServer');
const fs = require('fs');
const path = require('path');
const Router = require('./lib/routers/Router');
const UserCrudRouter = require('./lib/routers/UserCrudRouter');
const TokenCrudRouter = require('./lib/routers/TokenCrudRouter');
const LoginRouter = require('./lib/routers/LoginRouter');

let app = {};

app.init  = function() {

    const options = {
        key: fs.readFileSync(path.join(__dirname, '/https/key.pem')),
        cert: fs.readFileSync(path.join(__dirname, '/https/cert.pem'))
    };

    console.log('env = ', config);

    // initialize all routers
    let userRouter = new UserCrudRouter();
    let tokenRouter = new TokenCrudRouter();
    let loginRouter = new LoginRouter();

    // initialize servers, http and https
    let serverHttp = new UnsecureServer(config.httpPort, config.envName);
    serverHttp.userRouter = userRouter;
    serverHttp.tokenRouter = tokenRouter;
    serverHttp.loginRouter = loginRouter;

    let serverHttps = new SecureServer(options, config.httpsPort, config.envName);
    serverHttps.userRouter = userRouter;
    serverHttps.tokenRouter = tokenRouter;
    serverHttps.loginRouter = loginRouter;

    serverHttp.init();
    serverHttps.init();

    // initialize router for REST requests


};

app.init();

module.exports = app;
