/**
	This class handles the WebRTC connection setup.
*/
var WebRTCController = function() {
	/**
		Reference to this
	*/
	var self = this;
	
	/**
		Reference to logger
	*/
	var logger = null;
	
	/**
		Reference to local stream
	*/
	this.localStream = null;
	
	/**
		Reference to remote stream
	*/
	this.remoteStream = null;
	
	/**
		Local video DOM selector
	*/
	this.localVideo = null;
	
	/**
		Remote video DOM selector
	*/
	this.remoteVideo = null;
	
	/**
		Id of remote video DOM reference
	*/
	this.remoteVideoId = null;
	
	/**
		UserMedia handler
	*/
	this.userMedia = new UserMedia();
	
	/**
		RTCPeerConnection object
	*/
	this.peerConnection = null;
	
	/**
		RTCPeerConnection configuration for ICE server.
		Depends on which browser was detected. Currently only implemented for Firefox and Chrome.
	*/
	this.peerConnectionConfig = null;
	
	/**
		Constraints for setting up a RTCPeerConnection.
	*/
	this.peerConnectionConstraints = null;
	
	/**
		Session description protocol constraints (needed if STUN and TURN servers are used)
	*/
	this.sdpConstraints = null;
	
	/**
		DataChannel for sending data.
	*/
	this.sendChannel = null;
	
	/**
		DataChannel for receiving data.
	*/
	this.receiveChannel = null;

	/**
		Flag for keeping track if a call has been started.
	*/
	this.callStarted = false;

	/**
		Flag for keeping track who initiated the call.
	*/
	this.isInitiator = false;
	
	/**
		Id of the user on the other end.
	*/
	this.collocutorId = null;
	
	/**
		Function to determine if a data channel is available. Returns boolean true or false.
	*/
	this.dataChannelAvailable = function() {
		return this.sendChannel !== null || this.receiveChannel !== null;
	}
	
	/**
		Handler that is called when a peer connection AND a reliable data channel have been successfully created.
	*/
	this.onPeerConnectionCreated = null;
	
	/**
		Handler that is called when a peer connection has been closed.
	*/
	this.onPeerConnectionClosed = null;
	
	// is video stream paused?
	this.videoPaused = false;
	
	/**
		Initiates a call between to users.
	*/
	this.initiateCall = function(callee_id) {
		this.collocutorId = callee_id;
		
		this.isInitiator = true;
		
		this.checkAndStart();
	}
	
	/**
		Channel negotiation trigger function.
	*/
	this.checkAndStart = function() {
		if (!this.callStarted && typeof this.localStream != 'null') {
			this.createPeerConnection();
			
			this.callStarted = true;
			
			if (this.isInitiator) {
				this.placeCall();
			}
		}
	}
	
	/**
		Peer connection management.
	*/
	this.createPeerConnection = function() {
		try {
			this.peerConnection = new RTCPeerConnection(this.peerConnectionConfig, this.peerConnectionConstraints);
			
			this.peerConnection.addStream(this.localStream);
			
			this.peerConnection.onicecandidate = this.handleIceCandidate;
			
			this.logger.log(this.logger.WEBRTC, "Created RTCPeerConnection successfully");
		} catch (ex) {
			this.logger.error("could not create RTCPeerConnection", ex);
			return;
		}
		
		this.peerConnection.onaddstream = this.handleRemoteStreamAdded;
		this.peerConnection.onremovestream = this.handleRemoteStreamRemoved;
		
		if (this.isInitiator) {
			try {
				// create a reliable data channel
				self.sendChannel = this.peerConnection.createDataChannel("sendDataChannel", { reliable: true });
				self.logger.log(self.logger.WEBRTC, "Created send data channel");
				
				if (self.onPeerConnectionCreated !== null && typeof self.onPeerConnectionCreated === 'function')
					self.onPeerConnectionCreated();
			} catch (ex) {
				self.logger.error("createDataChannel() failed", ex);
			}
			
			this.sendChannel.onopen = this.handleSendChannelStateChange;
			this.sendChannel.onmessage = this.handleDataChannelMessage;
			this.sendChannel.onclose = this.handleSendChannelStateChange;
		} else {
			this.peerConnection.ondatachannel = this.gotReceiveChannel;
		}
	};
	
	/**
		Got receive channel handler.
	*/
	this.gotReceiveChannel = function(event) {
		self.logger.log(self.logger.WEBRTC, "Receive Channel callback");
		
		self.receiveChannel = event.channel;
		self.receiveChannel.onmessage = self.handleDataChannelMessage;
		self.receiveChannel.onopen = self.handleReceiveChannelStateChange;
		self.receiveChannel.onclose = self.handleReceiveChannelStateChange;
		
		if (self.onPeerConnectionCreated !== null && typeof self.onPeerConnectionCreated === 'function')
			self.onPeerConnectionCreated();
	};
	
	/**
		Handler to be called when a message is received via DataChannel.
	*/
	this.handleDataChannelMessage = null;
	
	/**
		Handler that is called when the ready state of the send channel changes.
	*/
	this.handleSendChannelStateChange = function() {
		if (self.sendChannel === null)
			return;
		
		var readyState = self.sendChannel.readyState;
		self.logger.log(self.logger.WEBRTC, "Send channel state is: " + readyState);
		
		if (readyState == "open") {
			self.logger.log(self.logger.WEBRTC, "Send data channel is open");
		} else {
			self.logger.log(self.logger.WEBRTC, "Send data channel is closed");
		}
	};
	
	/**
		Handler that is called when the ready state of the receive channel changes.
	*/
	this.handleReceiveChannelStateChange = function() {
		if (self.receiveChannel === null)
			return;
		
		var readyState = self.receiveChannel.readyState;
		self.logger.log(self.logger.WEBRTC, "Receive channel state is: " + readyState);
		
		if (readyState == "open") {
			self.logger.log(self.logger.WEBRTC, "Receive data channel is open");
		} else {
			self.logger.log(self.logger.WEBRTC, "Receive data channel is closed");
		}
	};
	
	/**
		Ice candidate management.
	*/
	this.handleIceCandidate = null;
	
	/**
		Function for placing a call.
	*/
	this.placeCall = function() {
		this.logger.log(this.logger.WEBRTC, "Creating offer...");
		this.peerConnection.createOffer(this.setLocalAndSendMessageOffer, this.onSignalingError, this.sdpConstraints);
	};
	
	/**
		Error handler for signaling errors.
	*/
	this.onSignalingError = null;
	
	/**
		Create answer to session description offer.
	*/
	this.doAnswer = function() {
		this.logger.log(this.logger.WEBRTC, "Sending answer to peer");
		this.peerConnection.createAnswer(this.setLocalAndSendMessageAnswer, this.onSignalingError, this.sdpConstraints);
	};
	
	/**
		Success handler for createOffer.
	*/
	this.setLocalAndSendMessageOffer = null;
	
	/**
		Success handler for createAnswer.
	*/
	this.setLocalAndSendMessageAnswer = null;
	
	/**
		Optional success handler for remote stream added
	*/
	this.onRemoteStreamAdded = null;
	
	/**
		Optional success handler for remote stream removed
	*/
	this.onRemoteStreamRemoved = null;
	
	/**
		Handler that is called when a remote stream is added.
	*/
	this.handleRemoteStreamAdded = function(event) {
		self.logger.log(self.logger.WEBRTC, "Remote stream added");
		
		self.remoteStream = event.stream;
		
		attachMediaStream(self.remoteVideo, event.stream);
		
		self.logger.log(self.logger.WEBRTC, "Remote stream attached");
		
		// optional additional function set by handling script
		if (self.onRemoteStreamAdded !== null && typeof self.onRemoteStreamAdded === 'function')
			self.onRemoteStreamAdded();
	};
	
	/**
		Handler that is called when a remote stream is removed.
	*/
	this.handleRemoteStreamRemoved = function(event) {
		self.logger.log(self.logger.WEBRTC, "Remote stream removed", event);
		
		// optional additional function set by handling script
		if (self.onRemoteStreamRemoved !== null && typeof self.onRemoteStreamRemoved === 'function')
			self.onRemoteStreamRemoved();
	};
	
	/**
		Handler that is called when a hangup is requested.
	*/
	this.onHangup = null;
	
	/**
		Called when the user wants to end the call.
	*/
	this.hangup = function() {
		self.logger.log(self.logger.WEBRTC, "Hanging up");
		self.stop();
		
		if (self.onHangup !== null && typeof self.onHangup === 'function')
			self.onHangup();
	};
	
	/**
		Called when the user on the other end terminates the call.
	*/
	this.handleRemoteHangup = function() {
		self.logger.log(self.logger.WEBRTC, "Session terminated");
		self.stop();
		self.collocutorId = null;
	};
	
	/**
		Function that is always called when a call is terminated.
	*/
	this.stop = function() {
		self.callStarted = false;
		self.isInitiator = false;
		
		if (self.sendChannel !== null) {
			self.sendChannel.close();
			self.sendChannel = null;
		}
		
		if (self.receiveChannel !== null) {
			self.receiveChannel.close();
			self.receiveChannel = null;
		}
		
		if (self.peerConnection !== null) {
			self.peerConnection.close();
		}
		
		self.peerConnection = null;
		
		self.handleRemoteStreamRemoved();
		
		if (self.onPeerConnectionClosed !== null && typeof self.onPeerConnectionClosed === 'function')
			self.onPeerConnectionClosed();
	}
	
	/**
		Sends a peer-to-peer message via DataChannel.
	*/
	this.sendDataChannelMessage = function(messageString) {
		if (self.sendChannel !== null) {
			self.sendChannel.send(messageString);
		} else if (self.receiveChannel !== null) {
			self.receiveChannel.send(messageString);
		} else {
			self.logger.log(self.logger.WEBRTC, "No data channel open");
			return;
		}
			
		self.logger.log(self.logger.WEBRTC, "Sent P2P message");
	};
	
	/**
		Sets the appropriate handlers.
	*/
	this.setHandlers = function(handlers) {
		this.handleDataChannelMessage = handlers.handleDataChannelMessage || null;
		this.handleIceCandidate = handlers.handleIceCandidate || null;
		this.onSignalingError = handlers.onSignalingError || null;
		this.setLocalAndSendMessageOffer = handlers.setLocalAndSendMessageOffer || null;
		this.setLocalAndSendMessageAnswer = handlers.setLocalAndSendMessageAnswer || null;
		this.onHangup = handlers.onHangup || null;
		this.onRemoteStreamAdded = handlers.onRemoteStreamAdded || null;
		this.onRemoteStreamRemoved = handlers.onRemoteStreamRemoved || null;
		this.onPeerConnectionCreated = handlers.onPeerConnectionCreated || null;
		this.onPeerConnectionClosed = handlers.onPeerConnectionClosed || null;
	};
	
	/**
		Checks if a peer connection is currently established.
	*/
	this.isConnected = function() {
		return this.peerConnection !== null;
	}
}