"use strict";
/*
 * Router to route remote procedure call requests, non-CRUD/REST requests.
 */

// dependencies
const Router = require('./Router');
const url   = require('url');
const util = require('util');
const debug = util.debuglog('RpcRouter');

class RpcRouter extends Router {
    constructor() {
        super();
        debug('Instantiated RpcRouter.');
    }
    route(inputData, callback) {
        debug('inputData:', inputData);
        this.dispatch(inputData,  callback);
    }
}

module.exports = RpcRouter;
