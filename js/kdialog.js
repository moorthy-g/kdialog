//javascript document
;(function($, window, document, undefined) {

	'use strict';

	// Create the defaults once
	var pluginName = "kdialog",
		defaults = {
			open: function(){},
			close: function(){}
		};

	// The plugin constructor
	function KDialog(element, options) {
		this.element = element;
		this.isOpen = false;
		this.settings = $.extend(defaults, options);
		this.init();		
	};

	//private & public methods
	KDialog.prototype = function() {
		
		var _busy = false, _animationEndEvent, _transitionEndEvent,

		//serve touch events for touchscreen
		/* 
			todo:
			How touch events behave in touchscreen laptop with mouse connected?
			coz we don't bind click events in touch enabled devices
		 */
		events = "ontouchstart" in window ?
				  { click: "touchstart" } :
				  { click: "click" };

		var _private = function() {
			console.log("private method");
		};

		var _getPrefixedEndEvent = function(prop) {
			var prefix = ["webkit", "moz", "MS"], element = document.createElement("p");

			if(element.style[prop] == "")
				return prop + "End"; //return standard event

			prop = prop.charAt(0).toUpperCase() + prop.slice(1);
			for(var i = 0; i<prefix.length; i++) {
				if(element.style[prefix[i] + prop] == "")
					return prefix[i] + prop + "End"; //return prefixed event
			}
		};

		var init = function() {
			var _self = this, $element = $(this.element);
			$element.on(events.click, "[data-action=close]", function(e){
				e.preventDefault();
				close.call(_self);
			});
			console.log("KDialog initiated");
		};

		var open = function() {
			// hey, It has opened already. so, return
			if(this.isOpen) return;

			var _self = this, $element = $(_self.element);
			$element.show();
			//add class for animation
			$element.addClass("in");
			_self.isOpen = true;
			console.log("KDialog opened");
		};

		var close = function() {
			// nothing to close. so, return
			if(!this.isOpen) return;

			var _self = this, $element = $(_self.element);
			$element.hide();
			//remove class for animation
			$element.addClass("out");
			_self.isOpen = false;
			console.log("KDialog closed");
		};

		var destroy = function() {
			var _self = this, $element = $(_self.element);
			console.log("KDialog destroyed");
		};

		//return public methods
		return {
			init: init,	open: open, close: close, destroy: destroy
		};

	}();

	// plugin wrapper around the constructor,
	$.fn[pluginName] = function(options) {
		return this.each(function(){
			if(! $.data(this, pluginName)) 
				$.data(this, pluginName, new KDialog(this, options));  //instance
		});
	};

})(jQuery, window, document);