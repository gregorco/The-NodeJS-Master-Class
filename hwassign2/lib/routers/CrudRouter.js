"use strict";
/*
 * Class to handle routing http/https requests of CRUD operations
 */

// dependencies
const url   = require('url');
const Router = require('./Router');
const util = require('util');
const debug = util.debuglog('CrudRouter');

class CrudRouter extends Router {
    constructor() {
        super();
        debug('Instantiated Router.');
    }
/*    route(inputData, callback) {
        debug('inputData:', inputData);
        this.dispatch(inputData,  callback);
    }
*/
    dispatch(data, callback) {
        debug("callback inputdata:", data);
        let acceptableMethods = ['post', 'get', 'put', 'delete'];
        let reqMethod = data.method.toLowerCase();
        if (acceptableMethods.indexOf(reqMethod) != -1) {
            this[reqMethod](data, callback);
        } else {
            callback("Invalid REST method requested: " + data.method);
        }
    }

    post(data, callback) {
        debug('Router post()');
        callback(500, 'Router post');
    }

    get(data, callback) {
        debug('Router get()');
        callback(500, 'Router get');
    }

    put(data, callback) {
        debug('Router update()');
        callback(500, 'Router update');
    }

    delete(data, callback) {
        debug('Router delete()');
        callback(500, 'Router delete');
    }

}

module.exports = CrudRouter;
