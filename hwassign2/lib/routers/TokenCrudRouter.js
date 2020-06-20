"use strict";
/*
 * A subclass of the Router class, that handles Token requests
 */
// dependencies
const _data = require('../data');
const CrudRouter = require('./CrudRouter');
const utils = require('../utils');
const util = require('util');
const debug = util.debuglog('TokenCrudRouter');

const handle = (promise) => {
    return promise
        .then(data => ([undefined, data]))
        .catch(error => Promise.resolve([error, undefined]));
}

class TokenCrudRouter extends CrudRouter {
    constructor() {
        super();
        debug('constructor');

    }

// Create token
// Required properties: phone, password
// Optional properties: none
    async post(data, callback) {
        debug('data:',data);
        // verify that all required properties were sent
        let missingProperties = '';
        let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
        let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

        if(!phone || !password) {
            callback(400, {'Error': 'Missing/invalid properties: '+missingProperties});
        } else {
            // check if this user already exists
            let [readErr, userData] = await handle(_data.read('users',phone));
            debug('POST: _data.read err:',readErr);
            if(!readErr && userData) {

                let hashedPassword = utils.hash(password.trim());
                if(hashedPassword == userData.hashedPassword) {
                    // create user object
                    let tokenId = utils.getRandomString(20);
                    // define expiration date to be one hour into the future
                    let expireDate = Date.now() + 1000 * 60 * 60;
                    debug("New token "+tokenId+" expires: "+new Date(expireDate));
                    let tokenObj = {
                        'phone': phone,
                        'tokenId': tokenId,
                        'expires': expireDate
                    };
                    // create new token file
                    let [createErr, voidCreate] = await handle(_data.create('tokens',tokenId,tokenObj));
                    debug('create status: '+createErr);
                    if(!createErr) {
                        callback(200, tokenObj);
                    } else {
                        callback(500, createErr);
                    }
                } else {
                    callback(400, {'Error':'Password does not match.'})
                }
            } else {
                debug("readErr: ",readErr);
                debug("data:", data);
                callback(400, {'Error': 'User not found.'});
            }
        }
    };

// Required data: tokenId
// Optional data: none
// @TODO: add check to only allow authenticated users to access their own record
    async get(data, callback) {
        // get token
        let qObj = data.queryStringObject;
        debug("GET: qObj:",qObj);
        if(typeof(qObj["tokenId"]) == 'string' && qObj["tokenId"].trim().length == 20) {
            let [readErr, data] = await handle(_data.read('tokens',qObj["tokenId"].trim()));
            debug('read status: '+readErr);
            if(!readErr && data) {
                // remove the hashed password from returned data obj
                callback(200, data);
            } else {
                callback(404);
            }
        } else {
            callback(400, {'Error':'No valid tokenId provided. Must be 20 chars in length.'});
        }
    }

// Required data: tokenId, extend
// Optional data: none
// @TODO: add check to only allow authenticated users to update their own record
    async put(data, callback) {
        // update expiration of token
        let tokenId = (typeof(data.payload.tokenId) == 'string' && data.payload.tokenId.trim().length == 20) ? data.payload.tokenId.trim(): false;
        let extend = (typeof(data.payload.extend) == 'boolean' ? data.payload.extend: false);

        if(tokenId && extend) {
            // get the existing token object
            let [readErr, tokenObj] = await handle(_data.read('tokens',tokenId));
            if(!readErr && tokenObj) {
                // check that token is not already expired before continuing
                if(tokenObj.expires > Date.now()) {
                    tokenObj.expires = Date.now() + 1000 * 60 * 60;
                    let [updateErr, voidUpdate] = await handle(_data.update('tokens', tokenId, tokenObj));
                    debug('update status: ' + updateErr);
                    if (!updateErr) {
                        callback(200);
                    } else {
                        callback(500, updateErr);
                    }
                } else {
                    callback(400, {'Error':'Token already expired; cannot extend.'})
                }
            } else {
                callback(404, {'Error':'Token not found'});
            }
        } else {
            if(!tokenId) {
                callback(400, {'Error':'Missing required input: tokenId.'})
            } else if(!extend) {
                callback(400, {'Error':'No change to extend expiration.'})
            }
        }
    }

// delete user
// Required params: phone
// @TODO add support to only allow authenticated user to delete his record
// @TODO add support to clean up any associated records/data/files with this deleted user
    async delete(data, callback) {
        let tokenId = (typeof(data.queryStringObject.tokenId) == 'string' && data.queryStringObject.tokenId.trim().length == 20) ? data.queryStringObject.tokenId.trim(): false;

        if(tokenId) {
            // get the existing  object
            let [readErr, tokenObj] = await handle(_data.read('tokens',tokenId));
            if(!readErr && tokenObj) {
                let [deleteErr, voidDel] = await handle(_data.delete('tokens',tokenId));
                debug('delete status: '+deleteErr);
                if(!deleteErr) {
                    callback(200);
                } else {
                    callback(500, deleteErr);
                }
            } else {
                callback(400, {'Error':'Token not found'});
            }
        } else {
            callback(400, {'Error':'Missing required input: tokenId.'})
        }
    }

}


module.exports = TokenCrudRouter;
