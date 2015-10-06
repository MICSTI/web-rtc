var fs = require('fs');

var ModelFilesController = function(){
	
};

/**
	Serves a static model file from the file system, according to the file type in the restUrl object.
*/
ModelFilesController.prototype.handle = function(response, restUrl){
	// access to this
	var self = this;

	var filename = './model/' + restUrl.filename;
	
	fs.readFile(filename, function(err, filedata) {
		if (err === null ){
			if (restUrl.format.indexOf('js') >= 0) {
				response.writeHead(200, {'Content-Type': 'text/javascript'} );
				response.end( filedata.toString('UTF-8') );
			} else
				self.returnError(response, "Unsupported file type: '" + restUrl.format + "'");
		} else
			self.returnError(response, "Error reading file '" + filename + "': " + err);
		}
	)
};

// error response
ModelFilesController.prototype.returnError = function(response, msg) {
  	response.writeHead(503, {'Content-Type': 'text/plain'});
  	response.end("ERROR: '" + msg + "'\n");
}

module.exports = new ModelFilesController();