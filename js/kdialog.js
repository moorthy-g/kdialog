//javascript document
;(function($, window, document, undefined) {

	'use strict';

	// Create the defaults once
	var pluginName = "kdialog",
		defaults = {
			css: true, //if css animation
			modal: true, //if overlay
			actionHandlers: {}, //[data-action] handlers
			wrapperClass: null, //class to add in wrapper
			position: ["auto","auto"], //null/auto/integer
			beforeOpen: function(){}, //invokes before css animation happens
			beforeClose: function(){}, //invokes before css animation happens
			open: function(){}, //invokes at end of css animation
			close: function(){} //invokes at end of css animation
		};

	// The plugin constructor
	function KDialog(element, options) {
		this.element = element;
		this.isOpen = false;
		this.settings = $.extend(defaults, options);
		this.init();		
	};

	KDialog.prototype = function() { //anonymous scope, builds object prototype

		//static variables
		var BUSY = false, ANIM_PREFIXED, TRANS_PREFIXED, ANIM_END_EVENT, OVERLAY, EDGE_PADDING=20;

		/*private methods*/
		//returns vendor prefixed property
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
			ANIM_PREFIXED = _getPrefixedProperty("animation"),
			TRANS_PREFIXED = _getPrefixedProperty("transition");
			if(ANIM_PREFIXED) { //
				ANIM_END_EVENT = ANIM_PREFIXED + (ANIM_PREFIXED === "animation"?"end":"End");
			};
		};

		var _open = function() {
			BUSY = false;
			this.settings.open.call(this); //callback
		};

		var _close = function() {
			
			this.$wrapper.hide();
			BUSY = false;
			this.isOpen = false;

			//hide modal
			if(this.settings.modal)
				OVERLAY.fadeOut(200);

			this.settings.close.call(this); //callback

		};

		//handles facbook vertical placement
		var _handleFBCanvasY = function(y) {
			/* to place dialog in FB app by getting the visible area of the app canvas */
			/* note: no fixed header in canvas page*/
			var _self=this, offsetY, visibleTop, visibleBtm, visibleArea, dialogHeight,
			 documentHeight = document.documentElement.clientHeight;

			/*note: for tab page, coverHeight is the static space from bottom of navbar to beginin of app iframe*/
			var isTab, FBHeaders, coverHeight=389, PageAdminSpaceCorrection = 10;

			window.FB.Canvas.getPageInfo(function(info) {
				//wheather tab or canvas page (this is temproary, have to improve tab detection)
				isTab = document.documentElement.clientWidth === 810;
				//find fixed header space of tab page (it varies for user & admin)
				FBHeaders = isTab?info.offsetTop-coverHeight:0; 
				//do corrections (extra **px added margin for admin)
				FBHeaders -= FBHeaders>50?PageAdminSpaceCorrection:0;
				//iframes' offset top related to main window
				offsetY = info.offsetTop-info.scrollTop-FBHeaders; 
				// the top most visible pixel of app canvas
				visibleTop = offsetY<0?Math.abs(offsetY):0; 
				//the bottom most visible pixel of app canvas
				visibleBtm = (offsetY<0?info.clientHeight+visibleTop:info.clientHeight-offsetY)-FBHeaders;
				//don't count pixels beyond app canvas
				visibleBtm = visibleBtm>documentHeight?documentHeight:visibleBtm;


				if(y=="auto") {
					visibleArea = visibleBtm-visibleTop;
					dialogHeight = _self.$wrapper.height();

					// if enough space, place it center
					if(visibleArea>=dialogHeight)
						y = (visibleArea-dialogHeight)/2;
					// don't allow dialog to exceed document height unless limited top
					else if(visibleTop+dialogHeight>documentHeight)
						y = visibleArea-dialogHeight-EDGE_PADDING;
					// place it on top
					else {
						y = EDGE_PADDING;
					}
				}

				_self.$wrapper.css("top", y+visibleTop);

			});
		};

		var init = function() {
			var _self = this, $dialog = $(this.element);

			// initiate overlay one time
			if(_self.settings.modal && ! OVERLAY) {
				OVERLAY = $("<div class='koverlay'></div>");
				OVERLAY.insertBefore($dialog);
			}

		 	//create a dialog wrapper. add if any wrapper class
		 	$dialog.wrap("<div class='kwrapper"+(_self.settings.wrapperClass?" "+_self.settings.wrapperClass:"")+"'></div>");
		 	_self.$wrapper = $dialog.parent(); 
		 	$dialog.show();

			/* tap any element that has [data-action=*] within dialog, it performs the correspondent action handler
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
			//no fancy css animations for old andriod even though it supports partial animation
			if(/android [1-2\.]/i.test(navigator.userAgent.toLowerCase()))
				_self.settings.css = false;

		};

		var open = function() {
			// It has opened or the plugin is busy. so, return
			if(this.isOpen || BUSY) return;

			var _self = this, $dialog = $(_self.element), animations;

			BUSY = true; //make the plugin busy
			_self.isOpen = true; 
			_self.settings.beforeOpen.call(_self); //callback
			_self.$wrapper.show();

			//set position
			if(_self.settings.position)
				_self.position(this.settings.position[0], this.settings.position[1]);

			//show modal
			if(_self.settings.modal)
				OVERLAY.fadeIn(200);

			//go for css animation if css set to true in options & browser supports animation
			if(_self.settings.css && ANIM_END_EVENT) {
				$dialog.addClass("in");
				animations = ANIM_PREFIXED + "Name";
				if($dialog.css(animations) != "none") { //if any css animation to play, handle end event.
					$dialog.on(ANIM_END_EVENT, function() {
						$dialog.off(ANIM_END_EVENT);
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
			// nothing to close or the plugin is busy. so, return
			if(!this.isOpen || BUSY) return;

			var _self = this, $dialog = $(_self.element), animations;

			BUSY = true;
			_self.settings.beforeClose.call(_self);

			//go for css animation if css set to true in options & browser supports animation
			if(_self.settings.css  && ANIM_END_EVENT) { 
				$dialog.addClass("out");
				animations = ANIM_PREFIXED + "Name";
				if($dialog.css(animations) != "none") { //if any css animation to play, handle end event.
					$dialog.on(ANIM_END_EVENT, function() {
						$dialog.off(ANIM_END_EVENT).removeClass("out");
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

		var position = function(x, y) {

			//vertical placement
			if(window.FB && window.FB.Canvas && y) { //handle placement in facebook canvas mode
				_handleFBCanvasY.call(this, y);
			} else if(y) { //handle placement in normal mode
				if(y=="auto") {
					y = (document.documentElement.clientHeight-this.$wrapper.height())/2;
					y = y<EDGE_PADDING?EDGE_PADDING:y;
				} 
				this.$wrapper.css("top", y+document.body.scrollTop);
			}

			//horizontal placement
			if(x){
				x = x=="auto"?(document.documentElement.clientWidth-this.$wrapper.width())/2:x;
				this.$wrapper.css("left", x+document.body.scrollLeft);
			}
			
		};

		var destroy = function() {
			var _self = this;
			//remove wrapper & hide dialog
			$(this.element).unwrap().hide();
			//remove events
			_self.$wrapper.off("touchstart click");
			//hide overlay
			OVERLAY.hide();
		};

		_initStaticScope();

		//return public methods
		return {
			init: init,	open: open, close: close, position: position, destroy: destroy
		};

	}();

	// plugin wrapper around the constructor
	$.fn[pluginName] = function(options) {
		return this.each(function(){
			if(! $.data(this, pluginName))
				$.data(this, pluginName, new KDialog(this, options));  //instance
		});
	};

})(jQuery, window, document);