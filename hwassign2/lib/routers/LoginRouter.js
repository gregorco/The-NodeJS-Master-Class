"use strict";
/*
 * A subclass of the Router class, that handles Login requests
 */
// dependencies
const fs = require('fs');
const _data = require('../data');
const RpcRouter = require('./RpcRouter');
const utils = require('../utils');
const util = require('util');
const debug = util.debuglog('LoginRouter');

const handle = (promise) => {
    return promise
        .then(data => ([undefined, data]))
        .catch(error => Promise.resolve([error, undefined]));
}

class LoginRouter extends RpcRouter {
    constructor() {
        super();
        debug('constructor');

    }

    dispatch(data, callback) {
        debug("callback inputdata:",data);
        let acceptableMethods = ['post'];
        let reqMethod = data.method.toLowerCase();
        if(acceptableMethods.indexOf(reqMethod) != -1) {
            this[reqMethod](data, callback);
        } else {
            callback("Invalid REST method requested: "+data.method);
        }
    }

// Login the specified user
// Required properties: email, password
// Optional properties: none
// Validate the user's existence and matching password, then return a new token
    async post(data, callback) {
        debug('data:', data);
        // verify that all required properties were sent
        let missingProperties = '';
        let emailAddr = typeof (data.payload.emailAddr) == 'string' && data.payload.emailAddr.trim().length > 0 ? data.payload.emailAddr.trim() : false;
        let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
        let sentCallback = false;
        if (!emailAddr || !password) {
            if (!emailAddr) missingProperties += ",emailAddr";
            if (!password) missingProperties += ",password";
            callback(400, {'Error': 'Missing/invalid properties: ' + missingProperties});
        } else {
            // check if this user already exists by searching all user's for a matching emailAddr
            // get all the checks
            let [listErr, uids] = await handle(_data.list('users'));
            if(!listErr && uids && uids.length > 0) {
                let foundUser = false;
                let usersProcessed = 0;
                for (const uid of uids) {
                    // read in the user data
                    debug('Comparing to ', uid);
                    let [readErr, userData] = await handle(_data.read('users', uid));
                    usersProcessed++;
                    if (!readErr && userData) {
                        // does this user's email and password match the user logging in?
                        let hashedPassword = utils.hash(password.trim());
                        if (emailAddr == userData.emailAddr) {
                            if (hashedPassword == userData.hashedPassword) {
                                // create user object
                                foundUser = true;
                                let tokenId = utils.getRandomString(20);
                                // define expiration date
                                let expireDate = Date.now() + 1000 * 60 * 60;
                                debug("New token " + tokenId + " expires: " + new Date(expireDate));
                                let tokenObj = {
                                    'uid': uid,
//                                                'emailAddr': userData.emailAddr,
                                    'tokenId': tokenId,
                                    'expires': expireDate
                                };
                                // create new token file
                                let [createErr, void1] = await handle(_data.create('tokens', tokenId, tokenObj));
                                debug('create status: ' + createErr);
                                sentCallback = true;
                                if (!createErr) {
                                    callback(200, tokenObj);
                                } else {
                                    callback(500, createErr);
                                }
                            } else {
                                foundUser = true;
                                debug('Bad password');
                                sentCallback = true;
                                callback(400, {'Error': 'Incorrect password.'})
                            }
                        } else {
                            if (usersProcessed == uids.length && !foundUser && !sentCallback) {
                                sentCallback = true;
                                debug('User not found.');
                                callback(400, {'Error': 'User not found.'});
                            }
                        }
                    } else {
                        debug("Error: reading one of the user's data.");
                    }
                    if (sentCallback) {
                        break;
                    }
                }
            } else {
                debug('Error: Could not find any users to process.');
                sentCallback = true;
                callback(400, {'Error': 'No users found.'});
            }
        }
    };
}

module.exports = LoginRouter;
