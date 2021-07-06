(function ( $ ) {

	var elementsToMaximize = [];


	$.fn.maxSize = function(w, h) {
 
	    return this.each(function() {
	    	scaleView([this], w, h);
	        elementsToMaximize.push(this);
	    });
	 
	};


	$(window).on("orientationchange", function(){scaleView()});
	$(window).on("resize", function(){scaleView()});

		
	function scaleView(targetElements, w, h){
		
		targetElements = targetElements || elementsToMaximize;

		$(targetElements).each(function(){

			var screenRatio = window.innerWidth / window.innerHeight;
			var appWidth = w || $(this).width();
			var appHeight = h || $(this).height();
			var appRatio = appWidth / appHeight;
			var scale = 1;
			
			$(this).css({	
				width: appWidth,
				height: appHeight
			});
			
			
			if(appRatio > screenRatio) {
				
				// app is more widescreen than screen
				scale = (window.innerWidth / appRatio) / appHeight;
				
			} else {
				
				// screen is more widescreen than app
				scale = (window.innerHeight * appRatio) / appWidth;
				
			}
			
			var cssScaleVal = "scale(" + scale + "," + scale + ") ";
			var cssTranslateVal = "translate(0%, 0%) ";
			var originVal = "0 0";
			
			appWidth*=scale;
			appHeight*=scale;
			
			var left = (window.innerWidth - appWidth) / 2 + "px";
			var top = (window.innerHeight - appHeight) / 2 + "px";
			    
			$(this).css({
			    "-ms-transform": cssTranslateVal + cssScaleVal, /* IE 9 */
				"-webkit-transform": cssTranslateVal + cssScaleVal, /* Chrome, Safari, Opera */
				transform: cssTranslateVal + cssScaleVal,

				"-ms-transform-origin": originVal, /* IE 9 */
				"-webkit-transform-origin": originVal, /* Chrome, Safari, Opera */
				transformOrigin: originVal,
				
				position: "absolute",

				top: top,
				left: left
			});
		
		});
	}

}( jQuery ));