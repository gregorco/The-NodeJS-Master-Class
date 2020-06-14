"use strict";
/*
* Launch pizza delivery APIs
 */

// dependencies
const config = require('./lib/config');
const UnsecureServer = require('./lib/servers/UnsecureServer');
const SecureServer = require('./lib/servers/SecureServer');
const fs = require('fs');
const path = require('path');
const UserCrudRouter = require('./lib/routers/UserCrudRouter');
const TokenCrudRouter = require('./lib/routers/TokenCrudRouter');
const LoginRouter = require('./lib/routers/LoginRouter');
const LogoutRouter = require('./lib/routers/LogoutRouter');
const MenuRouter = require('./lib/routers/MenuRouter');
const ShoppingCartCrudRouter = require('./lib/routers/ShoppingCartCrudRouter');
const OrderCrudRouter = require('./lib/routers/OrderCrudRouter');

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
    let logoutRouter = new LogoutRouter();
    let menuRouter = new MenuRouter();
    let cartRouter = new ShoppingCartCrudRouter();
    let orderRouter = new OrderCrudRouter();

    // initialize servers, http and https
    let serverHttp = new UnsecureServer(config.httpPort, config.envName);
    serverHttp.userRouter = userRouter;
    serverHttp.tokenRouter = tokenRouter;
    serverHttp.loginRouter = loginRouter;
    serverHttp.logoutRouter = logoutRouter;
    serverHttp.menuRouter = menuRouter;
    serverHttp.cartRouter = cartRouter;
    serverHttp.orderRouter = orderRouter;

    let serverHttps = new SecureServer(options, config.httpsPort, config.envName);
    serverHttps.userRouter = userRouter;
    serverHttps.tokenRouter = tokenRouter;
    serverHttps.loginRouter = loginRouter;
    serverHttps.logoutRouter = logoutRouter;
    serverHttps.menuRouter = menuRouter;
    serverHttps.cartRouter = cartRouter;
    serverHttps.orderRouter = orderRouter;

    serverHttp.init();
    serverHttps.init();

    // initialize router for REST requests


};

app.init();

module.exports = app;
