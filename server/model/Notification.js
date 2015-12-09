var Notification = function() {
	var self = this;
	
	// id
	this.id = this.assignId();
	
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
	
	/**
		Issues the notification to the screen.
	*/
	this.notify = function() {
		var n = $(this.getHtml())
					.hide()
					.appendTo("body")
					.css("position", "absolute")
					.css("top", function() { return "0px"; })
					.css("left", function() { return "0px"; });
		
		// additional type-specific functionality
		switch (this.type) {
			case this.types.ACTION:
				// TODO: add action buttons and attach its functions
				this.actions.forEach(function(item, idx) {
					var button = $("<button>");
					button.html(item.display);
					button.on("click", item.action);
					$("#" + self.id + " .notification-action").append(button);
				});
				
				break;
				
			case this.types.INFO:
				// dismiss element on click
				n.on("click", function() { self.fadeElement($(this)); });
				
				// auto-dismiss after this.timeout milliseconds
				if (this.timeout !== null) {
					n.bind("webrtc.timeout", function() {
						var bindElem = $(this);
						
						setTimeout(function() {
							self.fadeElement(bindElem);
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
}

/**
	Returns the HTML for the notification
*/
Notification.prototype.getHtml = function() {
	var html = "";
	
	html += "<div class='notification notification-wrapper notification" + this.type + "' id='" + this.id + "'>";
		// title
		html += "<div class='notification-title'>" + this.title + "</div>";
		
		// text
		html += "<div class='notification-text'>" + this.text + "</div>";
		
		// action buttons
		html += "<div class='notification-action'></div>";
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

/**
	Assigns an id to the notification
*/
Notification.prototype.assignId = function() {
	return Util.generateId(12);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports.Notification = Notification;
}