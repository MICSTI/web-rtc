var User = function() {
	// Id
	this.id = "";
	
	// Name
	this.name = "";
	
	// E-Mail
	this.mail = "";
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports.User = User;
}