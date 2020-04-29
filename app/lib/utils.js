// utilities

const config = require('./config');
const crypto = require('crypto');

let utils = {};


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












module.exports = utils;