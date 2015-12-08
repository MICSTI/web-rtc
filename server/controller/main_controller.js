var MainController = function() {
	// node modules
	var https = require('https');
	var webSocketServer = require('websocket').server;
	var fs = require('fs');
	
	// read ssl credentials
	var privateKey = fs.readFileSync('sslcert/key.pem', 'utf8');
	var certificate = fs.readFileSync('sslcert/cert.pem', 'utf8');
	
	var credentials = {
		key: privateKey,
		cert: certificate
	};
	
	// read config file
	var config = require('../config');
	
	// logger
	var logger = require('../helper/logger');
	logger.enabled = config.logging;

	// url parser
	var urlparser = require('../helper/urlparser');

	// page view
	var pv = require('../view/page_view');
	
	// routes controller
	var routesController = require('./routes_controller');

	// static files controllers
	var staticFilesController = require('./static_files_controller');
	
	// util
	var util = require('../view/public/js/Util');
	
	// models
	var userModel = require('../model/User');
	var messageModel = require('../model/Message');
	var clientModel = require('../model/Client');

	var _title = config.application.title;
	var _author = config.application.author;
	var _version = config.application.version;
	var _port = config.server.port;
	var _ip = config.server.ip;

	// web socket clients
	var clients = [];
	
	// user "server"
	var serverUser = new userModel.User();
	serverUser.id = 1;
	serverUser.name = "Server";
	serverUser.mail = "server@webrtc.com";
	
	// color array (to assign to users)
	var colors = ["cadetblue", "coral", "cornflowerblue", "crimson", "darkgoldenrod", "darkkhaki", "darkseagreen", "dodgerblue", "firebrick", "forestgreen", "gold", "indianred", "lightcyan", "lightsteelblue", "limegreen", "moccasin", "olivedrab", "orange", "orangered", "rosybrown", "saddlebrown", "salmon", "whitesmoke"];

	// server startup
	var server = https.createServer(credentials, function(request, response) {
		logger.log(logger.SERVER, "Incoming request: " + request.url);
		
		// handle according to request method
		switch (request.method) {
			case "GET":
				// check url for redirection
				request.url = routesController.checkForUrlRedirection(request);
			
				// parse url
				var restUrl = new urlparser.UrlParser(request, {}, config.server.defaultResponseFormat);
				
				// get controller type from routes controller
				var controller = routesController.getController(restUrl);
				
				switch (controller) {
					case "static": 
						staticFilesController.handle(response, restUrl);
						break;
						
					case "media":
						logger.log(logger.SERVER, "Serving media stream");
						
						break;
						
					default:
						logger.log("No appropriate controller for this request:", restUrl);
						
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

	server.listen(_port, _ip, function() {
		logger.log(logger.WS, "Server is listening on port " + _port);
		logger.blank();
	});

	// init log statements
	logger.blank();
	
	logger.log(logger.INFO, _title);
	logger.log(logger.INFO, "Version: " + _version);
	logger.log(logger.INFO, "(C) " + _author);
	logger.blank();
	
	logger.log(logger.SERVER, "Server running at https://" + _ip + ":" + _port);
	logger.blank();

	// web socket setup
	var wsServer = new webSocketServer({
		httpServer: server
	});

	wsServer.on('request', function(request) {
		logger.blank();
		logger.log(logger.WS, "Connection from origin " + request.origin + ".");
		
		// accept origin
		var connection = request.accept(null, request.origin);
		
		// assign client a unique id
		var unique = false;
		
		while (!unique) {
			var clientId = util.generateId();
			
			unique = clients.indexOf(clientId) < 0;
		}
		
		// build client object
		var client = new clientModel.Client();
		client.id = clientId;
		client.webSocketConnection = connection;
		
		client.user = new userModel.User();
		client.user.id = clientId;
		
		// add client object to clients array
		clients[clientId] = client;
		
		logger.log(logger.WS, "Connection accepted, assigned id " + clientId);
		
		// send welcome message
		var welcomeMessage = new messageModel.Message();
		
		welcomeMessage.topic = welcomeMessage.topics.USER_ID;
		welcomeMessage.content = clientId;
		welcomeMessage.sender = serverUser;
		welcomeMessage.type = welcomeMessage.types.SERVER;
		
		connection.sendUTF(JSON.stringify(welcomeMessage));
		
		// user sent a message
		connection.on('message', function(message) {
			// we accept only text
			if (message.type === 'utf8') {
				// parse message JSON data
				var messageData = JSON.parse(message.utf8Data);
				
				// cast it to message object
				var messageObject = castObject(messageData, "Message");
				
				// call onmessage handler
				onMessageReceived(clientId, messageObject);
			}
		});
		
		// on close event
		connection.on('close', function(connection) {
			logger.log(logger.WS, clients[clientId].user.name + " disconnected.");
			
			// remove client from clients array
			delete clients[clientId];
			
			// broadcast user info to all connected clients
			broadcastUserInfo();
		});
	});
	
	/**
		Handler that will be executed when a new message is received.
	*/
	var onMessageReceived = function(clientId, message) {
		// handle message according to message type
		switch (message.type) {
			case message.types.SERVER:
				// we only handle messages to the server
				handleServerMessage(clientId, message);
				
				break;
				
			case message.types.RELAY:
				// relay message to appropriate client
				clients[message.recipient.id].webSocketConnection.sendUTF(JSON.stringify(message));
				
				break;
				
			default:
			
				break;
		}
	}
	
	/**
		Handles incoming messages to the management server.
	*/
	var handleServerMessage = function(clientId, message) {
		logger.log(logger.WS, "New message", message);
		
		if (clients[clientId].user.id !== clientId) {
			// Something is wrong! An error maybe, or an attempt to break in?
			return;
		}
		
		switch (message.topic) {
			case message.topics.USER_INFO:
				var userObject = castObject(message.content, "User");
				
				if (clients[clientId].user.color === null) {
					// assign a random color
					userObject.color = getRandomItem(colors);
					clients[clientId].user.color = userObject.color;
				}
				
				// set user info
				clients[clientId].user.name = userObject.name;
				clients[clientId].user.mail = userObject.mail;
				clients[clientId].user.gotUserMedia = userObject.gotUserMedia;
				
				// send back an info about all available users
				broadcastUserInfo();
				
				break;
				
			case message.topics.CHANGE_USER_COLOR:
				var requestedColor = message.content;
				
				// if no color was requested, a random color is assigned
				if (requestedColor === null) {
					requestedColor = getRandomItem(colors);
				}
				
				clients[clientId].user.color = requestedColor;
				
				// send back an info about all available users
				broadcastUserInfo();
				
				break;
				
			default:
				break;
		}
	}
	
	/**
		Broadcasts info about all users to all clients
	*/
	var broadcastUserInfo = function() {
		var messageContent = [];
		
		for (var idx in clients) {
			messageContent.push(clients[idx].user);
		}
		
		for (var idx in clients) {
			var broadcastMessage = new messageModel.Message();
			
			broadcastMessage.topic = broadcastMessage.topics.USER_BROADCAST;
			broadcastMessage.sender = serverUser;
			broadcastMessage.recipient = clients[idx].user;
			broadcastMessage.type = broadcastMessage.types.SERVER;
			broadcastMessage.content = messageContent;
			
			clients[idx].webSocketConnection.sendUTF(JSON.stringify(broadcastMessage));
		}
	}
	
	/**
		Outputs all currently connected clients to the console.
	*/
	var logClients = function() {
		logger.log(logger.WS, "Currently connected clients", clients);
	}
	
	/**
		Returns a random element from an array.
	*/
	var getRandomItem = function(_array) {
		return _array[Math.floor(Math.random() * _array.length)];
	}
	
	/**
		Casts a generic JS object to the specified object type.
	*/
	var castObject = function(object, type) {
		var returnObject = null;
		
		switch (type) {
			case "Message":
				returnObject = new messageModel.Message();
				break;
				
			case "User":
				returnObject = new userModel.User();
				break;
				
			case "Client":
				returnObject = new clientModel.Client();
				break;
				
			default:
				break;
		}
		
		if (returnObject !== null) {
			for (var property in object) {
				if (object.hasOwnProperty(property)) {
					returnObject[property] = object[property];
				}
			}
		}
		
		return returnObject;
	}
}

module.exports.startup = new MainController();