// Längst upp på sidan är det bra att skriva globala variabler
var ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

var clients = [
{
  name: "client0",
  cols: 12,
  rows: 1,
  color: "blue"
},
{
  name: "client1",
  cols: 5,
  rows: 1,
  color: "red"
},
{
  name: "client2",
  cols: 2,
  rows: 2,
  color: "green"
},
{
  name: "client3",
  cols: 2,
  rows: 2,
  color: "orange"
},
{
  name: "client4",
  cols: 12,
  rows: 1,
  color: "purple"
}
];




var instrID = 0;
var instrNames = ["0", "1", "2", "3", "4"];
var debug = false;
var skipFrames = 1;
var curFrame = 0;
var curMotionFrame = 0;
var curOrientationFrame = 0;



let touchArea = document.querySelector("#touchArea");


function getQueryParams(qs) {
    qs = qs.split("+").join(" ");

    var params = {}, tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }

    return params;
}


var queryParams = getQueryParams(document.location.search);


window.addEventListener("load", init);



function init(){

	socket = io();
	socket.addEventListener("error", e => console.log(e));

	generateGUI();
}



var socket;


function clientToServer(msg){
	msg.id = instrID;
	socket.emit("clientToServer", msg);
}



function serverToClient(msg){
	console.log(msg);

	switch(msg.command){

		default:
		break;
	}

}





document.querySelectorAll(".instrID button").forEach(btn => {
	btn.addEventListener("click", e => {
		//e.preventDefault();
		instrID = Array.from(e.target.parentNode.children).indexOf(e.target);
		//document.querySelectorAll("button").forEach(btn => btn.style.backgroundColor = "#fff");
		touchArea.style.backgroundColor = clients[instrID].color;

    let x = 100 / clients[instrID].cols;
    let y = 100 / clients[instrID].rows;
    touchArea.style.backgroundSize = `${x}% ${y}%`;
	});
});





function initSensors(){
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




function setDeviceMotion(e){

	if(!(curMotionFrame++ % (skipFrames + 1))){
		clientToServer({
			name: "devicemotion",
			acceleration: e.acceleration,
			accelerationIncludingGravity: e.accelerationIncludingGravity,
			rotationRate: e.rotationRate
		});
	}

}




function setDeviceOrientation(e){

	if(!(curOrientationFrame++ % (skipFrames + 1))){
		clientToServer({
			name: "deviceorientation",
			deviceOrientation: {
				alpha: e.alpha,
				beta: e.beta,
				gamma: e.gamma
			}
		});
	}

	/*
		// do something with e
	webAudioXML.alpha = e.alpha;
	webAudioXML.beta = e.beta;
	webAudioXML.gamma = e.gamma;

	document.querySelector(".orientation.alpha").innerHTML = e.alpha;
	document.querySelector(".orientation.beta").innerHTML = e.beta;
	document.querySelector(".orientation.gamma").innerHTML = e.gamma;
	*/
}












var touchIDs = [];
var touchArray = [];
while(touchArray.length < (navigator.maxTouchPoints || 1)){
	touchArray.push({});
}


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
	let rect = touchArea.getBoundingClientRect();
	obj.relX = (x-rect.left) / rect.width * 100;
	obj.relY = (y-rect.top) / rect.height * 100;
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
		let rect = touchArea.getBoundingClientRect();
		obj.relMoveX = obj.moveX / rect.width * 100;
		obj.relMoveY = obj.moveY / rect.height * 100;
	}
}



touchArea.addEventListener("touchstart", e => {


	//e.preventDefault();
	Array.prototype.forEach.call(e.changedTouches, touch => {
		if(touch.target.nodeName.toLowerCase() == "a"){return}

		let identifier = touchIDs.find((el, id) => touchArray[id].down != 1);
		let i;

		if(identifier){
			i = touchIDs.indexOf(identifier);
			// update recently released touch to connect with new touch
			// to support touch and release one finger within a multi touch
			touchIDs[i] = touch.identifier;
		} else {
			i = touchIDs.length;
			touchIDs.push(touch.identifier);
		}



		let touchObj = touchArray[i];
		copyTouchProperties(touch, touchObj);
		setRelativePos(touchObj, touch.clientX, touch.clientY);
		setMovePos(touchObj);


		touchObj.down = 1;
	});


	clientToServer({name: "touchstart", touchArray: touchArray, padIDs: getPadIDs(touchArray)});
	updateCircles();

}, false);



touchArea.addEventListener("touchmove", e => {


	e.preventDefault();
	Array.prototype.forEach.call(e.changedTouches, touch => {
		if(touch.target.nodeName.toLowerCase() == "a"){return}

		let touchObj = touchArray[touchIDs.indexOf(touch.identifier)];

		if(touchObj){
			copyTouchProperties(touch, touchObj);
			setRelativePos(touchObj, touch.clientX, touch.clientY);
			setMovePos(touchObj, touch.clientX, touch.clientY);
		}
	});
	if(!(curFrame++ % (skipFrames + 1))){
		clientToServer({name: "touchmove", touchArray: touchArray});
		updateCircles();
	}
}, false);


touchArea.addEventListener("touchend", tounchEnd, false);
touchArea.addEventListener("touchcancel", tounchEnd, false);


function tounchEnd(e){

	//e.preventDefault();
	Array.prototype.forEach.call(e.changedTouches, touch => {
		if(touch.target.nodeName.toLowerCase() == "a"){return}


		let i = touchIDs.indexOf(touch.identifier);


		let touchObj = touchArray[i];
		if(touchObj){
			touchObj.down = 0;
			touchObj.force = 0;
			//setMovePos(touchObj);
		} else {
			console.log("touchObj not found: " + touch.identifier, touchIDs);
		}

		// reset touch list if last touch
		let stillDown = 0;
		touchArray.forEach(touch => {
			stillDown = stillDown || touch.down;
		});
		if(!stillDown){
			while(touchIDs.length){
				touchIDs.pop();
			}
		}

	});

	clientToServer({name: "touchend", touchArray: touchArray, padIDs: getPadIDs(touchArray)});
	updateCircles();
}



function updateCircles(){
	touchArray.forEach((touch, i) => {
		let targetCircle = document.querySelector("#circle-" + i);
		if(targetCircle){
			targetCircle.style.left = (touch.relX - targetCircle.clientWidth / targetCircle.parent.offsetWidth * 100) + "px";
			targetCircle.style.top = (touch.relY - targetCircle.clientHeight / targetCircle.parent.offsetHeight * 100) + "px";
			targetCircle.style.display = touch.down ? "block": "none";
		}
	});
}





touchArea.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});

touchArea.addEventListener('touchmove', function(event) {
  event = event.originalEvent || event;
  if(event.scale > 1) {
    event.preventDefault();
  }
}, false);


function getPadIDs(touchArray){
  let padIDs = [];
  touchArray.forEach(touchObj => {
    if(typeof touchObj.relX == "undefined"){return}
    let colID = Math.floor(touchObj.relX / 100 * clients[instrID].cols);
    let rowID = Math.floor(touchObj.relY / 100 * clients[instrID].rows) + 1;
    padIDs.push(rowID + ABC[colID]);
  });

  return padIDs;
}












let pointerDownEvent = window.PointerEvent ? "pointerdown" : "mousedown";
let pointerMoveEvent = window.PointerEvent ? "pointermove" : "mousemove";
let pointerUpEvent = window.PointerEvent ? "pointerup" : "mouseup";



touchArea.addEventListener(pointerDownEvent, pointerDown);
touchArea.addEventListener(pointerUpEvent, pointerUp);
touchArea.addEventListener(pointerMoveEvent, pointerMove);




function pointerDown(e) {
	// simulate touch behaviour if needed
	if(!navigator.maxTouchPoints){
		let touchObj = touchArray[0];
		copyTouchProperties(e, touchObj);
		setRelativePos(touchObj, e.clientX, e.clientY);
		setMovePos(touchObj);
		touchObj.down = 1;
		//clientToServer({name: "touchstart", touchArray: touchArray});
	}
}

function pointerMove(e){
	// simulate touch behaviour if needed
	if(!navigator.maxTouchPoints){
		let touchObj = touchArray[0];
		copyTouchProperties(e, touchObj);
		setRelativePos(touchObj, e.clientX, e.clientY);
		setMovePos(touchObj, e.clientX, e.clientY);
		if(!(curFrame++ % (skipFrames + 1))){
			//clientToServer({name: "touchmove", touchArray: touchArray});
		}
	}
}


function pointerUp(e){
	// simulate touch behaviour if needed
	if(!navigator.maxTouchPoints){
		let touchObj = touchArray[0];
		copyTouchProperties(e, touchObj);
		setRelativePos(touchObj, e.clientX, e.clientY);
		setMovePos(touchObj, e.clientX, e.clientY);
		touchObj.down = 0;
		//clientToServer({name: "touchend", touchArray: touchArray});
	}

}


function generateGUI(){


	let colors = ["blue", "red", "green", "yellow", "grey", "pink"];
	let nrOfClients = 10;
	let nrOfTouches = 10;


	for(let t = 0; t < nrOfTouches; t++){

		let styles = {
			backgroundColor: colors[instrID % nrOfClients],
			width: "10px",
			height: "100px",
			borderRadius: "50px",
			position: "absolute",
			textAlign: "center",
			fontWeight: "bold",
			display: "none",
			lineHeight: "100px",
			fontSize: "80px"
		}
		let circle = document.createElement("div");
		Object.assign(circle.style, styles);
		circle.innerHTML = t;
		circle.id = "circle-" + t;
		touchArea.appendChild(circle);

	}



}
