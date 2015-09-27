/**
	Parses a ReSTful request url
*/
var UrlParser = function(request, postData, defaultResponseFormat) {
	// request url
	this.url = request.url;
	
	// request method (GET, POST, PUT or DELETE)
	this.method = request.method;
	
	// data
	this.path = "";
	this.resource = "";
	this.id = "";
	this.format = "";
	this.params = {};
	this.filename = null;
	
	// default response format
	this.defaultResponseFormat = defaultResponseFormat;
	
	// parse request url
	this.parseUrl();
}

/**
	Parses the request url and fills the data into the respective data objects.
*/
UrlParser.prototype.parseUrl = function() {
	// position of last slash
	var posLastSlash = this.url.lastIndexOf("/");
	
	// path and resource of url (we start at index 1 because we always get a slash at the first character
	var pathAndResource = this.url.substring(1, posLastSlash);
	
	// split into parts
	var parts = pathAndResource.split("/");
	
	// first index is the path
	this.path = parts[0];
	
	// the comes the resource
	this.resource = parts[1];
	
	// last part contains the id and possible params
	var idAndFormatAndParams = this.url.substring(posLastSlash + 1);
	
	// split by "?"
	var idParts = idAndFormatAndParams.split("?");
	
	// id and format (e.g. available.json)
	var idAndFormat = idParts[0];
	
	// the first element equals the filename ("availabe.json")
	this.filename = idAndFormat;
	
	// split it by "."
	var idAndFormatParts = idAndFormat.split(".");

	
	if (idAndFormatParts.length > 1) {
		// id and format were passed
		this.id = idAndFormatParts[0];
		this.format = idAndFormatParts[1];
	} else {
		// no format was passed - we use the default format
		this.id = idAndFormatParts[0];
		this.format = this.defaultResponseFormat;
	}
	
	// parse params string (if available)
	var paramsString = idParts[1] || null;
	
	if (paramsString) {
		var parameters = {};
		
		// key-value pairs
		var kvs = paramsString.split("&");
		
		kvs.forEach(function(item) {
			var split = item.split("=");
			var _key = unescape(split[0]);
			var _value = unescape(split[1]);
			
			// add it to parameters object
			parameters[_key] = _value;
		});
		
		this.params = parameters;
	}
}

module.exports.UrlParser = UrlParser;