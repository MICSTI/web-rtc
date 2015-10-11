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
	var sendMessage = $("#send-message");
	
	// set ofcus to username field
	username.focus();
	
	// current user
	var user = new User();
	
	// server "user"
	var server = new User();
	server.id = 1;
	server.name = "Server";
	
	// WebSocker connection
	var connection = null;
	
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
		
		if (connection === null) {
			// open connection
			openWebSocketConnection();
		} else {
			// update user info
			updateUserInfo();
		}
		
		// submit button
		// TODO: implement when WebRTC is here
		/*send.on("click", function() {
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
		});*/
	});
	
	/**
		Opens a web socket connection to th	e management server.
	*/
	var openWebSocketConnection = function() {
		// open connection
		connection = new WebSocket('ws://' + appConfig.server + ':' + appConfig.port);

		connection.onopen = function() {
		   console.log("WebSocket connection opened");
		   
		   updateUserInfo();
		   
		   // show video and chat elements
		   afterLogin.show();
		};

		connection.onerror = function(error) {
			addServerConnectionError();
			
			clearCommunicationSections();
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
	}
	
	/**
		Sends an updated user info message to the management server
	*/
	var updateUserInfo = function() {
		if (connection === null)
			return;
		
		// send user info message
	   var message = new Message();
	   
	   message.topic = message.topics.USER_INFO;
	   message.sender = user;
	   message.recipient = server;
	   message.content = user;
	   message.type = message.types.SERVER;
	   
	   connection.send(JSON.stringify(message));
	}
	
	/**
		Sends a request to get a new user color to the management server
	*/
	var requestNewColor = function() {
		if (connection === null)
			return;
		
		// send message
	   var message = new Message();
	   
	   message.topic = message.topics.CHANGE_USER_COLOR;
	   message.sender = user;
	   message.recipient = server;
	   message.type = message.types.SERVER;
	   
	   connection.send(JSON.stringify(message));
	}
	
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
		errorMessage.status = errorMessage.statuses.ERROR;
		errorMessage.content = "Connection lost";
		
		// append message to chat
		chat.append(getMessageHtml(errorMessage));
	}
	
	/**
		Disables the communication sections on the web page.
		Includes available users, chat.
	*/
	var clearCommunicationSections = function() {
		availableUsers.empty();
		sendMessage.empty();
	}
	
	/**
		Updates the available users.
	*/
	var updateAvailableUsers = function(users) {
		// empty div
		availableUsers.empty();
		
		// temp variables to determine which user is "us"
		var tempUsers = [];
		var myself = null;
		
		// display all users
		users.forEach(function(item, idx, array) {
			// check if user is "us"
			var us = user.id === item.id;
			
			if (us) {
				myself = item;
			} else {
				tempUsers.push(item);
			}
		});
		
		// display ourselves first
		availableUsers.append(getUserHtml(myself, true));
		
		// add other users
		tempUsers.forEach(function(item, idx, array) {
			availableUsers.append(getUserHtml(item, false));
		});
		
		// attach double click handler for color span (and delete attached handlers first)
		$("span.user-avatar").off("dblclick");
		
		$(".user-myself .user-avatar").on("dblclick", function() {
			requestNewColor();
		});
	}
	
	/**
		Returns the HTML content for a message.
	*/
	var getMessageHtml = function(message) {
		var html = "";
		
		if (message.status !== undefined)
			var msgClass = "message-" + message.status;
		else
			var msgClass = "";
		
		switch (message.type) {
			case message.types.SERVER:
				html += "<div class='message message-server " + msgClass + "'>";
					html += "<div class='message-timestamp'>" + message.timestamp + "</div>";
					html += "<div class='message-content'>" + message.content + "</div>";
				html += "</div>";
				
				break;
				
			case message.types.P2P:
			default:			
				html += "<div class='message " + msgClass + "'>";
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
		
		// "Call" span is only displayed for user that are not ourselves
		var callSpan = myself ? "" : "<span class='user-call right'>Call</span>";
		
		html += "<div class='" + userClass + "'>";
			html += callSpan;
			html += "<span class='user-avatar' style='background-color: " + user.color + ";'></span>";
			html += "<span class='user-name'>" + userName + "</span>";
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
	
	// getUserMedia init
	var userMedia = new UserMedia();
	
	userMedia.constraints = {
		audio: false, video: true
	};
	
	userMedia.video = document.getElementById("local-video");
	
	userMedia.onSuccess = function(stream) {
		if (window.URL) {
			userMedia.video.src = window.URL.createObjectURL(stream);
		} else {
			userMedia.video.src = stream;
		}
		
		userMedia.video.play();
	};
	
	userMedia.onError = function(error) {
		console.log("navigator.getUserMedia error: ", error);
	}
	
	userMedia.init();
});