"use strict";
/*
 * A subclass of the Router class, that handles User requests
 */
// dependencies
const Router = require('./router');
const util = require('util');
const debug = util.debuglog('router_user');

class UserRouter extends Router {
    constructor() {
        super();
        debug('constructor');

    }


    post(data, callback) {
        debug('post()');
        callback(200, 'UserRouter post\n');
    }

    get(data, callback) {
        debug('get()');
        callback(200, 'UserRouter get\n');
    }

    put(data, callback) {
        debug('update()');
        callback(200, 'UserRouter update\n');
    }

    delete(data, callback) {
        debug('delete()');
        callback(200, 'UserRouter delete\n');
    }
}


module.exports = UserRouter;
