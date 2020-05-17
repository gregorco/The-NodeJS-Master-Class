"use strict";
/*
 * A subclass of the Router class, that handles User requests
 */
// dependencies
const CrudRouter = require('./CrudRouter');
const util = require('util');
const utils = require('../utils');
const _data = require('../data');
const debug = util.debuglog('UserCrudRouter');
const User = require('../User');

class UserCrudRouter extends CrudRouter {
    constructor() {
        super();
        debug('constructor');

    }

    // Create user
    // Required properties: firstName, lastName, emailAddr, phone, password, tosAgreement
    // Optional properties: streetAddr
    post(data, callback) {
        debug("users:post: ",data);
        // verify that all required properties were sent
        let missingProperties = '';
        let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0
            ? data.payload.firstName.trim() : false;
        let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0
            ? data.payload.lastName.trim() : false;
        let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10
            ? data.payload.phone.trim() : false;
        let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0
            ? data.payload.password.trim() : false;
        let emailAddr = typeof(data.payload.emailAddr) == 'string' && data.payload.emailAddr.trim().length > 0
            ? data.payload.emailAddr.trim() : false;
        let streetAddr = typeof(data.payload.streetAddr) == 'string' && data.payload.streetAddr.trim().length > 0
            ? data.payload.streetAddr.trim() : false;
        let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' ? data.payload.tosAgreement : false;

        if(!firstName || !lastName || !phone || !password || !emailAddr || !tosAgreement) {
            if (!firstName) missingProperties += "firstName";
            if (!lastName) missingProperties += ",lastName";
            if (!phone) missingProperties += ",phone";
            if (!emailAddr) missingProperties += ",emailAddr";
            if (!tosAgreement) missingProperties += ",tosAgreement";
            if (!password) missingProperties += ",password";
            callback(400, {'Error': 'Missing/invalid properties: '+missingProperties+'\n'+JSON.stringify(data.payload)});
        } else {
            // check if this user already exists
            _data.read('users',phone, function(err,readData) {
                debug('POST: _data.read err:',err);
                if(err) {

                    let hashedPassword = utils.hash(password.trim());
                    if(hashedPassword) {
                        // create user object
                        let userObj = {
                            'firstName': firstName,
                            'lastName':  lastName,
                            'phone': phone,
                            'hashedPassword': hashedPassword,
                            'emailAddr' : emailAddr,
                            'streetAddr' : streetAddr,
                            'tosAgreement': true
                        };
                        let user = new User(userObj);
                        // create new user file
                        _data.create('users',phone,user,function(err) {
                            debug('create status: '+err);
                            if(!err) {
                                callback(200);
                            } else {
                                callback(500, {'Error':'Failed to create new user: '+phone});
                            }
                        });
                    } else {
                        callback(500, {'Error':'Failed to obscure password with hash. Aborted.'})
                    }
                } else {
                    debug("err: ",err);
                    debug("data:", data);
                    callback(400, {'Error': 'User phone already exists:'+phone});
                }
            });
        }
    }

// Required data: phone
// Optional data: none
// checks to only allow authenticated users to update their own record
    get(data, callback) {
        // get user file
        let qObj = data.queryStringObject;
        debug("GET: qObj:",qObj);
        if(typeof(qObj["phone"]) == 'string' && qObj["phone"].trim().length == 10) {
            let phone = qObj["phone"].trim();
            // authenticate the user
            let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
            if(tokenId) {
                // check that this token is valid for the given user/phone
                _data.verifyToken(tokenId, phone, function(isValidToken) {
                    if(isValidToken) {
                        _data.read('users', phone, function (err, data) {
                            debug('read status: ' + err);
                            if (!err && data) {
                                // remove the hashed password from returned data obj
                                delete data.hashedPassword;
                                callback(200, data);
                            } else {
                                callback(404);
                            }
                        });
                    } else {
                        callback(403, {'Error':'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'})
                    }
                });
            } else {
                callback(400, {'Error':'Token missing or invalid length.'})
            }
        } else {
            callback(400, {'Error':'No valid phone number provided. Must be 10 chars in length.'});
        }
    }

// Required data: phone
// Optional data: rest of properties
// checks to only allow authenticated users to update their own record
    put(data, callback) {
        // update user file
        let phone = (typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 0) ? data.payload.phone.trim(): false;

        let firstName = (typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0) ? data.payload.firstName.trim(): false;
        let lastName = (typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0) ? data.payload.lastName.trim(): false;
        let password = (typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0) ? data.payload.password.trim(): false;
        debug("users.put: firstName: "+firstName+", lastName="+lastName);
        if(phone) {

            // authenticate the user
            let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
            if(tokenId) {
                // check that this token is valid for the given user/phone
                _data.verifyToken(tokenId, phone, function(isValidToken) {
                    if(isValidToken) {
                        // get the existing user object
                        _data.read('users',phone,function(err, userObj) {
                            if(!err && userObj) {
                                if(firstName) {
                                    userObj.firstName = firstName;
                                }
                                if(lastName) {
                                    userObj.lastName = lastName;
                                }
                                if(password) {
                                    userObj.hashedPassword = utils.hash(password);
                                }
                                _data.update('users',phone, userObj,function(err) {
                                    debug('update status: '+err);
                                    if(!err) {
                                        callback(200);
                                    } else {
                                        callback(500, {'Error': err});
                                    }
                                });
                            } else {
                                callback(400, {'Error':'User not found with phone number:'+phone});
                            }
                        })
                    } else {
                        callback(403, {'Error':'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'})
                    }
                });
            } else {
                callback(400, {'Error':'Token missing or invalid length.'})
            }
        } else {
            callback(400, {'Error':'Missing required input: phone.'})
        }
    }

// delete user
// Required params: phone
// @TODO add support to clean up any associated records/data/files with this deleted user
    delete(data, callback) {
        let phone = (typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 0) ? data.queryStringObject.phone.trim(): false;

        if(phone) {

            // authenticate the user
            let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
            if(tokenId) {
                // check that this token is valid for the given user/phone
                _data.verifyToken(tokenId, phone, function(isValidToken) {
                    if(isValidToken) {
                        // get the existing user object
                        _data.read('users',phone,function(err, userObj) {
                            if(!err && userObj) {
                                _data.delete('users',phone,function(err) {
                                    debug('delete status: '+err);
                                    if(!err) {
                                        let undeletedCheckCount = 0;
                                        let deletedChecksCount = 0;
                                        // get list of user's checks
                                        let checks = typeof(userObj.checks) == 'object' && userObj.checks instanceof Array ? userObj.checks: [];
                                        if(checks.length > 0) {
                                            checks.forEach(function (checkId) {
                                                _data.delete('checks', checkId, function (err) {
                                                    if (!err) {
                                                        deletedChecksCount++;
                                                    } else {
                                                        undeletedCheckCount++;
                                                    }
                                                    if(deletedChecksCount + undeletedCheckCount == checks.length) {
                                                        if(undeletedCheckCount > 0) {
                                                            callback(500, {'Error':'Errors encountered while trying to delete '+undeletedCheckCount+' checks.'});
                                                        } else {
                                                            callback(200);
                                                        }
                                                    }
                                                })
                                            });
                                        } else {
                                            callback(200)
                                        }
                                    } else {
                                        callback(500, {'Error': err});
                                    }
                                });
                            } else {
                                callback(400, {'Error':'User not found with phone number:'+phone});
                            }
                        })
                    } else {
                        callback(403, {'Error':'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'})
                    }
                });
            } else {
                callback(400, {'Error':'Token missing or invalid length.'})
            }
        } else {
            callback(400, {'Error':'Missing required input: phone.'})
        }

    }


}


module.exports = UserCrudRouter;
