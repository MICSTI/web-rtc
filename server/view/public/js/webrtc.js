$(document).ready(function() {
	// references to input elements
	var chat = $("#chat");
	var input = $("#chat-message");
	var username = $("#username");
	var mail = $("#mail");
	var send = $("#send");
	var setUserInfo = $("#set-user-info");
	var afterLogin = $("#after-login");
	var availableUsers = $("#available-users");
	
	// set ofcus to username field
	username.focus();
	
	// current user
	var user = new User();
	
	// server "user"
	var server = new User();
	server.id = 1;
	server.name = "Server";
	
	// if user is running mozilla then use its built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;
	
	// if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        chat.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        return;
    }
	
	// set user info
	setUserInfo.on("click", function() {
		// set user info
		user.name = username.val();
		user.mail = mail.val();
		
		// open connection
		var connection = new WebSocket('ws://127.0.0.1:1337');

		connection.onopen = function() {
		   console.log("WebSocket connection opened");
		   
		   // send user info message
		   var message = new Message();
		   
		   message.topic = message.topics.USER_INFO;
		   message.sender = user;
		   message.recipient = server;
		   message.content = user;
		   message.type = message.types.SERVER;
		   
		   connection.send(JSON.stringify(message));
		   
		   // show video and chat elements
		   afterLogin.show();
		};

		connection.onerror = function(error) {
			addServerConnectionError();
		};

		// most important part - incoming messages
		connection.onmessage = function(message) {
			// message origin
			var origin = message.origin;
			
			// parse message JSON data
			var messageData = JSON.parse(message.data);
			
			// cast it to message object
			var messageObject = castObject(messageData, "Message");
			
			// call onmessage handler
			onMessageReceived(messageObject);
		};
		
		// submit button
		send.on("click", function() {
			// build message
			var message = new Message();
			message.sender = user;
			message.recipient = server;
			message.type = message.types.P2P;
			message.content = input.val();
			
			// send stringified message
			connection.send(JSON.stringify(message));
			
			// append message to chat
			chat.append(getMessageHtml(message));
			
			// clear input for future messages
			input.val("");
		});
	});
	
	/**
		Handler that will be executed when a new message is received.
	*/
	var onMessageReceived = function(message) {
		// handle message according to message type
		switch (message.type) {
			case message.types.SERVER:
				// handle internal server message
				handleServerMessage(message);
				
				break;
				
			case message.types.P2P:
				// add the message to the chat
				chat.append(getMessageHtml(message));
				
				break;
				
			default:
			
				break;
		}
	}
	
	/**
		Handles incoming messages from the management server.
	*/
	var handleServerMessage = function(message) {
		// handle according to message topic
		switch (message.topic) {
			// user id assigned by server (= also the client identifier)
			case message.topics.USER_ID:
				// assign user id
				user.id = message.content;
				
				break;
				
			// user broadcast
			case message.topics.USER_BROADCAST:
				updateAvailableUsers(message.content);
			
				break;
				
			default:
				break;
		}
	}
	
	/**
		Adds a server message to the chat showing that the server connection has been successfully established.
	*/
	var addServerConnectionSuccessful = function() {
		var successMessage = new Message();
		successMessage.type = successMessage.types.SERVER;
		successMessage.status = successMessage.statuses.SUCCESS;
		successMessage.content = "Connection established";
		
		// append message to chat
		chat.append(getMessageHtml(successMessage));
	}
	
	/**
		Adds a server message to the chat showing that there was an error with the server connection
	*/
	var addServerConnectionError = function() {
		var errorMessage = new Message();
		errorMessage.type = errorMessage.types.SERVER;
		errorMessage.status = errorMessage.statuses.SUCCESS;
		errorMessage.content = "Connection lost";
		
		// append message to chat
		chat.append(getMessageHtml(errorMessage));
	}
	
	/**
		Updates the available users.
	*/
	var updateAvailableUsers = function(users) {
		// empty div
		availableUsers.empty();
		
		// display all users
		users.forEach(function(item, idx, array) {
			// check if user is actually "us"
			var us = user.id === item.id;
			
			availableUsers.append(getUserHtml(item, us));
		});
	}
	
	/**
		Returns the HTML content for a message.
	*/
	var getMessageHtml = function(message) {
		var html = "";
		
		switch (message.type) {
			case message.types.SERVER:
				html += "<div class='message message-server'>";
					html += "<div class='message-timestamp'>" + message.timestamp + "</div>";
					html += "<div class='message-content'>" + message.content + "</div>";
				html += "</div>";
				
				break;
				
			case message.types.P2P:
			default:			
				html += "<div class='message'>";
					html += "<div class='message-timestamp'>" + message.timestamp + "</div>";
					html += "<div class='message-sender'>" + message.sender.name + "</div>";
					html += "<div class='message-content'>" + message.content + "</div>";
				html += "</div>";
				
				break;
		}
		
		return html;
	}
	
	/**
		Returns the HTML content for a user.
		If the myself flag is set to true, "You" is displayed instead of the name and no "Call" button will be displayed.
	*/
	var getUserHtml = function(user, myself) {
		var html = "";
		
		var userClass = myself ? "user user-myself" : "user";
		var userName = myself ? "You" : user.name;
		
		html += "<div class='" + userClass + "' style='background-color: " + user.color + ";'>";
			html += "<div class='user-name'>" + userName + "</div>";
		html += "</div>";
		
		return html;
	}
	
	/**
		Casts a generic JS object to the specified object type.
	*/
	var castObject = function(object, type) {
		var returnObject = null;
		
		switch (type) {
			case "Message":
				returnObject = new Message();
				break;
				
			case "User":
				returnObject = new User();
				break;
				
			case "Client":
				returnObject = new Client();
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
});