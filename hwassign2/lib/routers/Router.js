"use strict";
/*
 * Router class to handle routing http/https requests.
 */

// dependencies
const util = require('util');
const debug = util.debuglog('Router');
const url   = require('url');

class Router {
    constructor() {
        debug('Instantiated Router.');
    }
    route(inputData, callback) {
        debug('inputData:', inputData);
        this.dispatch(inputData,  callback);
    }

    dispatch(data, callback) {
        debug("callback inputdata:",data);
        let acceptableMethods = ['post','get','put','delete'];
        let reqMethod = data.method.toLowerCase();
        if(acceptableMethods.indexOf(reqMethod) != -1) {
            this[reqMethod](data, callback);
        } else {
            callback("Invalid REST method requested: "+data.method);
        }
    }

}

module.exports = Router;
