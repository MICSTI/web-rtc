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
	
	// Type enum
	this.type = null;
}

// possible topic values
Message.prototype.topics = {
	USER_ID: "userId"
};

// possible type values
Message.prototype.types = {
	SERVER: 1,
	P2P: 2
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports.Message = Message;
}