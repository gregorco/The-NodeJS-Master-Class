"use strict";
/*
 * A subclass of the Router class, that handles Token requests
 */
// dependencies
const Router = require('./router');
const util = require('util');
const debug = util.debuglog('router_token');

class TokenRouter extends Router {
    constructor() {
        super();
        debug('constructor');

    }


    post(data, callback) {
        debug('post()');
        callback(200, 'TokenRouter post\n');
    }

    get(data, callback) {
        debug('get()');
        callback(200, 'TokenRouter get\n');
    }

    put(data, callback) {
        debug('update()');
        callback(200, 'TokenRouter update\n');
    }

    delete(data, callback) {
        debug('delete()');
        callback(200, 'TokenRouter delete\n');
    }
}


module.exports = TokenRouter;
