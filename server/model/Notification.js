var Notification = function() {
	var self = this;
	
	// id
	this.id = this.generateId();
	
	// notification parent (will be displayed relative to it)
	// should be a DOM element id
	// defaults to window.
	this.parent = null;
	
	// notification type
	this.type = null;
	
	// notification title
	this.title = "";
	
	// notification text
	this.text = "";
	
	// notification actions (only applicable for type = ACTION)
	// should be added with method addAction(actionDisplayName, action)
	this.actions = [];
	
	// notification timeout (after x milliseconds the notification dismisses itself, only applicable for type = INFO)
	this.timeout = 3000;
	
	// is the notification dismissable (e.g. will it disappear after the user clicks on it, only applicable for type = INFO)
	this.dismissable = true;
	
	/**
		Issues the notification to the screen.
	*/
	this.notify = function() {
		// get information about parent element
		var _parent = this.parent !== null ? $("#" + this.parent) : $(window);
		
		var width = _parent.outerWidth();
		var height = _parent.outerHeight();
		
		if (this.parent !== null) {
			var position = _parent.offset();
		} else {
			var position = { top: 0, left: 0 };
		}
		
		var n = $(this.getHtml())
					.hide()
					.appendTo("body")
					.css("position", "absolute")
					.css("top", position.top + "px")
					.css("left", position.left + "px");
					
		// calculate width and height, factoring in self padding
		var _paddingLeftRight = parseInt(n.css("padding-left").replace("px", ""), 10) + parseInt(n.css("padding-right").replace("px", ""), 10);
		var _paddingTopBottom = parseInt(n.css("padding-top").replace("px", ""), 10) + parseInt(n.css("padding-bottom").replace("px", ""), 10);
		
		n.css("width", (width - _paddingLeftRight) + "px")
		 .css("height", (height - _paddingTopBottom) + "px");
		
		// additional type-specific functionality
		switch (this.type) {
			case this.types.ACTION:
				this.actions.forEach(function(item, idx) {
					var button = $("<button>");
					button.html(item.display);
					button.on("click", function() {
						if (item.action !== undefined && typeof item.action === 'function')
							item.action();
						
						// clear notification
						self.clear();
					});
					$("#" + self.id + " .notification-action").append(button);
				});
				
				break;
				
			case this.types.INFO:
				// dismiss element on click
				if (this.dismissable) {
					n.on("click", function() { self.fadeElement($(this)); });
				}
				
				// auto-dismiss after this.timeout milliseconds
				if (this.timeout !== null) {
					n.bind(Notification.NOTIFICATION_TIMEOUT, function() {
						var bindElem = $(this);
						
						setTimeout(function() { self.fadeElement(bindElem); }, self.timeout);
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
				$(this).trigger(Notification.NOTIFICATION_TIMEOUT);
			}
		});
	};
	
	/**
		Removes the notification from the DOM immediately.
	*/
	this.clear = function() {
		$("#" + this.id).remove();
	}
}

/**
	Returns the HTML for the notification.
*/
Notification.prototype.getHtml = function() {
	var html = "";
	
	html += "<div class='notification notification-wrapper notification-" + this.type + "' id='" + this.id + "'>";
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
	Assigns an id to the notification.
*/
Notification.prototype.generateId = function() {
	return Util.generateId(12);
}

// 
Notification.NOTIFICATION_TIMEOUT = "notification-timeout";

if (typeof module !== 'undefined' && module.exports) {
	module.exports.Notification = Notification;
}