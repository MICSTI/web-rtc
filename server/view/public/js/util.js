var Util = function() {
	/**
		Returns a random alpha-numeric string.
		Length parameter can be passed, defaults to 32 if left out.
	*/
	this.generateId = function(_len) {
		// possible characters
		var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		
		// string length (defaults to 32)
		var len = _len !== undefined ? _len : 32;
		
		// result string
		var result = "";
		
		for (var i = len; i >= 0; i--) {
			result += chars[Math.round(Math.random() * (chars.length - 1))];
		}
		
		return result;
	}
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = new Util();
}