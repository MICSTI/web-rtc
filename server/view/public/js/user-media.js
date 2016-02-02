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
		self.constraints = options.constraints || null;
		self.onSuccess = options.onSuccess || null;
		self.onError = options.onError || null;
		
		if (self.constraints === null) {
			throw "navigator.getUserMedia constraints not set";
		}
		
		if (self.onSuccess === null) {
			throw "navigator.getUserMedia success handler not set";
		}
		
		if (self.onError === null) {
			throw "navigator.getUserMedia error handler not set";
		}
		
		// determine all video sources
		getSources(function() {
			// use back facing when possible option
			if (appConfig.camera.useBackFacingWhenPossible) {
				var bestSuitableSource = tryToFindEnvironmentCamera();
				
				self.constraints.video = { optional: [{ sourceId: bestSuitableSource["deviceId"] }] };
			}
			
			// try to get user media
			navigator.getUserMedia(self.constraints, self.onSuccess, self.onError);
		});
	}
	
	var tryToFindEnvironmentCamera = function() {
		var count = videoSources.length;
		
		if (count == 0) {
			throw "No video sources found!";
		}
		
		for (var i = 0; i < count; i++) {
			var source = videoSources[i];
			
			if (source.facing !== undefined && source.facing === "environment")
				return source;
		}
		
		// if none is found, the first camera in the array is returned
		return videoSources[0];
	}
	
	/**
		Gets all sources that are present on the device.
	*/
	var getSources = function(onSuccess) {
		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
			console.log("enumerateDevices() not supported");
			return;
		}
		
		// enumerate all cameras and microphones
		navigator.mediaDevices
				 .enumerateDevices()
				 .then(function(devices) {
					  devices.forEach(function(device) {
						  switch (device.kind) {
							case "audioinput":
								audioSources.push(device);
								break;
							
							case "videoinput":
								videoSources.push(device);
								
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
				  })
				  .catch(function(err) {
					  console.log(err.name + ":" + err.message);
				  });
	};
}