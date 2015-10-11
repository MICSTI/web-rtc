var UserMedia = function() {
	/**
		getUserMedia is depending on the browser's implementation
	*/
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	
	/**
		Video element
	*/
	this.video = null;
	
	/**
		Constraints for getUserMedia
	*/
	this.constraints = null;
	
	/**
		Success callback function
	*/
	this.onSuccess = null;
	
	/**
		Error callback function
	*/
	this.onError = null;
	
	/**
		Inits getUserMedia
	*/
	this.init = function() {
		navigator.getUserMedia(this.constraints, this.onSuccess, this.onError);
	}
}