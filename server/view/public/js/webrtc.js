$(document).ready(function() {
	// references to input elements
	var chat = $("#chat");
	var input = $("#chat-message");
	var username = $("#username");
	var mail = $("#mail");
	var send = $("#send");
	var setUserInfo = $("#set-user-info");
	var afterLogin = $("#after-login");
	
	// set ofcus to username field
	username.focus();
	
	// current user
	var user = new User();
	
	// server "user"
	var server = new User();
	server.id = 1;
	server.name = "Server";
	
	// if user is running mozilla then use it's built-in WebSocket
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
		   
		   message.sender = user;
		   message.recipient = server;
		   message.type = message.type.SERVER;
		   
		   connection.send(JSON.stringify(message));
		   
		   // show video and chat elements
		   afterLogin.show();
		};

		connection.onerror = function(error) {
			var errorMessage = new Message();
			
			errorMessage.content = "We are now disconnected";
			errorMessage.type = errorMessage.type.SERVER;
			
			onMessageReceived(errorMessage);
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
			onMessageReceived(messageData);
		};
		
		// submit button
		send.on("click", function() {
			connection.send(input.val());
			
			input.val("");
		});
	});
	
	/**
		Handler that will be executed when a new message is received.
	*/
	var onMessageReceived = function(message) {
		// add the message to the chat
		chat.append(getMessageHtml(message));
	}
	
	/**
		Returns the HTML content for a message.
	*/
	var getMessageHtml = function(message) {
		var html = "";
		
		// TODO: find better solution
		var m = new Message();
		
		switch (message.type) {
			case m.type.SERVER:
				html += "<div class='message message-server'>";
					html += "<div class='message-timestamp'>" + message.timestamp + "</div>";
					html += "<div class='message-content'>" + message.content + "</div>";
				html += "</div>";
				
				break;
				
			case m.type.P2P:
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
	
	var castObject = function(object, type) {
		var returnObject = null;
		
		switch (type) {
			case "Message":
				returnObject = new Message();
				break;
				
			case "User":
				returnObject = new User();
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