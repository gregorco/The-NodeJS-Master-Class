

const _data = require('./data');
const utils = require('./utils');
const config = require('./config');

let handlers = {};

handlers.hello = function(data,callback) {
    callback(200, {'message': 'Hello there!'});
};

handlers.testit = function(data,callback) {
    console.log("testit callback inputdata:",data);
    _data.create('test','testfilename',data,function(err) {
        console.log('create status: '+err);
        callback(200, err);
    });
};

handlers.ping = function(data, callback) {
    console.log("ping callback inputdata:", data);
    callback(200);
};

handlers.notFound = function(data, callback) {
    callback(404);
};

handlers.users = function(data,callback) {
    console.log("handlers.users: callback inputdata:",data);
    let acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method.toLowerCase()) != -1) {
        handlers._users[data.method.toLowerCase()](data, callback);
    } else {
        callback("Invalid REST method requested: "+data.method);
    }
};

handlers._users = {};
// Create user
// Required properties: firstName, lastName, phone, password, tosAgreement
handlers._users.post = function(data, callback) {
    console.log("users:post: ",data);
    // verify that all required properties were sent
    let missingProperties = '';
    if(typeof(data.payload.firstName) != 'string' || data.payload.firstName.trim().length == 0) {
        missingProperties += "firstName,";
    }
    if(typeof(data.payload.lastName) != 'string' || data.payload.lastName.trim().length == 0) {
        missingProperties += "lastName,";
    }
    if(typeof(data.payload.phone) != 'string' || data.payload.phone.trim().length != 10) {
        missingProperties += "phone,";
    }
    if(typeof(data.payload.password) != 'string' || data.payload.password.trim().length == 0) {
        missingProperties += "password,";
    }
    if(typeof(data.payload.tosAgreement) != 'boolean' || !data.payload.tosAgreement) {
        missingProperties += "tosAgreement";
    }

    if(missingProperties.length > 0) {
        callback(400, {'Error': 'Missing/invalid properties: '+missingProperties});
    } else {
        let firstName = data.payload.firstName;
        let lastName = data.payload.lastName;
        let phone = data.payload.phone;
        let password = data.payload.password;
        let tosAgreement = data.payload.tosAgreement;
        // check if this user already exists
        _data.read('users',phone, function(err,readData) {
            console.log('POST: _data.read err:',err);
            if(err) {

                let hashedPassword = utils.hash(password.trim());
                if(hashedPassword) {
                    // create user object
                    let userObj = {
                      'firstName': firstName,
                      'lastName':  lastName,
                      'phone': phone,
                      'hashedPassword': hashedPassword,
                      'tosAgreement': true
                    };
                    // create new user file
                    _data.create('users',phone,userObj,function(err) {
                        console.log('create status: '+err);
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
                console.log("err: ",err);
                console.log("data:", data);
                callback(400, {'Error': 'User phone already exists:'+phone});
            }
        });
    }
};

// Required data: phone
// Optional data: none
// checks to only allow authenticated users to update their own record
handlers._users.get = function(data, callback) {
    // get user file
    let qObj = data.queryStringObject;
    console.log("GET: qObj:",qObj);
    if(typeof(qObj["phone"]) == 'string' && qObj["phone"].trim().length == 10) {
        let phone = qObj["phone"].trim();
        // authenticate the user
        let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
        if(tokenId) {
            // check that this token is valid for the given user/phone
            handlers._tokens.verifyToken(tokenId, phone, function(isValidToken) {
                if(isValidToken) {
                    _data.read('users', phone, function (err, data) {
                        console.log('read status: ' + err);
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
};

// Required data: phone
// Optional data: rest of properties
// checks to only allow authenticated users to update their own record
handlers._users.put = function(data, callback) {
    // update user file
    let phone = (typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 0) ? data.payload.phone.trim(): false;

    let firstName = (typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0) ? data.payload.firstName.trim(): false;
    let lastName = (typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0) ? data.payload.lastName.trim(): false;
    let password = (typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0) ? data.payload.password.trim(): false;
    console.log("users.put: firstName: "+firstName+", lastName="+lastName);
    if(phone) {

        // authenticate the user
        let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
        if(tokenId) {
            // check that this token is valid for the given user/phone
            handlers._tokens.verifyToken(tokenId, phone, function(isValidToken) {
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
                                console.log('update status: '+err);
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
};

// delete user
// Required params: phone
// @TODO add support to only allow authenticated user to delete his record
// @TODO add support to clean up any associated records/data/files with this deleted user
handlers._users.delete = function(data, callback) {
    let phone = (typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 0) ? data.queryStringObject.phone.trim(): false;

    if(phone) {

        // authenticate the user
        let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
        if(tokenId) {
            // check that this token is valid for the given user/phone
            handlers._tokens.verifyToken(tokenId, phone, function(isValidToken) {
                if(isValidToken) {
                    // get the existing user object
                    _data.read('users',phone,function(err, userObj) {
                        if(!err && userObj) {
                            _data.delete('users',phone,function(err) {
                                console.log('delete status: '+err);
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

};

// ****************************************************************************************************************
// route the token requests.
handlers.tokens = function(data,callback) {
    console.log("handlers.tokens: callback inputdata:",data);
    let acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method.toLowerCase()) != -1) {
        handlers._tokens[data.method.toLowerCase()](data, callback);
    } else {
        callback("Invalid REST method requested: "+data.method);
    }
};

handlers._tokens = {};
// Create user
// Required properties: phone, password
// Optional properties: none
handlers._tokens.post = function(data, callback) {
    // verify that all required properties were sent
    let missingProperties = '';
    if(typeof(data.payload.phone) != 'string' || data.payload.phone.trim().length != 10) {
        missingProperties += "phone,";
    }
    if(typeof(data.payload.password) != 'string' || data.payload.password.trim().length == 0) {
        missingProperties += "password,";
    }

    if(missingProperties.length > 0) {
        callback(400, {'Error': 'Missing/invalid properties: '+missingProperties});
    } else {
        let phone = data.payload.phone;
        let password = data.payload.password;
        // check if this user already exists
        _data.read('users',phone, function(err,userData) {
            console.log('POST: _data.read err:',err);
            if(!err && userData) {

                let hashedPassword = utils.hash(password.trim());
                if(hashedPassword == userData.hashedPassword) {
                    // create user object
                    let tokenId = utils.getRandomString(20);
                    // define expiration date
                    let expireDate = Date.now() + 1000 * 60 * 60;
                    let tokenObj = {
                        'phone': phone,
                        'tokenId': tokenId,
                        'expires': expireDate
                    };
                    // create new token file
                    _data.create('tokens',tokenId,tokenObj,function(err) {
                        console.log('create status: '+err);
                        if(!err) {
                            callback(200, tokenObj);
                        } else {
                            callback(500, {'Error':err});
                        }
                    });
                } else {
                    callback(400, {'Error':'Password does not match.'})
                }
            } else {
                console.log("err: ",err);
                console.log("data:", data);
                callback(400, {'Error': 'User not found.'});
            }
        });
    }
};

// Required data: tokenId
// Optional data: none
// @TODO: add check to only allow authenticated users to access their own record

handlers._tokens.get = function(data, callback) {
    // get token
    let qObj = data.queryStringObject;
    console.log("GET: qObj:",qObj);
    if(typeof(qObj["tokenId"]) == 'string' && qObj["tokenId"].trim().length == 20) {
        _data.read('tokens',qObj["tokenId"].trim(),function(err, data) {
            console.log('read status: '+err);
            if(!err && data) {
                // remove the hashed password from returned data obj
                callback(200, data);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error':'No valid tokenId provided. Must be 20 chars in length.'});
    }
};

// Required data: tokenId, extend
// Optional data: none
// @TODO: add check to only allow authenticated users to update their own record
handlers._tokens.put = function(data, callback) {
    // update expiration of token
    let tokenId = (typeof(data.payload.tokenId) == 'string' && data.payload.tokenId.trim().length == 20) ? data.payload.tokenId.trim(): false;
    let extend = (typeof(data.payload.extend) == 'boolean' ? data.payload.extend: false);

    if(tokenId && extend) {
        // get the existing token object
        _data.read('tokens',tokenId,function(err, tokenObj) {
            if(!err && tokenObj) {
                // check that token is not already expired before continuing
                if(tokenObj.expires > Date.now()) {
                    tokenObj.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens', tokenId, tokenObj, function (err) {
                        console.log('update status: ' + err);
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': err});
                        }
                    });
                } else {
                    callback(400, {'Error':'Token already expired; cannot extend.'})
                }
            } else {
                callback(404, {'Error':'Token not found'});
            }
        })
    } else {
        if(!tokenId) {
            callback(400, {'Error':'Missing required input: tokenId.'})
        } else if(!extend) {
            callback(400, {'Error':'No change to extend expiration.'})
        }
    }
};

// delete user
// Required params: phone
// @TODO add support to only allow authenticated user to delete his record
// @TODO add support to clean up any associated records/data/files with this deleted user
handlers._tokens.delete = function(data, callback) {
    let tokenId = (typeof(data.queryStringObject.tokenId) == 'string' && data.queryStringObject.tokenId.trim().length == 20) ? data.queryStringObject.tokenId.trim(): false;

    if(tokenId) {
        // get the existing  object
        _data.read('tokens',tokenId,function(err, tokenObj) {
            if(!err && tokenObj) {

                _data.delete('tokens',tokenId,function(err) {
                    console.log('delete status: '+err);
                    if(!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error': err});
                    }
                });
            } else {
                callback(400, {'Error':'Token not found'});
            }
        })
    } else {
        callback(400, {'Error':'Missing required input: tokenId.'})
    }

};

// verify that the given token is valid: exists for the given phone and is not expired
handlers._tokens.verifyToken = function(tokenId, phone, callback) {
    let tokId = (typeof(tokenId) == 'string' && tokenId.trim().length == 20 ? tokenId.trim(): false);

    if(tokId) {
        // get the existing  object
        _data.read('tokens',tokId,function(err, tokenObj) {
            if (!err && tokenObj) {
                // check that the phone associated with the token matches the given phone and that the token has not already expired as of now
                if(tokenObj.phone == phone && tokenObj.expires > Date.now()) {
                    callback(true);
                } else {
                    callback(false);
                }
            } else {
                callback(false);
            }
        });
    } else {
        callback(false);
    }
}

// ================================================================================================================

handlers.checks = function(data,callback) {
    console.log("handlers.checks: callback inputdata:",data);
    let acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method.toLowerCase()) != -1) {
        handlers._checks[data.method.toLowerCase()](data, callback);
    } else {
        callback("Invalid REST method requested: "+data.method);
    }
};

handlers._checks = {};
// Create user
// Required properties: firstName, lastName, phone, password, tosAgreement
handlers._checks.post = function(data, callback) {
    console.log("checks:post: ",data);
    // verify that all required properties were sent
    let protocol = typeof(data.payload.protocol) == 'string' && ['http','https'].indexOf(data.payload.protocol.trim().toLowerCase()) > -1 ? data.payload.protocol.trim().toLowerCase(): false;
    let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
    let method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method.trim().toLowerCase()) > -1 ? data.payload.method.trim().toLowerCase(): false;
    let successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array  && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if(protocol && url && method && successCodes && timeoutSeconds) {

        // authenticate the user
        let tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;
        if(tokenId) {
            // check that this token is valid for the given user/phone
            _data.read('tokens', tokenId, function (err, tokenObj) {
                if (!err && tokenObj && tokenObj.expires > Date.now()) {
                    let phone = tokenObj.phone;

                    // store the checks with this user's phone
                    _data.read('users', phone, function (err, userObj) {
                        if (!err && userObj) {
                            // update the user object to add a check to its check's list
                            let userChecks = typeof (userObj.checks) == 'object' && userObj.checks instanceof Array ? userObj.checks : [];
                            // prevent user from exceeding max checks
                            if (userChecks.length < config.maxChecks) {
                                // add new check
                                let checkId = utils.getRandomString(20);
                                let checkObj = {
                                    'id': checkId,
                                    'userPhone': phone,
                                    'protocol': protocol,
                                    'url': url,
                                    'method': method,
                                    'successCodes': successCodes,
                                    'timeoutSeconds': timeoutSeconds
                                };
                                _data.create('checks', checkId, checkObj, function (err) {
                                    if (!err) {
                                        userObj.checks = userChecks;
                                        userObj.checks.push(checkId);
                                        _data.update('users', phone, userObj, function (err) {
                                            if (!err) {
                                                callback(200, checkObj);
                                            } else {
                                                callback(500, {'Error': 'Failed to update user object.'});
                                            }
                                        });
                                    } else {
                                        callback(500, {'Error': err});
                                    }
                                });

                            } else {
                                callback(400, {'Error': 'Max checks already reached. Delete one and try again.'})
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
    } else {
        callback(400, {'Error': 'Missing/invalid properties.'});
    }
}

module.exports = handlers;
