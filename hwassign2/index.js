"use strict";
/*
* Launch pizza delivery APIs
 */

// dependencies
const http = require('http');
const config = require('./lib/config');
const UnsecureServer = require('./lib/unsecureserver');
const SecureServer = require('./lib/secureserver');
const fs = require('fs');
const path = require('path');
const Router = require('./lib/router');
const UserRouter = require('./lib/router_user');
const TokenRouter = require('./lib/router_token');

let app = {};

app.init  = function() {

    const options = {
        key: fs.readFileSync(path.join(__dirname, '/https/key.pem')),
        cert: fs.readFileSync(path.join(__dirname, '/https/cert.pem'))
    };

    console.log('env = ', config);

    // initialize all routers
    let router = new Router();
    let userRouter = new UserRouter();
    let tokenRouter = new TokenRouter();

    // initialize servers, http and https
    let serverHttp = new UnsecureServer(config.httpPort, config.envName);
    serverHttp.router = router;
    serverHttp.userRouter = userRouter;
    serverHttp.tokenRouter = tokenRouter;
    let serverHttps = new SecureServer(options, config.httpsPort, config.envName);
    serverHttps.router = router;
    serverHttps.userRouter = userRouter;
    serverHttps.tokenRouter = tokenRouter;

    serverHttp.init();
    serverHttps.init();

    // initialize router for REST requests


};

app.init();

