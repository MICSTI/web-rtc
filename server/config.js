var appConfig = {
	title: "WebRTC",
	version: 0.2,
	author: "Michael Stifter",
	
	port: 1337,
	server: '10.55.200.40',
	
	defaultResponseFormat: "json"
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = appConfig;
}