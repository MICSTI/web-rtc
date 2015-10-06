var Message = function() {
	// Timestamp (defaults to now)
	this.timestamp = new Date();
	
	// Content
	this.content = null;
	
	// Sender
	this.sender = null;
	
	// Receiver
	this.receiver = null;
	
	// Type enum
	this.type = {
		SERVER: 1,
		P2P: 2
	}
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports.Message = Message;
}