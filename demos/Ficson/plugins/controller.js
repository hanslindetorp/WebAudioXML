
window.addEventListener("load", init);


var socket;
var hoverboardCircle = document.querySelector("#hoverboardCircle");
var hangerCircle = document.querySelector("#hangerCircle");
var wheelchairCircle = document.querySelector("#wheelchairCircle");
var exes = []; 
var ys = [];  

window.addEventListener("load", coordinatesHb);
window.addEventListener("load", coordinatesFh);
window.addEventListener("load", coordinatesWc);

document.querySelector("body").addEventListener("ontouchmove", function coordinatesStorage() {
	var xgen = event.touches[0].clientX;
	var ygen = event.touches[0].clientY

})

function download_txt(textToSave) {

  var hiddenElement = document.createElement('a');

  hiddenElement.href = 'data:attachment/text,' + encodeURI(textToSave);
  hiddenElement.target = '_blank';
  hiddenElement.download = 'userRecording.txt';
  hiddenElement.click();
}


/*function done(event){
{
 var mouseX = event.touches[0].clientX;
 var mouseY = event.touches[0].clientY;  
  exes.push([mouseX]);
  ys.push([mouseY]);
 if(document.querySelector('#saveBtn').click()){
 	var text = "X values: " + exes + "\b" + "Y values: " + ys;
 	this.download_txt(text);
 } 		
}
  document.getElementById("results").innerHTML = "You have clicked at: " + JSON.stringify(coords);
}
*/


function coordinatesHb(event){
	var hbxpos = 1-(410-event.touches[0].clientX)/400;
	var hbypos = (410-event.touches[0].clientY)/400;
		//document.getElementById("hbx").innerHTML = hbxpos;
		//document.getElementById("hby").innerHTML = hbypos;
	if(hbxpos >= 0 && hbxpos <= 1 && hbypos >= 0 && hbypos <= 1){
	clientToServer({
		name: "Hb",
		x: hbxpos,
		y: hbypos
	})
	}}

	function coordinatesFh(event){
		var fhxpos = 1-(830-event.touches[0].clientX)/400;
		var fhypos = (410-event.touches[0].clientY)/400;
		//document.getElementById("fhx").innerHTML = fhxpos;
		//document.getElementById("fhy").innerHTML = fhypos;
		if(fhxpos >= 0 && fhxpos <= 1 && fhypos >= 0 && fhypos <= 1){
		clientToServer({
		name: "Fh",
		x: fhxpos,
		y: fhypos
	})
	}}
	function coordinatesWc(event){
		var wcxpos = 1-(1250-event.touches[0].clientX)/400;
		var wcypos = (410-event.touches[0].clientY)/400;
		//document.getElementById("wcx").innerHTML = wcxpos;
		//document.getElementById("wcy").innerHTML = wcypos;
		if(wcxpos >= 0 && wcxpos <= 1 && wcypos >= 0 && wcypos <= 1){
		clientToServer({
		name: "Wc",
		x: wcxpos,
		y: wcypos
	})
	}}

	function solo(value){
		clientToServer({
			name: "solo",
			value: value
		})
	}

/*	function mixerHb(event){
		var xHb = 1-(410-event.touches[0].clientX)/400;
		clientToServer({
			name: "mixHb",
			x: xHb
			}) 
		}
	
	function mixerFh(event){
		var xFh = 1-(830-event.touches[0].clientX)/400;
		clientToServer({
			name: "mixFh",
			x: xFh
			}) 
	}
	function mixerWc(event){
		var xWc = 1-(1250-event.touches[0].clientX)/400;
		clientToServer({
			name: "mixWc",
			x: xWc
			}) 
	}
	function ambienceLevel(event){
		var ambience = 1-(410-event.touches[0].clientX)/400;
		clientToServer({
			name: "mixAmb",
			x: ambience
			}) 
	}
	function pause(event){
			clientToServer({
		name: "pause",
		})
		}
*/
	function done(event){
		clientToServer({
			name: "I'm done",
		})
	}

	function reset(event){
		clientToServer({
			name: "reset",
		})
		}
	

		function clientToServer(msg){
			socket.emit("clientToServer", msg);
		}
		function init(){
			console.log("init");


			socket = io();
			socket.addEventListener("error", e => console.log(e));
		}

		function serverToClient(msg){

			switch(msg.command){

				default:
				break;
			}





/*
	hoverboardCircle.addEventListener("mouseover", event => {
		var xpos = event.offsetX;
		var ypos = event.offsetY;
		clientToServer({
			name: "overHoverboard";
			xpos: xpos;
			ypos: ypos;
		})
	})*/

}


