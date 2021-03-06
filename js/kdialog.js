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
			wrapperClass: "kdefault", //class to add in wrapper
			position: ["auto","auto"], //null/auto/integer
			watchForResize: false, //adjust dialog position as window resize
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
		this.wrapper = null;
		this.isOpen = false;
		this.busy = false;
		this.settings = $.extend({}, defaults, options);
		this.id = 0;
		this.init();	
	};

	KDialog.prototype = function() { //anonymous scope, builds object prototype

		//static variables
		var ANIM_PREFIXED, TRANS_PREFIXED,
		ANIM_END_EVENT = "animationend webkitAnimationEnd mozAnimationEnd",
		TRANS_END_EVENT = "transitionend webkitTransitionEnd mozTransitionEnd",
		RESIZE_EVENT = "onorientationchange" in window?"orientationchange":"resize",
		COUNT=0, OVERLAY, MODAL=0, EDGE_PADDING=20,
		OLD_ANDROID = /android [1-2\.]/i.test(navigator.userAgent.toLowerCase());


		/*private methods -- kindof*/
		//detect animation & transition support
		var _detectSupports = function() {

			var prefixes = ["webkit","moz"], style = document.createElement("p").style;

			//check for standard property
			if(style.animation !== undefined)
				ANIM_PREFIXED = "animation";
			if(style.transition !== undefined) 
				TRANS_PREFIXED = "transition";

			//check for prefixed property
			for(var i=0, prefix; i<prefixes.length, prefix = prefixes[i]; i++) {
				if(ANIM_PREFIXED && TRANS_PREFIXED)
					break;
				if(style[prefix+"Animation"] !== undefined)
					ANIM_PREFIXED = prefix + "Animation";
				if(style[prefix[i]+"Transition"] !== undefined)
					TRANS_PREFIXED = prefix + "Transition";

			}

		};

		var _open = function() {
			this.busy = false;
			this.settings.open.call(this); //callback
		};

		var _close = function() {
			
			//remove all inline styles
			/* there is a problem in safari 5 & IOS 6 while using "removeAttribute('style')".
			 using "setAttribute" to empty the style serves the purpose*/
			this.wrapper.setAttribute("style", "");
			/* in IE8, Empty string does't affect the style attribute. so, remove after making it empty*/
			this.wrapper.removeAttribute("style");

			this.busy = false;
			this.isOpen = false;

			//hide modal && handle multiple modal dialogs 
			if(this.settings.modal && --MODAL < 1)
				$(OVERLAY).fadeOut(200);

			this.settings.close.call(this); //callback

		};

		//handle dialog placement
		var _position = function() {

			//do position, only if the dialog has opened
			if(!this.isOpen && !this.settings.position) return;

			var x = this.settings.position[0], y = this.settings.position[1], wrapper = this.wrapper;

			//vertical placement
			if(window.Env && window.Env.fb.mode == "canvas" && y != null) { //handle placement in facebook canvas mode
				_handleFBCanvasY.call(this, y);
			} else if(y != null) { //handle placement in normal mode
				if(y == "auto") {
					y = (document.documentElement.clientHeight-wrapper.clientHeight)/2;
					y = y<EDGE_PADDING?EDGE_PADDING:y;
				} 
				//some browser(chrome) returns page scroll position in document.body.scrollTop
				wrapper.style.top = y+(document.documentElement.scrollTop||document.body.scrollTop)+"px";
			} else if(! this.busy) {
				wrapper.style.top = "";
			}

			//horizontal placement
			if(x != null) {
				x = x=="auto"?(document.documentElement.clientWidth-wrapper.clientWidth)/2:x;
				wrapper.style.left = x+(document.documentElement.scrollLeft||document.body.scrollLeft)+"px";
			} else if(! this.busy) {
				wrapper.style.left = "";
			}
			
		};

		//handles facebook vertical placement
		var _handleFBCanvasY = function(y) {
			/* to place dialog in FB app by getting the visible area of the app canvas */
			/* note: no fixed header in canvas page*/
			var _self=this, offsetY, visibleTop, visibleBtm, visibleArea, dialogHeight,
			 documentHeight = document.documentElement.clientHeight, wrapper = this.wrapper;

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
					dialogHeight = wrapper.clientHeight;

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

				wrapper.style.top = y+visibleTop+"px";

			});
		};

		var init = function() {
			var _self = this, dialog = this.element, wrapper;

			

			// initiate overlay one time
			if(_self.settings.modal && ! OVERLAY) {
				OVERLAY = document.createElement("div");
				OVERLAY.className = "koverlay";
				document.body.appendChild(OVERLAY);
			}

		 	//create a dialog wrapper. add wrapper class, if any
		 	wrapper = this.wrapper = document.createElement("div");
		 	wrapper.className = "kwrapper "+ (_self.settings.wrapperClass||"kdefault");
		 	wrapper.appendChild(dialog);

		 	//make it, a direct child of "body"
			document.body.appendChild(wrapper);
			dialog.style.display = "block";

			/* tap any element that has [data-action=*] within dialog, it performs the correspondent action handler
			defined in plugin settings*/
			$(wrapper).on("click", "[data-action]", function(e){
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

			console.log("init");

		};

		var open = function() {
			// It has opened or the plugin is busy. so, return
			if(this.isOpen || this.busy) return;

			var _self = this, dialog = this.element, $dialog = $(dialog), animations;

			_self.busy = true;
			_self.isOpen = true; 
			_self.wrapper.style.display = "block";

			//set position
			_position.call(_self);

			_self.settings.beforeOpen.call(_self); //callback

			//show modal
			if(_self.settings.modal) {
				MODAL++;
				$(OVERLAY).fadeIn(200);
			}

			//go for css animation if css set to animation in options & browser supports animation
			if(_self.settings.css === "animation" && !OLD_ANDROID && ANIM_PREFIXED) {
				$dialog.addClass("in");
				animations = ANIM_PREFIXED + "Name";
				/* use computed style to get the property value defined in css.
				direct access, only works with inline properties */
				/*getComputedStyle supports from IE9. IE9- doesn't execute this block*/
				if(window.getComputedStyle(dialog)[animations] != "none") { //if any css animation to play, handle end event.
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
			else if(_self.settings.css === "transition" && !OLD_ANDROID && TRANS_PREFIXED) {

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
				OVERLAY && $(OVERLAY).on("click.kdid"+_self.id, function(e){
					//close on overlay click
					close.call(_self);	
				});
			};

			//watch for resize
			if(_self.settings.watchForResize) {
				$(window).on(RESIZE_EVENT+".kdid"+_self.id, function(e){
					_position.call(_self);
					console.log("resize");
				});
			};
			

		};

		var close = function() {
			// nothing to close or the plugin is busy. so, return
			if(!this.isOpen || this.busy) return;

			var _self = this, dialog = this.element, $dialog = $(dialog), animations;

			_self.busy = true;
			_self.settings.beforeClose.call(_self);

			//easy close
			if(_self.settings.easyClose) {
				$(document).off("keyup.kdid"+_self.id);
				OVERLAY && $(OVERLAY).off("click.kdid"+_self.id);
			}

			//watch for resize
			if(_self.settings.watchForResize) {
				$(window).off(RESIZE_EVENT+".kdid"+_self.id);
			}
			

			//go for css animation if css set to animation in options & browser supports animation
			if(_self.settings.css === "animation" && !OLD_ANDROID && ANIM_PREFIXED) { 
				$dialog.addClass("out");
				animations = ANIM_PREFIXED + "Name";
				if(window.getComputedStyle(dialog)[animations] != "none") { //if any css animation to play, handle end event.
					$dialog.on(ANIM_END_EVENT, function() {
						$dialog.off(ANIM_END_EVENT).removeClass("out");
						_close.call(_self);
					});
				} else { //else, degrade gracefully
					$dialog.removeClass("out");
					_close.call(_self);
				}
			}
			else if(_self.settings.css === "transition" && !OLD_ANDROID && TRANS_PREFIXED) {

				var transitFrom = _self.settings.transitFrom, transitTo = _self.settings.transitTo;

				$dialog.on(TRANS_END_EVENT, function() {
					var toRemove = {};

					$dialog.off(TRANS_END_EVENT);
					$dialog.removeClass("transition from");

					if(transitFrom) {
						dialog.setAttribute("style", "");
						dialog.removeAttribute("style");
						dialog.style.display = "block";
					}

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

		var refresh = function(options, cmd) { //refresh the dialog with given settings

			var settings = this.settings, wrapper = this.wrapper;

			if(options) {
				//extend with current settings
				$.extend(settings, options);
				//refresh wrapperClass, incase any change
				wrapper && (wrapper.className = "kwrapper "+ (settings.wrapperClass||"kdefault"));
			}

			//reposition, unless "close" command
			cmd !== "close" && _position.call(this);

			console.log("refresh");

		};

		var destroy = function() {
			var _self = this, wrapper = this.wrapper;

			//close
			_self.close();

			//remove dialog from DOM
			wrapper.parentNode.removeChild(wrapper);

			//decrease instance count & remove overlay if no other dialog instance
			if(--COUNT<1 && OVERLAY) {
				OVERLAY.parentNode.removeChild(OVERLAY);
				OVERLAY = null;
			} else if(OVERLAY) {//else just hide overlay
				OVERLAY.style.display = "none";
			}
		};

		_detectSupports();

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
			var kdialog = $.data(this, pluginName);
			if(! kdialog ) //if instance not initiated, create one
				kdialog = $.data(this, pluginName, new KDialog(this, options))
			else //if already initiated, refresh
				kdialog.refresh(options, cmd);
			
			//invoke the command
			cmd && cmd != "refresh" && (cmd = kdialog[cmd]) && cmd.call(kdialog);
			
		});
	};

}));