"use strict";
/*
 * Server class
 */

// dependencies
const http = require('http');
const url  = require('url');
const util = require('util');
const StringDecoder = require('string_decoder').StringDecoder;
const debug = util.debuglog('unsecureserver');
const utils = require('./utils');

//const Router = require('./router');

class UnsecureServer {
    constructor(portNum, envName) {
        this.envName = envName;
        this.protocol = 'http';
        this.port = portNum;
        this.routerMap = {
            'user': this.userRouter,
            'token':this.tokenRouter
        };
    }

    set router(rtr) {
        this._router = rtr;
    }
    get router() {
        return this._router;
    }
    set userRouter(rtr) {
        this._userRouter = rtr;
        this.routerMap['user'] = this._userRouter;
    }
    get userRouter() {
        return this._userRouter;
    }
    set tokenRouter(rtr) {
        this._tokenRouter = rtr;
        this.routerMap['token'] = this._tokenRouter;
    }
    get tokenRouter() {
        return this._tokenRouter;
    }
    getTimestamp(date) {
        return {  unix: date.getTime(),  utc: date.toUTCString()};
    }
    init() {
        // create http server to handle unsecured requests
        this.server = http.createServer(
            function(req, res) {
                this.parse(req, res, this.handle);
            }.bind(this)
        );

        // start listening for unsecured requests
        this.server.listen(this.port,
            function() {
                debug('listening on HTTP '+ this.envName+' port:'+this.port);
            }.bind(this)
        );
    }

    parse (req, res, handlerCallback) {
        let parsedUrl = url.parse(req.url, true);
        debug('parsedUrl:',parsedUrl);

//        this.router.route(req, res);

        // get path
        let pathName = parsedUrl.pathname;
        let trimmedPath = pathName.replace(/^\/+|\/+$/g, '');
        let method = req.method.toLowerCase();
        let queryStrObj = parsedUrl.query;
        let headers = req.headers;
        let stringDecoder = new StringDecoder('utf-8');
        let buffer = '';
        req.on('data',function(data) {
            buffer += stringDecoder.write(data);
        });

        req.on('end', function() {
            buffer += stringDecoder.end();

            //log response
            debug("Request received at: "+this.getTimestamp(new Date()).utc);
            debug('req.url='+req.url);
            debug("pathname="+pathName);
            debug('trimmedPath='+trimmedPath);
            debug("request method="+method);
            debug("query parameters",queryStrObj);
            debug("headers",headers);
            debug("payload/buffer: ", buffer);

            // choose handler for this request, or notFound if no handlers are defined
            if(trimmedPath.length > 0 ) {
                let pathParts = trimmedPath.split("/");
                let chosenPath = pathParts[0];
                debug("chosenPath:" + chosenPath);
                let chosenHandler = null;
                debug('this.routerMap:',this.routerMap);
                if (typeof this.routerMap[chosenPath] != 'undefined') {
                    chosenHandler = this.routerMap[chosenPath];
                }
                debug("chosenHandler=", chosenHandler);
                let inputData = {
                    'method': req.method,
                    'trimmedPath': trimmedPath,
                    'headers': headers,
                    'payload': utils.parseJsonToObj(buffer),
                    'queryStringObject': queryStrObj
                };
                debug("inputData: ", inputData);
                handlerCallback(inputData,  req,  res, chosenHandler);
            }
        }.bind(this));
    }

    handle(inputData, req, res, chosenRouter) {
        if (chosenRouter != null) {
            chosenRouter.route(inputData, function (statusCode, responseDataObj) {
                debug("response code:" + statusCode + ", responseDataObj", responseDataObj);
                debug("typeof(responseDataObj):" + typeof (responseDataObj));
                let retStatusCode = typeof (statusCode) == 'number' ? statusCode : 200;
                let payloadString = "{}";
                if (typeof (responseDataObj) == 'object') {
                    payloadString = JSON.stringify(responseDataObj);
                } else {
                    payloadString = responseDataObj;
                }
                debug("Returning statusCode: " + retStatusCode + ", responseObj: " + payloadString);
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(retStatusCode);
                res.end(payloadString);

            });
        } else {
            debug("Returning statusCode: 404, responseObj: ");
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(404);
            res.end('Error: Unsupported path.\n');
        }

    }

};


module.exports = UnsecureServer;
