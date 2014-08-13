//javascript document
;(function($, window, document, undefined) {

	'use strict';

	// Create the defaults once
	var pluginName = "kdialog",
		defaults = {
			css: true, 
			beforeOpen: function(){},
			beforeClose: function(){},
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
		
		var _busy = false, _animationPrefixed, _transitionPrefixed,	_animationEndEvent;
		
		var _getPrefixedProperty = function(prop) {
			var prefix = ["webkit", "moz", "MS"], element = document.createElement("p");

			if(element.style[prop] == "")
				return prop; //return standard property

			prop = prop.charAt(0).toUpperCase() + prop.slice(1);
			for(var i = 0; i<prefix.length; i++) {
				if(element.style[prefix[i] + prop] == "")
					return prefix[i] + prop; //return prefixed property
			}
		};

		var _initStaticScope = function() {
			_animationPrefixed = _getPrefixedProperty("animation"),
			_transitionPrefixed = _getPrefixedProperty("transition");
			_animationEndEvent = _animationPrefixed + (_animationPrefixed === "animation"?"end":"End");
		};

		var init = function() {
			var _self = this, $element = $(this.element);
			$element.on("touchstart click", "[data-action=close]", function(e){
				e.preventDefault();
				close.call(_self);
			});
		};

		var open = function() {
			// hey, It has opened already. so, return
			if(this.isOpen || _busy) return;

			var _self = this, $element = $(_self.element), animations;

			_busy = true;
			_self.isOpen = true;	
			_self.settings.beforeOpen();
			$element.show();
			$element.addClass("in");
			animations = _animationPrefixed + "Name";

			if(animations) {
				$element.on(_animationEndEvent, function() {
					$element.off(_animationEndEvent);
					$element.removeClass("in");
					_busy = false;
					_self.settings.open();
				});
			} else {

			};
		};

		var close = function() {
			// nothing to close. so, return
			if(!this.isOpen || _busy) return;

			var _self = this, $element = $(_self.element), animations;

			_busy = true;
			$element.addClass("out");
			_self.settings.beforeClose();
			animations = _animationPrefixed + "Name";

			if(animations) {
				$element.on(_animationEndEvent, function() {
					$element.off(_animationEndEvent);
					$element.removeClass("out").hide();
					_self.isOpen = false;
					_busy = false;
					_self.settings.close();
				});
			} else {

			};
		};

		var destroy = function() {
			var _self = this, $element = $(_self.element);
		};

		_initStaticScope();

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