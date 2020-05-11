"use strict";
// utilities

const config = require('./config');
const crypto = require('crypto');
const querystring = require('querystring')
const https = require('https');
const util = require('util');
const debug = util.debuglog('utils');

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
    debug('parseJsonToObj::str',str);
  try {
      return JSON.parse(str);
  }
  catch(e) {
      debug('parseJsonToObj::e',e);
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

utils.sendTwilioSms = function(phone, msg, callback) {
    // validate parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim(): false;
    msg = typeof(msg) == 'string' && msg.trim().length >= 0 && msg.trim().length <= 1600 ? msg.trim(): false;

    if(phone && msg) {
        // configure request payload that will be sent to twilio
        let payload = {
            'From': config.twilio.fromPhone,
            'To': '+1'+phone,
            'Body': msg
        };

        let payloadString = querystring.stringify(payload);

        let requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(payloadString)
            }

        };

        // instantiate the request object
        let req = https.request(requestDetails, function(res) {
            let status = res.statusCode;
            if(status == 200 || status == 201) {
                callback(false);
            } else {
                debug('Status code was '+status);
                debug('twilio res:',res);
                callback(status);
            }
        });

        // bind to any error event
        req.on('error', function(err) {
            callback(err);
        });

        // add the payload
        req.write(payloadString);
        debug('utils.twilio sending req',req);
        req.end();

    } else {
        callback('Required parameters missing or invalid.');
    }
};










module.exports = utils;
