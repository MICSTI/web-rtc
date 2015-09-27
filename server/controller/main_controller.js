// node modules
var http = require('http');
var fs = require('fs');

// url parser
var urlparser = require('../helper/urlparser');

// read config file
var config = require('../config');

var _title = config.title;
var _author = config.author;
var _version = config.version;
var _port = config.port;
var _server = config.server;

// server startup
var startup = function() {
	// create server
	http.createServer(function(request, response) {
		console.log("Incoming request: " + request.url + "\n");
		
		// handle according to request method
		switch (request.method) {
			case "GET":
				// parse url
				var restUrl = new urlparser.UrlParser(request, {}, config.defaultResponseFormat);
				console.log(restUrl);
			
				break;
				
			case "POST":
			case "PUT":
			case "DELETE":
			default:
				
				break;
		}
		
		response.writeHead(200, {'Content-Type': 'text/plain'} );
		response.end("Hello dear friend! Nice of you to drop by.");
		
	}).listen(_port, _server);
	
	console.log(_title);
	console.log("Version: " + _version);
	console.log("(C) " + _author);
	console.log("Server running at http://" + _server + ":" + _port + "/\n");
}

module.exports.startup = startup;