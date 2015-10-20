var appConfig = {
	application: {
		title: "WebRTC",
		version: 0.3,
		author: "Michael Stifter"
	},
	
	frontend: {
		localVideo: "local-video",
		remoteVideo: "remote-video"
	},
	
	logging: true,
	
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
	}
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = appConfig;
}