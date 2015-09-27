var fs = require('fs');

var StaticFilesController = function(){
	
}

StaticFilesController.prototype.handle = function(response, restUrl){

	var filename = '../view' + restUrl.url;
	
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
				returnErr(response, "Unsupported file type: '" + restUrl.format + "'");
		}else
			returnErr(response, "Error reading file '" + filename + "': " + err);
		}
	)
}

var staticFileController = new StaticFilesController();
module.exports = staticFileController;

// helper Errors for static files:
StaticFilesController.prototype.returnErr = function(response,msg) {
	console.log("DEBUG: serving static files " + msg);
  	response.writeHead(503, {'Content-Type': 'text/plain'});
  	response.end("ERROR: '" + msg + "'\n");
}
