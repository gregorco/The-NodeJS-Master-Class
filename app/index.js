
const http = require('http')
const https = require('https')
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const Router = require('./router');
const config = require('./lib/config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const utils = require('./lib/utils')

const options = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
};

const getTimestamp = date => ({  unix: date.getTime(),  utc: date.toUTCString()});

// create server and have it respond with hello world to all requests
let httpServer = http.createServer(function(req, res) {
    unifiedServer(req, res);
});

// create server and have it respond with hello world to all requests
let httpsServer = https.createServer(options, function(req, res) {
    unifiedServer(req, res);
});

// start http server
httpServer.listen(config.httpPort, function() {
    console.log("listening on HTTP "+config.envName+" port: "+config.httpPort);
})

// start https server
httpsServer.listen(config.httpsPort, function() {
    console.log("listening on HTTPS "+config.envName+" port: "+config.httpsPort);
})



let myrouter = {
    'hello': handlers.hello,
    'testit': handlers.testit,
    'ping'  : handlers.ping,
    'users' : handlers.users
}


let unifiedServer = function(req, res) {

    // parse url
    let parsedUrl = url.parse(req.url, true);

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
        console.log("Request received at: "+getTimestamp(new Date()).utc);
        console.log('index.js: req.url='+req.url);
        console.log("index.js: pathname="+pathName);
        console.log('index.js: trimmedPath='+trimmedPath);
        console.log("index.js: request method="+method);
        console.log("index.js: query parameters",queryStrObj);
        console.log("index.js: headers",headers);
        console.log("index.js: payload/buffer: ", buffer);

        // choose handler for this request, or notFound if no handlers are defined
        if(trimmedPath.length > 0 ) {
            let pathParts = trimmedPath.split("/");
            let chosenPath = pathParts[0];
            console.log("index.js: chosenPath:" +chosenPath);
            console.log("index.js: myrouter=",myrouter);
            console.log("index.js: myrouter[chosenPath] =",myrouter[chosenPath] );
            let chosenHandler = handlers.notFound;
            if(typeof myrouter[chosenPath] != 'undefined') {
                chosenHandler = myrouter[chosenPath];
            }
            console.log("index.js: chosenHandler=",chosenHandler);
            let inputData = {
                'method': req.method,
                'trimmedPath': trimmedPath,
                'headers' : headers,
                'payload' : utils.parseJsonToObj(buffer),
                'queryStringObject' : queryStrObj
            };
            console.log("index.js: inputData: ", inputData );
            chosenHandler(inputData, function(statusCode, responseDataObj) {
                console.log("index.js: response code:"+statusCode+", responseDataObj",responseDataObj);
                console.log("index.js: typeof(responseDataObj):"+typeof(responseDataObj));
                let retStatusCode = typeof(statusCode) == 'number' ? statusCode : 200;
                let payloadString = "{}";
                if(typeof(responseDataObj) == 'object') {
                    payloadString = JSON.stringify(responseDataObj);
                } else {
                    payloadString = responseDataObj;
                }
//                let respObj = typeof(responseDataObj) == 'object' ? responseDataObj : {};
//                let payloadString = JSON.stringify(respObj);
                res.setHeader('Content-Type','application/json');
                res.writeHead(retStatusCode);
                res.end(payloadString);

                console.log("index.js: Returning statusCode: "+retStatusCode+", responseObj: "+payloadString);
            });
            console.log("index.s: finished.")
        }

//        let myr = new Router();
//        myr.routeBar("some bar string");
//        myr.routeFoo("some foo string");
    });

};