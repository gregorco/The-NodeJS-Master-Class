"use strict";
/*
 * Define configurations for testing and production
 */
let environments = {};
let choices = ['staging','production'];
environments.staging = {
    'envName':      'staging',
    'httpPort':     '3001',
    'httpsPort':    '3002'
};


environments.production = {
    'envName':      'production',
    'httpPort':     '4001',
    'httpsPort':    '4002'
};

let choice = typeof(process.env.NODE_ENV) == 'string' && process.env.NODE_ENV.length > 0
    ? (choices.indexOf(process.env.NODE_ENV) > -1 ? process.env.NODE_ENV : 'staging')
    : 'staging';

module.exports = environments[choice];
