var MainController = function() {
	// node modules
	var http = require('http');
	var webSocketServer = require('websocket').server;
	var fs = require('fs');

	// url parser
	var urlparser = require('../helper/urlparser');

	// page view
	var pv = require('../view/page_view');
	
	// routes controller
	var routesController = require('./routes_controller');

	// static files controllers
	var staticFilesController = require('./static_files_controller');
	
	// models
	var userModel = require('../model/User');
	var messageModel = require('../model/Message');

	// read config file
	var config = require('../config');

	var _title = config.title;
	var _author = config.author;
	var _version = config.version;
	var _port = config.port;
	var _server = config.server;

	// web socket clients
	var clients = [];
	
	// user "server"
	var serverUser = new userModel.User();
	serverUser.id = 1;
	serverUser.name = "Server";
	serverUser.mail = "server@webrtc.com";

	// server startup
	var server = http.createServer(function(request, response) {
		console.log("Incoming request: " + request.url + "\n");
		
		// handle according to request method
		switch (request.method) {
			case "GET":
				// check url for redirection
				request.url = routesController.checkForUrlRedirection(request);
			
				// parse url
				var restUrl = new urlparser.UrlParser(request, {}, config.defaultResponseFormat);
				
				// get controller type from routes controller
				var controller = routesController.getController(restUrl);
				
				switch (controller) {
					case "static": 
						staticFilesController.handle(response, restUrl);
						break;
						
					default:
						console.log("No appropriate controller for this request:", restUrl);
						
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
		var welcomeMessage = new messageModel.Message();
		
		welcomeMessage.content = "Hello!!!";
		welcomeMessage.sender = serverUser;
		welcomeMessage.type = welcomeMessage.type.SERVER;
		
		connection.sendUTF(JSON.stringify(welcomeMessage));
		
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
}

module.exports.startup = new MainController();