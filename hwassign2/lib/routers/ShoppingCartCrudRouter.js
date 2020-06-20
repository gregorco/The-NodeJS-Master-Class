"use strict";
/*
 * A subclass of the Router class, that handles shopping cart requests
   {	uid		(PK)
	    menuItems [	{index:<idx1>, count: <count>},
				{index:<idx1>, count: <count>},
				…
				{index:<idx1>, count: <count>}
	    ]
   }
 */
// dependencies
const _data = require('../data');
const CrudRouter = require('./CrudRouter');
const utils = require('../utils');
const util = require('util');
const debug = util.debuglog('ShoppingCartCrudRouter');

const handle = (promise) => {
    return promise
        .then(data => ([undefined, data]))
        .catch(error => Promise.resolve([error, undefined]));
}

class ShoppingCartCrudRouter extends CrudRouter {
constructor() {
    super();
    debug('constructor');

}

// Create cart
// Required properties: uid, tokenId
// Optional properties: none
    async post(data, callback) {
        debug("post: ",data);

        // authenticate the user
        let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
        if(tokenId) {
            // check that this token is valid
            let [readErr, tokenObj] = await handle(_data.read('tokens', tokenId));
            if (!readErr && tokenObj && tokenObj.expires > Date.now()) {
                let uid = tokenObj.uid;

                // store the cart with this user's uid
                let [readUserErr, userObj] = await handle(_data.read('users', uid));
                if (!readUserErr && userObj) {
                    // update the user object to add a cart
                    let userCart = typeof (userObj.cart) == 'object' ? userObj.cart : false;
                    // prevent user from adding multiple carts
                    if (!userCart) {
                        // add new cart
                        let cartId = userObj.uid;
                        let cartObj = {
                            'uid': cartId,
                            'menuItems' : []
                        };
                        let [createErr, void1] = await handle(_data.create('carts', cartId, cartObj));
                        if (!createErr || createErr.message.indexOf('May already exist') != -1) {
                            userObj.cart = cartObj;
                            debug("updating user obj:"+userObj.uid);
                            let [updateErr, voidUpdate] = await handle(_data.update('users', userObj.uid, userObj));
                            if (!updateErr) {
                                callback(200, cartObj);
                            } else {
                                callback(500, updateErr);
                            }
                        } else {
                            callback(500, createErr);
                        }
                    } else {
                        callback(400, {'Error': 'User already has a cart. Cannot have multiple carts.'});
                    }
                } else {
                    callback(403);
                }
            } else {
                callback(403);
            }
        } else {
            callback(400, {'Error': 'Missing/invalid properties.'});
        }
    }


// return the requested shoppingcart object
// Required inputs: cartId
// Optional inputs: none
    async get(data, callback) {
        debug("GET:", data);
        // get user file
        let uid = typeof (data.queryStringObject.uid) == 'string' && data.queryStringObject.uid.trim().length > 0 ? data.queryStringObject.uid.trim() : false;
        if (uid) {
            // authenticate the user
            let [readErr, cartObj] = await handle(_data.read('carts', uid));
            if (!readErr && cartObj) {
                let tokenId = typeof (data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
                if (tokenId) {
                    // check that this token is valid for the given user/phone
                    let [verifyErr, isValidToken] = await handle(_data.verifyToken(tokenId, uid));
                    if (isValidToken) {
                        callback(200, cartObj);
                    } else {
                        callback(403, {'Error': 'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'})
                    }
                } else {
                    callback(400, {'Error': 'Token missing or invalid length.'});
                }
            } else {
                callback(404, {'Error': readErr});
            }
        } else {
            callback(400, {'Error': 'No valid cart id provided. Must be 20 chars in length.'});
        }
    }


// update a shopping cart
// Required input: cartId, and one of the optional inputs
// Optional inputs: menuItem
    async put(data, callback) {
        // get required input
        let uid = typeof(data.payload.uid) == 'string' && data.payload.uid.trim().length > 0 ? data.payload.uid.trim(): false;
        let menuItems = typeof(data.payload.menuItems) == 'object'
        && data.payload.menuItems instanceof Array ? data.payload.menuItems : false;
        if(uid && menuItems) {
            // authenticate the user
            let [readErr, cartObj] = await handle(_data.read('carts', uid));
            if (!readErr && cartObj) {
                let tokenId = typeof (data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
                if (tokenId) {
                    // check that this token is valid for the given user/phone
                    let [verifyErr, isValidToken] = await handle(_data.verifyToken(tokenId, uid));
                    if (isValidToken) {
                        let currMenuItems = cartObj.menuItems;
                        cartObj.menuItems = menuItems;
                        if (currMenuItems.length > 0) {
                            // @TODO: clear inventory of previous cart contents before replacing cart contents
                        }
                        let [updateErr, updateVoid] = await handle(_data.update('carts',uid, cartObj));
                        debug('update status: '+updateErr);
                        if(!updateErr) {
                            // update the user's document too

                            let [readUserErr, userObj] = await handle(_data.read('users',uid));
                            debug('update status: '+readUserErr);
                            if(!readUserErr) {
                                userObj.cart = cartObj;
                                let [updateErr, updateVoid] = await handle(_data.update('users',uid, userObj));
                                if (!updateErr) {
                                    callback(200);
                                } else {
                                    callback(500, {'Error':"Updated shopping cart, but not user's copy."});
                                }
                            } else {
                                callback(500, {'Error':"Updated shopping cart, but couldn't find user."});
                            }
                        } else {
                            callback(500, updateErr);
                        }
                    } else {
                        callback(403, {'Error': 'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'})
                    }
                } else {
                    callback(400, {'Error': 'Token missing or invalid length.'});
                }
            } else {
                callback(404, readErr);
            }
        } else {
            callback(400, {'Error':'Missing required input(s).'});
        }
    }

// delete shopping cart
// Required input: cartId
// Optional inputs: none
    async delete(data, callback) {
        debug("DELETE: data:", data);
        let cartId = (typeof(data.queryStringObject.cartId) == 'string' && data.queryStringObject.cartId.trim().length > 0) ? data.queryStringObject.cartId.trim(): false;

        if(cartId) {
            let [readErr, cartObj] = await handle(_data.read('carts', cartId));
            if (!readErr && cartObj) {
                // get user uid
                let uid = cartObj.uid;
                let tokenId = typeof (data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
                if (tokenId) {
                    // check that this token is valid for the given user/phone
                    let [verifyErr, isValidToken] = await handle(_data.verifyToken(tokenId, uid));
                    if (isValidToken) {
                        let [deleteErr, voidDel] = await handle(_data.delete('carts', cartId));
                        debug('delete status: ' + deleteErr);
                        if (!deleteErr) {
                            // get the existing user object
                            let [readUserErr, userObj] = await handle(_data.read('users', uid));
                            if (!readUserErr && userObj) {
                                // try to remove the cartId from the user's reference
                                debug("carts:update: userObj:",userObj);
                                let userCart = typeof (userObj.cart) == 'object' ? userObj.cart : [];
                                if(userCart.uid == cartId) {
                                    delete userObj.cart;
                                    let [updateErr, voidUpdate] = await handle(_data.update('users', uid, userObj));
                                    if(!updateErr) {
                                        callback(200);
                                    } else {
                                        callback(500, {'Error':'Failed to remove cart from user.'});
                                    }
                                } else {
                                    callback(400, {'Error': 'User does not have that cart.'});
                                }
                            } else {
                                callback(500, {'Error': 'Could not find a user who created the cart, so only deleted cart and updated no user.'});
                            }
                        } else {
                            callback(500, deleteErr);
                        }
                    } else {
                        callback(403, {'Error': 'User not authenticated.'});
                    }
                } else {
                    callback(403, {'Error': 'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'});
                }
            } else {
                callback(404);
            }
        } else {
            callback(400, {'Error':'Missing required input: cartId.'});
        }

    }
}

module.exports = ShoppingCartCrudRouter;
