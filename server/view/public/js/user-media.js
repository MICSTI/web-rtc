/**
	This class handles the access to navigator.getUserMedia call.
*/
var UserMedia = function() {
	var self = this;
		
	/**
		getUserMedia is depending on the browser's implementation.
	*/
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	/**
		Flag to keep track if media sources have been determined.
	*/
	this.gotSources = false;

	/**
		Available video sources on the device.
	*/
	var videoSources = [];
	
	/**
		Available audio sources on the device.
	*/
	var audioSources = [];
	
	/**
		Returns an object containing the audio and video sources for the device.
		The function returns null if the sources have not been determined yet.
	*/
	this.getMediaSources = function() {
		if (!this.gotSources) {
			return null;
		}
		
		return {
			audio: audioSources,
			video: videoSources
		}
	}
	
	/**
		Returns the video sources for the device.
		The function returns null if the sources have not been determined yet.
	*/
	this.getVideoSources = function() {
		if (this.gotSources) {
			return videoSources;
		}
		
		return null;
	}
	
	/**
		Returns the audio sources for the device.
		The function return null if the sources have not been determined yet.
	*/
	this.getAudioSources = function() {
		if (this.gotSources) {
			return audioSources;
		}
		
		return null;
	}
	
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
	
	/**
		Gets all sources that are present on the device.
	*/
	var getSources = function(onSuccess) {
		// TEMPORARY FALLBACK SOLUTION
		// Firefox does not support MediaStreamTrack.getSources
		// instead, an empty array will be returned if the browser does not support it
		try {
			MediaStreamTrack.getSources(function(sources) {
				sources.forEach(function(item, idx) {
					switch (item.kind) {
						case "audio":
							audioSources.push(item);
							break;
						
						case "video":
							videoSources.push(item);
							break;
							
						default:
							break;
					}
				});
				
				// set got sources flag to true
				self.gotSources = true;
				
				// call onSuccess handler
				if (onSuccess !== undefined && typeof onSuccess === 'function')
					onSuccess(self.getMediaSources);
			});
		} catch (ex) {
			console.log(ex);
			
			if (onSuccess !== undefined && typeof onSuccess === 'function')
				onSuccess([]);
		}
	};
	
	// determine all video sources
	getSources();
}