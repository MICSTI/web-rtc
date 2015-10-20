/**
	This class handles the access to navigator.getUserMedia call.
*/
var UserMedia = function() {
	/**
		getUserMedia is depending on the browser's implementation.
	*/
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	
	/**
		Video element.
	*/
	this.video = null;
	
	/**
		Constraints for getUserMedia.
	*/
	this.constraints = null;
	
	/**
		Success callback function.
	*/
	this.onSuccess = null;
	
	/**
		Error callback function.
	*/
	this.onError = null;
	
	/**
		Flag to keep track if user media access was granted.
	*/
	this.userMediaGranted = null;
	
	/**
		Inits getUserMedia.
	*/
	this.init = function(options) {
		this.constraints = options.constraints || null;
		this.onSuccess = options.onSuccess || null;
		this.onError = options.onError || null;
		
		if (this.constraints === null) {
			throw "navigator.getUserMedia constraints not set";
		}
		
		if (this.onSuccess === null) {
			throw "navigator.getUserMedia success handler not set";
		}
		
		if (this.onError === null) {
			throw "navigator.getUserMedia error handler not set";
		}
		
		// try to get user media
		navigator.getUserMedia(this.constraints, this.onSuccess, this.onError);
	}
}