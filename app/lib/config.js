let environments = {};

environments.staging = {
  'httpPort': 8081,
  'httpsPort': 8082,
  'envName': 'staging',
  'hashingKey' : 'myStagingSecretKey',
  'maxChecks' : 5
};


environments.production = {
  'httpPort': 8091,
  'httpsPort': 8092,
  'envName': 'production',
  'hashingKey' : 'myProdSecretKey',
  'maxChecks' : 5
};

let currentEnv = typeof(process.env.NODE_ENV) == 'string' ?
    (typeof(environments[process.env.NODE_ENV.toLowerCase()]) != "undefined" ?
        process.env.NODE_ENV.toLowerCase() : "staging") : "staging";

module.exports = environments[currentEnv];
