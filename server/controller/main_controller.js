// node modules
var http = require('http');
var webSocketServer = require('websocket').server;
var fs = require('fs');

// url parser
var urlparser = require('../helper/urlparser');

// page view
var pv = require('../view/page_view');

// static files controllers
var staticFiles = require('./static_files_controller');

// read config file
var config = require('../config');

var _title = config.title;
var _author = config.author;
var _version = config.version;
var _port = config.port;
var _server = config.server;

// web socket clients
var clients = [];

// server startup
var server = http.createServer(function(request, response) {
	console.log("Incoming request: " + request.url + "\n");
	
	// handle according to request method
	switch (request.method) {
		case "GET":
			// parse url
			var restUrl = new urlparser.UrlParser(request, {}, config.defaultResponseFormat);
			
			// return according to format
			switch (restUrl.format) {
				case "html":
					var pageView = new pv.PageView();
					pageView.getHtml(response, restUrl, {});
					
					break;
					
				case "js":
				case "css":
					staticFiles.handle(response, restUrl);
					break;
					
				default:
					response.writeHead(200, {'Content-Type': 'text/plain'} );
					response.end("Hello dear friend! Nice of you to drop by.");
					
					break;
			}
		
			break;
			
		case "POST":
		case "PUT":
		case "DELETE":
		default:
			
			break;
	}
});

server.listen(_port, _server, function() {
	console.log((new Date()) + " Server is listening on port " + _port);
});
	
console.log(_title);
console.log("Version: " + _version);
console.log("(C) " + _author);
console.log("Server running at http://" + _server + ":" + _port + "/\n");

// web socket setup
var wsServer = new webSocketServer({
	httpServer: server
});

wsServer.on('request', function(request) {
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
	
	// accept origin
	var connection = request.accept(null, request.origin);
	
	// keep track of client index to remove them on 'close' event
	var index = clients.push(connection) - 1;
	
	console.log((new Date()) + ' Connection accepted.');
	
	// send welcome message
	connection.sendUTF(JSON.stringify( { message: "Hello!!!" } ));
	
	// user sent a message
	connection.on('message', function(message) {
		// we accept only text
		if (message.type === 'utf8') {
			console.log((new Date()) + ' Received Message: ' + message.utf8Data);
		}
	});
	
	// on close event
	connection.on('close', function(connection) {
		console.log((new Date()) + " " + connection.remoteAddress + " disconnected.");
		
		// remove from client array
		clients.splice(index, 1);
	});
});