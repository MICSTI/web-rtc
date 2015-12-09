var Notification = function() {
	var self = this;
	
	// notification parent (will be displayed relative to it)
	// should be a DOM element id
	// defaults to "window"
	this.parent = "window";
	
	// notification type
	this.type = null;
	
	// notification title
	this.title = null;
	
	// notification text
	this.text = null;
	
	// notification actions (only applicable for type = ACTION)
	// should be added with method addAction(actionDisplayName, action)
	this.actions = [];
	
	// notification timeout (after x milliseconds the notification dismisses itself, only applicable for type = INFO)
	this.timeout = null;
	
	// is the notification dismissable (e.g. will it disappear after the user clicks on it, only applicable for type = INFO)
	this.dismissable = null;
}

/**
	Issues the notification to the screen.
*/
Notification.prototype.notify = function() {
	var n = $(this.getHtml())
				.hide()
				.appendTo("body")
				.css("position", "absolute")
				.css("top", function() { return "0px"; })
				.css("left", function() { return "0px"; });
	
	// additional type-specific functionality
	switch (this.type) {
		case this.types.ACTION:
			
			
			break;
			
		case this.types.INFO:
			// dismiss element on click
			n.on("click", function() { fadeElement($(this)); });
			
			// auto-dismiss after this.timeout milliseconds
			if (this.timeout !== null) {
				n.bind("webrtc.timeout", function() {
					var bindElem = $(this);
					
					setTimeout(function() {
						fadeElement(bindElem);
					}, self.timeout);
				});
			}
			
			break;
			
		default:
			break;
	}
	
	// show notification on screen
	n.fadeIn(150, function() {
		if (self.type == self.types.INFO) {
			// for info notifications, after element has fully faded in, the timeout for fading it out after the duration period starts
			$(this).trigger("webrtc.timeout");
		}
	});
};

/**
	Returns the HTML for the notification
*/
Notification.prototype.getHtml = function() {
	var html = "";
	
	html += "<div class='notification notification-wrapper notification" + this.type + "'>";
		// title
		html += "<div class='notification-title'>" + this.title + "</div>";
		
		// text
		html += "<div class='notification-text'>" + this.text + "</div>";
		
		// action buttons
		if (this.type == this.types.ACTION) {
			this.actions.forEach(function(item, idx) {
				html += "<button>" + item.display + "</button>";
			});
		}
	html += "</div>";
	
	return html;
};

/**
	All possible notification types
*/
Notification.prototype.types = {
	ACTION: "action",
	INFO: "info"
};

/**
	Adds an action object to the action array.
	@param displayName (String) the name of the action, as it will be displayed on the notification's button
	@param action (function) the function to be executed when the user selects this action
*/
Notification.prototype.addAction = function(displayName, action) {
	this.actions.push({
		display: displayName,
		action: action
	});
};

/**
 * Fades a notification out and rearranges all other visible notifications on the screen.
 */
Notification.prototype.fadeElement = function(elem) {
	$(elem).fadeOut(200, function() {
		// remove the notification from the DOM
		$(elem).remove();
	});
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports.Notification = Notification;
}