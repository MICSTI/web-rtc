/**
	This controller is responsible for page redirection and selecting the appropriate controller for handling a request URL.
*/
var RoutesController = function() {
	
}

/**
	Checks if the current URL should be redirected to another page.
*/
RoutesController.prototype.checkForUrlRedirection = function(request) {
	var url = request.url;
	
	// if request url is empty, redirect to client page
	if (url == "/" || url == "") {
		url = "/public/client.html";
	}
	
	return url;
}

/**
	Returns the appropriate controller for the passed restUrl object.
	The decision rules can specified as wanted.
	Defaults to "default".
*/
RoutesController.prototype.getController = function(restUrl) {
	var controller = "default";
	
	// static files
	if (restUrl.path.indexOf("public") >= 0) {
		controller = "static";
	}
	
	if (restUrl.resource == "public") {
		controller = "static";
	}
	
	if (restUrl.filename == "index.html") {
		controller = "static";
	}
	
	return controller;
}

// export routes controller
module.exports = new RoutesController();