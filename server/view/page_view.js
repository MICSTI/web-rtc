fs=require("fs");

var PageView = function() {
	this.clientHtml = "../view/client.html";
}

PageView.prototype.getHtml = function(response, restUrl, data) {
	// read file
	fs.readFile(this.clientHtml, function(err, layoutdata) {
		var html = "";
		
		if (err === null ){
			html = layoutdata.toString('UTF-8');
		} else {
			html = "An error occurred.";
			console.log("Error", err);
		}
		
		response.writeHead(200, {'Content-Type': 'text/html'} );
		response.end(html);
	});
}

module.exports.PageView = PageView;