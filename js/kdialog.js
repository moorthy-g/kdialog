;(function(factory) {

	if(typeof define === "function" && define.amd){
		// AMD. Register as an anonymous module.
		define(["jquery"], factory);
	} else {
		// Browser globals
		factory(jQuery);
	}

}(function($) {

	'use strict';

	// Create the defaults once
	var pluginName = "kdialog",
		defaults = {
			css: "animation", //whether use animation/transition/null
			modal: true, //if overlay
			actionHandlers: {}, //[data-action] handlers
			wrapperClass: null, //class to add in wrapper
			position: ["auto","auto"], //null/auto/integer
			easyClose: false, //close on esc & close overlay tap
			transitFrom: null, //object of animatable css properties
			transitTo: null, //object of animatable css properties
			beforeOpen: function(){}, //invokes before css animation happens
			beforeClose: function(){}, //invokes before css animation happens
			open: function(){}, //invokes at end of css animation
			close: function(){} //invokes at end of css animation
		};


	// The plugin constructor
	function KDialog(element, options) {
		this.element = element;
		this.isOpen = false;
		this.busy = false;
		this.settings = $.extend({}, defaults, options);
		this.id = 0;
		this.init();		
		return this;	
	};

	KDialog.prototype = function() { //anonymous scope, builds object prototype

		//static variables
		var ANIM_PREFIXED, TRANS_PREFIXED, ANIM_END_EVENT, 
		TRANS_END_EVENT, COUNT=0, $OVERLAY, MODAL=0, EDGE_PADDING=20,
		OLD_ANDROID = /android [1-2\.]/i.test(navigator.userAgent.toLowerCase());

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
			if(ANIM_PREFIXED) //
				ANIM_END_EVENT = ANIM_PREFIXED + (ANIM_PREFIXED === "animation"?"end":"End");
			if(TRANS_PREFIXED) 
				TRANS_END_EVENT = TRANS_PREFIXED + (TRANS_PREFIXED === "transition"?"end":"End");
		};

		var _open = function() {
			this.busy = false;
			this.settings.open.call(this); //callback
		};

		var _close = function() {
			
			//remove all inline styles
			this.$wrapper.removeAttr("style");
			this.busy = false;
			this.isOpen = false;

			//hide modal && handle multiple modal dialogs 
			if(this.settings.modal && --MODAL < 1)
				$OVERLAY.fadeOut(200);

			this.settings.close.call(this); //callback

		};

		//handle dialog placement
		var _position = function() {

			//do position, only if the dialog has opened
			if(!this.isOpen) return;

			var x = this.settings.position[0], y = this.settings.position[1];

			//vertical placement
			if(window.Env && window.Env.fb.mode == "canvas" && y != null) { //handle placement in facebook canvas mode
				_handleFBCanvasY.call(this, y);
			} else if(y != null) { //handle placement in normal mode
				if(y == "auto") {
					y = (document.documentElement.clientHeight-this.$wrapper.height())/2;
					y = y<EDGE_PADDING?EDGE_PADDING:y;
				} 
				//some browser(chrome) returns page scroll position in document.body.scrollTop
				this.$wrapper.css("top", y+(document.documentElement.scrollTop||document.body.scrollTop));
			}

			//horizontal placement
			if(x != null){
				x = x=="auto"?(document.documentElement.clientWidth-this.$wrapper.width())/2:x;
				this.$wrapper.css("left", x+(document.documentElement.scrollLeft||document.body.scrollLeft));
			}
			
		};

		//handles facebook vertical placement
		var _handleFBCanvasY = function(y) {
			/* to place dialog in FB app by getting the visible area of the app canvas */
			/* note: no fixed header in canvas page*/
			var _self=this, offsetY, visibleTop, visibleBtm, visibleArea, dialogHeight,
			 documentHeight = document.documentElement.clientHeight;

			/*note: for tab page, coverHeight is the static space from bottom of navbar to beginin of app iframe*/
			var isTab, FBHeaders, fixedHeader = 50, coverHeight=389, PageAdminSpaceCorrection = 10;

			window.FB.Canvas.getPageInfo(function(info) {
				//wheather tab or canvas page (this is temproary, have to improve tab detection)
				isTab = document.documentElement.clientWidth === 810;
				//find fixed header space of tab page (it varies for user & admin)
				FBHeaders = isTab?info.offsetTop-coverHeight:0; 
				//do corrections (extra **px added margin for admin)
				FBHeaders -= FBHeaders>fixedHeader?PageAdminSpaceCorrection:0;
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
			if(_self.settings.modal && ! $OVERLAY) {
				$OVERLAY = $("<div class='koverlay'></div>");
				$OVERLAY.insertBefore($dialog);
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
				} else if(action = _self.settings.actionHandlers[action]) {
					action.call(_self, e);
				}
				
			});

			//increase instance count
			_self.id =  COUNT++;

		};

		var open = function() {
			// It has opened or the plugin is busy. so, return
			if(this.isOpen || this.busy) return;

			var _self = this, $dialog = $(_self.element), animations;

			_self.busy = true;
			_self.isOpen = true; 
			_self.$wrapper.show();

			//set position
			if(_self.settings.position)
				_position.call(_self);

			_self.settings.beforeOpen.call(_self); //callback

			//show modal
			if(_self.settings.modal) {
				MODAL++;
				$OVERLAY.fadeIn(200);
			}

			//go for css animation if css set to animation in options & browser supports animation
			if(!OLD_ANDROID && _self.settings.css === "animation" && ANIM_END_EVENT) {
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
			else if(!OLD_ANDROID && _self.settings.css === "transition" && TRANS_END_EVENT) {

				var transitFrom = _self.settings.transitFrom, transitTo = _self.settings.transitTo;

				$dialog.on(TRANS_END_EVENT, function() {
					$dialog.off(TRANS_END_EVENT);
					$dialog.removeClass("transition")
					_open.call(_self);
				});

				if(transitFrom && transitTo) { //dynamic transition
					$dialog.css(transitFrom);
					setTimeout(function(){
						$dialog.addClass("transition").css(transitTo);	
					}, 10);
				} else { //static transition
					$dialog.addClass("from");
					setTimeout(function(){
						$dialog.addClass("transition").removeClass("from");
					}, 10);
				}

			}
			else { //if animation set to false, go without css animation
				_open.call(_self);
			};

			//easy close
			if(_self.settings.easyClose) {
				$(document).on("keyup.kdid"+_self.id, function(e){
					//close on esc key press
					e.which == 27 && close.call(_self);	
				});
				$OVERLAY.on("click.kdid"+_self.id, function(e){
					//close on overlay click
					close.call(_self);	
				});
			}

		};

		var close = function() {
			// nothing to close or the plugin is busy. so, return
			if(!this.isOpen || this.busy) return;

			var _self = this, $dialog = $(_self.element), animations;

			_self.busy = true;
			_self.settings.beforeClose.call(_self);

			//easy close
			if(_self.settings.easyClose) {
				$(document).off("keyup.kdid"+_self.id);
				$OVERLAY.off("click.kdid"+_self.id);
			}

			//go for css animation if css set to animation in options & browser supports animation
			if(!OLD_ANDROID && _self.settings.css === "animation"  && ANIM_END_EVENT) { 
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
			}
			else if(!OLD_ANDROID && _self.settings.css === "transition" && TRANS_END_EVENT) {

				var transitFrom = _self.settings.transitFrom, transitTo = _self.settings.transitTo;

				$dialog.on(TRANS_END_EVENT, function() {
					var toRemove = {};

					$dialog.off(TRANS_END_EVENT);
					$dialog.removeClass("transition from");

					if(transitFrom)
						$dialog.removeAttr("style").show();

					_close.call(_self);
				});

				$dialog.addClass("transition");

				if(transitFrom) //dynamic transition
					$dialog.css(transitFrom);
				else //static transition
					$dialog.addClass("from");
				
			}
			else { //if css set to false, go without css animation
				_close.call(_self);
			}

		};

		var refresh = function(options) { //refresh the dialog with given settings

			options && $.extend(this.settings, options);

			//position, live refresh
			_position.call(this);
		};

		var destroy = function() {
			var _self = this;
			//close
			_self.close();
			//remove wrapper & hide dialog
			$(_self.element).unwrap().hide()
			.data(pluginName, null);
			//remove events
			_self.$wrapper.off("touchstart click");

			//decrease instance count & remove overlay if no other dialog instance
			if(--COUNT<1 && $OVERLAY) {
				$OVERLAY.remove();
				$OVERLAY = null;
			} else if($OVERLAY) {//else just hide overlay
				$OVERLAY.hide();
			}
		};

		_initStaticScope();

		//return public methods
		return {
			init: init,	open: open, close: close, refresh: refresh, destroy: destroy
		};

	}();

	// plugin wrapper around the constructor
	$.fn[pluginName] = function() {
		
		var cmd, options;

		//organize arguments
		for(var i = 0, arg; arg=arguments[i],i < 2; i++) {
			if(typeof arg === "object")
				options = arg;
			else if(typeof arg === "string")
				cmd = arg;
		}; 

		return this.each(function() {
			//get instance. if not initiated, create & get one
			var kdialog = $.data(this, pluginName) || $.data(this, pluginName, new KDialog(this, options));
			//extend with new settings
			kdialog.refresh(options);
			//invoke the command
			cmd && cmd != "refresh" && (cmd = kdialog[cmd]) && cmd.call(kdialog);
			
		});
	};

}));