
window.addEventListener("load", init);


var socket;
var hoverboardCircle = document.querySelector("#hoverboardCircle");
var hangerCircle = document.querySelector("#hangerCircle");
var wheelchairCircle = document.querySelector("#wheelchairCircle");
var finalCoordsHb = [];
var finalCoordsWc = [];
var finalCoordsHf = [];
var gamma1;
var gamma2;
var gamma3;
var today = new Date();
var currentDateAndTime = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+' at '+today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

var timeoutInMiliseconds = 30000;
var timeoutId; 
 

window.addEventListener("load", coordinatesHb);
window.addEventListener("load", coordinatesHf);
window.addEventListener("load", coordinatesWc);
window.addEventListener("load", randomAngles);
window.addEventListener("touchstart", touchHandler, false);

document.querySelector("body").addEventListener("ontouchmove", function coordinatesStorage() {
	var xgen = event.touches[0].clientX;
	var ygen = event.touches[0].clientY

})
document.addEventListener("contextmenu", function(event){
	event.preventDefault();
	return false;
})


function touchHandler(event){
	if(event.touches.length > 1){
		event.preventDefault()
	}
}

function randomAngles(){
	gamma1 = 2*Math.PI*Math.random();
	gamma2 = 2*Math.PI*Math.random();
	gamma3 = 2*Math.PI*Math.random();
}

function coordinatesHb(event){
/*	var coords = [];
	var hbxpos = 1-(650-event.touches[0].clientX)/450;
	var hbypos = (535-event.touches[0].clientY)/450;
	let r = Math.sqrt((hbxpos - 0.5)*(hbxpos - 0.5) + (hbypos - 0.5)*(hbypos - 0.5));
	let theta = Math.atan2(hbxpos, hbypos);
	let phi = 2*Math.PI*Math.random() + theta;

	let hbxTras = r*Math.cos(phi)+0.5;
	let hbyTras = y*Math.sin(phi)+0.5;
	if(hbxpos >= 0 && hbxpos <= 1 && hbypos >= 0 && hbypos <= 1){
	clientToServer({
		name: "Hb",
		x: hbxTras,
		y: hbyTras
	})*/
	var coords = [];
	var hbxpos = 1-(630-event.touches[0].clientX)/450;
	var hbypos = (560-event.touches[0].clientY)/450;		
	let r = Math.sqrt(Math.pow(hbxpos-0.5, 2) + Math.pow(hbypos-0.5, 2));
	r = Math.min(1, r * 2);

	let theta = Math.atan2(hbxpos-0.5, hbypos-0.5) + 2*Math.PI;
	let phi = theta + gamma1; // activate the "gamma1" to enable the random angle

	//let hbxTras = r*Math.cos(phi)+0.5;
	//let hbyTras = r*Math.sin(phi)+0.5;
	let deg = (phi * 180 / Math.PI) % 360;
	if(hbxpos >= 0 && hbxpos <= 1 && hbypos >= 0 && hbypos <= 1){
		clientToServer({
			name: "Hb",
			x: hbxpos,//hbxTras,
			y: hbypos,//hbyTras,
			deg: deg,
			dist: r
		})
		coords.push(Date.now(), "Hb", r, theta, gamma1,  "   \r");
		finalCoordsHb.push(coords);
	}}

	function coordinatesWc(event){
		var coords = [];
		var fhxpos = 1-(1180-event.touches[0].clientX)/450;
		var fhypos = (560-event.touches[0].clientY)/450;
		let r = Math.sqrt(Math.pow(fhxpos-0.5, 2) + Math.pow(fhypos-0.5, 2));
		r = Math.min(1, r * 2);

		let theta = Math.atan2(fhxpos-0.5, fhypos-0.5) + 2*Math.PI;
		let phi = theta + gamma2; // activate gamma to enable randomness

//		let fhxTras = r*Math.cos(phi)+0.5;
//		let fhyTras = r*Math.sin(phi)+0.5;

		let deg = (phi * 180 / Math.PI) % 360;
		if(fhxpos >= 0 && fhxpos <= 1 && fhypos >= 0 && fhypos <= 1){


			clientToServer({
				name: "Wc",
				x: fhxpos,//fhxTras,
				y: fhypos, //fhyTras,
				deg: deg,
				dist: r
			})
			coords.push(Date.now(),"Wc", r, theta, gamma2, "  \r");
			finalCoordsWc.push(coords);
		}
	}

	function coordinatesHf(event){
		var coords = [];
		var wcxpos = 1-(1750-event.touches[0].clientX)/450;
		var wcypos = (560-event.touches[0].clientY)/450;
		let r = Math.sqrt(Math.pow(wcxpos-0.5, 2) + Math.pow(wcypos-0.5, 2));
		r = Math.min(1, r * 2);

		let theta = Math.atan2(wcxpos-0.5, wcypos-0.5)  + 2*Math.PI;
		let phi = theta + gamma3; // activate gamma to enable randomness

		//let wcxTras = r*Math.cos(phi)+0.5;
		//let wcyTras = r*Math.sin(phi)+0.5;
		let deg = (phi * 180 / Math.PI) % 360;
		if(wcxpos >= 0 && wcxpos <= 1 && wcypos >= 0 && wcypos <= 1){
			clientToServer({
				name: "Hf",
				x: wcxpos,//wcxTras,
				y: wcypos,//wcyTras,
				deg: deg,
				dist: r
			})
			coords.push(Date.now(),"Hf", r, theta, gamma3, "   \r");
			finalCoordsHf.push(coords);
		}
	}

	function solo(value){
		clientToServer({
			name: "solo",
			value: value
		})
	}
	
	/*function timeOutedDone(event){
		let csvData = [
			["Downloaded after time out"]
			["Vehcle", "Distance", "InitAngle", /*"TranslAngle",*//* "UTC Time"],
			[finalCoordsHb],
			[finalCoordsWc],
			[finalCoordsHf],
		]
		let csvContent = "data:text/csv;charset=utf-8,";
		csvData.forEach(function(rowArray) {
			let row = rowArray.join(",");
			csvContent += row + "\r\n";
			
		});
		while(window.ontouch() = false){
			var timeout = setTimeout(dataFile(), 3000);
			if(timeout = 30000){
				function dataFile(){
		let encodedUri = encodeURI(csvContent);
		window.open(encodedUri);
				}
			clientToServer({
				name: "I'm done",
			})
		}
	}
}
*/

function startTimer(event){ 
	timeoutId = window.setInterval(timeOutSaving, timeoutInMiliseconds);
 }

 function myStopFunction(event) {
	clearInterval(timeoutId);
  }

function timeOutSaving(){
	let csvData = [
		["UTC Time","Vehicle", "Distance", "InitAngle", "Random shift", "Timeout"],
		[finalCoordsHb],
		[finalCoordsWc],
		[finalCoordsHf],
	]
	let csvContent = "data:text/csv;charset=utf-8,";
	csvData.forEach(function(rowArray) {
		let row = rowArray.join(",");
		csvContent += row + "\r\n";
		
	});

	

	let encodedUri = encodeURI(csvContent);
	window.open(encodedUri);
	location.reload();
		clientToServer({
			name: "Time out",
		})
	}
	


function done(event){
		
	let csvData = [
		
		["UTC Time", "Vehicle", "Distance", "InitAngle", "Random shift", "Saved"],
		[finalCoordsHb],
		[finalCoordsWc],
		[finalCoordsHf],
	]
	let csvContent = "data:text/csv;charset=utf-8,";
	csvData.forEach(function(rowArray) {
		let row = rowArray.join(",");
		csvContent += row + "\r\n";
		
	});

	let encodedUri = encodeURI(csvContent);
	window.open(encodedUri);
	location.reload();
		clientToServer({
			name: "I'm done",
		})
	}





	function reset(event){
		let csvData = [
		
			["UTC Time", "Vehicle", "Distance", "InitAngle", "Random shift", "Reload"],
			[finalCoordsHb],
			[finalCoordsWc],
			[finalCoordsHf],
		]
		let csvContent = "data:text/csv;charset=utf-8,";
		csvData.forEach(function(rowArray) {
			let row = rowArray.join(",");
			csvContent += row + "\r\n";
			
		});
	
		let encodedUri = encodeURI(csvContent);
		window.open(encodedUri);
		location.reload();
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
}


