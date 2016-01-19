$(document).ready(function() {
	// references to input elements
	var chat = $("#chat");
	var input = $("#chat-message");
	var username = $("#username");
	var send = $("#send");
	var setUserInfo = $("#set-user-info");
	var loginContainer = $("#login-container");
	var chatContainer = $("#chat-container");
	var controlContainer = $("#control-container");
	var intro = $("#webrtc-intro");
	var afterLogin = $("#after-login");
	var availableUsers = $("#available-users");
	var sendMessage = $("#send-message");
	
	var controlSupportOptions = $("#control-support-options");
	
	// video elements
	var localVideo = $("#" + appConfig.frontend.localVideo);
	var remoteVideo = $("#" + appConfig.frontend.remoteVideo);
	
	// canvas setup
	var localCanvas = $("#" + appConfig.frontend.localCanvas);
	var remoteCanvas = $("#" + appConfig.frontend.remoteCanvas);
	
	var localCanvasDrawing = $("#" + appConfig.frontend.localDrawingCanvas);
	var remoteCanvasDrawing = $("#" + appConfig.frontend.remoteDrawingCanvas);
	
	// logger
	var logger = new Logger();
	logger.enabled = appConfig.logging;
	
	// set focus to username field
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
	
	/**
		Screen initialization.
	*/
	var initScreen = function() {
		// hide video containers
		hideLocalVideo();
		hideRemoteVideo();
		
		// init canvas drawing
		initDrawing();
		
		// init radio buttons
		initRadioButtons();
		
		// init state buttons
		initStateButtons();
	};
	
	/**
		Sends the user info over the web socket connection.
		If no web socket connection is open, the function tries to open one.
	*/
	var sendUserInfo = function() {
		// set user info
		user.name = username.val();
		
		if (connection === null) {
			// open connection
			openWebSocketConnection();
		} else {
			// update user info
			updateUserInfo();
		}
	}
	
	// set user info
	setUserInfo.on("click", sendUserInfo);
	
	// auto-login on enter in username field
	username.on("keypress", function(event) {
		if (event.which == 13) {
			event.preventDefault();
			
			sendUserInfo();
		}
	});
	
	// message is sent automatically on enter
	input.keypress(function(event) {
		if (event.which == 13) {
			event.preventDefault();
			
			// trigger click on send message button
			send.click();
		}
	});
	
	// send P2P message
	send.on("click", function() {
		// check if data channel connection exists
		if (webrtc.dataChannelAvailable()) {			
			var message = new Message();
			
			message.sender = user;
			message.recipient = webrtc.collocutorId;
			message.content = input.val();
			message.type = message.types.P2P;
			message.topic = message.topics.P2P_TEXT;
			
			sendTextMessageToPeer(message);
			
			// clear message box and assign the focus again
			input.val("").focus();
		}
	});
	
	/**
		Opens a web socket connection to th	e management server.
	*/
	var openWebSocketConnection = function() {
		// open connection
		connection = new WebSocket('wss://' + appConfig.server.ip + ':' + appConfig.server.port);

		connection.onopen = function() {
		   logger.log(logger.WS, "WebSocket connection opened");
		   
		   updateUserInfo();
		   
		   // hide login container and intro
		   loginContainer.hide();
		   intro.hide();
		   
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
	};
	
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
	};
	
	/**
		Sends a call notification to the peer.
	*/
	var callPeer = function(peerId) {
		var message = new Message();
		
		message.topic = message.topics.CALL;
		message.sender = user;
		message.type = message.types.RELAY;
		
		message.recipient = new User();
		message.recipient.id = peerId;
		
		connection.send(JSON.stringify(message));
	};
	
	/**
		Sends a text message to the connected peer.
	*/
	var sendTextMessageToPeer = function(message) {
		// send message
		webrtc.sendDataChannelMessage(JSON.stringify(message));
		
		// append it to chat
		appendChatMessage(message);
	};
	
	/**
		Sends a support message to the connected peer.
	*/
	var sendSupportMessageToPeer = function(message) {
		// send message
		webrtc.sendDataChannelMessage(JSON.stringify(message));
	};
	
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
				// handle P2P message
				handleP2PMessage(message);
				
				break;
				
			case message.types.RELAY:
				// handle relay message
				handleRelayMessage(message);
				
				break;
				
			default:
			
				break;
		}
	};
	
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
		Handles incoming messages that were sent peer-to-peer from another client.
		This includes text chat messages, support messages and system calls (like video pause).
	*/
	var handleP2PMessage = function(message) {
		// handle according to message topic
		switch (message.topic) {
			case message.topics.P2P_TEXT:
				// text message
				appendChatMessage(message);
				
				break;
				
			case message.topics.P2P_SUPPORT:
				// draw support path on local drawing canvas
				drawSupportPath(message.content);
			
				break;
				
			case message.topics.P2P_MODE:
				// set radio button value
				setRadioButtonValue("support-mode", message.content);
			
				// change support mode
				setSupportMode(message.content);
				
				break;
				
			case message.topics.P2P_BACK_OFFICE:
				// set state button value
				setStateButtonValue("control-back-office", message.content);
				
				// set back office mode
				setBackOffice(message.content);
				
				break;
				
			case message.topics.P2P_CLEAR_CANVAS:
				// clear drawing canvas
				clearDrawingCanvas();
			
				break;
				
			case message.topics.P2P_DRAW_STATE:
				// set state button
				setStateButtonValue("control-draw", message.content);
				
				// set video pause
				webrtc.videoPaused = message.content;
			
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
				
			// call
			case message.topics.CALL:
				// hide call spans
				hideCallSpans();
			
				// show notification on screen
				var n = new Notification();
				n.type = n.types.ACTION;
				n.title = "Incoming call";
				n.text = "<b>" + message.sender.name + "</b> is calling";
				n.fillParent = false;
				n.parent = "local-canvas-video";
				n.addAction("Accept", function() { 
					// send call accept message
					var acceptMessage = new Message();
		
					acceptMessage.topic = acceptMessage.topics.CALL_ACCEPT;
					acceptMessage.sender = user;
					acceptMessage.type = acceptMessage.types.RELAY;
					acceptMessage.recipient = message.sender;
					
					connection.send(JSON.stringify(acceptMessage));
					
					// clear notification
					n.clear();
				});
				n.addAction("Decline", function() {
					// send call decline message
					var declineMessage = new Message();
		
					declineMessage.topic = declineMessage.topics.CALL_DECLINE;
					declineMessage.sender = user;
					declineMessage.type = declineMessage.types.RELAY;
					declineMessage.recipient = message.sender;
					
					connection.send(JSON.stringify(declineMessage));
					
					// clear notification
					n.clear();
					
					// show decilned notification
					var declined = new Notification();
					
					declined.type = declined.types.INFO;
					declined.text = "Call declined";
					declined.parent = "local-canvas-video";
					declined.notify();
					
					// show call spans
					showCallSpans();
				});
				n.notify();
			
				break;
				
			// accept call
			case message.topics.CALL_ACCEPT:
				// clear notifications
				Notification.clearAll();
			
				// now we can initiate the call
				webrtc.initiateCall(message.sender.id);
				
				break;
				
			// decline call
			case message.topics.CALL_DECLINE:
				// clear previous notifications
				Notification.clearAll();
			
				// show call declined notification
				var declined = new Notification();
				declined.type = declined.types.INFO;
				declined.text = "<b>" + message.sender.name + "</b> declined your call";
				declined.parent = "local-canvas-video";
				declined.notify();
				
				// show call spans
				showCallSpans();
			
				break;
				
			// call withdrawn
			case message.topics.CALL_WITHDRAWN:
				// clear all notifications from the screen
				Notification.clearAll();
				
				// show call spans
				showCallSpans();
				
				break;
				
			// bye message
			case message.topics.BYE:
				webrtc.handleRemoteHangup();
				
				// video display
				hideRemoteVideo();
				showLocalVideo();
				
				showCallEndedNotification();
				
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
	};
	
	/**
		Clears the canvas from all drawed lines.
	*/
	var clearCanvas = function(canvasId) {
		var canvas = document.getElementById(canvasId);
		var ctx = canvas.getContext('2d');
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	};
	
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
		$(".user-myself .user-avatar").off("click");
		
		$(".user-myself .user-avatar").on("click", function() {
			// request new color is only possible if user is currently not connected
			if (!webrtc.isConnected())
				requestNewColor();
		});
		
		// attach hangup function
		$(".user-hangup").off("click");
		
		$(".user-hangup").on("click", function() {
			webrtc.hangup();
			
			// video display
			hideRemoteVideo();
			showLocalVideo();
			
			showCallEndedNotification();
		});
		
		// attach call function
		$(".user-call").off("click");
	
		$(".user-call").on("click", function() {
			// info of called user
			var calledId = $(this).attr("data-user-id");
			var calledName = $(this).attr("data-user-name");
			
			// hide call spans
			hideCallSpans();
			
			// call peer
			callPeer(calledId);
			
			// show calling notification
			var calling = new Notification();
			calling.type = calling.types.ACTION;
			calling.text = "Calling <b>" + calledName + "</b>...";
			calling.parent = "local-canvas-video";
			calling.addAction("Hangup", function() {
				// send call withdrawn message
				var withdrawnMessage = new Message();
				withdrawnMessage.sender = user;
				withdrawnMessage.topic = withdrawnMessage.topics.CALL_WITHDRAWN;
				withdrawnMessage.type = withdrawnMessage.types.RELAY;
				
				withdrawnMessage.recipient = new User();
				withdrawnMessage.recipient.id = calledId;
				
				connection.send(JSON.stringify(withdrawnMessage));
				
				// clear calling notification
				calling.clear();
				
				// show call spans
				showCallSpans();
			});
			calling.notify();
		});
	}
	
	/**
		Displays a call ended notification.
	*/
	var showCallEndedNotification = function() {
		// show call ended notification
		var ended = new Notification();
		ended.type = ended.types.INFO;
		ended.text = "Call ended";
		ended.parent = "local-canvas-video";
		ended.notify();
	}
	
	/**
		Returns the HTML content for a message.
	*/
	var getMessageHtml = function(message) {
		var html = "";
		
		if (message.status !== undefined)
			var msgStatusClass = "message-" + message.status;
		else
			var msgStatusClass = "";
		
		switch (message.type) {
			case message.types.SERVER:
				html += "<div class='message message-server " + msgClass + "'>";
					html += "<div class='message-timestamp'>" + message.timestamp + "</div>";
					html += "<div class='message-content'>" + message.content + "</div>";
				html += "</div>";
				
				break;
				
			case message.types.P2P:
				var sender = message.sender == user ? "You" : message.sender.name;
				var msgMyselfClass = message.sender == user ? "message-myself" : "";
			
				html += "<div class='message " + msgStatusClass + " " + msgMyselfClass + "'>";
					html += "<div class='message-timestamp'>" + message.timestamp + "</div>";
					html += "<div class='message-sender'>" + sender + "</div>";
					html += "<div class='message-content'>" + message.content + "</div>";
				html += "</div>";
			
			default:			
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
		
		// Hangup span
		var hangupSpan = myself ? "<span class='user-hangup right'>Hangup</span>" : "";
		
		// Call span is only displayed for users that can be called (i.e. have accepted navigator.getUserMedia)
		if (callable)
			var callSpan = "<span class='user-call right' data-user-id='" + _user.id + "' data-user-name='" + _user.name + "'>Call</span>";
		else
			var callSpan = "";
		
		html += "<div class='" + userClass + "'>";
			html += hangupSpan;
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
	var webrtc = new WebRTCController();
	
	// add logger reference
	webrtc.logger = logger;
	
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
		constraints: appConfig.userMedia.constraints,
		onSuccess: function(stream) {			
			// set user media granted flag
			webrtc.userMedia.userMediaGranted = true;
			
			// set stream as local stream
			webrtc.localStream = stream;
			
			// attachMediaStream is a function of adapter.js
			attachMediaStream(webrtc.localVideo, stream);
			
			// update user info
			user.gotUserMedia = true;
			
			// start video display on canvas
			videoAndCanvasSetup();
			
			// add update intervals to video canvases
			addUpdateIntervalToCanvas();
			
			// show local video
			showLocalVideo();
			
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
			logger.log(logger.WEBRTC, "Received message: " + event.data);
			
			// parse message JSON data
			var messageData = JSON.parse(event.data);
			
			// cast it to message object
			var messageObject = castObject(messageData, "Message");
			
			// if "addOwnTimestampToMessage" flag is set, set the current timestamp
			if (appConfig.misc.addOwnTimestampToMessage)
				messageObject.timestamp = Util.getDateTime();
			
			// call onmessage handler
			onMessageReceived(messageObject);
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
		},
		
		// call hangup requested
		onHangup: function() {
			// send bye message to peer (via server)
			var byeMessage = new Message();
			byeMessage.type = byeMessage.types.RELAY;
			byeMessage.topic = byeMessage.topics.BYE;
			byeMessage.sender = user;
			
			byeMessage.recipient = new User();
			byeMessage.recipient.id = webrtc.collocutorId;
			
			logger.log(logger.WEBRTC, "Sending bye message");
			
			connection.send(JSON.stringify(byeMessage));
		},
		
		// remote stream added
		onRemoteStreamAdded: function() {
			// make sure we cannot call anyone else while the call lasts - show hangup span instead
			hideCallSpans();
			showHangupSpans();
			
			// at the start we are in chat mode, so we display only the remote video
			hideLocalVideo();
			showRemoteVideo();
		},
		
		// remote stream removed
		onRemoteStreamRemoved: function() {
			hideRemoteVideo();
			
			// hide hangup span and show call spans again instead
			hideHangupSpans();
			showCallSpans();
			
			// clear canvas
			clearDrawingCanvas();
		},
		
		// peer connection created
		onPeerConnectionCreated: function() {
			// display control container
			showControlContainer();
			
			// clear chat window from previous messages
			clearChat();
			
			// display chat message textarea
			showChatTextarea();
			
			// re-position canvases
			videoAndCanvasSetup();
		},
		
		// peer connection closed
		onPeerConnectionClosed: function() {
			// hide control container
			hideControlContainer();
			
			// hide chat message textarea
			hideChatTextarea();
		}
	});
	
	/**
		Positions local and remote canvas and video elements.
	*/
	var videoAndCanvasSetup = function() {
		// set size of drawing canvasses
		localCanvasDrawing.attr("height", localCanvas.attr("height"));
		localCanvasDrawing.attr("width", localCanvas.attr("width"));
		
		remoteCanvasDrawing.attr("height", remoteCanvas.attr("height"));
		remoteCanvasDrawing.attr("width", remoteCanvas.attr("width"));
		
		// position drawing canvasses
		localCanvasDrawing.css(localCanvas.offset());
		remoteCanvasDrawing.css(remoteCanvas.offset());
	};
	
	/**
		Adds an interval to update the video canvases
	*/
	var addUpdateIntervalToCanvas = function() {
		// set local canvas
		var localCanvasSetup = setInterval(function() { return updateCanvas(appConfig.frontend.localCanvas, appConfig.frontend.localVideo); }, 24);
		
		// set remote canvas
		var remoteCanvasSetup = setInterval(function() { return updateCanvas(appConfig.frontend.remoteCanvas, appConfig.frontend.remoteVideo); }, 24);
	};
	
	/**
		Updates the canvas with the current image from the video element.
	*/
	var updateCanvas = function(canvasId, videoId) {
		// do not update if video has been paused
		if (webrtc.videoPaused) {
			return;
		}
		
		var canvas = document.getElementById(canvasId);
		var ctx = canvas.getContext('2d');
		var video = document.getElementById(videoId);
		ctx.drawImage(video, 0, 0, 373, 280);
	};
	
	/**
		Calculates the position of the mouse on the canvas.
	*/
	var getMousePos = function(canvas, event) {
		var rect = canvas.getBoundingClientRect();
		return {
		  x: event.clientX - rect.left,
		  y: event.clientY - rect.top
		};
	};
	
	/**
		Calculates the position of a touch on the canvas.
	*/
	var getTouchPos = function(canvas, event) {
		 var rect = canvasDom.getBoundingClientRect();
		 return {
			x: touchEvent.touches[0].clientX - rect.left,
			y: touchEvent.touches[0].clientY - rect.top
		 };
	};
	
	/**
		Initializes the drawing-on-canvas functionality
	*/
	var initDrawing = function() {
		var canvas = document.getElementById(appConfig.frontend.remoteDrawingCanvas);
		var ctx = canvas.getContext('2d');
		
		var width = canvas.width;
		var height = canvas.height;
		
		var prevX = 0;
		var curX = 0;
		
		var prevY = 0;
		var curY = 0;
		
		var active = false;
		
		var color = "red";
		var size = 3;
		
		// we need the mouse* events for interaction on "regular" pcs and laptops
		canvas.addEventListener("mousemove", function(event) {
			trackPath("move", event);
		}, false);
		
		canvas.addEventListener("mousedown", function(event) {
			trackPath("down", event);
		}, false);
		
		canvas.addEventListener("mouseup", function(event) {
			trackPath("end", event);
		}, false);
		
		canvas.addEventListener("mouseout", function(event) {
			trackPath("end", event);
		}, false);
		
		// we need the touch* events for interaction on handheld devices
		canvas.addEventListener("touchstart", function(event) {
			var touch = event.touches[0];
			
			var mouseEvent = new MouseEvent("mousedown", {
				clientX: touch.clientX,
				clientY: touch.clientY
			});
			
			canvas.dispatchEvent(mouseEvent);
		}, false);
		
		canvas.addEventListener("touchmove", function(event) {
			var touch = event.touches[0];
			
			var mouseEvent = new MouseEvent("mousemove", {
				clientX: touch.clientX,
				clientY: touch.clientY
			});
			
			canvas.dispatchEvent(mouseEvent);
		}, false);
		
		canvas.addEventListener("touchend", function(event) {
			var touch = event.touches[0];
			
			var mouseEvent = new MouseEvent("mouseup", {});
			
			canvas.dispatchEvent(mouseEvent);
		}, false);
		
		// additionally, we have to add listeners to prevent the body from scrolling when a canvas is being touched
		document.body.addEventListener("touchstart", function(event) {
			if (event.target == canvas) {
				e.preventDefault();
			}
		}, false);
		
		document.body.addEventListener("touchend", function(event) {
			if (event.target == canvas) {
				e.preventDefault();
			}
		}, false);
		
		document.body.addEventListener("touchmove", function(event) {
			if (event.target == canvas) {
				e.preventDefault();
			}
		}, false);
		
		// track the path on the canvas
		var trackPath = function(action, event) {			
			switch (action) {
				case "down":
					prevX = curX;
					prevY = curY;
					
					var pos = getMousePos(canvas, event); 
					curX = pos.x;
					curY = pos.y;
					
					active = true;
				
					break;
					
				case "end":
					active = false;
					
					break;
					
				case "move":
					if (active) {
						prevX = curX;
						prevY = curY;
						
						var pos = getMousePos(canvas, event); 
						curX = pos.x;
						curY = pos.y;
						
						drawPath();
					}
				
					break;
			}
		};
		
		// draw the path on the canvas
		var drawPath = function() {
			ctx.beginPath();
			ctx.moveTo(prevX, prevY);
			ctx.lineTo(curX, curY);
			ctx.strokeStyle = color;
			ctx.lineWidth = size;
			ctx.stroke();
			ctx.closePath();
			
			// check if data channel connection exists
			if (webrtc.dataChannelAvailable()) {			
				// send drawing message to peer
				var message = new Message();
				
				message.sender = user;
				message.recipient = webrtc.collocutorId;
				message.content = {
					previous: {
						x: prevX,
						y: prevY
					},
					current: {
						x: curX,
						y: curY
					},
					color: color,
					size: size
				};
				message.type = message.types.P2P;
				message.topic = message.topics.P2P_SUPPORT;
				
				sendSupportMessageToPeer(message);
			}
		};
	};
	
	/**
		Draws the support info on the canvas.
	*/
	var drawSupportPath = function(drawingInfo) {
		var canvas = document.getElementById(appConfig.frontend.localDrawingCanvas);
		var ctx = canvas.getContext('2d');
		
		ctx.beginPath();
		ctx.moveTo(drawingInfo.previous.x, drawingInfo.previous.y);
		ctx.lineTo(drawingInfo.current.x, drawingInfo.current.y);
		ctx.strokeStyle = drawingInfo.color;
		ctx.lineWidth = drawingInfo.size;
		ctx.stroke();
		ctx.closePath();
	};
	
	/**
		Shows the local video container.
	*/
	var showLocalVideo = function() {
		$("#" + appConfig.frontend.localVideoContainer).show();
	};
	
	/**
		Hides the local video container.
	*/
	var hideLocalVideo = function() {
		$("#" + appConfig.frontend.localVideoContainer).hide();
	};
	
	/**
		Shows the remote video container.
	*/
	var showRemoteVideo = function() {
		$("#" + appConfig.frontend.remoteVideoContainer).show();
	};
	
	/**
		Hides the remote video container.
	*/
	var hideRemoteVideo = function() {
		$("#" + appConfig.frontend.remoteVideoContainer).hide();
	};
	
	/**
		Shows all call spans.
	*/
	var showCallSpans = function() {
		$(".user-call").show();
	};
	
	/**
		Hides all call spans.
	*/
	var hideCallSpans = function() {
		$(".user-call").hide();
	};
	
	/**
		Shows all hangup spans.
	*/
	var showHangupSpans = function() {
		$(".user-hangup").show();
	};
	
	/**
		Hides all hangup spans.
	*/
	var hideHangupSpans = function() {
		$(".user-hangup").hide();
	};
	
	/**
		Shows the chat textarea for entering messages.
	*/
	var showChatTextarea = function() {
		sendMessage.show();
	};
	
	/**
		Hides the chat textarea for entering messages.
	*/
	var hideChatTextarea = function() {
		sendMessage.hide();
	};
	
	/**
		Shows the control container for support options.
	*/
	var showControlContainer = function() {
		controlContainer.show();
	};
	
	/**
		Hides the control container for support options.
	*/
	var hideControlContainer = function() {
		controlContainer.hide();
	};
	
	/**
		Appends a new message to the chat window.
	*/
	var appendChatMessage = function(message) {
		chat.prepend(getMessageHtml(message));
	};
	
	/**
		Removes all messages from the chat window.
	*/
	var clearChat = function() {
		$(".message").remove();
	};
	
	/**
		Inits all special state buttons on the page.
	*/
	var initStateButtons = function() {
		// string keys are the ids of the state buttons
		// value is the function to be called when the state of the button changes
		var eventHandlers = {
			"control-back-office": function(active) {
				// inform collocutor about back office setting
				sendBackOfficeMessage(!active);
			},
			"control-draw": function(active) {
				// inform collocutor about draw setting (pauses video)
				sendDrawStateMessage(active);
				
				// set pause mode (equals active flag)
				webrtc.videoPaused = active;
			},
			"control-clear": function(active) {
				// clear drawing canvas
				clearDrawingCanvas();
				
				// send clear message to peer
				sendClearCanvasMessage();
			}
		};
		
		$(".state-button").on("click", function() {
			// "state-button-not-persistent" class is for state buttons which states should not be persisted (e.g. they are "normal" click buttons
			if (!$(this).hasClass("state-button-not-persistent")) {
				// toggle active class
				$(this).toggleClass("state-button-active");
			}
			
			// call change event handler
			var active = $(this).hasClass("state-button-active");
			
			if (eventHandlers !== undefined && eventHandlers[$(this).attr("id")] !== undefined
											&& typeof eventHandlers[$(this).attr("id")] === 'function')
				eventHandlers[$(this).attr("id")](active);
		});
	};
	
	/**
		Inits all special radio buttons on the page.
	*/
	var initRadioButtons = function() {
		// top-level string key is the id of the radio button
		// value is the function to be called when a different option is selected
		var eventHandlers = {
			"support-mode": function(value) {
				// notify peer of mode change
				sendSupportModeMessage(value);
					
				// change support mode
				setSupportMode(value);
				
				// person setting support mode gets the back office functionality by default
				if (value === "support") {
					setBackOffice(true);
					
					// inform collocutor of back office setting
					sendBackOfficeMessage(false);
				}
			}
		};
		
		$(".radio-button-choice").on("click", function() {
			// check if choice was already selected
			if (!$(this).hasClass("radio-button-active")) {
				// value of choice button
				var value = $(this).attr("data-value");
				
				// get parent
				var parent = $(this).parent(".radio-button");
				
				// clear all active classes
				parent.children().removeClass("radio-button-active");
				
				// set active class on clicked element
				$(this).addClass("radio-button-active");
				
				// call radio button event handler
				if (eventHandlers !== undefined && eventHandlers[parent.attr("id")] !== undefined
												&& typeof eventHandlers[parent.attr("id")] === 'function') {
					eventHandlers[parent.attr("id")](value);
				}
			}	
		});
	};
	
	/**
		Programmatically sets the active state of the radio button.
		No change event handlers are called.
	*/
	var setRadioButtonValue = function(id, value) {
		// parent radio button element
		var elem = $("#" + id);
		
		// clear all active classes
		elem.children().removeClass("radio-button-active");
		
		// set active class on this element
		elem.children(".radio-button-choice[data-value=" + value + "]").addClass("radio-button-active");
	};
	
	/**
		Programmatically sets the value of the state button.
		No change event handlers are called.
	*/
	var setStateButtonValue = function(id, value) {
		if (value === true) {
			$("#" + id).addClass("state-button-active");
		} else {
			$("#" + id).removeClass("state-button-active");
		}
	};
	
	/**
		Sends info about the newly selected support mode to the connected peer.
	*/
	var sendSupportModeMessage = function(mode) {
		var message = new Message();
			
		message.sender = user;
		message.recipient = webrtc.collocutorId;
		message.content = mode;
		message.type = message.types.P2P;
		message.topic = message.topics.P2P_MODE;
		
		webrtc.sendDataChannelMessage(JSON.stringify(message));
	};
	
	/**
		Sends info about the newly selected back office mode to the connected peer.
	*/
	var sendBackOfficeMessage = function(on) {
		var message = new Message();
			
		message.sender = user;
		message.recipient = webrtc.collocutorId;
		message.content = on;
		message.type = message.types.P2P;
		message.topic = message.topics.P2P_BACK_OFFICE;
		
		webrtc.sendDataChannelMessage(JSON.stringify(message));
	};
	
	/**
		Sends info about the newly selected draw state to the connected peer.
	*/
	var sendDrawStateMessage = function(on) {
		var message = new Message();
			
		message.sender = user;
		message.recipient = webrtc.collocutorId;
		message.content = on;
		message.type = message.types.P2P;
		message.topic = message.topics.P2P_DRAW_STATE;
		
		webrtc.sendDataChannelMessage(JSON.stringify(message));
	};
	
	/**
		Sends info about the newly selected back officemode to the connected peer.
	*/
	var sendClearCanvasMessage = function() {
		var message = new Message();
			
		message.sender = user;
		message.recipient = webrtc.collocutorId;
		message.type = message.types.P2P;
		message.topic = message.topics.P2P_CLEAR_CANVAS;
		
		webrtc.sendDataChannelMessage(JSON.stringify(message));
	};
	
	/**
		Sets the support mode.
		Currently are two modes implemented: chat and support.
	*/
	var setSupportMode = function(mode) {
		switch (mode) {
			case "chat":
				// do not show second control line
				controlSupportOptions.hide();
				
				// show only the other person's screen
				hideLocalVideo();
				showRemoteVideo();
				
				break;
				
			case "support":
				// show second control line
				controlSupportOptions.show();
			
				break;
				
			default:
				break;
		}
	};
	
	/**
		Sets the back office mode
	*/
	var setBackOffice = function(on) {
		// set state button
		setStateButtonValue("control-back-office", on);
		
		// set screen display
		if (on == true) {
			// show only collocutor screen
			hideLocalVideo();
			showRemoteVideo();
		} else {
			// show only own screen
			hideRemoteVideo();
			showLocalVideo();
		}
	};
	
	// clears the drawing canvases
	var clearDrawingCanvas = function() {
		clearCanvas(appConfig.frontend.localDrawingCanvas);
		clearCanvas(appConfig.frontend.remoteDrawingCanvas);
	};
	
	// call init screen on page load
	initScreen();
});