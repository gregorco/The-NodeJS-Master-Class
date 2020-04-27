
const http = require('http')
const https = require('https')
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const Router = require('./router');
const config = require('./config');
const fs = require('fs');

const options = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
};
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

let handlers = {};

handlers.hello = function(data,callback) {
    callback(200, {'message': 'Hello there!'});
}

handlers.testit = function(data,callback) {
    console.log("testit callback inputdata:",data);
    callback(407, {'age': 3});
}

handlers.ping = function(data, callback) {
    console.log("ping callback inputdata:", data);
    callback(200);
}

handlers.notFound = function(data, callback) {
    callback(404);
}

let myrouter = {
    'hello': handlers.hello,
    'testit': handlers.testit,
    'ping'  : handlers.ping
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
    })

    req.on('end', function() {
        buffer += stringDecoder.end();

        //log response
        console.log('req.url='+req.url);
        console.log("pathname="+pathName);
        console.log('trimmedPath='+trimmedPath);
        console.log("request method="+method);
        console.log("query parameters",queryStrObj);
        console.log("headers",headers);
        console.log("payload: ", buffer);

        // choose handler for this request, or notFound if no handlers are defined
        if(trimmedPath.length > 0 ) {
            let pathParts = trimmedPath.split("/");
            let chosenPath = pathParts[0];
            console.log("chosenPath:" +chosenPath);
            console.log("myrouter=",myrouter);
            console.log("myrouter[chosenPath] =",myrouter[chosenPath] );
            let chosenHandler = handlers.notFound;
            if(typeof myrouter[chosenPath] != 'undefined') {
                chosenHandler = myrouter[chosenPath];
            }

            let inputData = {
                'trimmedPath': trimmedPath,
                'headers' : headers,
                'payload' : buffer,
                'queryStringObject' : queryStrObj
            }
            chosenHandler(inputData, function(statusCode, responseDataObj) {
                console.log("response code:"+statusCode+", responseDataObj",responseDataObj);
                let retStatusCode = typeof(statusCode) == 'number' ? statusCode : 200;
                let respObj = typeof(responseDataObj) == 'object' ? responseDataObj : {};
                let payloadString = JSON.stringify(respObj);
                res.setHeader('Content-Type','application/json');
                res.writeHead(retStatusCode);
                res.end(payloadString);

                console.log("Returning statusCode: "+retStatusCode+", responseObj: "+payloadString);
            });
        }

//        let myr = new Router();
//        myr.routeBar("some bar string");
//        myr.routeFoo("some foo string");
    })

};