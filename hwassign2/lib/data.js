"use strict";
/*
* Library for storing and editing data
*/

const utils = require('./utils');
const fs = require('fs');
const path = require('path');
const util = require('util');
const debug = util.debuglog('data');


let lib = {};

lib.baseDir = path.join(__dirname,'/../.data/');

// write file
lib.create = function(dir, fileName, data, callback) {
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

lib.read = function(dir, fileName, callback) {
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



lib.verifyToken = function(tokenId, phone, callback) {
    let tokId = (typeof(tokenId) == 'string' && tokenId.trim().length == 20 ? tokenId.trim(): false);

    if(tokId) {
        // get the existing  object
        lib.read('tokens',tokId,function(err, tokenObj) {
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



module.exports = lib;
