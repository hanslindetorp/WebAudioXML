
var socket;

window.addEventListener("load", e => {

	console.log("init");

	socket = io();
	socket.addEventListener("error", e => console.log(e));


	document.querySelectorAll("waxml-xy-handle").forEach(el => {
		el.addEventListener("input", e => {
			let value = e.target.value;
			e.target.targets.forEach((varName, i) => {
				clientToServer({
					name: varName,
					data: value[i]
				});
			});
			
		});
	});



	
    waxml.addEventListener("init", e => {
        waxml.variablesToStore = "a1, a2, a3, r1, r2, r3, d1, d2, d3, timeStamp".split(",").map(s => s.trim());

        var triggerObject = {}
        triggerObject.setVariable = (key, val) => {
            let el = document.querySelector(`#handle_${key.substr(1,1)}`);
            if(el){
                let i = el.targets.indexOf(key);
                if(i >= 0){
                    let target = el.sources[i];
                    if(target == "angle"){
                        val = (1 + val - el.angleOffset) % 1;
                    }
                    el[target] = val;
                }
                
            }
            
            
        }

        waxml.registerPlugin(triggerObject);9
	});

    data = readData();
    initSelectMenu(data.sessions);

  

    document.querySelector("#selectSession").addEventListener("change", e => {
		document.querySelector("#output").innerHTML = JSON.stringify(data.sessions[e.target.selectedIndex]);
        let events = data.sessions[e.target.selectedIndex].events;
        let offsets = data.sessions[e.target.selectedIndex].offsets;
        let handles = [...document.querySelectorAll("waxml-xy-handle")];
        offsets.forEach((val, i) => {
            handles[i].angleOffset = val;
        });
       let eventList = events.map(event => {
            return {
                time: event[0],
                name: event[1],
                value: event[2]
            }
        });
        waxml.clearSequence("stored");
        waxml.addSequence("stored", eventList);
        waxml.playSequence("stored");
    });


	document.querySelector("#exportBtn").addEventListener("click", e => {
		document.querySelector("#output").innerHTML = JSON.stringify(data);
	});

});





function clientToServer(msg){
	socket.emit("clientToServer", msg);
}



function serverToClient(msg){

	switch(msg.command){

		default:
		break;
	}

}


window.addEventListener("touchstart", touchHandler, false);
function touchHandler(event){
	if(event.touches.length > 1){
		event.preventDefault()
	}
}


document.addEventListener("contextmenu", function(event){
	event.preventDefault();
	return false;
});


function done(event){
	clientToServer({
		name: "I'm done",
	});
	waxml.setVariable("timeStamp", new Date().getTime());
}

function reset(event){
	clientToServer({
		name: "reset",
	});
	newSession();
}

// function solo(value){
// 	clientToServer({
// 		name: "solo",
// 		value: value
// 	})
// }




function newSession(){
    let session = {};
    session.time = new Date().getTime();
    session.offsets = [...document.querySelectorAll("waxml-xy-handle")].map(el => {
        return el.angleOffset;
    });
    session.states = [...document.querySelectorAll("waxml-xy-handle")].map(el => {
        return {id: el.getAttribute("id"), angle: el.angle, radius: el.radius};
    });
    session.events = waxml.getSequenceData({name: "default", precision: 3, frameRate: 15}).events;

    if(session.events.length){
        waxml.clearSequence("default");

        data.sessions.push(session);
        initSelectMenu(data.sessions);
    
        writeData(data);
    }
    
    initHandles();

	
	clientToServer({
		name: "solo",
		value: -1
	});
}

function initSelectMenu(sessions){
    let seletion = document.querySelector("#selectSession");
    seletion.innerHTML = "";

    sessions.forEach(session => {
        let option = document.createElement("option");
        option.innerHTML = new Date(session.time).toLocaleTimeString();
        seletion.appendChild(option);
    });
}



function readData(){
    data = window.localStorage.getItem("waxml-data");

    if(data){
        data = JSON.parse(data);
    } else {
        data = {};
        data.appName = "Ficson";
        data.version = "1.1";
        data.sessions = [];
    }
    return data;
}

function writeData(data){
    data = JSON.stringify(data);
    window.localStorage.setItem("waxml-data", data);
}

function initHandles(){
    document.querySelectorAll("waxml-xy-handle").forEach(el => {
        el.classList.remove("changed");
        el.angleOffset = Math.random();
    });
}




// var hoverboardCircle = document.querySelector("#hoverboardCircle");
// var hangerCircle = document.querySelector("#hangerCircle");
// var wheelchairCircle = document.querySelector("#wheelchairCircle");
// var exes = []; 
// var ys = [];  

// window.addEventListener("load", coordinatesHb);
// window.addEventListener("load", coordinatesHf);
// window.addEventListener("load", coordinatesWc);


// document.querySelector("body").addEventListener("ontouchmove", function coordinatesStorage() {
// 	var xgen = event.touches[0].clientX;
// 	var ygen = event.touches[0].clientY

// })


// function download_txt(textToSave) {

//   var hiddenElement = document.createElement('a');

//   hiddenElement.href = 'data:attachment/text,' + encodeURI(textToSave);
//   hiddenElement.target = '_blank';
//   hiddenElement.download = 'userRecording.txt';
//   hiddenElement.click();
// }



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


// function coordinatesHb(event){
// 	var hbxpos = 1-(650-event.touches[0].clientX)/450;
// 	var hbypos = (535-event.touches[0].clientY)/450;
// 		//document.getElementById("hbx").innerHTML = hbxpos;
// 		//document.getElementById("hby").innerHTML = hbypos;
// 	if(hbxpos >= 0 && hbxpos <= 1 && hbypos >= 0 && hbypos <= 1){
// 	clientToServer({
// 		name: "Hb",
// 		x: hbxpos,
// 		y: hbypos
// 	})
// 	}}

// 	function coordinatesWc(event){
// 		var fhxpos = 1-(1150-event.touches[0].clientX)/450;
// 		var fhypos = (535-event.touches[0].clientY)/450;
// 		//document.getElementById("fhx").innerHTML = fhxpos;
// 		//document.getElementById("fhy").innerHTML = fhypos;
// 		if(fhxpos >= 0 && fhxpos <= 1 && fhypos >= 0 && fhypos <= 1){
// 		clientToServer({
// 		name: "Wc",
// 		x: fhxpos,
// 		y: fhypos
// 	})
// 	}}
// 	function coordinatesHf(event){
// 		var wcxpos = 1-(1750-event.touches[0].clientX)/450;
// 		var wcypos = (530-event.touches[0].clientY)/450;
// 		//document.getElementById("wcx").innerHTML = wcxpos;
// 		//document.getElementById("wcy").innerHTML = wcypos;
// 		if(wcxpos >= 0 && wcxpos <= 1 && wcypos >= 0 && wcypos <= 1){
// 		clientToServer({
// 		name: "Hf",
// 		x: wcxpos,
// 		y: wcypos
// 	})
// 	}}


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


