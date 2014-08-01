//javascript document
;(function($, window, document, undefined) {

	'use strict';

	// Create the defaults once
	var pluginName = "kdialog",
		defaults = {
			open: function(){},
			close: function(){}
		};

	// The actual plugin constructor
	function KDialog(element, options) {
		this.element = element;
		this.settings = $.extend(defaults, options);
		this.init();
	};

	KDialog.prototype.init = function() {
		var $element = $(this.element);
		$element.on("click", "[data-action=close]", function(){
			$element.data(pluginName).close();
		});
		console.log("KDialog initiated successfully");
	};

	KDialog.prototype.open = function() {
		var $element = $(this.element);
		$element.show();
		console.log("KDialog opened");
	};

	KDialog.prototype.close = function() {
		var $element = $(this.element);
		$element.hide();
		console.log("KDialog closed");
	};

	KDialog.prototype.destroy = function() {
		console.log("KDialog destroyed");
	};

	// plugin wrapper around the constructor,
	$.fn[pluginName] = function(options) {
		return this.each(function(){
			if(! $.data(this, pluginName)) 
				$.data(this, pluginName, new KDialog(this, options));  //instance
		});
	};

})(jQuery, window, document);