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

	KDialog.prototype = function() { //anonymous scope, builts objects prototype

		//static variables
		var _busy = false, _animationPrefixed, _transitionPrefixed,	_animationEndEvent;

		/*private & public methods*/
		//returns special vendor prefixed property
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

		//set values to static variables
		var _initStaticScope = function() {
			_animationPrefixed = _getPrefixedProperty("animation"),
			_transitionPrefixed = _getPrefixedProperty("transition");
			if(_animationPrefixed) {
				_animationEndEvent = _animationPrefixed + (_animationPrefixed === "animation"?"end":"End");
			};
		};

		var _open = function() {
			_busy = false;
			this.settings.open(); //callback
		};

		var _close = function() {
			$(this.element).hide();
			_busy = false;
			this.isOpen = false;
			this.settings.close(); //callback
		};

		var init = function() {
			var _self = this, $element = $(this.element);
			// tap any element with [data-action=close], closes the dialog
			$element.on("touchstart click", "[data-action=close]", function(e){
				e.preventDefault();
				close.call(_self);
			});
			//no fancy css animations for old andriod
			if(/android [1-2\.]/i.test(navigator.userAgent.toLowerCase()))
				_self.settings.css = false;
		};

		var open = function() {
			// It has opened. so, return
			if(this.isOpen || _busy) return;

			var _self = this, $element = $(_self.element), animations;

			_busy = true; //make the object busy
			_self.isOpen = true; 
			_self.settings.beforeOpen(); //callback
			$element.show();

			//go for css animation if css set to true & browser supports animation
			if(_self.settings.css && _animationEndEvent) { 
				$element.addClass("in");
				animations = _animationPrefixed + "Name";
				if($element.css(animations) != "none") { //if any css animation, perform.
					$element.on(_animationEndEvent, function() {
						$element.off(_animationEndEvent);
						$element.removeClass("in");
						_open.call(_self);
					});
				} else { //else, degrade gracefully
					$element.removeClass("in");
					_open.call(_self);
				};
			}
			else { //if css set to false, go without css animation
				_open.call(_self);
			};
		};

		var close = function() {
			// nothing to close. so, return
			if(!this.isOpen || _busy) return;

			var _self = this, $element = $(_self.element), animations;

			_busy = true;
			_self.settings.beforeClose();

			//go for css animation if css set to true & browser supports animation
			if(_self.settings.css  && _animationEndEvent) { 
				$element.addClass("out");
				animations = _animationPrefixed + "Name";
				if($element.css(animations) != "none") { //if any css animation, perform.
					$element.on(_animationEndEvent, function() {
						$element.off(_animationEndEvent).removeClass("out");
						_close.call(_self);
					});
				} else { //else, degrade gracefully
					$element.removeClass("out");
					_close.call(_self);
				}
			} else { //if css set to false, go without css animation
				_close.call(_self);
			}

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