var fs = require('fs');

var StaticFilesController = function(){
	
};

/**
	Serves a static file from the file static, according to the file type in the restUrl object.
*/
StaticFilesController.prototype.handle = function(response, restUrl){
	// access to this
	var self = this;

	var filename = './view/' + restUrl.url;
	
	fs.readFile(filename, function(err, filedata) {
		if (err === null ){
			if (restUrl.format.indexOf('png') >= 0 ){
				response.writeHead(200, {'Content-Type': 'image/png'} );
				response.end(filedata);
			} else if (restUrl.format.indexOf('jpg') >= 0){
				response.writeHead(200, {'Content-Type': 'image/jpeg'} );
				response.end(filedata);
			} else if (restUrl.format.indexOf('htm') >= 0) {
				response.writeHead(200, {'Content-Type': 'text/html'} );
				response.end( filedata.toString('UTF-8') );
			} else if (restUrl.format.indexOf('js') >= 0) {
				response.writeHead(200, {'Content-Type': 'text/javascript'} );
				response.end( filedata.toString('UTF-8') );
			} else if (restUrl.format.indexOf('css') >= 0) {
				response.writeHead(200, {'Content-Type': 'text/css'} );
				response.end( filedata.toString('UTF-8') );
			} else
				self.returnError(response, "Unsupported file type: '" + restUrl.format + "'");
		} else
			self.returnError(response, "Error reading file '" + filename + "': " + err);
		}
	)
};

// error response
StaticFilesController.prototype.returnError = function(response, msg) {
  	response.writeHead(503, {'Content-Type': 'text/plain'});
  	response.end("ERROR: '" + msg + "'\n");
}

module.exports = new StaticFilesController();