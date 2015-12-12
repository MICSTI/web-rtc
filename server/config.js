var appConfig = {
	application: {
		title: "WebRTC",
		version: 0.4,
		author: "Michael Stifter"
	},
	
	frontend: {
		localVideo: "local-video",
		localCanvas: "local-canvas-video",
		localDrawingCanvas: "local-canvas-drawing",
		localVideoContainer: "local-video-container",
		
		remoteVideo: "remote-video",
		remoteCanvas: "remote-canvas-video",
		remoteDrawingCanvas: "remote-canvas-drawing",
		remoteVideoContainer: "remote-video-container",
	},
	
	logging: true,
	
	misc: {
		addOwnTimestampToMessage: true
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
		ip: '127.0.0.1',
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