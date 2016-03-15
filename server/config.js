var appConfig = {
	application: {
		title: "WebRTC",
		version: 1.1,
		author: "Michael Stifter"
	},
	
	camera: {
		useBackFacingWhenPossible: true
	},
	
	frontend: {
		localVideo: "local-video",
		localCanvas: "local-canvas-video",
		localDrawingCanvas: "local-canvas-drawing",
		localVideoContainer: "local-video-container",
		
		remoteVideo: "remote-video",
		remoteCanvas: "remote-canvas-video",
		remoteDrawingCanvas: "remote-canvas-drawing",
		remoteVideoContainer: "remote-video-container"
	},
	
	logging: true,
	
	misc: {
		addOwnTimestampToMessage: false
	},
	
	peerConnection: {
		configuration: {
			'firefox': {'iceServers': [{'url': 'stun:23.21.150.121'}]},
			'chrome': {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]}
		}, 
		
		constraints: {
			'optional': [
				{'DtlsSrtpKeyAgreement': true}
			]
		}
	},

	server: {
		ip: '192.168.0.104',
		port: 1337,
		defaultResponseFormat: "json"
	},
	
	userMedia: {
		constraints: {
			audio: false,
			video: true
		}
	}
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = appConfig;
}