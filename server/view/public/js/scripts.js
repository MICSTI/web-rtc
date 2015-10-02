$(function() {
	var chat = $("#chat");
	var input = $("#message");
	var username = $("#username");
	var send = $("#send");
	
	// if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;
	
	// if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        chat.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        return;
    }
	
	// open connection
    var connection = new WebSocket('ws://127.0.0.1:1337');

    connection.onopen = function () {
       console.log("Connection opened");
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        chat.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        console.log(message);
    };
	
	// submit button
	send.on("click", function() {
		connection.send(input.val());
		
		input.val("");
	});
});