"use strict";
/*
 * A subclass of the CrudRouter class, that handles Order CRUD operations
   {
	id			(PK)
	userUid			(FK)
	status // active, paid, shipped, canceled, completed, expired
	menuItems [	{index:<idx1>, count: <count>},
			{index:<idx1>, count: <count>},
			…
			{index:<idx1>, count: <count>}
	]
	deliveryAddressess
	creditCard {
		holderName,
		address,
		cardNumber,
		expirationMonth,
		expirationYear,
		securityCode
	}

   }
 */
// dependencies
const _data = require('../data');
const CrudRouter = require('./CrudRouter');
const utils = require('../utils');
const User = require('../User');
const CreditCard = require('../CreditCard');
const util = require('util');
const debug = util.debuglog('OrderCrudRouter');

class OrderCrudRouter extends CrudRouter {
constructor() {
    super();
    debug('constructor');

}

// Create order with the user's current cart
// Required properties: uid
// Optional properties: none
post(data, callback) {
    debug("post: ",data);

    // authenticate the user
    let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
    if(tokenId) {
        // check that this token is valid
        _data.read('tokens', tokenId, function (err, tokenObj) {
            if (!err && tokenObj && tokenObj.expires > Date.now()) {
                let uid = tokenObj.uid;

                _data.read('users', uid, function (err, userObject) {
                    if (!err && userObject) {
                        let userObj = new User(userObject);
                        // update the user object to add an order based on the current cart
                        let cartObj = typeof (userObj.cart) == 'object' ? userObj.cart : false;
                        //
                        if (!cartObj) {
                            // report failure as a cart is needed to create an order
                            callback(400, {'Error': 'No shopping cart exists yet. First add item(s) to shopping cart, then place order.'});
                        } else {
                            // add new orderobject
                            let orderId = utils.getRandomString(20);
                            let menuItems = cartObj.menuItems;
                            let orderObj = {
                                'id': orderId,
                                'userUid': uid,
                                'menuItems': menuItems
                            }
                            _data.create('orders', orderId, orderObj, function (err) {
                                if (!err) {
                                    // add order to user's list
//                                    userObj.orders.push(orderObj);
                                    userObj.addOrder(orderObj);
                                    debug("updating user obj:"+userObj.uid);
                                    _data.update('users', userObj.uid, userObj, function (err) {
                                        if (!err) {
                                            callback(200, orderObj);
                                        } else {
                                            callback(500, {'Error': 'Failed to update user object.'});
                                        }
                                    });
                                } else {
                                    callback(500, {'Error': err});
                                }
                            });
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        });
    } else {
        callback(400, {'Error': 'Missing/invalid properties.'});
    }
}

// return the requested order object
// Required inputs: id
// Optional inputs: none
get(data, callback) {
    debug("GET:", data);
    // get order file
    let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // authenticate the user
        _data.read('orders', id, function (err, orderObj) {
            if (!err && orderObj) {
                let userUid = orderObj.userUid;
                let tokenId = typeof (data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
                if (tokenId) {
                    // check that this token is valid for the given user/phone
                    _data.verifyToken(tokenId, userUid, function (isValidToken) {
                        if (isValidToken) {
                            callback(200, orderObj);
                        } else {
                            callback(403, {'Error': 'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'})
                        }
                    });
                } else {
                    callback(400, {'Error': 'Token missing or invalid length.'});
                }
            } else {
                callback(404, {'Error': err});
            }
        });
    } else {
        callback(400, {'Error': 'No valid order id provided. Must be 20 chars in length.'});
    }
}


// update an order
// Required input: orderId, and one of the optional inputs
// Optional inputs: menuItem
put(data, callback) {
    // get required input
    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim(): false;
    let menuItems = typeof(data.payload.menuItems) == 'object'
        && data.payload.menuItems instanceof Array ? data.payload.menuItems : false;
    let deliveryAddress = typeof(data.payload.deliveryAddress) == 'string' && data.payload.deliveryAddress.trim().length > 0
        ? data.payload.deliveryAddress.trim() : false;
    let creditCard = typeof(data.payload.creditCard) == 'object' ? new CreditCard(data.payload.creditCard) : false;

    if(id && menuItems && deliveryAddress && creditCard && creditCard.validate()) {
        // authenticate the user
        _data.read('orders', id, function (err, orderObj) {
            if (!err && orderObj) {
                let userUid = orderObj.userUid;
                let tokenId = typeof (data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
                if (tokenId) {
                    // check that this token is valid for the given user/phone
                    _data.verifyToken(tokenId, userUid, function (isValidToken) {
                        if (isValidToken) {
                            let currMenuItems = orderObj.menuItems;
                            orderObj.menuItems = menuItems;
                            orderObj.deliveryAddress = deliveryAddress;
                            orderObj.creditCard = creditCard;
                            if (currMenuItems.length > 0) {
                                // @TODO: clear inventory of previous cart contents before replacing cart contents
                            }
                            _data.update('orders',id, orderObj,function(err) {
                                debug('update status: '+err);
                                if(!err) {
                                    _data.read('users',userUid, function(err, userObject) {
                                        debug('update status: '+err);
                                        if(!err) {
                                            let userObj = new User(userObject);
                                            let updateStatus = userObj.updateOrder(orderObj);
                                            if (updateStatus == true) {
                                                _data.update('users', userUid, userObj, function (err) {
                                                    if (!err) {
                                                        callback(200);
                                                    } else {
                                                        callback(500, {'Error': "Updated Order but not user's embedded copy."});
                                                    }
                                                });
                                            } else {
                                                callback(500, {'Error':'Failed to update the embedded order in the User doc.'});
                                            }
                                        } else {
                                            callback(500, {'Error':"Updated shopping cart, but couldn't find user."});
                                        }
                                    });
                                } else {
                                    callback(500, {'Error': err});
                                }
                            });
                        } else {
                            callback(403, {'Error': 'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'})
                        }
                    });
                } else {
                    callback(400, {'Error': 'Token missing or invalid length.'});
                }
            } else {
                callback(404, {'Error': err});
            }
        });

    } else {
        callback(400, {'Error':'Missing required input(s).'});
    }
}

// delete order
// Required input: id
// Optional inputs: none
delete(data, callback) {
    debug("DELETE: data:", data);
    let id = (typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length ==  20) ? data.queryStringObject.id.trim(): false;

    if(id) {
        _data.read('orders', id, function (err, orderObj) {
            if (!err && orderObj) {
                // get user uid
                let uid = orderObj.userUid;
                let tokenId = typeof (data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
                if (tokenId) {
                    // check that this token is valid for the given user/phone
                    _data.verifyToken(tokenId, uid, function (isValidToken) {
                        if (isValidToken) {
                            _data.delete('orders', id, function (err) {
                                debug('delete status: ' + err);
                                if (!err) {
                                    // get the existing user object
                                    _data.read('users', uid, function (err, userObj) {
                                        if (!err && userObj) {
                                            // try to remove the order from the user's reference
                                            debug("orders:update: userObj:",userObj);
                                            // find order in orders array
                                            let userInst = new User(userObj);
                                            userInst.deleteOrder(id);
                                            _data.update('users', uid, userInst, function(err) {
                                                if(!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {'Error':'Deleted order but failed to remove order from user.'});
                                                }
                                            });
                                        } else {
                                            callback(500, {'Error': 'Could not find a user who created the order, so only deleted order and updated no user.'});
                                        }
                                    });
                                } else {
                                    callback(500, {'Error': err});
                                }
                            });
                        } else {
                            callback(403, {'Error': 'User not authenticated.'});
                        }
                    });
                } else {
                    callback(403, {'Error': 'User not authenticated. Missing \'tokenid\' in headers, or invalid tokenid.'});
                }
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error':'Missing required input: cartId.'});
    }
}

}

module.exports = OrderCrudRouter;
