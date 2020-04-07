/*
MIT License

Copyright (c) 2020 hanslindetorp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


var Parser = require('./Parser.js');
var Connector = require('./Connector.js');
var GUI = require('./GUI.js');

var source = document.currentScript.dataset.source;




class WebAudio {

	constructor(_ctx){

		if(!_ctx){

			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			if (AudioContext) {
					// Web Audio API is available.
					_ctx = new AudioContext();
			} else {
				console.error("This browser does not support Web Audio API");
			}

		}
		
		
		this.plugins = [];
		
		
		
		// INTERACTION - might be better to separate from 
		// WebAudioXML itself

		// variables
		// create a way of keeping track of each touch
		// during a multi touch
		let touches = [];
		while(touches.length < (navigator.maxTouchPoints || 1)){
			touches.push({});
		}
		this.touch = touches;
		this.deviceOrientation = {};

		this.client = [];
		
		while(this.client.length < 10){
			let c = {};
			c.touchIDs = [];
			
			c.touch = [];
			while(c.touch.length < 5){
				c.touch.push({});
			}
			
			c.acceleration = {};
			c.accelerationIncludingGravity = {};
			c.rotationRate = {};
			
			c.deviceOrientation = {};
			
			this.client.push(c);
		}
		
		

		this._ctx = _ctx;

		if(source){
			window.addEventListener("load", () => {

				new Parser(source, this, xmlDoc => {
					this._xml = xmlDoc;
					//webAudioXML = xmlDoc.audioObject;
					//webAudioXML.touch = touches;
					new Connector(xmlDoc, _ctx);
					this.plugins.forEach(plugin => {
						plugin.init();
					});
					if(this._xml.getAttribute("controls") == "true"){
						new GUI(xmlDoc, document.body);
					}
				});
			});
		} else {
			console.error("No WebAudioXML source specified")
		}

	}


	start(){
		this._xml.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.start());
	}

	stop(){
		this._xml.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.stop());
	}

	registerPlugin(plugin){
		
		this.plugins.push(plugin);
		// consider returning an interface to 
		// variables here
	}


}



let webAudioXML = new WebAudio();

window.webAudioXML = webAudioXML;
var firstMouseDown = true;


var acceleration = {}
acceleration.x = {}
acceleration.x.min = 0;
acceleration.x.max = 0;

acceleration.y = {}
acceleration.y.min = 0;
acceleration.y.max = 0;

acceleration.z = {}
acceleration.z.min = 0;
acceleration.z.max = 0;

var decayFactor = 0.0;

function setDeviceMotion(e){
	webAudioXML.acceleration = e.acceleration;
	webAudioXML.accelerationIncludingGravity = e.accelerationIncludingGravity;
	webAudioXML.rotationRate = e.rotationRate;


	acceleration.x.max *= decayFactor;
	acceleration.y.max *= decayFactor;
	acceleration.z.max *= decayFactor;


	acceleration.x.min = Math.min(acceleration.x.min, e.acceleration.x);
	acceleration.x.max = Math.max(acceleration.x.max, e.acceleration.x);

	acceleration.y.min = Math.min(acceleration.y.min, e.acceleration.y);
	acceleration.y.max = Math.max(acceleration.y.max, e.acceleration.y);

	acceleration.z.min = Math.min(acceleration.z.min, e.acceleration.z);
	acceleration.z.max = Math.max(acceleration.z.max, e.acceleration.z);

	/*

	document.querySelector(".acceleration.x").style.width = (acceleration.x.max * 100) + "%";
	document.querySelector(".acceleration.y").style.width = (acceleration.y.max * 100) + "%";
	document.querySelector(".acceleration.z").style.width = (acceleration.z.max * 100) + "%";


	document.querySelector(".acceleration.x").innerHTML = acceleration.x.min + " - " + acceleration.x.max;
	document.querySelector(".acceleration.y").innerHTML = acceleration.y.min + " - " + acceleration.y.max;
	document.querySelector(".acceleration.z").innerHTML = acceleration.z.min + " - " + acceleration.z.max;

	document.querySelector(".accelerationIncludingGravity.x").innerHTML = acceleration.x.min + " - " + acceleration.x.max;
	document.querySelector(".accelerationIncludingGravity.y").innerHTML = acceleration.y.min + " - " + acceleration.y.max;
	document.querySelector(".accelerationIncludingGravity.z").innerHTML = acceleration.z.min + " - " + acceleration.z.max;

	document.querySelector(".rotationRate.alpha").innerHTML = e.rotationRate.alpha;
	document.querySelector(".rotationRate.beta").innerHTML = e.rotationRate.beta;
	document.querySelector(".rotationRate.gamma").innerHTML = e.rotationRate.gamma;
	*/
}




function setDeviceOrientation(e){
	// do something with e
	webAudioXML.alpha = e.alpha;
	webAudioXML.beta = e.beta;
	webAudioXML.gamma = e.gamma;

	/*
	document.querySelector(".orientation.alpha").innerHTML = e.alpha;
	document.querySelector(".orientation.beta").innerHTML = e.beta;
	document.querySelector(".orientation.gamma").innerHTML = e.gamma;
	*/
}



var touchIDs = [];

function copyTouchProperties(source, target){
	target.identifier  = source.identifier;
	target.screenX = source.screenX;
	target.screenY = source.screenY;
	target.clientX = source.clientX;
	target.clientY = source.clientY;
	target.pageX = source.pageX;
	target.pageY = source.pageY;
	target.radiusX = source.radiusX;
	target.radiusY = source.radiusY;
	target.rotationAngle = source.rotationAngle;
	target.force = source.force;
}

function setRelativePos(obj, x, y){
	obj.relX = x / window.innerWidth * 100;
	obj.relY = y / window.innerHeight * 100;
}

function setMovePos(obj, x, y){
	if(typeof x === "undefined"){
		// reset
		obj.initX = obj.clientX;
		obj.initY = obj.clientY;
		obj.moveX = 0;
		obj.moveY = 0;
		obj.relMoveX = 0;
		obj.relMoveY = 0;
	} else {
		// update
		obj.initX = typeof obj.initX === "undefined" ? obj.clientX : obj.initX;
		obj.initY = typeof obj.initY === "undefined" ? obj.clientY : obj.initY;
		obj.moveX = x - obj.initX;
		obj.moveY = y - obj.initY;
		obj.relMoveX = obj.moveX / window.innerWidth * 100;
		obj.relMoveY = obj.moveY / window.innerHeight * 100;
	}
}


document.addEventListener("touchstart", e => {

	//e.preventDefault();
	Array.prototype.forEach.call(e.changedTouches, touch => {
		let identifier = touchIDs.find((el, id) => webAudioXML.touch[id].down != 1);
		let i;

		if(identifier){
			i = touchIDs.indexOf(identifier);
			touchIDs[i] = touch.identifier;
		} else {
			i = touchIDs.length;
			touchIDs.push(touch.identifier);
		}

		let touchObj = webAudioXML.touch[i];
		copyTouchProperties(touch, touchObj);
		setRelativePos(touchObj, touch.clientX, touch.clientY);
		setMovePos(touchObj);
		touchObj.down = 1;
		webAudioXML._xml.querySelectorAll("*[trig='touch[" + i + "]']").forEach(el => {
			el.audioObject.start();
		});
	});

}, true);



document.addEventListener("touchmove", e => {

	//e.preventDefault();
	Array.prototype.forEach.call(e.changedTouches, touch => {
		let touchObj = webAudioXML.touch[touchIDs.indexOf(touch.identifier)];

		if(touchObj){
			copyTouchProperties(touch, touchObj);
			setRelativePos(touchObj, touch.clientX, touch.clientY);
			setMovePos(touchObj, touch.clientX, touch.clientY);
		}
	});
}, true);


document.addEventListener("touchend", tounchEnd, true);
document.addEventListener("touchcancel", tounchEnd, true);


function tounchEnd(e){

	//e.preventDefault();
	Array.prototype.forEach.call(e.changedTouches, touch => {
		let i = touchIDs.indexOf(touch.identifier);


		let touchObj = webAudioXML.touch[i];
		if(touchObj){
			touchObj.down = 0;
			touchObj.force = 0;
			setMovePos(touchObj);
			webAudioXML._xml.querySelectorAll("*[trig='touch[" + i + "]']").forEach(el => el.audioObject.stop());

		}

		// reset touch list if last touch
		let stillDown = 0;
		webAudioXML.touch.forEach(touch => {
			stillDown = stillDown || touch.down;
		});
		if(!stillDown){
			while(touchIDs.length){
				touchIDs.pop();
			}
		}

	});
}


let pointerDownEvent = window.PointerEvent ? "pointerdown" : "mousedown";
let pointerMoveEvent = window.PointerEvent ? "pointermove" : "mousemove";
let pointerUpEvent = window.PointerEvent ? "pointerup" : "mouseup";

document.addEventListener(pointerDownEvent, pointerDown);
document.addEventListener(pointerUpEvent, pointerUp);
document.addEventListener(pointerMoveEvent, pointerMove);


function pointerMove(e){
	webAudioXML.mouseX = e.clientX;
	webAudioXML.mouseY = e.clientY;

	webAudioXML.pointerX = e.clientX;
	webAudioXML.pointerY = e.clientY;

	setRelativePos(webAudioXML, e.clientX, e.clientY);

	// simulate touch behaviour if needed
	if(!navigator.maxTouchPoints){

		let touchObj = webAudioXML.touch[0];
		copyTouchProperties(e, touchObj);
		setRelativePos(touchObj, e.clientX, e.clientY);
		setMovePos(touchObj, e.clientX, e.clientY);
		
		touchObj = webAudioXML.client[0].touch[0];
		copyTouchProperties(e, touchObj);
		setRelativePos(touchObj, e.clientX, e.clientY);
		setMovePos(touchObj, e.clientX, e.clientY);
	}
}


function pointerUp(e){
	webAudioXML.mousedown = 0;
	webAudioXML.pointerdown = 0;
	webAudioXML.touchdown = 0;

	webAudioXML._xml.querySelectorAll("*[trig='mouseup']").forEach(el => el.audioObject.start());
	webAudioXML._xml.querySelectorAll("*[trig='pointerup']").forEach(el => el.audioObject.start());

	webAudioXML._xml.querySelectorAll("*[trig='mouse']").forEach(el => el.audioObject.stop());

	// simulate touch behaviour if needed
	if(!navigator.maxTouchPoints){

		let touchObj = webAudioXML.touch[0];
		copyTouchProperties(e, touchObj);
		setRelativePos(touchObj, e.clientX, e.clientY);
		setMovePos(touchObj, e.clientX, e.clientY);
		touchObj.down = 0;

		webAudioXML._xml.querySelectorAll("*[trig='touch[0]']").forEach(el => el.audioObject.stop());
		webAudioXML._xml.querySelectorAll("*[trig='client[0].touch[0]']").forEach(el => el.audioObject.stop());
	}

}



function pointerDown(e) {
	if(firstMouseDown){
		firstMouseDown = false;
		webAudioXML._ctx.resume();

		//alert("init audio");


		if (window.DeviceMotionEvent) {


			if(typeof DeviceMotionEvent.requestPermission === 'function'){
				// iOS 13+
				DeviceMotionEvent.requestPermission()
				.then(response => {
				  if (response == 'granted') {
				    window.addEventListener('devicemotion', setDeviceMotion);
				  }
				})
				.catch(console.error);
			} else {
				// non iOS 13+
				window.addEventListener('devicemotion', setDeviceMotion);
			}


		} else {

		  console.log("this device does not support DeviceMotionEvent");
		}


		if (window.DeviceOrientationEvent) {

			if(typeof DeviceOrientationEvent.requestPermission === 'function'){
				DeviceOrientationEvent.requestPermission()
				.then(response => {
				  if (response == 'granted') {
				  	window.addEventListener('deviceorientation', setDeviceOrientation);
				  }
				})
				.catch(console.error);
			} else {
				// non iOS 13+
				window.addEventListener('deviceorientation', setDeviceOrientation);
			}

		} else {

		  console.log("this device does not support DeviceOrientationEvent");
		}



	}

	// simulate touch behaviour if needed
	if(!navigator.maxTouchPoints){

		let touchObj = webAudioXML.touch[0];
		copyTouchProperties(e, touchObj);
		setRelativePos(touchObj, e.clientX, e.clientY);
		setMovePos(touchObj);
		touchObj.down = 1;

		webAudioXML._xml.querySelectorAll("*[trig='touch[0]']").forEach(el => el.audioObject.start());
		webAudioXML._xml.querySelectorAll("*[trig='client[0].touch[0]']").forEach(el => el.audioObject.start());
	}
	webAudioXML.touchIDs = touchIDs;
	webAudioXML.mousedown = 1;
	webAudioXML.pointerdown = 1;
	webAudioXML.touchdown = 1;
	webAudioXML._xml.querySelectorAll("*[trig='mousedown']").forEach(el => {el.audioObject.start()});
	webAudioXML._xml.querySelectorAll("*[trig='pointerdown']").forEach(el => {el.audioObject.start()});
	webAudioXML._xml.querySelectorAll("*[trig='mouse']").forEach(el => el.audioObject.stop());


}



window.webAudioXML = webAudioXML;
module.exports = WebAudio;



/*

	Test:
	Files on remote servers. Cross-domain issues
	PeriodicWave data. Problem: Uncaught (in promise) SyntaxError: Unexpected token ' in JSON at position 2

	Implement:
	Motion capture
	iOS 13: https://medium.com/flawless-app-stories/how-to-request-device-motion-and-orientation-permission-in-ios-13-74fc9d6cd140
	Simple GUI
	OK. AudioBufferSourceNode

*/
