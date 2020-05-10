/*
 * Library for storing and rotating log files
 */

// dependencies
let fs = require('fs');
let path = require('path');
let zlib = require('zlib');

// container for the module
let lib = {};

lib.baseDir = path.join(__dirname, '/../.logs/');

// append a string to a file. Create file if it doesn't exist yet.
lib.append = function(fileName, dataString, callback) {
    // open file for appending
    fs.open(lib.baseDir+fileName+'.log','a', function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            // append to the file and close it
            fs.appendFile(fileDescriptor, dataString+'\n', function(err) {
                if(!err) {
                    fs.close(fileDescriptor, function(err){
                        if(!err) {
                            callback(false);
                        } else {
                            callback('Error closing file that was being appended',err);
                        }
                    });
                } else {
                    callback(500,{'Error': 'Failed to write data to log file,'+fileName});
                }
            });
        } else {
            callback('Could not open file,'+fileName+', to append to.');
        }
    });

};


lib.list = function(includeCompressedLogs, callback) {
    fs.readdir(lib.baseDir, function(err, data) {
        console.log('logs.list data',data);
        if(!err && data) {
            var trimmedFileNames = [];
            data.forEach(function(fileName) {
                if(fileName.indexOf('.log') > -1) {
                    trimmedFileNames.push(fileName.replace('.log',''));
                }
                // Add on the .gz files
                if(fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
                    trimmedFileNames.push(fileName.replace('.gz.g64',''));
                }
                callback(false, trimmedFileNames);
            });
        } else {
            callback(err, data);
        }
    });
};

// compress a .log file into a .gz.b64 file in same folder
lib.compress = function(logId, newFileId, callback) {
    let sourceFile = logId+'.log';
    let destFile = newFileId+'.gz.b64';

    // read the source file
    fs.readFile(lib.baseDir+sourceFile, 'utf8', function(err, inputString) {
       if(!err && inputString) {
           // compress the data
           zlib.gzip(inputString, function(err, buffer) {
               if(!err && buffer) {
                   // send to file for writing
                   fs.open(lib.baseDir+destFile, 'wx', function(err, fileDescriptor) {
                       if(!err && fileDescriptor) {
                           fs.writeFile(fileDescriptor, buffer.toString('base64'), function(err) {
                               if(!err) {
                                   fs.close(fileDescriptor, function(err) {
                                       if(!err) {
                                           callback(false);
                                       } else {
                                           callback(err);
                                       }
                                   });
                               } else {
                                   callback(err);
                               }
                           });
                       } else {
                           callback(err);
                       }
                   });
               } else {
                   callback(err);
               }
           });
       } else {
           callback(err);
       }
    });

};


// decompress contents of a .gz.b64 file into a string variable
lib.decompress = function(fileId, callback) {
    let fileName = fileId+'.gz.b64';
    fs.readFile(lib.baseDir+filename, 'utf8', function(err, str) {
        if(!err && str) {
            // decompress the data
            let inputBuffer = Buffer.from(str, 'base64');
            zlib.unzip(inputBuffer, function(err, outputBuffer) {
                if(!err && outputBuffer) {
                    let str = outputBuffer.toString();
                    callback(false, str);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    });
};


// truncate a log file
lib.truncate = function(logId, callback) {
    fs.truncate(lib.baseDir+logId+'.log', 0, function(err) {
        if(!err) {
            callback(false);
        } else {
            callback(err);
        }
    });

};



module.exports = lib;
