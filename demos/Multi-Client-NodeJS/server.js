var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


//var useOnsetData = (process.argv[2] == "use-onset-data");



// STORAGE
/*
var param = "events";
var store = require('data-store')('folkDJ');
var events = process.argv[2] == "clear" ? [] : store.get(param) || [];
//store.del({force: true});
//store.save();

function addEvent(event){
	
	event.time = Date.now();
	events.push(event);

	//console.log(event);
	//console.log("---------");
}

function saveData(){
	store.set(param, events);
	store.save();
}

*/


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


io.on('connection', function(socket){
	console.log('client connected');
		
	socket.on('clientToServer', function(msg){
		
		//console.log('clientToServer', msg);		
		io.emit('serverToClient', msg);
	
	});
	
	
});


'use strict';

var os = require('os');
var ifaces = os.networkInterfaces();

Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log("http://" + alias, iface.address + ":3000");
    } else {
      // this interface has only one ipv4 adress
      console.log("http://" + iface.address + ":3000");
    }
    ++alias;
  });
});



http.listen(3000, function(){
  
  console.log('Server Running on localhost:3000');

});