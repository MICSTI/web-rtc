var Util = function() {
	
}

/**
	Returns a random alpha-numeric string.
	Length parameter can be passed, defaults to 32 if left out.
*/
Util.prototype.generateId = function(_len) {
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

/**
	Returns the current date time as a string.
*/
Util.prototype.getDateTime = function() {
	return this.getDate() + " " + this.getTime();
}

/**
	Returns the current date as a string.
*/
Util.prototype.getDate = function() {
	var now = new Date();
	
	return this.addSpacing(now.getDate(), 2, "0") + "." + this.addSpacing((now.getMonth() + 1), 2, "0") + "." + (now.getYear() + 1900);
}

/**
	Returns the current time as a string.
*/
Util.prototype.getTime = function() {
	var now = new Date();
	
	return this.addSpacing(now.getHours(), 2, "0") + ":" + this.addSpacing(now.getMinutes(), 2, "0") + ":" + this.addSpacing(now.getSeconds(), 2, "0");
}

/**
	Adds spacing to a string or number.
*/
Util.prototype.addSpacing = function(_toSpace, resultLength, padCharacter) {
	var toSpace = typeof _toSpace !== 'string' ? _toSpace.toString() : _toSpace;
	
	var toPad = resultLength - toSpace.length;
	
	if (toPad <= 0)
		return toSpace;
	
	return Array(toPad + 1).join(padCharacter) + toSpace;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = new Util();
} else {
	var Util = new Util();
}