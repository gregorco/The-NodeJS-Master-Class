"use strict";
/*
 * A subclass of the MenuRouter class, that handles Menu requests
 */
// dependencies
const RpcRouter = require('./RpcRouter');
const util = require('util');
const utils = require('../utils');
const _data = require('../data');
const Menu = require('../Menu');
const debug = util.debuglog('MenuRouter');

class MenuRouter extends RpcRouter {

    constructor() {
        super();
        debug('Instantiated MenuRouter.');
    }

    dispatch(data, callback) {
        debug("callback inputdata:",data);
        let acceptableMethods = ['get'];
        let reqMethod = data.method.toLowerCase();
        if(acceptableMethods.indexOf(reqMethod) != -1) {
            this[reqMethod](data, callback);
        } else {
            callback("Invalid REST method requested: "+data.method);
        }
    }

    get(data, callback) {
        // get user file
        let qObj = data.queryStringObject;
        debug("GET: qObj:",qObj);
        let menuItemId;
        if(typeof(qObj["item"]) == 'string') {
            menuItemId = qObj["item"];
        }
        let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
        if(tokenId) {                // check that this token is valid for the given user/phone
            _data.verifyToken(tokenId, null,function(isValidToken) {
                if (isValidToken) {
                    if (typeof (menuItemId) == 'string') {
                        callback(200, new Menu().menuItems[menuItemId]);
                    } else {
                        callback(200, new Menu().menuItems);
                    }
                } else {
                    callback(403, {'Error': 'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'})
                }
            });
        } else {
            callback(400, {'Error':'User not logged in. Token missing or invalid length.'})
        }
    }
}


module.exports = MenuRouter;
