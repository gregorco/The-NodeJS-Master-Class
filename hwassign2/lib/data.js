"use strict";
/*
* Library for storing and editing data
*/

const utils = require('./utils');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const util = require('util');
const debug = util.debuglog('data');

const handle = (promise) => {
    return promise
        .then(data => ([undefined, data]))
        .catch(error => Promise.resolve([error, undefined]));
}

let lib = {};

lib.baseDir = path.join(__dirname,'/../.data/');

// write file
lib.create_old = function(dir, fileName, data, callback) {
    // try to open the file
    fs.open(lib.baseDir+dir+"/"+fileName+".json",'wx',function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            let stringifiedData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringifiedData, function(err) {
                if(!err) {
                    fs.close(fileDescriptor, function(err) {
                        if(!err) {
                            callback(false);
                        } else {
                            callback('Error closing file: '+fileDescriptor.fileName);
                        }
                    });
                } else {
                    callback("Failed to write new file: "+fileDescriptor.fileName);
                }
            });
        } else {
            callback("Could not create file. May already exist.")
        }
    });
};

// write file
lib.create_old2 = async function(dir, fileName, data) {
    // try to open the file
    let filehandle = null;
    filehandle = await fsPromises.open(lib.baseDir+dir+"/"+fileName+".json",'wx')
        .catch(() => Promise.reject(new Error("Could not create file. May already exist.")));
    let stringifiedData = JSON.stringify(data);
    await fsPromises.writeFile(filehandle, stringifiedData)
        .catch(() => Promise.reject(new Error("Failed to write new file: "+fileName)));
    if (filehandle !== undefined) {
        await filehandle.close()
            .catch(() => Promise.reject(new Error('Error closing file: '+fileName)));
    }
};

// write file
lib.create = async function(dir, fileName, data) {
    // try to open the file
    let [openErr, fileHandle] = await handle(fsPromises.open(lib.baseDir+dir+"/"+fileName+".json",'wx'));
    if(openErr) throw new Error("Could not create file. May already exist.");

    let stringifiedData = JSON.stringify(data);

    let [writeErr, voidVal] = await handle(fsPromises.writeFile(fileHandle, stringifiedData));
    if(writeErr) throw new Error("Failed to write new file: "+fileName);

    if (fileHandle !== undefined) {
        let [closeErr, voidVal2] = await handle(fileHandle.close());
        if (closeErr) throw new Error('Error closing file: '+fileName);
    }
};

lib.read = async function(dir, fileName) {
    // open file
    let [readErr, data] = await handle(fsPromises.readFile(lib.baseDir+dir+"/"+fileName+".json", 'utf8'));
    if (readErr) throw new Error(readErr);

    return utils.parseJsonToObj(data);
};


lib.read_old = function(dir, fileName, callback) {
    // open file
    fs.readFile(lib.baseDir+dir+"/"+fileName+".json", 'utf8', function(err, data) {
        //console.log('_data.read err:',err);
        //console.log('_data.read data:',data);
        if(!err && data) {
            callback(false, utils.parseJsonToObj(data));
        } else {
            callback(err, data);
        }
    });
};

lib.update = function(dir, fileName, data, callback) {
    // try to open the file
    //console.log("lib.update data:",data);
    fs.open(lib.baseDir+dir+"/"+fileName+".json",'r+',function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            let stringifiedData = JSON.stringify(data);

            // truncate file
            fs.truncate(fileDescriptor, function(err) {
                if(!err) {
                    fs.writeFile(fileDescriptor, stringifiedData, function(err) {
                        if(!err) {
                            fs.close(fileDescriptor, function(err) {
                                if(!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing file: '+fileDescriptor.fileName);
                                }
                            });
                        } else {
                            callback("Failed to update file: "+fileDescriptor.fileName);
                        }
                    });
                } else {
                    callback("Failed to truncate file: "+fileDescriptor.fileName);
                }
            });
        } else {
            callback("Could not update file. May not exist yet.")
        }
    });

};

lib.delete = function(dir, fileName, callback) {
    fs.unlink(lib.baseDir+dir+"/"+fileName+".json",function(err, fileDescriptor) {
        if(!err) {
            callback(false);
        } else {
            callback('Failed to delete file: '+fileDescriptor.fileName);
        }
    });

};


lib.list = function(dir, callback) {
    fs.readdir(lib.baseDir+dir+'/', function(err, listData) {
        if(!err && listData && listData.length > 0) {
            let trimmedFileNames = [];
            listData.forEach(function(fileName) {
                trimmedFileNames.push(fileName.replace('.json',''));
            });
            callback(false, trimmedFileNames);
        } else {
            callback(err,listData);
        }
    });

};



lib.verifyToken = function(tokenId, uid, callback) {
    let tokId = (typeof(tokenId) == 'string' && tokenId.trim().length == 20 ? tokenId.trim(): false);

    if(tokId) {
        // get the existing  object
        lib.read('tokens',tokId,function(err, tokenObj) {
            if (!err && tokenObj) {
                debug("tokenObj.expires=",new Date(tokenObj.expires));
                // check that the uid associated with the token matches the given uid and that the token has not already expired as of now
                if(tokenObj.expires > Date.now() && tokenObj.uid == uid) {
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


module.exports = lib;
