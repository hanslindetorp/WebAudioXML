
window.onload = init;


function init(){


	generateGUI();


	socket = io();


	socket.on('serverToClient', msg => {

		switch(msg.name){

			case "touchstart":
			case "touchmove":
			case "touchend":
			case "touchcancel":

			let t = 0;
			msg.touchArray.forEach((touch, i) => {
				if(typeof touch.identifier === "undefined"){return}

				let targetCircle = document.querySelector("#circle-" + msg.id + "-" + t);
				if(targetCircle){
					targetCircle.style.left = (touch.relX / 100 * targetCircle.parentNode.offsetWidth - targetCircle.clientWidth) + "px";
					targetCircle.style.top = (touch.relY / 100 * targetCircle.parentNode.offsetHeight - targetCircle.clientHeight) + "px";
					targetCircle.style.display = touch.down ? "block": "none";
				}

				let iMusicVarName;
				let clientPathStr;

				if(webAudioXML){

					// this needs to be properly registered with
					// a plugin structure
					if(webAudioXML._xml){

						let touchObj;
						let clientObj = webAudioXML.variables.client[msg.id];
						touchObj = clientObj.touch[i];
						if(touchObj){
							copyTouchProperties(touch, touchObj);
						}

						clientPathStr = "client["+msg.id+"].touch[" + i + "]";
						iMusicVarName = "client"+msg.id+"_touch"+i;

						switch(msg.name){

							case "touchstart":
							webAudioXML.start("*[trig='" + clientPathStr + "']");
							iMusic.play(iMusicVarName);

							// PADs
							console.log(msg.padIDs);
							msg.padIDs.forEach(padID => {
								webAudioXML.start(`*[trig='client[${msg.id}].pad${padID}']`);
								iMusic.play(`client${msg.id}_pad${padID}`);
							});

							break

							case "touchend":
							case "touchcancel":
							webAudioXML.stop("*[trig='" + clientPathStr + "']");
							msg.padIDs.forEach(padID => {
								webAudioXML.stop(`*[trig='client[${msg.id}].pad${padID}']`);
								iMusic.stop(`client${msg.id}_pad${padID}`);
							});
							break;

							case "touchmove":
							// hack to make iMusic follow incoming mouseEvents
							window[iMusicVarName + "_relX"] = touchObj.relX;
							window[iMusicVarName + "_relY"] = touchObj.relY;
							break;
						}
					}

				}

				t++;
			});
			break;


			case "devicemotion":
			if(webAudioXML){

				// this needs to be properly registered with
				// a plugin structure
				if(webAudioXML._xml){
					let clientObj = webAudioXML.variables.client[msg.id];
					if(clientObj){
						copyDeviceMotionProperties(msg.acceleration, clientObj.acceleration);
						copyDeviceMotionProperties(msg.accelerationIncludingGravity, clientObj.accelerationIncludingGravity);
						copyDeviceMotionProperties(msg.rotationRate, clientObj.rotationRate);
					}

				}
			}

			break;


			case "deviceorientation":
			if(webAudioXML){

				// this needs to be properly registered with
				// a plugin structure
				if(webAudioXML._xml){

					let clientObj = webAudioXML.variables.client[msg.id];
					if(clientObj){
						copyDeviceOrientationProperties(msg.deviceOrientation, clientObj.deviceOrientation);
						//console.log(clientObj.deviceOrientation);
					}
				}

				// for iMusic
				iMusicVarName = "client" + msg.id;
				window[iMusicVarName + "_alpha"] = msg.deviceOrientation.alpha;
				window[iMusicVarName + "_beta"] = msg.deviceOrientation.beta;
				window[iMusicVarName + "_gamma"] = msg.deviceOrientation.gamma;
				//console.log(Math.floor(msg.deviceOrientation.alpha), Math.floor(msg.deviceOrientation.beta),Math.floor(msg.deviceOrientation.gamma));

			}
			break;
		}

	});

}


function generateGUI(){

	let container = document.querySelector("#touchArea");
	if(container == null || !container){
		let body = document.querySelector("body");
		container = document.createElement("div");
		body.appendChild(container);
	}



	let colors = ["blue", "red", "green", "orange", "purple"];
	let nrOfClients = 10;
	let nrOfTouches = 10;


	for(let i = 0; i < 10; i++){

		for(let t = 0; t < nrOfTouches; t++){

			let styles = {
				backgroundColor: colors[i % nrOfClients],
				width: "30px",
				height: "30px",
				borderRadius: "15px",
				position: "absolute",
				textAlign: "center",
				fontWeight: "bold",
				display: "none",
				lineHeight: "30px",
				fontSize: "20px"
			}
			let circle = document.createElement("div");
			Object.assign(circle.style, styles);
			circle.innerHTML = t;
			circle.id = "circle-" + i + "-" + t;
			container.appendChild(circle);

		}

	}


}


var socket;




function copyDeviceMotionProperties(source, target){

	target.x  = source.x;
	target.y  = source.y;
	target.z  = source.z;

}

function copyDeviceOrientationProperties(source, target){

	target.alpha  = source.alpha;
	target.beta  = source.beta;
	target.gamma  = source.gamma;

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

	target.relX = source.relX;
	target.relY = source.relY;

	target.initX = source.initX;
	target.initY = source.initY;

	target.moveX = source.moveX;
	target.moveY = source.moveY;
	target.relMoveX = source.relMoveX;
	target.relMoveY = source.relMoveY;
}
