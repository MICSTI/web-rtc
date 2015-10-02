$(document).ready(function() {
	// references to input elements
	var chat = $("#chat");
	var input = $("#message");
	var username = $("#username");
	var mail = $("#mail");
	var send = $("#send");
	var setUserInfo = $("#set-user-info");
	
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
		// open connection
		var connection = new WebSocket('ws://127.0.0.1:1337');

		connection.onopen = function() {
		   console.log("WebSocket connection opened");
		   
		   // send user info
		   connection.send(JSON.stringify(getUserInfo()));
		};

		connection.onerror = function(error) {
			// just in there were some problems with connection...
			chat.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
										+ 'connection or the server is down.' } ));
		};

		// most important part - incoming messages
		connection.onmessage = function(message) {
			// message origin
			var origin = message.origin;
			
			// parse message JSON data
			var data = JSON.parse(message.data);
			
			// call onmessage handler
			onMessageReceived(getMessageObject(data));
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
		chat.append(getMessageHtml(message));
	}
	
	var getMessageObject = function(messageJson) {
		var messageObject = {};
		
		// timestamp
		messageObject.timestamp = new Date();
		
		// sender
		// TODO: remove fake data
		messageObject.sender = {
			id: 0,
			name: "Server"
		};
		
		// content
		messageObject.content = messageJson.message;
		
		return messageObject;
	}
	
	/**
		Returns the HTML content for a message.
	*/
	var getMessageHtml = function(message) {
		var html = "";
		
		html += "<div class='message'>";
			html += "<div class='message-timestamp'>" + message.timestamp + "</div>";
			html += "<div class='message-sender'>" + message.sender.name + "</div>";
			html += "<div class='message-content'>" + message.content + "</div>";
		html += "</div>";
		
		return html;
	}
	
	/**
		Returns a object containing the info provided by the user.
		E.g. { "name": "ABC", "mail": "abc@example.com" }
	*/
	var getUserInfo = function() {
		return {
			name: username.val(),
			mail: mail.val()
		}
	}
});