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
	
	// the first element equals the filename ("available.json")
	this.filename = idAndFormat;
	
	// split it by "."
	var idAndFormatParts = idAndFormat.split(".");
	
	// get length of idAndFormatParts array
	var idAndFormatPartsLength = idAndFormatParts.length;
	
	if (idAndFormatPartsLength > 1) {
		// id and format were passed
		
		// is there more than ".", like in "jquery.min.js"?
		if (idAndFormatPartsLength > 2) {
			for (var i = 0; i < (idAndFormatPartsLength - 2); i++) {
				this.id += idAndFormatParts[i] + ".";
			}
			
			// remove the last "." - it doesn't belong here
			this.id = this.id.substr(0, this.id.length - 1);
		} else {
			// there's only one element in the array
			
			this.id = idAndFormatParts[0];
		}
		
		// format is the very last element in the array (in case there is more than ".", like in "jquery.min.js")
		this.format = idAndFormatParts[idAndFormatParts.length - 1];
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