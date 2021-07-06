const expressApp = require('express')();
const https = require('https');
const fs = require('fs');


const secureServer = https.createServer({
/*
    requestCert: false,
    rejectUnauthorized: false
*/
	key: fs.readFileSync('./RootCA.key'),
	cert: fs.readFileSync('./RootCA.pem')
}, expressApp);



expressApp.get('/*', (req, res) => {
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




const ios = require('socket.io')(secureServer);



ios.on('connection', socket => {
	
	
	console.log('client connected');
		
	socket.on('clientToServer', msg => {
		var relX;
		if(msg.touchArray){
			if(msg.touchArray[0]){
				relX = msg.touchArray[0].clientX;
			}
		}
		//console.log('clientToServer', msg.id, msg.name, relX);		
		ios.emit('serverToClient', msg);
	
	});
	
});




'use strict';

var os = require('os');
var ifaces = os.networkInterfaces();
var portNr = 8000;

Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log("https://" + alias, iface.address + ":" + portNr);
      console.log("https://127.0.0.1:" + portNr);
    } else {
      // this interface has only one ipv4 adress
      console.log("https://" + iface.address + ":" + portNr);
      console.log("https://127.0.0.1:" + portNr);
    }
    ++alias;
  });
});





secureServer.listen(portNr, () => {
	console.log('https Server running on port ' + portNr);
});


