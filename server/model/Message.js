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
	USER_ID: "userId"
};

// possible type values
Message.prototype.types = {
	SERVER: 1,
	P2P: 2
};

// possbile status values
Message.prototype.statuses = {
	SUCCESS: 1,
	INFO: 2,
	WARNING: 3,
	ERROR: 4
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports.Message = Message;
}