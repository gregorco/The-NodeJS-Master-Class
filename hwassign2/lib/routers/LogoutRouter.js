"use strict";
/*
 * A subclass of the Router class, that handles Logout requests
 */
// dependencies
const fs = require('fs');
const _data = require('../data');
const Router = require('./Router');
const utils = require('../utils');
const util = require('util');
const debug = util.debuglog('LogoutRouter');


class LogoutRouter extends Router {
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
    post(data, callback) {
        // authenticate the user
        let tokenId = typeof (data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
        if (tokenId) {
            // get the existing  object
            _data.read('tokens', tokenId, function (err, tokenObj) {
                if (!err && tokenObj) {

                    _data.delete('tokens', tokenId, function (err) {
                        debug('delete status: ' + err);
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': err});
                        }
                    });
                } else {
                    callback(400, {'Error': 'Token not found. Either expired or logged out already.'});
                }
            })
        } else {
            callback(400, {'Error': 'Missing required input: tokenId.'})
        }
    }
}

module.exports = LogoutRouter;
