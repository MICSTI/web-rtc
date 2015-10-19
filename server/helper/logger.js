/**
	This class handles the logging during server runtime.
*/
var Logger = function() {
	// Flag if log controller is enabled. True by default.
	this.enabled = true;
	
	/**
		Wrapper function to call when something should be logged.
	*/
	this.log = function(prefix, text, obj) {
		if (this.enabled) {
			performLog(prefix, text, obj);
		}
	};
	
	/**
		Wrapper function to call when an error has occurred.
		Error logs will always be shown in the console.
	*/
	this.error = function(message, err) {
		if (message !== undefined && message != "")
			console.log(message);
		
		console.log(Error(err));
	};
	
	/**
		Adds a blank line to the log output.
	*/
	this.blank = function() {
		this.log(undefined, "");
	}
	
	/**
		Performs log even if logging is turned off.
	*/
	this.force = function(prefix, text, obj) {
		performLog(prefix, text, obj);
	};
	
	/**
		Code that will be executed when logging happens.
	*/
	var performLog = function(prefix, text, obj) {
		// we only log to console for now
		consoleLog(prefix, text, obj);
	};
	
	/**
		Logs text and/or object to console.
	*/
	var consoleLog = function(prefix, _text, obj) {
		var text = prefix !== undefined ? prefix + " " + _text  : _text;
		
		if (obj !== undefined)
			console.log(text, obj);
		else
			console.log(text);
	};
}

// prefixes for logging
Logger.prototype.SERVER = "[SERVER]";
Logger.prototype.WS = "[WS]";
Logger.prototype.WEBRTC = "[WebRTC]";
Logger.prototype.INFO = "[INFO]";

// export logger
if (typeof module !== 'undefined' && module.exports) {
	module.exports = new Logger();
}