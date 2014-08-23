//javascript document
;(function($, window, document, undefined) {

	'use strict';

	// Create the defaults once
	var pluginName = "kdialog",
		defaults = {
			css: true,
			modal: true,
			actionHandlers: {},
			wrapperClass: null,
			position: ["center","center"], //null/integer
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

	KDialog.prototype = function() { //anonymous scope, builds objects prototype

		//static variables
		var _busy = false, _animationPrefixed, _transitionPrefixed,	_animationEndEvent, _overlay;

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
			this.settings.open.call(this); //callback
		};

		var _close = function() {
			
			this.$wrapper.hide();
			_busy = false;
			this.isOpen = false;

			//hide modal
			if(this.settings.modal)
				_overlay.fadeOut(200);

			this.settings.close.call(this); //callback

		};

		var _position = function(){
			if(this.settings.position instanceof Array) {
				var x = this.settings.position[0], y = this.settings.position[1];

				if(window.FB && window.FB.Canvas && y) { //handle placement in facebook canvas mode
					_handleFBCanvasY.call(this, y);
				} else { //handle placement in normal mode
					y = (y&&y=="center")?(document.documentElement.clientHeight-this.$wrapper.height())/2:y;
					this.$wrapper.css("top", y+document.body.scrollTop);
				}

				x = (x&&x=="center")?(document.documentElement.clientWidth-this.$wrapper.width())/2:x;
				this.$wrapper.css("left", x+document.body.scrollLeft);
			}
		};

		var _handleFBCanvasY = function(y){
			/* to place dialog in FB app by getting the visible area of the app canvas */
			// no fixed headers in canvas page
			var _self=this, offsetY, visibleTop, visibleBtm, visibleArea, dialogHeight;
			// for tab page. coverHeight is the static space between bottom of navbar & starting of app iframe
			var isTab, FBHeaders, coverHeight=389, PageAdminSpaceCorrection = 10;

			window.FB.Canvas.getPageInfo(function(info) {
				//wheather tab or canvas page
				isTab = document.documentElement.clientWidth === 810;
				//find fixed header space of tab page (ex: insights)
				FBHeaders = isTab?info.offsetTop-coverHeight:0; 
				//do corrections
				FBHeaders -= FBHeaders>50?PageAdminSpaceCorrection:0;
				//iframes' offset top in main window
				offsetY = info.offsetTop-info.scrollTop-FBHeaders; 
				// the top most visible pixel of app canvas
				visibleTop = offsetY<0?Math.abs(offsetY):0; 
				//the bottom most visible pixel of app canvas
				visibleBtm = (offsetY<0?info.clientHeight+visibleTop:info.clientHeight-offsetY)-FBHeaders;
				//don't count pixels beyond app canvas
				visibleBtm = visibleBtm>document.documentElement.clientHeight?document.documentElement.clientHeight:visibleBtm;


				if(y=="center") {
					visibleArea = visibleBtm-visibleTop;
					dialogHeight = _self.$wrapper.height();

					// if enough space, place it center
					if(visibleArea>=dialogHeight)
						y = (visibleArea-dialogHeight)/2;
					// if enough space place it center
					else if(visibleTop+dialogHeight>document.documentElement.clientHeight)
						y = visibleArea-dialogHeight;
					// if enough space place it center
					else
						y = 0;
				}

				_self.$wrapper.css("top", y+visibleTop);

			});
		};

		var init = function() {
			var _self = this, $dialog = $(this.element);

			// initiate overlay one time
			if(_self.settings.modal && ! _overlay) {
				_overlay = $("<div class='koverlay'></div>");
				_overlay.insertBefore($dialog);
			}

		 	//create a dialog wrapper. add if any wrapper class
		 	$dialog.wrap("<div class='kwrapper"+(_self.settings.wrapperClass?" "+_self.settings.wrapperClass:"")+"'></div>");
		 	_self.$wrapper = $dialog.parent();

			/* tap any element that has [data-action=*], it performs the correspondent action handler
			defined in plugin settings*/
			_self.$wrapper.on("touchstart click", "[data-action]", function(e){
				e.preventDefault();
				var action = this.getAttribute("data-action");
				if(action === "close") { //default close action handler
					close.call(_self);	
				} else {
					_self.settings.actionHandlers[action].call(_self);
				}
				
			});
			//no fancy css animations for old andriod
			if(/android [1-2\.]/i.test(navigator.userAgent.toLowerCase()))
				_self.settings.css = false;

		};

		var open = function() {
			// It has opened. so, return
			if(this.isOpen || _busy) return;

			var _self = this, $dialog = $(_self.element), animations;

			_busy = true; //make the object busy
			_self.isOpen = true; 
			_self.settings.beforeOpen.call(_self); //callback
			_self.$wrapper.show();

			//set position
			if(_self.settings.position)
				_position.call(_self);

			//show modal
			if(_self.settings.modal)
				_overlay.fadeIn(200);

			//go for css animation if css set to true & browser supports animation
			if(_self.settings.css && _animationEndEvent) {
				$dialog.addClass("in");
				animations = _animationPrefixed + "Name";
				if($dialog.css(animations) != "none") { //if any css animation, perform.
					$dialog.on(_animationEndEvent, function() {
						$dialog.off(_animationEndEvent);
						$dialog.removeClass("in");
						_open.call(_self);
					});
				} else { //else, degrade gracefully
					$dialog.removeClass("in");
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

			var _self = this, $dialog = $(_self.element), animations;

			_busy = true;
			_self.settings.beforeClose.call(_self);

			//go for css animation if css set to true & browser supports animation
			if(_self.settings.css  && _animationEndEvent) { 
				$dialog.addClass("out");
				animations = _animationPrefixed + "Name";
				if($dialog.css(animations) != "none") { //if any css animation, perform.
					$dialog.on(_animationEndEvent, function() {
						$dialog.off(_animationEndEvent).removeClass("out");
						_close.call(_self);
					});
				} else { //else, degrade gracefully
					$dialog.removeClass("out");
					_close.call(_self);
				}
			} else { //if css set to false, go without css animation
				_close.call(_self);
			}

		};

		var destroy = function() {
			var _self = this, $dialog = $(_self.element);
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