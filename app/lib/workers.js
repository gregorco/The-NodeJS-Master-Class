/*
 * Worker related tasks
 */

// dependencies
const http = require('http')
const https = require('https')
const url = require('url');
const config = require('./config');
const fs = require('fs');
const utils = require('./utils')
const path = require('path');
const _data = require('./data');

let workers = {};



// look up all checks, get their data, send to a validator
workers.gatherAllChecks = function() {
    // get all the checks
    _data.list('checks', function(err, checks) {
        if(!err && checks && checks.length > 0) {
            checks.forEach(function(check){
                // read in the check data
                _data.read('checks', check, function(err, origCheckData) {
                    if(!err && origCheckData) {
                        // pass it to the check validator and let that function continue
                        workers.validateCheckData(origCheckData);
                    } else {
                        console.log("Error: reading one of the check's data.");
                    }
                });
            });
        } else {
            console.log('Error: Could not find any checks to process.');
        }
    });
};

workers.validateCheckData = function(origCheckData) {
    origCheckData = typeof(origCheckData) == 'object' && origCheckData != null  ? origCheckData : {};
    origCheckData.id = typeof(origCheckData.id) == 'string' && origCheckData.id.trim().length == 20 ? origCheckData.id : false;
    origCheckData.userPhone = typeof(origCheckData.userPhone) == 'string' && origCheckData.userPhone.trim().length == 10 ? origCheckData.userPhone : false;
    origCheckData.protocol = typeof(origCheckData.protocol) == 'string' && ['http','https'].indexOf(origCheckData.protocol.trim().toLowerCase()) > -1 ? origCheckData.protocol.trim().toLowerCase(): false;
    origCheckData.url = typeof(origCheckData.url) == 'string' && origCheckData.url.trim().length > 0 ? origCheckData.url : false;
    origCheckData.method = typeof(origCheckData.method) == 'string' && ['post','get','put','delete'].indexOf(origCheckData.method.trim().toLowerCase()) > -1 ? origCheckData.method.trim().toLowerCase(): false;
    origCheckData.successCodes = typeof(origCheckData.successCodes) == 'object' && origCheckData.successCodes instanceof Array  && origCheckData.successCodes.length > 0 ? origCheckData.successCodes : false;
    origCheckData.timeoutSeconds = typeof(origCheckData.timeoutSeconds) == 'number' && origCheckData.timeoutSeconds % 1 === 0 && origCheckData.timeoutSeconds >= 1 && origCheckData.timeoutSeconds <= 5 ? origCheckData.timeoutSeconds : false;

    // set keys that may not have been set yet if workers have not yet seen this check: state and timestamp
    origCheckData.state = typeof(origCheckData.state) == 'string' && ['up','down'].indexOf(origCheckData.state.trim().toLowerCase()) > -1 ? origCheckData.state.trim().toLowerCase(): 'down';
    origCheckData.lastChecked = typeof(origCheckData.lastChecked) == 'number' && origCheckData.lastChecked % 1 === 0 && origCheckData.lastChecked > 0 ? origCheckData.lastChecked : false;

    if(origCheckData.id &&
        origCheckData.userPhone &&
        origCheckData.protocol &&
        origCheckData.url &&
        origCheckData.method &&
        origCheckData.successCodes &&
        origCheckData.timeoutSeconds) {

        workers.performCheck(origCheckData);
    } else {
        console.log('One of the check properties is not valid, so skipping check.');
    }
};

workers.performCheck = function(origCheckData) {
    // prepare the initial check outcome
    let checkOutcome = {
        'error': false,
        'responseCode': false
    };

    // mark that the outcome has not been sent
    let outcomeSent = false;

    // parse the original hostname and path out of the original check data
    let parsedUrl = url.parse(origCheckData.protocol+"://"+origCheckData.url, true);
    let hostName = parsedUrl.hostname;
    let path = parsedUrl.path; // want path instead of pathname because path includes query string, but pathname does not

    // setup request details
    let requestDetails = {
        'protocol' : origCheckData.protocol+':',
        'hostname' : hostName,
        'method' : origCheckData.method,
        'path' : path,
        'timeout' : origCheckData.timeoutSeconds
    };

    // instantiate the request module based on the checks protocol
    let _moduleToUse = origCheckData.protocol == 'http' ? http : https;
    let req = _moduleToUse.request(requestDetails, function(res) {
       // grab the status of the request
       let status = res.statusCode;

       // update the checkOutcome and pass data along
        checkOutcome.responseCode = status;
        if(!outcomeSent) {
            workers.processCheckOutcome(origCheckData,checkOutcome);
            outcomeSent = true;
        }
    });

    // bind to the error event so it doesn't throw error
    req.on('error', function(e) {
       // update the checkoutcome and pass the data along
       checkOutcome.error = {
           'error' : true,
           'value' : e
       };

        if(!outcomeSent) {
            workers.processCheckOutcome(origCheckData,checkOutcome);
            outcomeSent = true;
        }
    });

    // bind to the timeout event
    req.on('timeout', function(e) {
        // update the checkoutcome and pass the data along
        checkOutcome.error = {
            'error' : true,
            'value' : 'timeout'
        };

        if(!outcomeSent) {
            workers.processCheckOutcome(origCheckData,checkOutcome);
            outcomeSent = true;
        }
    });

    // end the request, which means to do the actual send
    req.end();

    // process the checkoutcome, trigger an alert if needed,
    // special processing to accommodate a check that has never been tested before (first one if not a trigger)


};

workers.processCheckOutcome = function(origCheckData, checkOutcome) {
    // check if the state is considered down or up
    let state = !checkOutcome.error && checkOutcome.responseCode && origCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    // decide if an alert is warranted?  is current state different than origCheck's state?
    let alertWarranted = origCheckData.lastChecked && origCheckData.state !== state ? true : false;

    // update the check state data
    let newCheckData = origCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    // save the data
    _data.update('checks', newCheckData.id, newCheckData, function(err, ){
        if(!err) {
            // send alert if warranted
            if(alertWarranted) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Check outcome has not changed, no alert necessary.');
            }
        } else {
            console.log('Error trying to save updates to one of the checks');
        }

    });
};

workers.alertUserToStatusChange = function(newCheckData) {
    // craft message for twilio api
    let msg = 'Alert: Your check for '+newCheckData.method.toUpperCase()+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
    utils.sendTwilioSms(newCheckData.userPhone, msg, function(err) {
        if(!err) {
            console.log('User was alerted to a status change in their check via SMS.',msg);
        } else {
            console.log('Error: Could not send an SMS alert to user who had a state change in their check.',err);
        }
    });
}

workers.loop = function() {
    setInterval(workers.gatherAllChecks,1000 * 60);
};

workers.init = function() {
    // get list of checks and execute immediately
    workers.gatherAllChecks();

    // start loop and check on schedule automatically
    workers.loop();
};










module.exports = workers;
