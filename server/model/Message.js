var Message = function() {
	// Timestamp
	this.timestamp = new Date();
	
	// Content
	this.content = "";
	
	// Sender
	this.sender = {};
	
	// Receiver
	this.receiver = {};
	
	// Type enum
	this.type = {
		SERVER: 1,
		P2P: 2
	}
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports.Message = Message;
}