let environments = {};

environments.staging = {
  'httpPort': 8081,
  'httpsPort': 8082,
  'envName': 'staging',
  'hashingKey' : 'myStagingSecretKey',
  'maxChecks' : 5,
  /* pirple
    'twilio': {
      'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
      'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
      'fromPhone' : '+15005550006'
    }
  */
  // gregor test credentials
  'twilio': {
      'accountSid' : 'AC96c11bdbef2fb946a2c9cc35e2ad23d3',
      'authToken'  : 'c652c90ca8906e91c3a475cf59baf7a1',
      'fromPhone'  : '+15005550006'
    }
    /* gregor
  'twilio': {
    'accountSid' : 'ACc9d97c07035e40dcd6d5a9f6381428b7',
    'authToken'  : '9f7d071a17ee5ba9bbb5c968624c66cd',
    'fromPhone'  : '+15712475490'
  }
  */
};


environments.production = {
  'httpPort': 8091,
  'httpsPort': 8092,
  'envName': 'production',
  'hashingKey' : 'myProdSecretKey',
  'maxChecks' : 5,
  'twilio': {
    'accountSid': '',
    'authToken': '',
    'fromPhone': ''
  }
};

let currentEnv = typeof(process.env.NODE_ENV) == 'string' ?
    (typeof(environments[process.env.NODE_ENV.toLowerCase()]) != "undefined" ?
        process.env.NODE_ENV.toLowerCase() : "staging") : "staging";

module.exports = environments[currentEnv];
