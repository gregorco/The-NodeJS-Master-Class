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
lib.create = async function(dir, fileName, data) {
    fileName += ".json";
    let filePath = lib.baseDir+dir+"/"+fileName;
    let fileHandle;
    // try to open the file
    try {
    let [openErr, fileHandle2] = await handle(fsPromises.open(filePath,'wx'));
    fileHandle = fileHandle2;
    if(openErr) throw new Error("Could not create file. May already exist.");

    let stringifiedData = JSON.stringify(data);

    let [writeErr, voidVal] = await handle(fsPromises.writeFile(fileHandle, stringifiedData));
    if(writeErr) throw new Error("Failed to write new file: "+fileName);
    } finally {
        if (fileHandle !== undefined) {
            debug("create: closing filedescriptor "+fileHandle.fd);
            let [closeErr, voidVal2] = await handle(fileHandle.close());
            if (closeErr) throw new Error('Error closing file: ' + fileName);
        }
    }
};

lib.read = async function(dir, fileName) {
    // open file
    let [readErr, data] = await handle(fsPromises.readFile(lib.baseDir+dir+"/"+fileName+".json", 'utf8'));
    if (readErr) throw new Error(readErr);

    return utils.parseJsonToObj(data);
};


lib.update = async function(dir, fileName, data) {
    fileName += ".json";
    let filePath = lib.baseDir+dir+"/"+fileName;
    let fileHandle;
    try {
        let [openErr, fileHandle2] = await handle(fsPromises.open(filePath, 'r+'));
        fileHandle = fileHandle2;
        if (openErr) throw new Error("Could not update file. May not exist yet.");
        let stringifiedData = JSON.stringify(data);
//    let [truncateErr, void1] = await handle(fsPromises.truncate(fileDescriptor));
        let [truncateErr, void1] = await handle(fsPromises.truncate(filePath));
        if (truncateErr) throw new Error("Failed to truncate file: " + fileName);
        let [writeErr, void2] = await handle(fsPromises.writeFile(fileHandle, stringifiedData));
        if (writeErr) throw new Error("Failed to update file: " + fileName);
    } finally {
        if (fileHandle !== undefined) {
            debug("update: closing filedescriptor "+fileHandle.fd);
            let [closeErr, voidVal3] = await handle(fileHandle.close());
            if (closeErr) throw new Error('Error closing file: '+fileName);
        }
    }
};

lib.update_old = function(dir, fileName, data, callback) {
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

lib.delete = async function(dir, fileName) {
    let [unlinkErr, fileDescriptor] = await handle(fsPromises.unlink(lib.baseDir+dir+"/"+fileName+".json"));
    if (unlinkErr) throw new Error('Failed to delete file: '+fileDescriptor.fileName);
};

lib.delete_old = function(dir, fileName, callback) {
    fs.unlink(lib.baseDir+dir+"/"+fileName+".json",function(err, fileDescriptor) {
        if(!err) {
            callback(false);
        } else {
            callback('Failed to delete file: '+fileDescriptor.fileName);
        }
    });
};


lib.list = async function(dir) {
    let [readErr, listData] = await handle(fsPromises.readdir(lib.baseDir+dir+'/'));
    if(!readErr && listData && listData.length > 0) {
        let trimmedFileNames = [];
        listData.forEach(function (fileName) {
            trimmedFileNames.push(fileName.replace('.json', ''));
        });
        return trimmedFileNames;
    } else {
        throw new Error(readErr);
    }
};

lib.list_old = function(dir, callback) {
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


lib.verifyToken = async function(tokenId, uid) {
    let tokId = (typeof(tokenId) == 'string' && tokenId.trim().length == 20 ? tokenId.trim(): false);

    if(tokId) {
        // get the existing  object
        let [readErr, tokenObj] = await handle(lib.read('tokens',tokId));
        if(!readErr && tokenObj) {
            debug("tokenObj.expires=",new Date(tokenObj.expires));
            // check that the uid associated with the token matches the given uid and that the token has not already expired as of now
            return tokenObj.expires > Date.now() && tokenObj.uid == uid;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

lib.verifyToken_old = function(tokenId, uid, callback) {
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
};


module.exports = lib;
