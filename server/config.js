var appConfig = {
	title: "WebRTC",
	version: 0.2,
	author: "Michael Stifter",
	
	port: 1337,
	server: '127.0.0.1',
	
	defaultResponseFormat: "json"
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = appConfig;
}