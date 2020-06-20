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

const handle = (promise) => {
    return promise
        .then(data => ([undefined, data]))
        .catch(error => Promise.resolve([error, undefined]));
}

class UserCrudRouter extends CrudRouter {
    constructor() {
        super();
        debug('constructor');

    }

    // Create user
    // Required properties: firstName, lastName, emailAddr, phone, password, tosAgreement
    // Optional properties: streetAddr
    async post(data, callback) {
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
            // use the hashed email address as the unique identifier for this user so that the
            // user's phone and name can be changed, and a change to email address would require a new account
            let uid = utils.hash(emailAddr.trim());
            // check if this user already exists
            let [readErr, readData] = await handle(_data.read('users',uid));
            if (readErr) {
                debug('POST: _data.read err:',readErr);

                let hashedPassword = utils.hash(password.trim());
                if(hashedPassword) {
                    // create user object
                    let userObj = {
                        'uid': uid,
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
                    let [createErr, voidVal] = await handle(_data.create('users',uid,user));
                    if (createErr) callback(500, {'Error':'Failed to create new user: '+emailAddr+' error:'+createErr.message});
                    callback(200);
                } else {
                    callback(500, {'Error':'Failed to obscure password with hash. Aborted.'});
                }
            } else {
                debug("err: ",readErr);
                debug("data:", readData);
                callback(400, {'Error': 'User already exists:'+emailAddr});
            }
        }
    }

    // Required data: uid
    // Optional data: none
    // checks to only allow authenticated users to get their own record
    async get(data, callback) {
        // get user file
        let qObj = data.queryStringObject;
        debug("GET: qObj:",qObj);
        if(typeof(qObj["uid"]) == 'string' && qObj["uid"].trim().length > 0) {
            let uid = qObj["uid"].trim();
            // authenticate the user
            let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
            if(tokenId) {
                // check that this token is valid for the given user/uid
                let [verifyErr, isValidToken] = await handle(_data.verifyToken(tokenId, uid));
                if(isValidToken) {
                    let [readErr, data] = await handle(_data.read('users', uid));
                    debug('read status: ' + readErr);
                    if (!readErr && data) {
                        // remove the hashed password from returned data obj
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                } else {
                    callback(403, {'Error':'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'});
                }
            } else {
                callback(400, {'Error':'Token missing or invalid length.'});
            }
        } else {
            callback(400, {'Error':'No valid uid number provided. Must be present.'});
        }
    }

    // Required data: uid
    // Optional data: rest of properties
    // checks to only allow authenticated users to update their own record
    async put(data, callback) {
        // update user file
        let uid = (typeof(data.payload.uid) == 'string' && data.payload.uid.trim().length > 0) ? data.payload.uid.trim(): false;

        let firstName = (typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0)
            ? data.payload.firstName.trim(): false;
        let lastName = (typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0)
            ? data.payload.lastName.trim(): false;
        let password = (typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0)
            ? data.payload.password.trim(): false;
        let phone = (typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10)
            ? data.payload.phone.trim(): false;
        let streetAddr = typeof(data.payload.streetAddr) == 'string' && data.payload.streetAddr.trim().length > 0
            ? data.payload.streetAddr.trim() : false;
        debug("users.put: firstName: "+firstName+", lastName="+lastName+", phone="+phone+", streetAddr="+streetAddr);
        if(uid) {

            // authenticate the user
            let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
            if(tokenId) {
                // check that this token is valid for the given user/uid
                let [verifyErr, isValidToken] = await handle(_data.verifyToken(tokenId, uid));
                if(isValidToken) {
                    // get the existing user object
                    let [readErr, userObj] = await handle(_data.read('users',uid));
                    if(!readErr && userObj) {
                        if(firstName) {
                            userObj.firstName = firstName;
                        }
                        if(lastName) {
                            userObj.lastName = lastName;
                        }
                        if(password) {
                            userObj.hashedPassword = utils.hash(password);
                        }
                        if(phone) {
                            userObj.phone = phone;
                        }
                        if(streetAddr) {
                            userObj.streetAddr = streetAddr;
                        }
                        let [updateErr, void1] = await handle(_data.update('users',uid, userObj));
                        debug('update status: '+updateErr);
                        if(!updateErr) {
                            callback(200);
                        } else {
                            callback(500, updateErr);
                        }
                    } else {
                        callback(400, {'Error':'User not found with uid:'+uid});
                    }
                } else {
                    callback(403, {'Error':'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'})
                }
            } else {
                callback(400, {'Error':'Token missing or invalid length.'});
            }
        } else {
            callback(400, {'Error':'Missing required input: uid.'});
        }
    }

    // delete user
    // Required params: uid
    async delete(data, callback) {
        let uid = (typeof(data.queryStringObject.uid) == 'string' && data.queryStringObject.uid.trim().length > 0) ? data.queryStringObject.uid.trim(): false;
        if(uid) {
            // authenticate the user
            let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
            if(tokenId) {
                // check that this token is valid for the given user/uid
                let [verifyErr, isValidToken] = await handle(_data.verifyToken(tokenId, uid));
                if(isValidToken) {
                    // get the existing user object
                    let [readErr, userObj] = await handle(_data.read('users',uid));
                    if(!readErr && userObj) {
                        let [deleteErr, void1] = await handle(_data.delete('users',uid));
                        debug('delete status: '+deleteErr);
                        if(!deleteErr) { // successfully deleted user, so now clean up associated data
                            let [cleanupErrMsg, voidcleanup] = await handle(this.cleanupData(userObj, tokenId));
                            callback(200, (cleanupErrMsg?'Successfully deleted user but failed to completely cleanup data: ' +cleanupErrMsg:""));
                        } else {
                            callback(500, deleteErr);
                        }
                    } else {
                        callback(400, {'Error':'User not found with uid:'+uid});
                    }
                } else {
                    callback(403, {'Error':'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'})
                }
            } else {
                callback(400, {'Error':'Token missing or invalid length.'});
            }
        } else {
            callback(400, {'Error':'Missing required input: uid.'});
        }

    }

    async cleanupData(userObj, tokenId) {
        let cleanupErrMsg = undefined;
        let undeletedOrderCount = 0;
        let deletedOrderCount = 0;
        // delete user's orders
        let orders = typeof (userObj.orders) == 'object' && userObj.orders instanceof Array ? userObj.orders : [];
        if (orders.length > 0) {
            for (const orderObj of orders) {
                let [deleteErr, void2] = await handle(_data.delete('orders', orderObj.id));
                if (!deleteErr) {
                    deletedOrderCount++;
                } else {
                    undeletedOrderCount++;
                }
            }
            if (undeletedOrderCount > 0) {
                cleanupErrMsg += 'Failed to delete '+undeletedOrderCount+ 'of '+orders.length+' orders. ';
            }
        }

        // delete user's shopping cart
        let cartObj = userObj.cart;
        if (typeof (cartObj) == 'object') {
            let [deleteErr, void5] = await handle(_data.delete('carts', cartObj.uid));
            if (deleteErr) {
                cleanupErrMsg += 'Failed to delete shopping cart. ';
            }
        }

        // delete tokens for user
        let [listErr, tokenIds] = await handle(_data.list('tokens'));
        if(!listErr && tokenIds && tokenIds.length > 0) {
            for (const tokenId of tokenIds) {
                let [readErr, tokenObj] = await handle(_data.read('tokens', tokenId));
                if (!readErr && tokenObj) {
                    // if this token is for this user, then delete it
                    if (userObj.uid == tokenObj.uid) {
                        let [deleteErr, voidDel] = await handle(_data.delete('tokens', tokenId));
                        if (deleteErr) {
                            cleanupErrMsg += "Failed to delete token (" + tokenId + "). ";
                        }
                    }
                }
            }
        }

        if (cleanupErrMsg) {
            throw new Error('Errors encountered while trying to cleanup user\'s data: ' + cleanupErrMsg);
        }

        return true;
    }

    delete_old2(data, callback) {
        let uid = (typeof(data.queryStringObject.uid) == 'string' && data.queryStringObject.uid.trim().length > 0) ? data.queryStringObject.uid.trim(): false;
        if(uid) {
            // authenticate the user
            let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
            if(tokenId) {
                // check that this token is valid for the given user/uid
                _data.verifyToken(tokenId, uid, function(isValidToken) {
                    if(isValidToken) {
                        // get the existing user object
                        _data.read('users',uid,function(err, userObj) {
                            if(!err && userObj) {
                                _data.delete('users',uid,function(err) {
                                    debug('delete status: '+err);
                                    if(!err) { // successfully deleted user, so now clean up associated data
                                        let undeletedOrderCount = 0;
                                        let deletedOrderCount = 0;
                                        // get list of user's orders
                                        let orders = typeof(userObj.orders) == 'object' && userObj.orders instanceof Array ? userObj.orders: [];
                                        if(orders.length > 0) {
                                            orders.forEach(function (orderObj) {
                                                _data.delete('orders', orderObj.id, function (err) {
                                                    if (!err) {
                                                        deletedOrderCount++;
                                                    } else {
                                                        undeletedOrderCount++;
                                                    }
                                                    if(deletedOrderCount + undeletedOrderCount == orders.length) {
                                                        if(undeletedOrderCount > 0) {
                                                            callback(500, {'Error':'Errors encountered while trying to delete '+undeletedOrderCount+' orders.'});
                                                        } else {
                                                            // delete user's shopping cart
                                                            let cartObj = userObj.cart;
                                                            if (typeof(cartObj) == 'object') {
                                                                _data.delete('carts',cartObj.uid,function(err) {
                                                                    if (!err) {
                                                                        // delete token for user
                                                                        _data.delete('tokens',tokenId, function(err) {
                                                                            if (!err) {
                                                                                callback(200);
                                                                            } else {
                                                                                callback(500, {'Error':'Deleted user and orders, and cart, but errors encountered while trying to delete user\'s token.'});
                                                                            }
                                                                        });
                                                                    } else {
                                                                        callback(500, {'Error':'Deleted user and orders, but errors encountered while trying to delete user\'s shopping cart.'});
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    }
                                                });
                                            });
                                        } else {

                                            // delete user's shopping cart
                                            let cartObj = userObj.cart;
                                            if (typeof(cartObj) == 'object') {
                                                _data.delete('carts',cartObj.uid,function(err) {
                                                    if (!err) {
                                                        // delete token for user
                                                        _data.delete('tokens',tokenId, function(err) {
                                                            if (!err) {
                                                                callback(200);
                                                            } else {
                                                                callback(500, {'Error':'Deleted user and orders, and cart, but errors encountered while trying to delete user\'s token.'});
                                                            }
                                                        });
                                                    } else {
                                                        callback(500, {'Error':'Deleted user and orders, but errors encountered while trying to delete user\'s shopping cart.'});
                                                    }
                                                });
                                            }
                                        }
                                    } else {
                                        callback(500, {'Error': err});
                                    }
                                });
                            } else {
                                callback(400, {'Error':'User not found with uid:'+uid});
                            }
                        });
                    } else {
                        callback(403, {'Error':'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'})
                    }
                });
            } else {
                callback(400, {'Error':'Token missing or invalid length.'});
            }
        } else {
            callback(400, {'Error':'Missing required input: uid.'});
        }

    }

    delete_old(data, callback) {
        let uid = (typeof(data.queryStringObject.uid) == 'string' && data.queryStringObject.uid.trim().length > 0) ? data.queryStringObject.uid.trim(): false;
        if(uid) {
            // authenticate the user
            let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
            if(tokenId) {
                // check that this token is valid for the given user/uid
                _data.verifyToken(tokenId, uid, function(isValidToken) {
                    if(isValidToken) {
                        // get the existing user object
                        _data.read('users',uid,function(err, userObj) {
                            if(!err && userObj) {
                                _data.delete('users',uid,function(err) {
                                    debug('delete status: '+err);
                                    if(!err) { // successfully deleted user, so now clean up associated data
                                        let undeletedOrderCount = 0;
                                        let deletedOrderCount = 0;
                                        // get list of user's orders
                                        let orders = typeof(userObj.orders) == 'object' && userObj.orders instanceof Array ? userObj.orders: [];
                                        if(orders.length > 0) {
                                            orders.forEach(function (orderObj) {
                                                _data.delete('orders', orderObj.id, function (err) {
                                                    if (!err) {
                                                        deletedOrderCount++;
                                                    } else {
                                                        undeletedOrderCount++;
                                                    }
                                                    if(deletedOrderCount + undeletedOrderCount == orders.length) {
                                                        if(undeletedOrderCount > 0) {
                                                            callback(500, {'Error':'Errors encountered while trying to delete '+undeletedOrderCount+' orders.'});
                                                        } else {
                                                            // delete user's shopping cart
                                                            let cartObj = userObj.cart;
                                                            if (typeof(cartObj) == 'object') {
                                                                _data.delete('carts',cartObj.uid,function(err) {
                                                                    if (!err) {
                                                                        // delete token for user
                                                                        _data.delete('tokens',tokenId, function(err) {
                                                                            if (!err) {
                                                                                callback(200);
                                                                            } else {
                                                                                callback(500, {'Error':'Deleted user and orders, and cart, but errors encountered while trying to delete user\'s token.'});
                                                                            }
                                                                        });
                                                                    } else {
                                                                        callback(500, {'Error':'Deleted user and orders, but errors encountered while trying to delete user\'s shopping cart.'});
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    }
                                                });
                                            });
                                        } else {

                                            // delete user's shopping cart
                                            let cartObj = userObj.cart;
                                            if (typeof(cartObj) == 'object') {
                                                _data.delete('carts',cartObj.uid,function(err) {
                                                    if (!err) {
                                                        // delete token for user
                                                        _data.delete('tokens',tokenId, function(err) {
                                                            if (!err) {
                                                                callback(200);
                                                            } else {
                                                                callback(500, {'Error':'Deleted user and orders, and cart, but errors encountered while trying to delete user\'s token.'});
                                                            }
                                                        });
                                                    } else {
                                                        callback(500, {'Error':'Deleted user and orders, but errors encountered while trying to delete user\'s shopping cart.'});
                                                    }
                                                });
                                            }
                                        }
                                    } else {
                                        callback(500, {'Error': err});
                                    }
                                });
                            } else {
                                callback(400, {'Error':'User not found with uid:'+uid});
                            }
                        });
                    } else {
                        callback(403, {'Error':'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'})
                    }
                });
            } else {
                callback(400, {'Error':'Token missing or invalid length.'});
            }
        } else {
            callback(400, {'Error':'Missing required input: uid.'});
        }

    }

}


module.exports = UserCrudRouter;
