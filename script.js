function positionFB(){
	/*misson: to get visible area of app*/
	// no fixed headers in canvas page
	var offsetY, visibleTop, visibleBtm;
	// for tab page. coverHeight is the static space between bottom of navbar & starting of app iframe
	var isTab, FBHeaders, coverHeight=389, PageAdminSpaceCorrection = 10;

	FB.Canvas.getPageInfo(function(info) {
		//whether tab or canvas page
		isTab = document.documentElement.clientWidth === 810;
		//find fixed header space of tab page (ex: insights)
		FBHeaders = isTab?info.offsetTop-coverHeight:0; 
		//do corrections
		FBHeaders -= FBHeaders>50?PageAdminSpaceCorrection:0;
		//iframes' offset top in main window
		offsetY = info.offsetTop-info.scrollTop-FBHeaders; 
		// the top most visible pixel of app
		visibleTop = offsetY<0?Math.abs(offsetY):0; 
		//the bottom most visible pixel of app
		visibleBtm = (offsetY<0?info.clientHeight+visibleTop:info.clientHeight-offsetY)-FBHeaders;
		visibleBtm = visibleBtm>document.documentElement.clientHeight?document.documentElement.clientHeight:visibleBtm;

		//prepare visual testing elements
		if(!window.testReady) {
			$("body").append("<div id=test_height></div>")
					.append("<div id=test_top></div>")
					.append("<div id=test_btm></div>");
			$("body").height(2000);
			$("#test_height").css({
				position: "absolute",
				background: "green",
				width: "100%",
				height: 100
			});
			$("#test_top").css({
				position: "absolute",
				background: "red",
				width: "100%",
				height: 10
			});
			$("#test_btm").css({
				position: "absolute",
				background: "red",
				width: "100%",
				height: 10,
				marginTop: -10
			});
			window.testReady = true;
		}

		$("#test_top").css("top", visibleTop);
		$("#test_btm").css("top", visibleBtm);
		$("#test_height").css({
			"top": visibleTop,
			"height": visibleBtm-visibleTop
		});
	});
};
positionFB();



//injection
var s = "<link href=http://localhost/GitHub/kdialog/style/kdialog.css rel=stylesheet></link>"+
"<script src=http://localhost/GitHub/kdialog/js/kdialog.js></script>";
$("head").append(s);
$("#container").css("overflow", "hidden").css("position", "relative").height(1000).append('<div id="kdialog" class="kdialog">'+
'<h1>Pourquoi cette autorisation</h1>'+
'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean placerat magna vitae odio vehicula elementum. Suspendisse potenti. Interdum et malesuada fames ac ante ipsum primis in faucibus. Fusce rhoncus sollicitudin ipsum, in pharetra urna condimentum nec. Ut ultricies risus sed mi consequat, eu varius nunc ornare. Ut rhoncus libero dignissim velit feugiat iaculis. Mauris ac nulla sed lectus luctus lacinia a vel mi. Fusce sagittis mi lectus, nec suscipit quam iaculis eget. Praesent eleifend varius quam, et pharetra quam.</p>'+
'<p>Donec ultrices venenatis arcu ut pulvinar. Ut pellentesque magna a euismod tincidunt. Vivamus ut diam et justo sodales molestie. Donec ornare laoreet sem a dictum. Sed sem ante, vestibulum vitae tincidunt ac, sollicitudin et elit. Nullam vel dui id tortor rhoncus ultricies vitae volutpat magna. Nulla mattis mauris sit amet dui imperdiet, ac dignissim metus dictum. Morbi id pellentesque mi, ut ultrices tortor. Nam hendrerit venenatis est, eu lacinia odio blandit aliquet. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Mauris dolor lacus, dictum vitae hendrerit eget, sodales sed massa. Sed aliquam velit ac ligula sodales imperdiet. Pellentesque sit amet eros laoreet, cursus diam id, feugiat diam. Duis nec laoreet nisl. Integer gravida, nisl vel luctus facilisis, ipsum neque posuere lorem, et posuere magna urna et neque. Nulla tempus eleifend lorem, id egestas tortor.</p>'+
'<a href="#" data-action="close">Close Dialog</a>'+
'<p>An Example for action handlers <a href="#" data-action="move">Move Dialog</a></p></div>');
$("#kdialog").kdialog().data("kdialog").open();