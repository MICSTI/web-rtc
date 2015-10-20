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
	};
	
	/**
		Handler to be called when a message is received via DataChannel.
	*/
	this.handleDataChannelMessage = null;
	
	/**
		Handler that is called when the ready state of the send channel changes.
	*/
	this.handleSendChannelStateChange = function() {
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
		Handler that is called when a remote stream is added.
	*/
	this.handleRemoteStreamAdded = function(event) {
		self.logger.log(self.logger.WEBRTC, "Remote stream added");
		
		self.remoteStream = event.stream;
		
		attachMediaStream(self.remoteVideo, event.stream);
		
		self.logger.log(self.logger.WEBRTC, "Remote stream attached");
	};
	
	/**
		Handler that is called when a remote stream is removed.
	*/
	this.handleRemoteStreamRemoved = function(event) {
		self.logger.log(self.logger.WEBRTC, "Remote stream removed", event);
		
		this.handleRemoteHangup();
	};
	
	/**
		Called when the user wants to end the call.
	*/
	this.hangup = function() {
		self.logger.log(self.logger.WEBRTC, "Hanging up");
		this.stop();
		
		// TODO: send bye message
	};
	
	/**
		Called when the user on the other end terminates the call.
	*/
	this.handleRemoteHangup = function() {
		self.logger.log(self.logger.WEBRTC, "Session terminated");
		this.stop();
		this.isInitiator = false;
	};
	
	/**
		Function that is always called when a call is terminated.
	*/
	this.stop = function() {
		this.callStarted = false;
		
		if (this.sendChannel !== null) {
			this.sendChannel.close();
		}
		
		if (this.receiveChannel !== null) {
			this.receiveChannel.close();
		}
		
		if (this.peerConnection !== null) {
			this.peerConnection.close();
		}
		
		this.peerConnection = null;
	}
	
	/**
		Sends a peer-to-peer message via DataChannel.
	*/
	this.sendDataChannelMessage = function(messageString) {
		self.sendChannel.send(messageString);
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
	}
}