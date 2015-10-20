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
	
	// logger
	var logger = new Logger();
	logger.enabled = appConfig.logging;
	
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
		connection = new WebSocket('ws://' + appConfig.server.ip + ':' + appConfig.server.port);

		connection.onopen = function() {
		   logger.log(logger.WS, "WebSocket connection opened");
		   
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
				
			case message.types.RELAY:
				// handle relay message
				handleRelayMessage(message);
				
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
	};
	
	/**
		Handles incoming messages from another client, relayed via the management server.
		This includes ICE candidate messages as well as session description offers and answers.
	*/
	var handleRelayMessage = function(message) {
		// handle according to message topic
		switch (message.topic) {
			// ICE candidate
			case message.topics.ICE_CANDIDATE:
				var candidate = new RTCIceCandidate( {
					sdpMLineIndex: message.content.label,
					candidate: message.content.candidate
				} );
				
				webrtc.peerConnection.addIceCandidate(candidate);
			
				break;
				
			// session description offer
			case message.topics.SESSION_DESCRIPTION_OFFER:
				if (!webrtc.isInitiator && !webrtc.callStarted) {
					webrtc.checkAndStart();
				}
				
				// set collocutor id
				webrtc.collocutorId = message.sender.id;
			
				webrtc.peerConnection.setRemoteDescription(new RTCSessionDescription(message.content));
				
				webrtc.doAnswer();
				
				break;
				
			// session description answer
			case message.topics.SESSION_DESCRIPTION_ANSWER:
				if (webrtc.callStarted) {
					webrtc.peerConnection.setRemoteDescription(new RTCSessionDescription(message.content));
				} else {
					logger.log(logger.WEBRTC, "got ANSWER, but call not started");
				}
				
				break;
				
			default:
				break;
		}
	};
	
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
				
				// add our own color to the user info object
				user.color = item.color;
			} else {
				tempUsers.push(item);
			}
		});
		
		// display ourselves first (with myself flag = true, callable = false)
		availableUsers.append(getUserHtml(myself, true, false));
		
		// add other users (with myself flag = false, callable if possible)
		tempUsers.forEach(function(item, idx, array) {
			// determine if user can be called
			var callable = user.gotUserMedia && item.gotUserMedia;
			
			availableUsers.append(getUserHtml(item, false, callable));
		});
		
		// attach click handler for color span (and delete attached handlers first)
		$("span.user-avatar").off("click");
		
		$(".user-myself .user-avatar").on("click", function() {
			requestNewColor();
		});
		
		// attach call function
		$(".user-call").off("click");
	
		$(".user-call").on("click", function() {
			// we use a closure so we can pass the id of the user that we initiate the call to
			return webrtc.initiateCall($(this).attr("data-user-id"));
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
		If the myself flag is set to true, "You" is displayed instead of the name
		If the callable flag is set to true, "Call" is displayed on hover
	*/
	var getUserHtml = function(_user, myself, callable) {
		var html = "";
		
		var userClass = myself ? "user user-myself" : "user";
		var userName = myself ? "You" : _user.name;
		
		// "Call" span is only displayed for users that can be called (i.e. have accepted navigator.getUserMedia)
		if (callable)
			var callSpan = "<span class='user-call right' data-user-id='" + _user.id + "'>Call</span>";
		else
			var callSpan = "";
		
		html += "<div class='" + userClass + "'>";
			html += callSpan;
			html += "<span class='user-avatar' style='background-color: " + _user.color + ";'></span>";
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
	
	// WebRTC setup
	var webrtc = new WebRTCController(logger);
	
	// references to local and remote video DOM elements
	webrtc.localVideo = document.getElementById(appConfig.frontend.localVideo);
	webrtc.remoteVideo = document.getElementById(appConfig.frontend.remoteVideo);
	
	// RTCPeerConnection configuration
	// webrtcDetectedBrowser is provided by adapter.js
	webrtc.peerConnectionConfig = appConfig.peerConnection.configuration[webrtcDetectedBrowser] || null;
	webrtc.peerConnectionConstraints = appConfig.peerConnection.constraints;
	
	// only necessary if we used STUN and turn servers
	webrtc.sdpConstraints = {};
		
	// init getUserMedia
	webrtc.userMedia.init({
		constraints: {
			audio: false,
			video: true
		},
		onSuccess: function(stream) {
			// set user media granted flag
			webrtc.userMedia.userMediaGranted = true;
			
			// set stream as local stream
			webrtc.localStream = stream;
			
			// attachMediaStream is a function of adapter.js
			attachMediaStream(webrtc.localVideo, stream);
			
			// update user info
			user.gotUserMedia = true;
			
			if (connection !== null)
				updateUserInfo();
		},
		onError: function(error) {
			// set user media granted flag
			webrtc.userMedia.userMediaGranted = false;
			
			logger.error("navigator.getUserMedia error", error);
		}
	});
	
	// add handlers for WebRTC controller
	webrtc.setHandlers({
		// incoming data channel message
		handleDataChannelMessage: function(event) {
			trace("Received message: " + event.data);
		},
		
		// ICE candidates
		handleIceCandidate: function(event) {
			logger.log(logger.WEBRTC, "handleIceCandidate event:", event);
			
			if (event.candidate) {
				var candidateMessage = new Message();
				
				candidateMessage.type = candidateMessage.types.RELAY;
				candidateMessage.topic = candidateMessage.topics.ICE_CANDIDATE;
				candidateMessage.sender = user;
				
				candidateMessage.recipient = new User();
				candidateMessage.recipient.id = webrtc.collocutorId;
				
				candidateMessage.content = {
					label: event.candidate.sdpMLineIndex,
					id: event.candidate.sdpMid,
					candidate: event.candidate.candidate
				};
				
				logger.log(logger.WEBRTC, "Sending ice candidate message", candidateMessage);
				
				connection.send(JSON.stringify(candidateMessage));
			} else {
				logger.log(logger.WEBRTC, "End of candidates");
			}
		},
		
		// signaling error
		onSignalingError: function(error) {
			logger.error("Failed to create signaling message", error);
		},
		
		// createOffer success
		setLocalAndSendMessageOffer: function(sessionDescription) {
			webrtc.peerConnection.setLocalDescription(sessionDescription);
			
			var sessionDescriptionMessage = new Message();
			sessionDescriptionMessage.type = sessionDescriptionMessage.types.RELAY;
			sessionDescriptionMessage.topic = sessionDescriptionMessage.topics.SESSION_DESCRIPTION_OFFER;
			sessionDescriptionMessage.sender = user;
			
			sessionDescriptionMessage.recipient = new User();
			sessionDescriptionMessage.recipient.id = webrtc.collocutorId;
			
			sessionDescriptionMessage.content = sessionDescription;
			
			logger.log(logger.WEBRTC, "Sending session description offer", sessionDescriptionMessage);
			
			connection.send(JSON.stringify(sessionDescriptionMessage));
		},
		
		// createAnswer success
		setLocalAndSendMessageAnswer: function(sessionDescription) {
			webrtc.peerConnection.setLocalDescription(sessionDescription);
			
			var sessionDescriptionMessage = new Message();
			sessionDescriptionMessage.type = sessionDescriptionMessage.types.RELAY;
			sessionDescriptionMessage.topic = sessionDescriptionMessage.topics.SESSION_DESCRIPTION_ANSWER;
			sessionDescriptionMessage.sender = user;
			
			sessionDescriptionMessage.recipient = new User();
			sessionDescriptionMessage.recipient.id = webrtc.collocutorId;
			
			sessionDescriptionMessage.content = sessionDescription;
			
			logger.log(logger.WEBRTC, "Sending session description answer", sessionDescriptionMessage);
			
			connection.send(JSON.stringify(sessionDescriptionMessage));
		}
	});
});