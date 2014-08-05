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
	KDialog.prototype = (function(){
		
		var _busy = false;

		var _private = function(){
			console.log("private method");
		};

		var init = function() {
			var _self = this, $element = $(this.element);
			$element.on("click", "[data-action=close]", function(){
				close.call(_self);
			});
			console.log("KDialog initiated");
		};

		var open = function() {
			var _self = this, $element = $(this.element);
			$element.show();
			//add class for animation
			$element.addClass("in");
			this.isOpen = true;
			console.log("KDialog opened");
		};

		var close = function() {
			var _self = this, $element = $(this.element);
			$element.hide();
			//remove class for animation
			$element.addClass("out");
			console.log("KDialog closed");
		};

		var destroy = function() {
			var _self = this, $element = $(this.element);
			console.log("KDialog destroyed");
		}

		//return public methods
		return {
			init: init,	open: open, close: close, destroy: destroy
		};

	})();

	// plugin wrapper around the constructor,
	$.fn[pluginName] = function(options) {
		return this.each(function(){
			if(! $.data(this, pluginName)) 
				$.data(this, pluginName, new KDialog(this, options));  //instance
		});
	};

})(jQuery, window, document);