var socket;
var sound = document.querySelector("#sound1");


window.addEventListener('load', event => {

	console.log("init");
	socket = io();
	
	socket.on('serverToClient', msg => {

		

		switch(msg.name){

			case "Fb":
				if(typeof msg.deg != "undefined"){
					webAudioXML.setVariable("deg3", msg.deg);
				}
				if(typeof msg.dist != "undefined"){
					webAudioXML.setVariable("dist3", msg.dist);
				}
			break;

			case "Wc":
				if(typeof msg.deg != "undefined"){
					webAudioXML.setVariable("deg2", msg.deg);
				}
				if(typeof msg.dist != "undefined"){
					webAudioXML.setVariable("dist2", msg.dist);
				}
			break;

			case "Hf":
				if(typeof msg.deg != "undefined"){
					webAudioXML.setVariable("deg1", msg.deg);
				}
				if(typeof msg.dist != "undefined"){
					webAudioXML.setVariable("dist1", msg.dist);
				}
			break;
			
			case "Hb":
			//document.getElementById("show").innerHTML = "X: " + msg.x + "     " + "Y: " + msg.y;
			webAudioXML.setVariable("x3", msg.x);
			webAudioXML.setVariable("y3", msg.y);
			webAudioXML.setVariable("deg3", msg.deg);
			webAudioXML.setVariable("dist3", msg.dist);
		 	break;

		 	case "Wc":
			webAudioXML.setVariable("x2", msg.x);
			webAudioXML.setVariable("y2", msg.y);
			webAudioXML.setVariable("deg2", msg.deg);
			webAudioXML.setVariable("dist2", msg.dist);
		 	break;

		    case "Hf":
		 	webAudioXML.setVariable("x1", msg.x);
			webAudioXML.setVariable("y1", msg.y);
			webAudioXML.setVariable("deg1", msg.deg);
			webAudioXML.setVariable("dist1", msg.dist);
		 	break;

			case "solo":
			webAudioXML.setVariable("solo", msg.value);
			break;

		 	case "I'm done":
				webAudioXML.setVariable("x1", 0.5);
				webAudioXML.setVariable("y1", 0.5);
				webAudioXML.setVariable("x2", 0.5);
				webAudioXML.setVariable("y2", 0.5);
				webAudioXML.setVariable("x3", 0.5);
				webAudioXML.setVariable("y3", 0.5);
		 	//Data logging to be implemented
			 break;

			 case "Time out":
				webAudioXML.setVariable("x1", 0.5);
				webAudioXML.setVariable("y1", 0.5);
				webAudioXML.setVariable("x2", 0.5);
				webAudioXML.setVariable("y2", 0.5);
				webAudioXML.setVariable("x3", 0.5);
				webAudioXML.setVariable("y3", 0.5);
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


			default:
			webAudioXML.setVariable(msg.name, msg.data);
			break;
				
		}
	});

});




