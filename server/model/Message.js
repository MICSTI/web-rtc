var Message = function() {
	// Timestamp (defaults to now)
	this.timestamp = new Date();
	
	// Topic
	this.topic = null;
	
	// Content
	this.content = null;
	
	// Sender
	this.sender = null;
	
	// Recipient
	this.recipient = null;
	
	// Type
	this.type = null;
	
	// Status
	this.status = null;
}

// possible topic values
Message.prototype.topics = {
	USER_ID: "userId",
	USER_INFO: "userInfo",
	USER_BROADCAST: "userBroadcast",
	CHANGE_USER_COLOR: "changeUserColor",
	ICE_CANDIDATE: "iceCandidate",
	SESSION_DESCRIPTION_OFFER: "sessionDescriptionOffer",
	SESSION_DESCRIPTION_ANSWER: "sessionDescriptionAnswer"
};

// possible type values
Message.prototype.types = {
	SERVER: 1,
	P2P: 2
};

// possible status values
Message.prototype.statuses = {
	SUCCESS: "success",
	INFO: "info",
	WARNING: "warning",
	ERROR: "error"
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports.Message = Message;
}