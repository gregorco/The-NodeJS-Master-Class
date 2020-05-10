"use strict";
/*
 * Secure server class
 */
const UnsecureServer = require('./unsecureserver');
const https = require('https');
const util = require('util');
const debug = util.debuglog('secureserver');

class SecureServer extends UnsecureServer {
    constructor(options, port, envName) {
        super(port, envName);
        this.options = options;
        this.protocol = 'https';
    }

    init() {
        // create secure server to handle secure requests
        this.server = https.createServer(this.options,
            function(req, res) {
                this.parse(req,  res, this.handle);
            }.bind(this)
        );

        // start listening for requests
        this.server.listen(this.port,
            function() {
                debug('listening on HTTPS '+ this.envName+' port:'+this.port);
            }.bind(this)
        );
    }
}


module.exports  = SecureServer;
