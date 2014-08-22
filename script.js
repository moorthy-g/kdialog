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