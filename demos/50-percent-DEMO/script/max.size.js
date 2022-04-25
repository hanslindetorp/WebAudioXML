(function () {

	var elementsToMaximize = [];

	let style = document.createElement("style");
	style.innerHTML = `

	html, body {
		margin: 0px;
		padding: 0px;
		width: 100%;
		height: 100%;
	}

	.pages section{
		position: absolute;
		width: 100%;
		height: 100%;
		opacity: 0;
		z-index: -1;
		box-sizing: border-box;
		background-size: cover;
		transition: 500ms;
	}

	.pages section:target {
		opacity: 1;
		z-index: 0;
	}
	`;
	document.head.appendChild(style);



	function maxSize(el) {

	    //return this.each(function() {

		    // this.el.style.cssText

			var appWidth = el.offsetWidth; // el.style.cssText.width || 
			var appHeight = el.offsetHeight; // el.style.cssText.height ||

		    el.dataset.origWidth = appWidth;
		    el.dataset.origHeight = appHeight;

			el.style.position = "absolute";
			el.style.overflow = "hidden";
			el.style.width = appWidth;
			el.style.height = appHeight;

	    	scaleView([el]);
	        elementsToMaximize.push(el);
	    //});

	}


	window.addEventListener("orientationchange", () => scaleView());
	window.addEventListener("resize", () => scaleView());


	window.addEventListener("load", () => {

		var use_vw = false;

		document.querySelectorAll(".max-size, [data-max-size='true']").forEach((el, id) => {	

			/*
			var CSSstrVal = el.style.cssText.width;
			var CSSfloatVal = parseFloat(CSSstrVal);
			var CSSvalLen = String(CSSfloatVal).length;
			var unit = CSSstrVal.substr(CSSstrVal);
			use_vw = use_vw || unit == "vw";

			*/
			if(use_vw){
			    var width = el.offsetWidth;
			    var height = el.offsetHeight;
			    var ratio = width / height * 100;

			    el.style.maxHeight = "100vh";
				el.style.maxWidth = ratio + "vh";
				el.style.overflow = "hidden";
				el.style.margin = "auto";
				el.style.position = "absolute";
				el.style.top = 0;
				el.style.bottom = 0;
				el.style.left = 0;
				el.style.right = 0;

			} else {
				maxSize(el);
			}

		});
	});


	function scaleView(targetElements){

		targetElements = targetElements || elementsToMaximize;

		targetElements.forEach(el => {


			var screenWidth = window.innerWidth;
			var screenHeight = window.innerHeight;

			var screenRatio = screenWidth / screenHeight;
			var landscape = screenRatio > 1;

			//var appWidth = parseInt($(this).css("width")) || $(this).data("orig-width");
			//var appHeight = parseInt($(this).css("height")) || $(this).data("orig-height");

			if(landscape){

				var appWidth = el.dataset.landscapeWidth || el.dataset.origWidth;
				var appHeight = el.dataset.landscapeHeight || el.dataset.origHeight;

			} else {
				var appWidth = el.dataset.portraitWidth || el.dataset.origWidth;
				var appHeight = el.dataset.portraitHeight || el.dataset.origHeight;
			}
			appWidth = parseFloat(appWidth);
			appHeight = parseFloat(appHeight);
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

			el.style["-ms-transform"] = cssTranslateVal + cssScaleVal; /* IE 9 */
			el.style["-webkit-transform"] = cssTranslateVal + cssScaleVal; /* Chrome, Safari, Opera */
			el.style.transform = cssTranslateVal + cssScaleVal;
			el.style["-ms-transform-origin"] = originVal; /* IE 9 */
			el.style["-webkit-transform-origin"] = originVal; /* Chrome, Safari, Opera */
			el.style.transformOrigin = originVal;
			el.style.width = w;
			el.style.height = h;
			el.style.top = top;
			el.style.left = left;

			el.dataset.scale = scale;


			// extra fix for non-scalable objects like CodeMirror
			el.querySelectorAll(".CodeMirror-cursors, .CodeMirror-measure:nth-child(2) + div").forEach(cmObj => {
				cmObj.style.transform = `scale(${1/scale},${1/scale}) translate(0%, 0%)`;
				cmObj.style.transformOrigin = "0 0";
			});

		});

	}

}());
