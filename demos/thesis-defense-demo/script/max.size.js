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
	* {
		margin: 0px;
		padding: 0px;
		font-family: sans-serif;
	}
	section > * {
		position: absolute;
	}
	
	body {
		background-color: black;
	}

	main {
		/* display: none; */
		opacity: 0;
	}

	main > section{
		position: absolute;
		width: 100%;
		height: 100%;
		opacity: 0;
		z-index: -1;
		box-sizing: border-box;
		background-size: cover;
		transition: 500ms;
	}

	main > section:target {
		opacity: 1;
		z-index: 0;
	}


	.button {
		background-color: #eee;
		text-decoration: none;
		text-align: center;
		color: black;
		display: inline-block;
		padding: 0.5em 1em;
		border: 1px solid #333;
		border-radius: 0.5em;
	}
	.button:active {
		background-color: #bbb;
	}
	.button:hover {
		background-color: #bbf;
	}
	.relative {
		position: relative;
		display: inline-block;
	}
	.bottom {
		bottom: 10px;
	}

	.left {
		left: 10px;
	}

	.right {
		right: 10px;
	}
	.top {
		top: 10px;
	}
	.h-center {
		left: 50%;
		transform: translate(-50%, 0);
	}
	.v-center {
		top: 50%;
		transform: translate(0, -50%);
	}
	.h-center.v-center {
		transform: translate(-50%, -50%);
	}
	.size-100 {
		display: block;
		width: 100%;
		height: 100%;
	}
	.size-75 {
		display: block;
		width: 75%;
		height: 75%;
	}
	.size-66 {
		display: block;
		width: 66%;
		height: 66%;
	}
	.size-50 {
		display: block;
		width: 50%;
		height: 50%;
	}
	.size-33 {
		display: block;
		width: 33%;
		height: 33%;
	}
	.size-25 {
		display: block;
		width: 25%;
		height: 25%;
	}
	.w-100{
		display: block;
		width: 100%;
		height: auto;
	}
	.w-75{
		display: block;
		width: 75%;
		height: auto;
	}
	.w-66{
		display: block;
		width: 66%;
		height: auto;
	}
	.w-50{
		display: block;
		width: 50%;
		height: auto;
	}
	.w-33{
		display: block;
		width: 33%;
		height: auto;
	}
	.w-25{
		display: block;
		width: 25%;
		height: auto;
	}
	body *.imusic-loading {
		display: none;
	}
	body.imusic-loading *.imusic-loading {
		animation: blinking 700ms infinite;
		display: block;
	}@keyframes blinking {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
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
		// denna sabbar för getBoundingClientRect(). Jag testar opacity istället
		// document.querySelector("main").style.display = "block";


		let mainElement = document.querySelector("main")
		mainElement.style.opacity = 1;


		let defaultID = mainElement.firstElementChild.getAttribute("id");
		if(defaultID){
			window.location = `#${defaultID}`;
		}


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
