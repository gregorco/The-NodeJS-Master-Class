

const _data = require('./data');
const utils = require('./utils')

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
// @TODO: add check to only allow authenticated users to access their own record
handlers._users.get = function(data, callback) {
    // create new user file
    let qObj = data.queryStringObject;
    console.log("GET: qObj:",qObj);
    if(typeof(qObj["phone"]) == 'string' && qObj["phone"].trim().length == 10) {
        _data.read('users',qObj["phone"].trim(),function(err, data) {
            console.log('read status: '+err);
            if(!err && data) {
                // remove the hashed password from returned data obj
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error':'No valid phone number provided. Must be 10 chars in length.'});
    }
};

// Required data: phone
// Optional data: rest of properties
// @TODO: add check to only allow authenticated users to update their own record
handlers._users.put = function(data, callback) {
    // create new user file
    _data.update('users','testfilename',data,function(err) {
        console.log('update status: '+err);
        callback(200, err);
    });
};

handlers._users.delete = function(data, callback) {
    // create new user file
    _data.delete('users','testfilename',function(err) {
        console.log('delete status: '+err);
        callback(200, err);
    });
};

module.exports = handlers;