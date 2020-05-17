/*
 * Primary app
 */

// dependencies
let server = require('./lib/server');
let workers = require('./lib/workers');

let app = {};

app.init  = function() {

    // instantiate the servers
    server.init();


    // instantiate the workers
    workers.init();




};

app.init();

module.exports = app;
