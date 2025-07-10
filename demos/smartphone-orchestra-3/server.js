var app = require('express')();

const nocache = require('nocache');
app.use(nocache());

var http = require('http').Server(app);
const fs = require("fs");
const path = require("path");
const IO = require('socket.io');
const port = process.env.PORT || 4500;

var MidiManager = require("./script/MidiManager.js");

const STC = 'serverToClient';



// HTTPS

const https = require("https");
// Read SSL certificate and key files
const options = {
	key: fs.readFileSync(path.join(__dirname, "localhost-key.pem")),
	cert: fs.readFileSync(path.join(__dirname, "localhost.pem")),
	requestCert: false,
	rejectUnauthorized: false
  };
  
// Create HTTPS server
const httpsServer = https.createServer(options, app);
httpsServer.listen(port, () => {
	console.log(`App listening on https://localhost:${port}`);
});




app.get('/*', function(req, res){
  var basePath = req.url;

  //Uncomment for param support

  var path = req.url;
  var pathArr = path.split("?");
  var basePath = pathArr[0];
  var restPath;
  if(pathArr.length>1){
  	 restPath = pathArr[1];
  	 //fix params here if necessary

  }
  res.sendFile(__dirname + basePath);
});


//console.log('http: ' + http);
//console.log('io: ' + io);

var time;

let sockets = [];
let soloist;

const conn = (socket) => {
	console.log('app connected');
		
	socket.on('addClient', (userAgent) => {
		// add socket
		sockets.push(socket);
		console.log("client added", socket.id, userAgent);
	});


	socket.on('clientToServer', (msg) => {
		
		// console.log('clientToServer', msg);	
		
		switch(msg.command){

			case "midiIn":

				// noteoff/noteon
				let curNotes = midiManager.getCurrentKeys();
				midiManager.midiIn(msg.value);
				let newNotes = midiManager.getCurrentKeys();
				// console.log(curNotes, newNotes);	
				let gain = 1; //Math.min(1, 1 / newNotes.length);

				// distribute notes to sockets evenly. If fewer than 4 notes, a fraction of the sockets will play
				// but always at least one socket per note.
				let voicesCnt = Math.max(newNotes.length, sockets.length / Math.max(1, 5 - newNotes.length));
				if(curNotes.length != newNotes.length){
					if(!newNotes.length){
						sockets.forEach(socket => {
							socket.emit(STC, {
								command: "midinoteoff"
							});
						});
					} else {
						// console.log("voicesCnt:", voicesCnt);
						sockets.forEach((socket, i) => {
							if(i < voicesCnt){
								let id = Math.floor(i / voicesCnt * newNotes.length);
								let note = newNotes[id];
								socket.emit(STC, {
									command: "midinote",
									value: {key: note, gain: gain}
								});
								// console.log("midinote", note);
							} else {
								socket.emit(STC, {
									command: "midinoteoff"
								});
								// console.log("midinoteoff");
							}
							
						});
					}
					
				}
				if(msg.value.status != 9){
					// controllers
					io.emit(STC, msg);
				}

				
			break;

			case "set-solo":
				if(soloist){
					// release current soloist
					soloist.emit(STC, {command: "set-mode", value: "pad"});
					sockets.push(soloist);
					soloist = undefined;
				}
				switch(msg.value){
					case 0:
					// no solo
					sockets.forEach(socket => {
						socket.emit(STC, {command: "set-mode", value: "pad"});
					});
					break;
					
					case 1:
					// pick a random soloist (other than the last 25% which might have been a recent soloist)
					soloist = sockets.splice(Math.floor(Math.random() * 0.75 * sockets.length), 1).pop();
					soloist.emit(STC, {command: "set-mode", value: "solo"});
					break;

					case 2:
					// all solo
					sockets.forEach(socket => {
						socket.emit(STC, {command: "set-mode", value: "solo"});
					});
					break;

					default:
					break;
				}
			break;	

			case "trig-test":
				let delayTime = 200 + 200 * msg.value;
				let scale = [0,2,3,5,7,8,10,12];
				sockets.forEach((socket, i) => {
					setTimeout(() => {
						let key = 74 + scale[i % scale.length];
						socket.emit(STC, {command: "testNote", value: key});
						console.log(key);
					}, i * delayTime);
				});
			break;

			case "generate-number":
			sockets.forEach((socket, i) => {
				socket.emit(STC, {
					command: "midinote",
					value: (Math.random()*100).toFixed(0)
				});
			});
			break;
			

			default:
				io.emit(STC, msg);
			break;
		}
		
	
	});
	

	socket.on("disconnect", (reason) => {
		
		// remove socket
		sockets = sockets.filter(s => s != socket);
		
	});
	
}

var io = IO(http);
io.on('connection', conn);

const ioSecure = IO(httpsServer);
ioSecure.on('connection', conn);

http.listen(3000, function(){
  
  console.log('now listening on *:3000');
	
});


const midiManager = new MidiManager();