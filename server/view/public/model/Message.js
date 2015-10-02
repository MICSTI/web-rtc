var Message = function() {
	// Timestamp
	this.timestamp = "";
	
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