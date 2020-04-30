/*
* Library for storing and editing data
*/

const fs = require('fs');
const path = require('path');
const utils = require('./utils')


let lib = {};

lib.baseDir = path.join(__dirname,'../.data/');

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
        console.log('_data.read err:',err);
        console.log('_data.read data:',data);
        if(!err && data) {
            callback(false, utils.parseJsonToObj(data));
        } else {
            callback(err, data);
        }
    });
};


lib.update = function(dir, fileName, data, callback) {
    // try to open the file
    console.log("lib.update data:",data);
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

module.exports = lib;
