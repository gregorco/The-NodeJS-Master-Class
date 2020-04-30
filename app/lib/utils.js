// utilities

const config = require('./config');
const crypto = require('crypto');

let utils = {
};


utils.hash = function(str) {
    if(typeof(str) == 'string' && str.length > 0) {
        let hashedVal = crypto.createHmac('sha256',config.hashingKey).update(str).digest('hex');
        return hashedVal;
    } else {
        return false;
    }
};


utils.parseJsonToObj = function(str) {
  try {
      return JSON.parse(str);
  }
  catch(e) {
      return {};
  }
};
utils.getRandomSection = function() {
    return Math.random().toString(36).substring(2, 15);
};
utils.getRandomString = function(maxSize) {
    if(typeof(maxSize) == 'number') {

        let randStr = utils.getRandomSection();
        while (randStr.length < maxSize) {
            randStr += utils.getRandomSection();
        }
        return randStr.substr(0, maxSize);
    } else {
        return false;
    }
};












module.exports = utils;
