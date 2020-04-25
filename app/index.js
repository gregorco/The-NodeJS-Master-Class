
var http = require('http')
var url = require('url');

// create server and have it respond with hello world to all requests
var server = http.createServer(function(req, res) {
    // parse url
    let parsedUrl = url.parse(req.url, true);
    
    // get path
    let pathName = parsedUrl.pathname;
    let trimmedPath = pathName.replace(/^\/+|\/+$/g, '');
    
    // send response
    res.end("Hello world.");
    
    //log response
    console.log('req.url='+req.url);
    console.log("pathname="+pathName);
    console.log('trimmedPath='+trimmedPath);
});

// start server and have it listen on port 3000
server.listen(3000, function() {
    console.log("listening on port 3000.");
})

