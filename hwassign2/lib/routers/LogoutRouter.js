"use strict";
/*
 * A subclass of the Router class, that handles Logout requests
 */
// dependencies
const fs = require('fs');
const _data = require('../data');
const RpcRouter = require('./RpcRouter');
const utils = require('../utils');
const util = require('util');
const debug = util.debuglog('LogoutRouter');

const handle = (promise) => {
    return promise
        .then(data => ([undefined, data]))
        .catch(error => Promise.resolve([error, undefined]));
}

class LogoutRouter extends RpcRouter {
    constructor() {
        super();
        debug('constructor');

    }

    dispatch(data, callback) {
        debug("callback data:", data);
        let acceptableMethods = ['post'];
        let reqMethod = data.method.toLowerCase();
        if (acceptableMethods.indexOf(reqMethod) != -1) {
            this[reqMethod](data, callback);
        } else {
            callback("Invalid REST method requested: " + data.method);
        }
    }

// Required data: phone
// Optional data: none
// checks to only allow authenticated users to update their own record
    async post(data, callback) {
        // authenticate the user
        let tokenId = typeof (data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
        if (tokenId) {
            // get the existing  object
            let [readErr, tokenObj] = await handle(_data.read('tokens', tokenId));
            if (!readErr && tokenObj) {
                let [deleteErr, void1] = await handle(_data.delete('tokens', tokenId));
                debug('delete status: ' + deleteErr);
                if (!deleteErr) {
                    callback(200);
                } else {
                    callback(500, deleteErr);
                }
            } else {
                callback(400, {'Error': 'Token not found. Either expired or logged out already.'});
            }
        } else {
            callback(400, {'Error': 'Missing required input: tokenId, or invalid length.'})
        }
    }
}

module.exports = LogoutRouter;
