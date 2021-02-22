(function ( $ ) {

	var elementsToMaximize = [];


	$.fn.maxSize = function(w, h) {
 
	    return this.each(function() {
		    
			var appWidth = w || $(this).width();
			var appHeight = h || $(this).height();
		    $(this).data("orig-width", appWidth);
		    $(this).data("orig-height", appHeight);
			
			$(this).css({	
				position: "absolute",
				overflow: "hidden",
				width: appWidth,
				height: appHeight
			});
			
	    	scaleView([this]);
	        elementsToMaximize.push(this);
	    });
	 
	};


	$(window).on("orientationchange", function(){scaleView()});
	$(window).on("resize", function(){scaleView()});
	
	
	$(window).on("load", function(){
		
		var use_vw = false;
		
		$(".max-size").each(function(id, el){	
			
			var CSSstrVal = $(this).css("width");
			var CSSfloatVal = parseFloat(CSSstrVal);
			var CSSvalLen = String(CSSfloatVal).length;
			var unit = CSSstrVal.substr(CSSstrVal);
			use_vw = use_vw || unit == "vw";
			
			
			if(use_vw){
			    var width = $(this).width();
			    var height = $(this).height();
			    var ratio = width / height * 100;
			    
			    $(el).css({
				    maxHeight: "100vh",
				    maxWidth: ratio + "vh",
				    overflow: "hidden",
				    margin: "auto",
				    position: "absolute",
				    top:0,
				    bottom:0,
				    left:0,
				    right:0
			    });	
			} else {
				$(this).maxSize();
			}
		    
		});
	});

		
	function scaleView(targetElements){
		
		targetElements = targetElements || elementsToMaximize;

		$(targetElements).each(function(){


			//var screenWidth = $(window).width();
			//var screenHeight = $(window).height();
			var screenWidth = window.innerWidth;
			var screenHeight = window.innerHeight;
			
			var screenRatio = screenWidth / screenHeight;
			var landscape = screenRatio > 1;
			
			//var appWidth = parseInt($(this).css("width")) || $(this).data("orig-width");
			//var appHeight = parseInt($(this).css("height")) || $(this).data("orig-height");
			
			if(landscape){
				
				var appWidth = $(this).data("landscape-width") || $(this).data("orig-width");
				var appHeight = $(this).data("landscape-height") || $(this).data("orig-height");
				
			} else {
				
				var appWidth = $(this).data("portrait-width") || $(this).data("orig-width");
				var appHeight = $(this).data("portrait-height") || $(this).data("orig-height");
			}
			var appRatio = appWidth / appHeight;
			var scale = 1;
			var w = appWidth;
			var h = appHeight;
			
			
			if(appRatio > screenRatio) {
				
				// app is more widescreen than screen
				scale = (screenWidth / appRatio) / appHeight;
				
			} else {
				
				// screen is more widescreen than app
				scale = (screenHeight * appRatio) / appWidth;
				
			}
			
			var cssScaleVal = "scale(" + scale + "," + scale + ") ";
			var cssTranslateVal = "translate(0%, 0%) ";
			var originVal = "0 0";
			
			appWidth*=scale;
			appHeight*=scale;
			
			//var left = (window.innerWidth - appWidth) / 2 + "px";
			//var top = (window.innerHeight - appHeight) / 2 + "px";
			
			var left = (screenWidth - appWidth) / 2 + "px";
			var top = (screenHeight - appHeight) / 2 + "px";
			    
			$(this).css({
			    "-ms-transform": cssTranslateVal + cssScaleVal, /* IE 9 */
				"-webkit-transform": cssTranslateVal + cssScaleVal, /* Chrome, Safari, Opera */
				transform: cssTranslateVal + cssScaleVal,

				"-ms-transform-origin": originVal, /* IE 9 */
				"-webkit-transform-origin": originVal, /* Chrome, Safari, Opera */
				transformOrigin: originVal,
				
				width: w,
				height: h,
				top: top,
				left: left
			});
		
		});
	}

}( jQuery ));