var socket;
var sound = document.querySelector("#sound1");


window.addEventListener('load', event => {

	console.log("init");
	socket = io();
	
	socket.on('serverToClient', msg => {
		switch(msg.name){
			
			case "Hb":
			//document.getElementById("show").innerHTML = "X: " + msg.x + "     " + "Y: " + msg.y;
			webAudioXML.setVariable("x1", msg.x);
			webAudioXML.setVariable("y1", msg.y);
		 	break;

		 	case "Wc":
			webAudioXML.setVariable("x2", msg.x);
			webAudioXML.setVariable("y2", msg.y);
		 	break;

		    case "Fh":
		 	webAudioXML.setVariable("x3", msg.x);
			webAudioXML.setVariable("y3", msg.y);
		 	break;

			case "solo":
			webAudioXML.setVariable("solo", msg.value);
			break;

		 	case "I'm done":
		 	//Data logging to be implemented
			 break;

		 	case "reset":
		 	webAudioXML.setVariable("x1", 0.5);
			webAudioXML.setVariable("y1", 0.5);
			webAudioXML.setVariable("x2", 0.5);
			webAudioXML.setVariable("y2", 0.5);
		 	webAudioXML.setVariable("x3", 0.5);
			webAudioXML.setVariable("y3", 0.5);
		 	break;
		}
	});

});




