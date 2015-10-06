var User = function() {
	// Id
	this.id = null;
	
	// Name
	this.name = null;
	
	// E-Mail
	this.mail = null;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports.User = User;
}