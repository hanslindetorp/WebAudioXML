(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

var WebAudioUtils = require('./WebAudioUtils.js');
var Loader = require('./Loader.js');
var Watcher = require('./Watcher.js');
var Mapper = require('./Mapper.js');



class AudioObject{

  	constructor(xmlNode, waxml, localPath){

	  	this.waxml = waxml;
	  	let _ctx = this.waxml._ctx;

	  	this._params = WebAudioUtils.attributesToObject(xmlNode.attributes);
	  	this._xml = xmlNode;
	  	let timeUnit = this.getParameter("timeunit");

  		switch(timeUnit){
		  	case "ms":
		  	this._params.timescale = 1/1000;
		  	break;

		  	default:
		  	this._params.timescale = 1;
		  	break;
	  	}


	  	this._localPath = localPath;

		  let nodeType = xmlNode.nodeName.toLowerCase();

	  	this._ctx = _ctx;
	  	let fn, src;
	  	this._nodeType = nodeType;

	  	switch(nodeType){


		  	case "analysernode":
		  	this._node = this._ctx.createAnalyser();
		  	break;


		  	case "audiobuffersourcenode":
		  	// just a temporary node
		  	this._node = this._ctx.createBufferSource();
		  	break;


		  	case "oscillatornode":
		  	this._node = this._ctx.createOscillator();
		  	this._node.start();
		  	break;


		  	case "biquadfilternode":
		  	this._node = this._ctx.createBiquadFilter();
		  	break;

		  	case "convolvernode":
		  	src = this._params.src;

		  	if(src){



			  	src = Loader.getPath(src, this._localPath);
			  	var node = this._ctx.createConvolver();
			  	this._node = node;



			  	/*
			  	let request = new XMLHttpRequest();
				request.open('GET', src, true);
				request.responseType = 'arraybuffer';


				request.onload = function() {
			        // decode the buffer into an audio source
			        _ctx.decodeAudioData(request.response, function(audioBuffer) {
			          if (buffer) {
			          	// store all buffers in buffers
			            //buffers[obj.url] = buffer;
			            //returnObj.duration = buffer.duration;
			            // store reference in this object
			            // obj.buffer = buffer;
			            node.buffer = audioBuffer
			            //console.log(obj.url + " loaded. offset: " + obj.offset);
			            //callBack(returnObj);

			          }
			        }, function(){
			        	console.error('File "' + src + '" could not be decoded');
			        	//buffers[obj.url] = -1;
			        	//callBack();
			        });
			     };
			     request.onerror = function() {
			          console.error('File "' + src + '" could not be loaded');
			          //buffers[obj.url] = -1;
			          //callBack();
			     };

				request.send();


			  	*/



			  	fetch(src) // "https://cors-anywhere.herokuapp.com/" + src
			        .then(response => response.arrayBuffer())
			        .then(arrayBuffer => this._ctx.decodeAudioData(arrayBuffer,
			        	audioBuffer => this._node.buffer = audioBuffer,
			        	e => reject(e)
			        ));

		  	}

		  	break;

		  	case "delaynode":
		  	if(this._params.maxDelayTime){
			  	this._node = this._ctx.createDelay(this._params.maxDelayTime * this._params.timescale);
		  	} else {
			  	this._node = this._ctx.createDelay();
		  	}

		  	break;

		  	case "dynamicscompressornode":
		  	break;

		  	case "stereopannernode":
		  	if(this._ctx.createStereoPanner){
			  	this._node = this._ctx.createStereoPanner();
		  	} else {
			  	this.fakePanner = true;
			    this._node = this._ctx.createPanner();
			    this._node.panningModel = 'equalpower';
			  }


/*
			  	this.input = this._ctx.createGain();
			  	this.channelSplitter = this._ctx.createChannelSplitter(2);
				this.channelSplitter.channelCountMode = "explicit";
				this.channelSplitter.channelInterpretation = "discrete";
			  	this.L = this._ctx.createGain();
			  	this.R = this._ctx.createGain();
			  	this._node = this._ctx.createChannelMerger(2);
				this._node.channelCountMode = "explicit";
				this._node.channelInterpretation = "discrete";


			  	this.input.connect(this.channelSplitter);
			  	this.channelSplitter.connect(this.L, 0, 0).connect(this._node, 0, 0);
			  	this.channelSplitter.connect(this.R, 1, 0).connect(this._node, 0, 1);
*/

		  	break;

		  	case "waveshapernode":
		  	break;

		  	case "periodicwavenode":
		  	break;

		  	case "iirfilternode":
		  	break;

		  	case "xml":
		  	break;

		  	case "audio":
        case "gainnode":
        case "mixer":
        case "voice":
		  	this._node = this._ctx.createGain();
		  	break;

        case "send":
		  	//this.input = this._ctx.createGain();
		  	this._node = this._ctx.createGain();
        //this.input.connect(this._node);
        break;

		  	case "chain":
		  	this.input = this._ctx.createGain();
		  	//console.log("chain input", this.input.__resource_id__);
		  	this._node = this._ctx.createGain();
		  	break;

		  	case "envelope":
		  	this._node = xmlNode.parentNode.audioObject._node;
		  	this._params.max = this._params.max || 1;
		  	this._params.valuescale = this._params.max / 100;
		  	this.setTargetAtTime(this._node, 0, 0, 0, true);
		  	break;



		  	// parameters
		  	default:
		  	this.mapper = new Mapper(this._params);

		  	nodeType = WebAudioUtils.caseFixParameter(nodeType);
		  	let parentAudioObj = xmlNode.parentNode.audioObject;

		  	if(parentAudioObj){

			  	this._node = parentAudioObj.getParameterNode(nodeType);
			  	if(this._params.value){
				  	this._params.value = WebAudioUtils.typeFixParam(nodeType, this._params.value);
				  	this._node.value = this._params.value;
				  }

  				if(this._params.follow){
  					this.watcher = new Watcher(xmlNode, this._params.follow, {
              delay: this.getParameter("delay"),
              waxml: this.waxml,
              range: this._params.range,
              value: this._params.value,
              curve: this._params.curve,
              callBack: val => {

    						val = this.mapper.getValue(val);
                let time = 0;

    						switch(this._node.name){
    							case "delayTime":
    							val *= this._params.timescale;
    							break;

                  case "frequency":
                  if(parentAudioObj){
                    if(parentAudioObj._nodeType.toLowerCase() == "oscillatornode"){
                      time = this.getParameter("portamento") || 0;
                      time *= this._params.timescale;
                    }
                  }
                  break;

    							default:
    							break;
    						}

    						this.setTargetAtTime(this._node, val, 0, time, true);
    					 }
             });
  				 }

  		  	} else {
  			  	console.error("WebAudioXML: Invalid element - '" + nodeType + "'");
  		    }
		  	  break;
	  	}

	  	//console.log(nodeType, this._node.__resource_id__);

	  	// set parameters
	  	if(this._params){
		  	Object.keys(this._params).forEach(key => {
		  		this[key] = this._params[key];
  			});
  		};

  	}

    follow(val){

      val = this.mapper.getValue(val);

      switch(this._node.name){
        case "delayTime":
        val *= this._params.timescale;
        break;

        default:
        break;
      }

      this.setTargetAtTime(this._node, val, 0, 0, true);
    }

  	getParameter(paramName){
	  	if(typeof this._params[paramName] === "undefined"){
		  	if(this._xml.parentNode){
			  	if(this._xml.parentNode.audioObject){
				  	return this._xml.parentNode.audioObject.getParameter(paramName);
			  	} else {
				  	return 0;
			  	}

		  	} else {
			  	return 0;
		  	}

	  	} else {
		  	return this._params[paramName];
	  	}
  	}


  	get connection(){
	  	return this._node;
  	}

  	get input(){

	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	case "audiobuffersourcenode":
		  	break;

		  	default:
		  	return this._input || this._node;
		  	break;
		  }

  	}

  	set input(node){
	  	this._input = node;
  	}


  	getParameterNode(param){
	  	if(!this._node){return}
	  	return this._node[param];
  	}

  	disconnect(ch){
	  	if(!this._node){return}
	  	ch = ch || 0;
	  	this._node.disconnect(ch);
  	}

  	connect(destination){

	  	if(this._node){
		  	if(this._node.connect){
			  	destination = destination || this._ctx.destination;
			  	this._node.connect(destination);

		  	}
	  	}
	  	this._destination = destination;;

  	}


  	inputFrom(sourceObject){
	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	case "audiobuffersourcenode":
		  	break;

		  	default:
		  	sourceObject.connect(this.input);
		  	break;
		  }
  	}

  	start(data){
	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	/*
		  	if(this._params.followkeyboard){
			  	let x = WebAudioUtils.MIDInoteToFrequency(data.note);
			  	if(this._params.followkeyboard.includes("x")){
				  	// what is this for?
				  	x = eval(this._params.followkeyboard);
			  	}
			  	this.frequency = x;
		  	}
		  	*/
		  	break;


		  	case "audiobuffersourcenode":
		  	this._node = this._ctx.createBufferSource();
		  	this._node.buffer = this._buffer;
		  	this._node.connect(this._destination);
		  	this._node.start();
		  	break;


		  	case "frequency":
		  	if(this._params.follow){
			  	if(this._params.follow.includes("MIDI")){
				  	let MIDI = data.note;
				  	let MIDInote = eval(this._params.follow);
			  		let hz = WebAudioUtils.MIDInoteToFrequency(MIDInote);
				  	this.value = hz;
			  	}
		  	}
		  	break;



		  	case "voice":
		  	this.gain = 1;
		  	break;


		  	case "envelope":
		  	if(this._params.adsr){
          let fn = e => {
            this.setTargetAtTime(this._node, this._params.valuescale * 100, 0, this._params.adsr.attack * this._params.timescale, true);
  			  	this.setTargetAtTime(this._node, this._params.valuescale * this._params.adsr.sustain, this._params.adsr.attack * this._params.timescale, this._params.adsr.decay * this._params.timescale);
          }
          let delay = this.getParameter("delay");
          if(delay){
            setTimeout(fn, delay * this._params.timescale * 1000);
          } else {
            fn();
          }
		  	}
		  	break;
	  	}
  	}

  	stop(data){

	  	switch(this._nodeType){

		  	case "voice":
		  	this.gain = 0;
		  	break;

		  	case "envelope":
		  	if(this._params.adsr){
          let fn = e => {
			  	  this.setTargetAtTime(this._node, 0, 0, this._params.adsr.release * this._params.timescale, true);
          }
          let delay = this.getParameter("delay");
          if(delay){
            setTimeout(fn, delay * this._params.timescale * 1000);
          } else {
            fn();
          }

		  	}
		  	break;
	  	}
  	}




  	setTargetAtTime(param, value, delay, transitionTime, cancelPrevious){

	  	let startTime = this._ctx.currentTime + (delay || 0);
	  	//transitionTime = transitionTime || 0.001;
	  	//console.log(value, delay, transitionTime, cancelPrevious);

	  	if(!this._node){
		  	console.error("Node error:", this);
	  	}
	  	if(typeof param == "string"){param = this._node[param]}

      if(param.value == value){return}

	  	if(cancelPrevious){
		  	param.cancelScheduledValues(this._ctx.currentTime);
	  	}
	  	if(transitionTime){
		  	param.setTargetAtTime(value, startTime, transitionTime);
	  	} else {
		  	param.setValueAtTime(value, startTime);
	  	}

  	}

  	set src(path){
	  	this._src = path;

	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	break;

		  	case "audiobuffersourcenode":
		  	let src = Loader.getPath(path, this._localPath);

		  	fetch(src)
		        .then(response => response.arrayBuffer())
		        .then(arrayBuffer => this._ctx.decodeAudioData(arrayBuffer,
		        	audioBuffer => {
			        	this._buffer = audioBuffer;
			        },
		        	e => reject(e)
		        ));


		  	break;

		  	default:
		  	break;

	  	}
  	}

  	get src(){

	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	return this.type;
		  	break;

		  	case "audiobuffersourcenode":
		  	case "convolvernode":
		  	return this._src;
		  	break;

		  	default:
		  	return false;
		  	break;

	  	}
  	}

  	set gain(val){
	  	this.setTargetAtTime("gain", val);
  	}

  	get gain(){
	  	return this._node.gain.value;
  	}

  	set frequency(val){
  		this.setTargetAtTime("frequency", val);
  	}

  	get frequency(){
	  	return this._node.frequency.value;
  	}

  	set detune(val){
	  	this.setTargetAtTime("detune", val);
  	}

  	get detune(){
	  	return this._node.detune.value;
  	}

  	set q(val){
	  	this.setTargetAtTime("Q", val);
  	}

  	get q(){
	  	return this._node.Q.value;
  	}

  	set type(val){

	  	switch(val){

		  	case "sine":
		  	case "sawtooth":
		  	case "square":
		  	case "triangle":

        case "lowpass":
        case "highpass":
        case "bandpass":
        case "lowshelf":
        case "highshelf":
        case "peaking":
        case "notch":
        case "allpass":
		  	this._node.type = val;
		  	break;


		  	default:

		  	if(val.includes(".js") || val.includes(".json")){
				// load PeriodicWave data
			  	let src = Loader.getPath(val, this._localPath);


			  	fetch(src)
					.then((response) => {
						return response.json();
					})
					.then((jsonData) => {
						if(jsonData.real && jsonData.imag){
					  		let wave = this._ctx.createPeriodicWave(real, imag);
					  		this._node.setPeriodicWave(wave);
						}
					});

		  	} else {
			  	let el = document.querySelector(val);
			  	if(el){
				  	let jsonData = JSON.parse(el.innerHTML);
				  	let wave = this._ctx.createPeriodicWave(real, imag);
				  	this._node.setPeriodicWave(wave);
				}
		  	}

		  	break;
	  	}



  	}

  	get type(){
	  	return this._node.type;
  	}


  	get delayTime(){
	  	return this._node.delayTime.value / this._params.timescale;
  	}

  	set delayTime(val){
	  	this.setTargetAtTime("delayTime", val * this._params.timescale);
  	}

  	set value(val){
	  	this.setTargetAtTime(this._node, val);
  	}

  	get value(){
	  	return this._node.value;
  	}

  	set pan(val){
	  	if(this.fakePanner){
			this._node.setPosition(val, 0, 1 - Math.abs(val));
/*
		  	this.setTargetAtTime(this.L.gain, 0.5-(val/2));
		  	this.setTargetAtTime(this.R.gain, 0.5+(val/2));
*/
	  	} else {
		  	this.setTargetAtTime("pan", val);
	  	}

  	}

  	get pan(){
	  	return this._params.pan;
  	}

  	set(key, value){
	  	if(typeof this._node[key] !== "undefined"){
		  	this[key] = value;
	  	}
  	}


}


module.exports = AudioObject;

},{"./Loader.js":6,"./Mapper.js":7,"./Watcher.js":12,"./WebAudioUtils.js":14}],2:[function(require,module,exports){


class Connector {

	constructor(xml, _ctx){

		this._xml = xml;
		this._ctx = _ctx;
		this.connect(xml);
	}



	connect(xmlNode){


		let nodeName = xmlNode.nodeName.toLowerCase();
		switch(nodeName){
			case "chain":
			// connect chain input to first element in chain
			let done = false;
			let targetNode;
			while(!done){
				if(!targetNode){
					targetNode = xmlNode.firstChild;
				} else {
					targetNode = targetNode.nextElementSibling;
				}


				if(!targetNode){
					// no children - connect to chain's output
					done = true;
					xmlNode.audioObject.input.connect(xmlNode.audioObject._node);
				} else {
					if(targetNode.nodeName == "#text"){continue}
					if(targetNode.nodeName == "parsererror"){continue}

					switch(targetNode.nodeName.toLowerCase()){
						//case "send":
						case "oscillatornode":
						case "audiobuffernode":
						break;

						case "send":
						targetNode.audioObject.inputFrom(xmlNode.audioObject.input);
						break;

						default:
						done = true;
						targetNode.audioObject.inputFrom(xmlNode.audioObject.input);
						break;
					}

				}


			}
			break;

			case "parsererror":
			case "style":
			case "link":
			return;
			break;
		}


		let output = xmlNode.getAttribute("output");
		if(output){

			// connect to specified node within the scope of this (external) document
			let topElement = xmlNode.closest("[href$='.xml]") || this._xml;
			topElement.querySelectorAll(output).forEach(target => {
				xmlNode.audioObject.connect(target.audioObject.input);
			});

		} else {

			// connect in chain or mix

			let target;
			let parentNodeType = xmlNode.parentNode.nodeName.toLowerCase();
			switch(parentNodeType){


				case "mixer":
				case "audio":
				case "voice":
				case "synth":
				xmlNode.audioObject.connect(xmlNode.parentNode.audioObject._node);
				break;

				case "chain":

				// run through following nodes to connect all
				// sends
				let targetNode = xmlNode;
				let done = false;

				while(!done){
					targetNode = targetNode.nextElementSibling;

					if(!targetNode){

						// connect last object to chain output
						done = true;
						targetNode = xmlNode.parentNode;
						xmlNode.audioObject.connect(targetNode.audioObject._node);
					} else {
						if(targetNode.nodeName == "#text"){continue}
						done = targetNode.nodeName.toLowerCase() != "send";
						xmlNode.audioObject.connect(targetNode.audioObject.input);
					}


				}

				target = this.getNextInput(xmlNode);
				break;


				// connect to parameter input
				case "gain":
				xmlNode.audioObject.connect(xmlNode.parentNode.audioObject._node);
				break;

				default:
				xmlNode.audioObject.connect(this._ctx.destination);
				break;
			}




		}
		Array.from(xmlNode.children).forEach(childNode => this.connect(childNode));

	}

	getNextInput(xmlNode){
		let nextSibling = xmlNode.nextElementSibling;
		if(nextSibling){
			if(nextSibling.audioObject.input){
				return nextSibling.audioObject.input;
			} else {
				return this.getNextInput(nextSibling);
			}
		} else {
			return xmlNode.parentNode.audioObject._node;
		}

	}
}




module.exports = Connector;

},{}],3:[function(require,module,exports){

var Sequence = require('./Sequence.js');


class EventTracker {

	constructor(_varRouter){
		this._variableRouter = _varRouter;

		this._sequences = [];
		this._registeredEvents = [];

		this._curSeqName = "default";
		this.addSequence();
	}

	getSequence(name = this._curSeqName){
		return this._sequences.find(seq => seq.name == name);
	}

	addSequence(name = this._curSeqName, events = []){
		let seq = this.getSequence(name);
		if(seq){
			seq.update(events);
		} else {
			seq = new Sequence(this, name, events);
			this._sequences.push(seq);
		}
		return seq;
	}

	addSequenceFromLastGesture(name){
		let events = this.lastGesture;
		let seq = new Sequence(this, name, events);
		return seq;
	}

	deleteSequence(name){
		let i = this._sequences.findIndex(seq => seq.name == name);
		if(i){
			this._sequences.splice(i, 1);
		}
	}

	registerEvent(name, execute){
		return this.getEventObject(name, execute);
	}



	registerEventListener(name, target = document, eventName, execute, process){

		let targetEl;
		if(typeof target == "string"){
			targetEl = document.querySelector(target);
		}
		if(targetEl == null){
			console.warn("WebAudioXML error: There is no interactionArea with selector " + target + ". Document will be used instead.");
			target = document;
		} else {
			target = targetEl;
		}

		let ev = this.getEventObject(name, execute, process, target);
		if(target.addEventListener){
			target.addEventListener(eventName, (e => ev.send(e)));
		} else {
			console.error("EventTracker error: " +  target + " does not support addEventListener()");
		}
		return ev;
	}

	getEventObject(name, execute, process, target){
		let ev = this._registeredEvents.find(ev => ev.name == name);
		if(!ev){ev = this.createEvent(name, execute, process, target)}
		return ev;
	}

	createEvent(name, execute, process, target){

		let ev = {
			name: name,
			target: target,
			process: process,
			execute: execute,
			send: (event => {

				if(!this.playing){
					// if process is set, then run it
					let data = ev.process ? ev.process(event, target) : event;

					// store data in sequencer
					this.currentSequence.store(name, data);

					// execute function
					if(ev.execute){ev.execute(data)}
				}
			})
		}
		this._registeredEvents.push(ev);

		return ev;
	}

	trigEvent(name, value){
		let ev = this._registeredEvents.find(ev => ev.name == name);
		if(ev.execute){ev.execute(value)}
	}

	clear(name = this._curSeqName){

		this.getSequence(name).clear();
	}

	allEvents(name = this._curSeqName, filter = []){
		return this.getSequence().allEvents(filter);
	}

	get currentSequence(){
		return this.getSequence(this._curSeqName);
	}

	get lastTouchGesture(){
		let seq = this.getSequence("default");
		let name = seq.name;
		let events = seq.events("touchstart", "touchend", ["touchstart", "touchmove", "touchend"], ["relX", "relY"]);
		return new Sequence(this, name, events);
	}

	get lastGesture(){
		let seq = this.getSequence("default");
		let name = seq.name;
		let events = seq.events("pointerdown", "pointerup", ["pointerdown", "pointermove", "pointerup"], ["relX", "relY"]);
		return new Sequence(this, name, events);
	}

	set playing(state){
		this._playing = state;
	}
	get playing(){
		return this._playing;
	}
}


module.exports = EventTracker;

},{"./Sequence.js":10}],4:[function(require,module,exports){

var Mapper = require('./Mapper.js');


class GUI {

	constructor(xmlNode, targetElement){
		let el = this.parseXML(xmlNode, targetElement);
		el.classList.add("WebAudioXML");
	}


	parseXML(xmlNode, targetElement){

		let nodeName = xmlNode.nodeName.toLowerCase();


		switch(nodeName){
			case "link":
			case "style":
			case "parsererror":
			return;
			break;
		}


		let node = xmlNode.audioObject._node;

		let params = this.getParameters(node);

		let el;

		if(params.length){

			el = document.createElement("div");

			el.className = nodeName;
			if(nodeName.substr(-4) == "node"){
				el.classList.add("node");
			}
			targetElement.appendChild(el);
			let title = document.createElement("header");
			title.innerHTML = nodeName;
			el.appendChild(title);

			params.forEach(param => this.addElement(node, el));
		} else {
			// attach child elements to the parent if this was not a node
			el = targetElement;
		}

		Array.from(xmlNode.children).forEach(childNode => this.parseXML(childNode, el));
		return el;
	}

	addElement(node, targetElement){

		let labelEl = document.createElement("label");
		let header = document.createElement("header");
		header.innerHTML = param.label;

		let el = document.createElement(param.nodeName);
		let output = document.createElement("span");
		output.className = "output";

		//Object.keys(param.attributes).forEach(key => el.setAttribute(key, param.attributes[key]));


		//el._attributes = param.attributes;

		labelEl.appendChild(header);
		labelEl.appendChild(el);
		labelEl.appendChild(output);
		targetElement.appendChild(labelEl);

		el.addEventListener("input", e => {
			let val = node.mapper.getValue(e.target.value);
			output.innerHTML = val;


			param.audioParam.setTargetAtTime(val, 0, 0.001);
		});
	}

	getParameters(node){

		let params = [];


		Object.keys(node.__proto__).forEach(key => {

			let param = node[key];
			if(param instanceof AudioParam){

				let obj = {};
				obj.audioParam = param;
				obj.label = key;
				let attr = {};
				obj.attributes = attr;
				params.push(obj);

				obj.nodeName = "input";
				attr.type = "range";
				attr.value = param.value;

				switch(key){


					case "frequency":
					attr.min = 0;
					attr.max = 22050;
					attr.conv = "Math.pow(10, x*3)/1000";
					break;

					case "detune":
				  	attr.min = -4800;
				  	attr.max = 4800;
				  	attr.conv = 1;
				  	break;

					case "Q":
					case "q":
				  	attr.min = 0;
				  	attr.max = 30;
				  	attr.conv = 1;
				  	break;

					default:
				  	attr.min = 0;
				  	attr.max = 1;
				  	attr.conv = "x";
				  	break;

				}
				attr.step = (attr.max - attr.min) / 100;

			} else if(param instanceof String){
				console.log(key, node[key]);
			}

		});

		return params;


	}



}




module.exports = GUI;

},{"./Mapper.js":7}],5:[function(require,module,exports){

var EventTracker = require('./EventTracker.js');


class InteractionManager {

	constructor(waxml){
		this.eventTracker = new EventTracker();
		this.waxml = waxml;
		this.inited = false;
		this._data = {};

		// variables
		// create a way of keeping track of each touch
		// during a multi touch
		let touches = [];
		while(touches.length < (navigator.maxTouchPoints || 1)){
			touches.push({});
		}
		this._data.touch = touches;
		this.touchIDs = [];

		this._data.client = [];

		while(this._data.client.length < 10){
			let c = {};
			c.touchIDs = [];

			c.touch = [];
			while(c.touch.length < 5){
				c.touch.push({});
			}

			c.acceleration = {};
			c.accelerationIncludingGravity = {};
			c.rotationRate = {};

			c.deviceOrientation = {};

			this._data.client.push(c);
		}

	}



	init(){
		this.inited = true;
		this.waxml.init();

		if (window.DeviceMotionEvent) {


			if(typeof DeviceMotionEvent.requestPermission === 'function'){
				// iOS 13+
				DeviceMotionEvent.requestPermission()
				.then(response => {
					if (response == 'granted') {
						window.addEventListener('devicemotion', e => {this.setDeviceMotion(e)});
					}
				})
				.catch(console.error);
			} else {
				// non iOS 13+
				window.addEventListener('devicemotion', e => {this.setDeviceMotion(e)});
			}


		} else {

			console.log("this device does not support DeviceMotionEvent");
		}


		if (window.DeviceOrientationEvent) {

			if(typeof DeviceOrientationEvent.requestPermission === 'function'){
				DeviceOrientationEvent.requestPermission()
				.then(response => {
					if (response == 'granted') {
						window.addEventListener('deviceorientation', e => {this.setDeviceOrientation(e)});
					}
				})
				.catch(console.error);
			} else {
				// non iOS 13+
				window.addEventListener('deviceorientation', e => {this.setDeviceOrientation(e)});
			}
		} else {
			console.log("this device does not support DeviceOrientationEvent");
		}
	}

	get variables(){
		return this._data;
	}

	registerEvents(target = document){

		// default value  does not seam to work if target is null
		if(!target){target = document}

		this.eventTracker.registerEventListener("touchstart", target, "touchstart",
			data => {

			}, event => {
				return event;

			}
		);

		this.eventTracker.registerEventListener("touchmove", target, "touchmove",
			data => {

			}, event => {
				return event;
			}
		);
		this.eventTracker.registerEventListener("touchend", target, "touchend",
			data => {

			}, event => {
				return event;
			}
		);
		this.eventTracker.registerEventListener("touchcancel", target, "touchcancel",
			data => {

			}, event => {
				return event;
			}
		);


		let pointerDownEvent = window.PointerEvent ? "pointerdown" : "mousedown";
		let pointerMoveEvent = window.PointerEvent ? "pointermove" : "mousemove";
		let pointerUpEvent = window.PointerEvent ? "pointerup" : "mouseup";

		this.eventTracker.registerEventListener("pointerdown", target, pointerDownEvent,
			(e => {return this.pointerDownExecute(e)}), (e => {return this.pointerDownProcess(e)})
		);
		this.eventTracker.registerEventListener("pointermove", target, pointerMoveEvent,
			(e => {return this.pointerMoveExecute(e)}), (e => {return this.pointerMoveProcess(e)})
		);
		this.eventTracker.registerEventListener("pointerup", target, pointerUpEvent,
			(e => {return this.pointerUpExecute(e)}), (e => {return this.pointerUpProcess(e)})
		);


	}

	setDeviceMotion(e){}

	setDeviceOrientation(e){
		this._data.alpha = e.alpha;
		this._data.beta = e.beta;
		this._data.gamma = e.gamma;
	}

	copyTouchProperties(source, target){
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
		target.target = source.target;
	}

	setRelativePos(obj, event){
		if(event.target){
			obj.relX = (event.clientX-event.target.offsetLeft) / event.target.offsetWidth * 100;
			obj.relY = (event.clientY-event.target.offsetTop) / event.target.offsetHeight * 100;
		}
	}

	setMovePos(obj, x, y){
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
			obj.relMoveX = obj.moveX / window.innerWidth * 100;
			obj.relMoveY = obj.moveY / window.innerHeight * 100;
		}
	}


	touchStart(){

		//e.preventDefault();
		Array.prototype.forEach.call(e.changedTouches, touch => {
			let identifier = this.touchIDs.find((el, id) => this._data.touch[id].down != 1);
			let i;

			if(identifier){
				i = this.touchIDs.indexOf(identifier);
				this.touchIDs[i] = touch.identifier;
			} else {
				i = this.touchIDs.length;
				this.touchIDs.push(touch.identifier);
			}

			let touchObj = this._data.touch[i];
			this.copyTouchProperties(touch, touchObj);
			this.setRelativePos(touchObj, touch);
			this.setMovePos(touchObj);
			touchObj.down = 1;

			this.waxml.start("*[trig='touch[" + i + "]']");
		});

	}

	touchMove(){

		//e.preventDefault();
		Array.prototype.forEach.call(e.changedTouches, touch => {
			let touchObj = this._data.touch[touchIDs.indexOf(touch.identifier)];

			if(touchObj){
				this.copyTouchProperties(touch, touchObj);
				this.setRelativePos(touchObj, touch);
				this.setMovePos(touchObj, touch.clientX, touch.clientY);
			}
		});
	}

	touchEnd(e){

		//e.preventDefault();
		Array.prototype.forEach.call(e.changedTouches, touch => {
			let i = touchIDs.indexOf(touch.identifier);


			let touchObj = this._data.touch[i];
			if(touchObj){
				touchObj.down = 0;
				touchObj.force = 0;
				setMovePos(touchObj);
				this.waxml.stop("*[trig='touch[" + i + "]']");

			}

			// reset touch list if last touch
			let stillDown = 0;
			this._data.touch.forEach(touch => {
				stillDown = stillDown || touch.down;
			});
			if(!stillDown){
				while(touchIDs.length){
					touchIDs.pop();
				}
			}

		});
	}

	pointerDownProcess(e) {

		if(!this.inited){
			this.init();
		}

		// simulate touch behaviour if needed

		if(!navigator.maxTouchPoints){

			let touchObj = this._data.touch[0];
			this.copyTouchProperties(e, touchObj);
			this.setRelativePos(touchObj, e);
			this.setMovePos(touchObj);

			this.waxml.start("*[trig='touch[0]']");
			this.waxml.start("*[trig='client[0].touch[0]']");
		}


		let data = {};
		data.clientX = e.clientX;
		data.clientY = e.clientY;
		data.target = e.target;
		this.setRelativePos(data, e);
		this.setMovePos(data);
		return data;
	}

	pointerDownExecute(e) {

		// simulate touch behaviour if needed
		if(!navigator.maxTouchPoints){

			let touchObj = this._data.touch[0];
			this.copyTouchProperties(e, touchObj);
			this.setRelativePos(touchObj, e);
			this.setMovePos(touchObj);

			this.waxml.start("*[trig='touch[0]']");
			this.waxml.start("*[trig='client[0].touch[0]']");
		}

		this._data.mouseX = e.clientX;
		this._data.mouseY = e.clientY;

		this._data.pointerX = e.clientX;
		this._data.pointerY = e.clientY;

		this._data.relX = e.relX;
		this._data.relY = e.relY;

		this._data.moveX = e.moveX;
		this._data.moveY = e.moveY;
		this._data.relMoveX = e.relMoveX;
		this._data.relMoveY = e.relMoveY;

		this._data.mousedown = 1;
		this._data.pointerdown = 1;
		this._data.touchdown = 1;
		this.waxml.start("*[trig='mousedown']");
		this.waxml.start("*[trig='pointerdown']");
		this.waxml.start("*[trig='mouse']");
		this.waxml.start("*[trig='pointer']");
	}

	pointerMoveProcess(e){
		let data = {};

		if(!e){
			console.error(e);
		} else {
			data.clientX = e.clientX;
			data.clientY = e.clientY;
			data.target = e.target;
			this.setRelativePos(data, e);
			this.setMovePos(data);
		}

		return data;
	}

	pointerMoveExecute(e){
		this._data.mouseX = e.clientX;
		this._data.mouseY = e.clientY;

		this._data.pointerX = e.clientX;
		this._data.pointerY = e.clientY;

		this._data.relX = e.relX;
		this._data.relY = e.relY;

		this._data.moveX = e.moveX;
		this._data.moveY = e.moveY;
		this._data.relMoveX = e.relMoveX;
		this._data.relMoveY = e.relMoveY;

		// simulate touch behaviour if needed
		if(!navigator.maxTouchPoints){

			let touchObj = this._data.touch[0];
			this.copyTouchProperties(e, touchObj);
			this.setRelativePos(touchObj, e);
			this.setMovePos(touchObj);

			//this.setRelativePos(touchObj);
			//this.setMovePos(touchObj, e.clientX, e.clientY);

			touchObj = this._data.client[0].touch[0];
			this.copyTouchProperties(e, touchObj);
			this.setRelativePos(touchObj, e);
			this.setMovePos(touchObj);
		}
	}


	pointerUpProcess(e){
			let data = {};
			data.clientX = e.clientX;
			data.clientY = e.clientY;
			data.target = e.target;
			this.setRelativePos(data, e);
			this.setMovePos(data);
			return data;
	}
	pointerUpExecute(e){
		this._data.mousedown = 0;
		this._data.pointerdown = 0;
		this._data.touchdown = 0;

		this.waxml.stop("*[trig='mouseup']");
		this.waxml.stop("*[trig='pointerup']");

		this.waxml.stop("*[trig='mouse']");
		this.waxml.stop("*[trig='pointer']");

		// simulate touch behaviour if needed
		if(!navigator.maxTouchPoints){

			let touchObj = this._data.touch[0];
			this.copyTouchProperties(e, touchObj);
			this.setRelativePos(touchObj, e);
			this.setMovePos(touchObj, e.clientX, e.clientY);

			this.waxml.stop("*[trig='touch[0]']");
			this.waxml.stop("*[trig='client[0].touch[0]']");
		}
	}


	copy(spec = "pointer"){
		let seq;

		switch (spec) {
			case "pointer":
				seq = this.eventTracker.lastGesture;
				break;
			case "touch":
				seq = this.eventTracker.lastTouchGesture;
				break;
			default:
				seq = this.eventTracker.events;
				break;
		}

		let JSONdata = JSON.stringify(seq._events);
		let str = "webAudioXML.addSequence('_storedGesture', " + JSONdata + ");";

	  const el = document.createElement('textarea');
	  el.value = str;
	  el.setAttribute('readonly', '');
	  el.style.position = 'absolute';
	  el.style.left = '-9999px';
	  document.body.appendChild(el);
	  el.select();
	  document.execCommand('copy');
	  document.body.removeChild(el);
	}

	playLastGesture(){
		let seq = this.eventTracker.addSequence("_lastGesture", this.eventTracker.lastGesture._events);
		seq.play();
	}

	get lastGesture(){
		return this.eventTracker.lastGesture;
	}

	addSequence(name="_storedGesture", events){
		this.eventTracker.addSequence(name, events);
	}

	getSequence(name="_storedGesture"){
		return this.eventTracker.getSequence(name);
	}

	play(name="_storedGesture"){
		if(!this.inited){
			this.init();
		}
		let seq = this.getSequence(name);
		if(seq){
			seq.play();
		} else {
			console.error("WebAudioXML error: No such sequence - " + name);
		}
	}

}






module.exports = InteractionManager;

},{"./EventTracker.js":3}],6:[function(require,module,exports){



	
class Loader {



	constructor(src, callBack){
		
		this.href = src;
		this.complete = false;
	
		if(src){
		  	fetch(src)
		  	.then(response => response.text())
		  	.then(xml => {
			  	let parser = new DOMParser();
			  	let xmlDoc = parser.parseFromString(xml,"text/xml");
			  	this.complete = true;
			  	callBack(xmlDoc.firstChild);
			})
	/*
			.catch((error) => {
				console.error('XML load error:', error);
			});
	*/
		} else {
			console.error("XML load error: No source specified.");
		}
	}
}


Loader.getPath = (url, localPath = "") => {
	
	let slash = "/";
	if(!localPath.endsWith(slash)){
		localPath += slash;
	}
	if(!url.includes(slash + slash)){
		// add local path (relative to linking document
		// to URL so relative links are relative to the current XML scope and 
		// not to the main HTML-file
		url = localPath + url; 
	}
	
	return url;
}


Loader.getFolder = path => {

	let slash = "/";
	let i = path.lastIndexOf(slash);
	return path.substring(0, i);
	
}


module.exports = Loader;

},{}],7:[function(require,module,exports){
var WebAudioUtils = require('./WebAudioUtils.js');
var Range = require('./Range.js');

class Mapper{


	constructor(params){

		this.params = params;

		if(params.map){
			this.minIn = params.map.minIn;
			this.maxIn = params.map.maxIn;
			this.minOut = params.map.minOut;
			this.maxOut = params.map.maxOut;
			this.conv = params.map.conv;
		}

		this.steps = params.steps;
		this.curve = params.curve;
		this.value = params.value;
		if(params.range){
			this.range = new Range(params.range);
		}
	}


	getValue(x){

		if(typeof this.minIn == "undefined"){return x}

		let rangeObj, targetRange, relVal, rangeIn, rangeOut, valOut;

		rangeObj = {
			values: {min: this.minIn, max: this.maxIn},
			index: 0
		}

		if(this.range){
			let ro = this.range.getRange(x);
			if(ro.index == -1){
				rangeObj.values.min = 0;
				rangeObj.values.max = 0;
			} else {
				rangeObj = ro;
			}
		}

		targetRange = rangeObj.values;
		rangeIn = targetRange.max - targetRange.min;
		rangeOut = this.maxOut - this.minOut;
		x = (x - targetRange.min)/rangeIn;


		// kanske kolla alla ranges vilken som ger högst output
		// multiplicera med "gain" för att göra kurvorna brantare

		// crop
		x = Math.max(0, Math.min(x, 1));


		if(this.curve){
			let curve = this.curve[rangeObj.index % this.curve.length];

			switch (curve) {
				case "bell":
					x = this.mapToBell(x);
					console.log(x);
					break;

				case "sine":
					x = Math.sin(2 * x * Math.PI) / 2 + 0.5;
					break;

				case "half-sine":
					x = Math.sin(x * Math.PI);
					break;

				default:
					break;

			}

		}
		// scale
		// use curve and levels (what about max?)
		// to calculate output
		if(this.level){
			let level = this.level[rangeObj.index % this.level.length];

			x = x * level / 100;
		}

		if(x > 1){
			//console.log(x);
		}


		if(this.conv == "MIDI"){
			let noteOffs;
			if(this.steps){
				//let cycle = Math.floor(noteOffs / obj.stepsCycle);
				//let noteInCycle = noteOffs % obj.stepsCycle;

	      let notesInCycle = this.steps.length-1;
				let stepsCycle = this.steps[notesInCycle];
	      let nrOfCycles = rangeOut / stepsCycle;
	      rangeOut = notesInCycle * nrOfCycles + 1;
	      noteOffs = Math.floor(x * rangeOut);

	      let cycle = Math.floor(noteOffs / notesInCycle);
	      let noteInCycle = Math.floor(noteOffs % notesInCycle);
				noteOffs = cycle * stepsCycle + this.steps[noteInCycle];
			} else {
	      noteOffs = Math.floor(x * rangeOut);
	    }
			valOut = WebAudioUtils.MIDInoteToFrequency(this.minOut + noteOffs);

		} else {
			valOut = eval(this.conv);
			valOut = valOut * rangeOut + this.minOut;
		}


		return valOut;
	}

	mapToBell(x, stdD = 1/4, mean = 0.5, skew = 0){
		//let v = 1;
		//x = Math.sqrt( -2.0 * Math.log( x ) ) * Math.cos( 2.0 * Math.PI * v );

	  //This is the real workhorse of this algorithm. It returns values along a bell curve from 0 - 1 - 0 with an input of 0 - 1.
		// I found the example here: https://codepen.io/zapplebee/pen/ByvmMo

		//https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve

		let max = this.bellFn(0, stdD, mean, skew);
		let min = this.bellFn(mean, stdD, mean, skew);
		x = this.bellFn(x, stdD, mean, skew);
		return (max - x) / (max-min);
	}

	bellFn(x, stdD, mean, skew){
		return  1 / (( 1/( stdD * Math.sqrt(2 * Math.PI) ) ) * Math.pow(Math.E , -1 * Math.pow(x - mean, 2) / (2 * Math.pow(stdD,2))));
	}

}

module.exports = Mapper;

},{"./Range.js":9,"./WebAudioUtils.js":14}],8:[function(require,module,exports){

var Loader = require('./Loader.js');
var AudioObject = require('./AudioObject.js');
var Synth = require('./Synth.js');


	
class Parser {
		  	
	constructor(source, waxml, callBack){
		
	  	this.waxml = waxml;
	  	let _ctx = this.waxml._ctx;
	  	
		this.callBack = callBack;
		this.externalFiles = [];
		this._ctx = _ctx;
		
		if(source){
			if(source.includes(".") || source.includes("#") || source == "xml"){
				// if check if XML is embedded in HTML
				let xml = document.querySelector(source);
				if(xml){
					this._xml = xml.firstElementChild;
				}
				
			}
			
			
			if(this._xml){
				this.parseXML(this._xml);
				this._xml.style.display = "none";
				this.checkLoadComplete();
			} else {
					
				let extFile = new Loader(source, XMLroot => {
					this._xml = XMLroot;
					let localPath = Loader.getFolder(source);
					this.parseXML(XMLroot, localPath);
					this.checkLoadComplete();
				});
				this.externalFiles.push(extFile);
			}
		} else {
			console.error("No WebAudioXML source specified");
		}			
	}
	
	checkLoadComplete(){
		let loading = this.externalFiles.find(file => file.complete == false);
		if(!loading){
			this.callBack(this._xml);
		}
	}
	
	parseXML(xmlNode, localPath){
		
		let href = xmlNode.getAttribute("href");
		let nodeName = xmlNode.nodeName.toLowerCase();
		
		
		if(href && !xmlNode.loaded && nodeName != "link"){
			
			href = Loader.getPath(href, localPath);
			localPath = Loader.getFolder(href);
			
			// if this node is external	and not yet linked
			let extFile = new Loader(href, externalXML => {
				
				xmlNode.loaded = true;
				this.parseXML(externalXML, localPath);
				
				// import audioObject and children into internal XML DOM
				xmlNode.audioObject = externalXML.audioObject;
				Array.from(externalXML.children).forEach(childNode => {
					if(childNode.nodeName.toLowerCase() != "parsererror"){
						xmlNode.appendChild(childNode);
					}
					
				});
				
				this.checkLoadComplete();
			});
			this.externalFiles.push(extFile);
			
		} else {
			
			// if this node is internal	
			
			
			switch(nodeName){
				
				case "parsererror":
				break;
				
				case "link":
				// import style if specified
				href = Loader.getPath(href, localPath);
				let linkElement = document.createElement("link");
				linkElement.setAttribute("href", href);
				linkElement.setAttribute("rel", "stylesheet");
				document.head.appendChild(linkElement);	
				break;
				
				case "style":
				// import style if specified
				document.head.appendChild(xmlNode);	
				break;
				
				case "synth":
				let synth = new Synth(xmlNode, this.waxml, localPath);				
				xmlNode.audioObject = synth;
				xmlNode.querySelectorAll("voice").forEach(node => this.parseXML(node, localPath));
				break;
				
				default:
				xmlNode.audioObject = new AudioObject(xmlNode, this.waxml, localPath);
				Array.from(xmlNode.children).forEach(node => this.parseXML(node, localPath));				
				break;
			}

			
		
		}
		
		
	}
}
  	

  	
module.exports = Parser;

},{"./AudioObject.js":1,"./Loader.js":6,"./Synth.js":11}],9:[function(require,module,exports){
var WebAudioUtils = require('./WebAudioUtils.js');


class Range {

	constructor(arr){

		this.values = [];

			arr.forEach(val => {

				if(val.includes("...")){
					var minMaxStrings = val.split("...");
					var numValMin = parseFloat(minMaxStrings[0]);
					var numValMax = parseFloat(minMaxStrings[1]);

					this.values.push(new MinMax(numValMin, numValMax));
				}
			});

	}

	getRange(x){
		let i = this.values.findIndex(item => x >= item.min && x <= item.max);
		return {values: this.values[i], index: i}
	}

	get value(){

		return Range.getRandomVal(this.values);

	}

	getRandomVal(dec, fn){
		return Range.getRandomVal(this.values, dec, fn);
	}

}

Range.getRandomVal = function(arr, dec, fn){

	if(!arr){return 0}
	if(!arr.length){return 0}


	var ln = fn == "other" ? arr.length - 1 : arr.length;
	var rnd = Math.floor(Math.random()*ln);
	var val;
	dec = dec || 0;

	// pick from array
	switch(fn){
		case "remove":
		val = arr.splice(rnd, 1).pop();
		break;

		case "other":
		val = arr.splice(rnd, 1).pop();
		arr.push(val);
		break;

		case "sequence":
		val = arr.shift();
		arr.push(val);
		break;

		case "shuffle":
		default:
		val = arr[rnd];
		break;
	}

	if(val instanceof MinMax){

		// random between two values

		var range = val.max-val.min+1;
		var num = val.min + Math.random()*range;

		var factor = Math.pow(10, dec);
		num*=factor;
		num = Math.floor(num);
		num/=factor;
		val = num;

	}
	return val;

}

class MinMax {

	constructor(min, max){
		this.min = Math.min(min, max);
		this.max = Math.max(min, max);
	}

}




module.exports = Range;

},{"./WebAudioUtils.js":14}],10:[function(require,module,exports){



class Sequence {

	constructor(eventTracker, name, events = []){
		this._eventTracker = eventTracker;
		this._name = name;
		this._eventTypes = [];
		this._events = events;
		this._timeouts = [];
	}

	allEvents(filter = []){
		return this.events(0, this._events.length, filter);
	}

	events(start = 0, end, filter = [], variableFilter = []){

		let startIndex, endIndex, i, ev;
		if(typeof start == "string"){
			// last
			for(i=this._events.length-1; i>=0; i--){
				ev = this._events[i];
				if(ev.name == start){
					startIndex = i;
					break;
				}
			}

		} else if(typeof start == "number"){
			startIndex = start;
		}
		if(typeof startIndex == "undefined"){
			startIndex = 0;
		}

		if(typeof end == "string"){
			// last
			for(i=this._events.length-1; i>startIndex; i--){
				ev = this._events[i];
				if(ev.name == end){
					endIndex = i;
					break;
				}
			}
		} else if(typeof end == "number"){
			endIndex = end;
		}

		let newEventList = [];
		let offset = this._events[startIndex].time;
		for(i = startIndex; i <= endIndex; i++){
			ev = this._events[i];
			if(!filter.length || filter.includes(ev.name)){
				let newEv = {}
				newEv.time = ev.time - offset;
				newEv.name = ev.name;
				newEv.value = {}
				Object.keys(ev.value).forEach(key => {
					if(!variableFilter.length || variableFilter.includes(key)){
						newEv.value[key] = ev.value[key];
					}
				});
				newEventList.push(newEv);
			}
		}
		return newEventList;
	}


	store(name, value){
		if(typeof name == "undefined"){return}
		if(typeof value == "undefined"){return}

		let ev = {
			time: new Date().getTime(),
			name: name,
			value: value
		};

		this._events.push(ev);
	}

	clear(){
		this._events = [];
	}

	update(events){
		this._events = events;
	}

	play(){
		if(!this._events.length){
			console.log("EventTracker error: Sequence is empty");
			return;
		}

		let now = new Date().getTime();
		let offset = this._events[0].time;
		let length = this._events[this._events.length-1].time - offset;

		this._events.forEach(ev => {
			let t = setTimeout(e => this._eventTracker.trigEvent(ev.name, ev.value), ev.time - offset + 1);
			this._timeouts.push(t);
		});
		this._eventTracker.playing = true;
		this._timeouts.push(setTimeout(e => this._eventTracker.playing = false, length));

	}

	stop(){
		while(this._timeouts.length){
			clearTimeout(this._timeouts.pop());
		}
	}

	get name(){
		return this._name;
	}

}


module.exports = Sequence;

},{}],11:[function(require,module,exports){

var WebAudioUtils = require('./WebAudioUtils.js');
var Watcher = require('./Watcher.js');

class Synth{


	constructor(xmlNode, waxml, localPath){

	  	this.waxml = waxml;
	  	let _ctx = this.waxml._ctx;

		this._xml = xmlNode;
		this._ctx = _ctx;
		this._localPath = localPath;

		this._params = WebAudioUtils.attributesToObject(xmlNode.attributes);
		this._voices = this._params.voices || 1;
		this._voiceID = 0;

		this._node = this._ctx.createGain();
		this._node.gain.value = 1/this._voices;
	  	console.log(xmlNode.nodeName, this._node.__resource_id__);

		// duplicate XML nodes until there are correct number of voices
		this.voiceNodes = this._xml.children;
		let voiceNodeCount = xmlNode.querySelectorAll("voice").length;

		this.hasEnvelope = xmlNode.querySelectorAll("envelope").length > 0;

		if(voiceNodeCount){
			let curID = 0;
			while(this._xml.children.length < this._voices){
				let targetNode = this._xml.children[curID];
				if(targetNode.nodeName.toLowerCase() != "voice"){continue}

				let newNode = targetNode.cloneNode(true);
				this._xml.appendChild(newNode);
				curID++;
			}
			this.voiceNodes = xmlNode.querySelectorAll("voice");
		} else {
			console.error("Web Audio XML error. Voice node(s) are missing in Synth node.");
		}


		this.watcher = new Watcher(xmlNode, this._params.follow, {
			delay: this.getParameter(delay),
			waxml: this.waxml,
			callBack: note => {
				if(note[0]){
					this.noteOn(note[1]);
				} else {
					this.noteOff(note[1]);
				}
			}
		});


	}


	connect(destination){

	  	if(this._node){
		  	if(this._node.connect){
			  	destination = destination || this._ctx.destination;
			  	this._node.connect(destination);
			  	this.destination = destination;
		  	}
	  	}

  	}


	noteOn(note, vel=1){

		let voiceNode = this.nextVoice;
		voiceNode.MIDInote = note;

		let data = {note:note, vel:vel, portamento: this.portamento};
		voiceNode.audioObject.start(data);
		voiceNode.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.start(data));

	}


	noteOff(note, vel=1){
		let voiceNode = this.noteToVoice(note);

		let data = {note:note, vel:vel};
		if(!this.hasEnvelope){voiceNode.audioObject.stop(data)};
		voiceNode.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.stop(data));
		voiceNode.MIDInote = 0;
	}


	get nextVoice(){

		return this.voiceNodes[this._voiceID++ % this._voices];

	}

	set gain(val){
  	this.setTargetAtTime("gain", val);
	}

	get gain(){
  	return this._node.gain.value;
	}


	noteToVoice(note){
		return Array.from(this.voiceNodes).find(voiceNode => voiceNode.MIDInote == note);
	}

	getParameter(paramName){
  	if(typeof this._params[paramName] === "undefined"){
	  	if(this._xml.parentNode){
		  	return this._xml.parentNode.audioObject.getParameter(paramName);
	  	} else {
		  	return 0;
	  	}

  	} else {
	  	return this._params[paramName];
  	}
	}


	setTargetAtTime(param, value, delay, transitionTime, cancelPrevious){

  	let startTime = this._ctx.currentTime + (delay || 0);
  	//transitionTime = transitionTime || 0.001;
  	//console.log(value, delay, transitionTime, cancelPrevious);

  	if(!this._node){
	  	console.error("Node error:", this);
  	}
  	if(typeof param == "string"){param = this._node[param]}

  	if(cancelPrevious){
	  	param.cancelScheduledValues(this._ctx.currentTime);
  	}
  	if(transitionTime){
	  	param.setTargetAtTime(value, startTime, transitionTime);
  	} else {
	  	param.setValueAtTime(value, startTime);
  	}

	}


}

module.exports = Synth;

},{"./Watcher.js":12,"./WebAudioUtils.js":14}],12:[function(require,module,exports){
var WebAudioUtils = require('./WebAudioUtils.js');


class Watcher {

	constructor(xmlNode, arr, params){

		// allow for different ways of specifying target, event, variable and delay
		// possible structures:
		// variable
		// targetStr, variable
		// targetStr, event, variable
		let target, variable, targetStr, event;
		if(arr.length){
			variable = arr.pop().trim();
		} else {
			console.log("WebAudioXML error: 'follow' attribute requires at least one parameter.")
			return false;
		}

		if(arr.length){
			// target object is an XML node closest to the calling object
			// variable is a property of WebAudioXML.
			targetStr = arr.shift().trim();
		} else {
			// target object is top XML node of this document
			// variable is a property of the audioObject connected to that XML node
			//xmlNode.getRootNode().querySelector("audio");
			this.addVariableWatcher(params.waxml.variables, variable, params);

			//params.waxml.addVariableWatcher(variable, callBack);
			return;
		}

		if(arr.length){
			// target object is a DOM element
			// event to use with addEventListener
			// variable expected to be a property of the event object in the callback of addEventListener
			event = arr.shift().trim();
		}

		target = xmlNode.closest(targetStr) || document.querySelector(targetStr);
		if(!target){
			try{
				target = eval(targetStr);
			}
			catch(error){
				console.error("WebAudioXML error: No valid target specified - " + targetStr);
			}

		}


		if(target){

			if(target.addEventListener){

				// make sure variable starts with e.
				if(variable.substr(0, 2) != "e."){
					if(variable.substr(0, 6) == "event."){
						variable = variable.substr(6);
					}
					variable = "e." + variable;
				}

				target.addEventListener(event, e => {
					let val = eval(variable);
					if(typeof val !== "undefined"){
						params.callBack(val);
					} else {
						console.error("Web Audio XML Parameter follow error. Target object event does not contain variable.", variable);
					}
				});

			} else {
				console.error("Web Audio XML Parameter follow error. Target object does not support addEventListener.", targetStr);
			}
		} else {
			console.error("Web Audio XML Parameter follow error. Target object not found: ", targetStr);
		}

	}

	addVariableWatcher(obj, variable, params){

		let oNv = this.varablePathToObject(obj, variable);
		obj = oNv.object || obj;

		// allow for simple variable names or variables inside an Object
		variable = oNv.variable || variable;

		obj._props = obj._props || {};

		if(!obj._props[variable]){

			obj._props[variable] = {};
			obj._props[variable].callBackList = [];

			Object.defineProperty(obj, variable, {
				get() {
					return this._props[variable].value;
				},
				set(val) {
					if(this._props[variable].value != val){
						this._props[variable].value = val;
						this._props[variable].callBackList.forEach(callBack => callBack(val));
						//if(variable == "relY"){console.log(val)}
					}
				}
			});
		}

		let callBack = params.callBack;
		if(params.delay){
			// wrap callBack in a timeout if delay is specified
			var origCallBack = callBack;
			callBack = val => {
				return setTimeout(e => {
					origCallBack(val);
				}, params.delay);
			};
		}
		obj._props[variable].callBackList.push(callBack);

	}


	varablePathToObject(obj = window, variable = ""){



		let varArray = variable.split(".");
		let v = varArray.pop();
		let varPath = varArray.length ? "." + varArray.join(".") : "";
		let o = eval("obj" + varPath);
		/*
		varArray.forEach(v => {
			let o = obj[v];
			if(typeof o == "object"){
				obj = o;
			}
		});
		*/
		return {object: o, variable: v};
	}

}

module.exports = Watcher;

},{"./WebAudioUtils.js":14}],13:[function(require,module,exports){
/*
MIT License

Copyright (c) 2020 hanslindetorp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


var Parser = require('./Parser.js');
var Connector = require('./Connector.js');
var GUI = require('./GUI.js');
var InteractionManager = require('./InteractionManager.js');



var source = document.currentScript.dataset.source;




class WebAudio {

	constructor(_ctx){

		if(!_ctx){

			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			if (AudioContext) {
					// Web Audio API is available.
					_ctx = new AudioContext();
			} else {
				console.error("This browser does not support Web Audio API");
			}

		}

		this.plugins = [];
		this._ctx = _ctx;

		if(source){
			window.addEventListener("load", () => {

				new Parser(source, this, xmlDoc => {
					this._xml = xmlDoc;
					this.ui.registerEvents(this._xml.getAttribute("interactionArea"));
					//webAudioXML = xmlDoc.audioObject;
					//webAudioXML.touch = touches;
					new Connector(xmlDoc, _ctx);
					this.plugins.forEach(plugin => {
						plugin.init();
					});
					if(this._xml.getAttribute("controls") == "true"){
						new GUI(xmlDoc, document.body);
					}
				});
			});
		} else {
			console.error("No WebAudioXML source specified")
		}

		this.ui = new InteractionManager(this);

	}

	/*
	// Maybe to be implemented when moved from AudioObject
	addVariableWatcher(variable, callBack){
		this.variableRouter.addVariableWatcher(variable, callBack);
	}
	*/
	init(){
		this._ctx.resume();
	}

	start(selector = "*"){
		this._xml.querySelectorAll(selector).forEach(XMLnode => XMLnode.audioObject.start());
	}

	stop(selector = "*"){
		this._xml.querySelectorAll(selector).forEach(XMLnode => XMLnode.audioObject.stop());
	}

	registerPlugin(plugin){

		this.plugins.push(plugin);
		// consider returning an interface to
		// variables here
	}

	get variables(){
		return this.ui.variables;
	}

	setVariable(key, val){
		this.ui.variables[key] = val;
	}

	// InteractionManager
	get lastGesture(){
		return this.ui.lastGesture;
	}

	addSequence(events, name){
		this.ui.addSequence(events, name);
	}

	getSequence(name){
		return this.ui.getSequence(name);
	}

	copyLastGestureToClipboard(){
		this.ui.copy();
	}

	playLastGesture(){
		this.ui.playLastGesture();
	}

	playSequence(name){
		this.ui.play(name);
	}

	querySelectorAll(selector){
		let arr = [];
		this._xml.querySelectorAll(selector).forEach(xml => {
			let audioObject = xml.audioObject;
			arr.push(xml.audioObject);
		});
		return arr;
	}
	querySelector(selector){
		let xml = this._xml.querySelector(selector);
		if(xml){
			let audioObject = xml.audioObject;
			if(audioObject){return audioObject}
		}
		return -1;
	}

}



let webAudioXML = new WebAudio();

window.webAudioXML = webAudioXML;
module.exports = WebAudio;



/*

	Test:
	Files on remote servers. Cross-domain issues
	PeriodicWave data. Problem: Uncaught (in promise) SyntaxError: Unexpected token ' in JSON at position 2

	Important:
	* Triggering of envelopes from external calls
	* check ADSR case insensitivity
	* Check envelope separation by comma and space
	Make a working MIDI example with or without webaudio-controls.
	* Make "follow"-attributes work with commas and spaces
	* Implement CSS-selector for Audio elements - !remember case insensitivity!
	Add "Channel" as an element that is a blueprint for a Chain element inside a Mixer element. The Mixer then, needs a "channels"-attribute
	and a routing syntax to allow for multiple channels. (possibly nth-child)
	Make sure external documents does not inherit variables like timeUnit

	Change "max" to "level" (supporting multiple values)?? Maybe not. Does this only apply to envelopes?

	* Synth does not react on gain-attribute

	Add map="MIDI" for frequency for initial values.
	Implement webAudioXML.setVariable(variableName, value);

	* se till att delay ärvs till childNodes

	* Lägg till ränder för clienten


	Arpeggio

	DeviceMotion (to documentation and implementation)

	Advanced circular mapping (alpha, beta, gamma) inkl offset
	Map Regions



	Implement:
	Simple GUI
  * AudioBufferSourceNode

	Wish:
	Advanced envelope with multiple times, levels and curves plus gate and release - imitate supercollider

	Bypass nodes
	Debug
	Controls = debug


	Not working:
	* https://codepen.io/hanslindetorp/pen/yLywNaW
	* init sensors


	* Add easy javascript access to nodes

	* Send can't be first in a chain
	* Check delay!

	* Do I need to floor steps in midi-conversion?

	* Flytta inläsningen av stored events
	* Kolla så att play gesture resumer ctx


	Rensa timeouts i sequence
	* Lägg till PADs på touchArea
	* portamento på synth

	Kolla dynamisk pan

	uppdatera lastGesture!

	9:15 Jakob
	9:30 Sebastian
	10:30 Edvin
	10:45 Tuva-Lill
	11:30 Bobo
	11:45 Ola

*/

},{"./Connector.js":2,"./GUI.js":4,"./InteractionManager.js":5,"./Parser.js":8}],14:[function(require,module,exports){






class WebAudioUtils {



}



WebAudioUtils.typeFixParam = (param, value) => {

	//param = param.toLowerCase();
	let arr;

	switch(param){

		case "volume":
		case "gain":
		if(value.includes("dB") || value.includes("db")){
			value = Math.pow(2, parseFloat(value) / 3);
		} else {
			value = parseFloat(value);
		}
		break;

		case "normalize":
		value = value == "true";
		break;

		// iMusic objects
		case "pan":
		case "tempo":
		case "fadeTime":
		case "loopActive":
		case "blockRetrig":
		case "repeat":
		case "release":
		case "active":


		// Web Audio Synth
		case "voices":
		case "portamento":
		case "max":
		case "delay":



		// AudioNodes

		//filter
		case "frequency":
		case "detune":
		case "Q":

		// delay
		case "delayTime":

		// compressor
		case "threshold":
		case "knee":
		case "ratio":
		case "reduction":
		case "attack":
		case "release":
		value = parseFloat(value);
		break;


		case "maxDelayTime":
		value = parseFloat(value) || 1;
		break;

		case "adsr":
		arr = WebAudioUtils.split(value);
		value = {
			attack: parseFloat(arr[0]),
			decay: parseFloat(arr[1]),
			sustain: parseFloat(arr[2]),
			release: parseFloat(arr[3])
		};
		break;

		case "map":
		// str is a comma separated string with at least four values
		// minIn, maxIn, minOut, mixOut
		// potentially also a fifth value indicating Math.power
		arr = WebAudioUtils.split(value);
		value = {};
  	value.minIn = parseFloat(arr.shift());
  	value.maxIn = parseFloat(arr.shift());
  	value.minOut = parseFloat(arr.shift());
  	value.maxOut = parseFloat(arr.shift());

		value.minIn = typeof value.minIn == "number" ? value.minIn : 0;
		value.maxIn = typeof value.maxIn == "number" ? value.maxIn : 1;
		value.minOut = typeof value.minOut == "number" ? value.minOut : 0;
		value.maxOut = typeof value.maxOut == "number" ? value.maxOut : 1;

		if(arr.length){
			value.conv = arr.shift().trim();
		} else {
			value.conv = 1;
		}
		if(Number(value.conv) == value.conv){value.conv = "Math.pow(x, " + value.conv + ")"};
		break;

		case "level":
		case "steps":
		value = WebAudioUtils.split(value).map(item => parseFloat(item));
		break;

		case "range":
		case "curve":
		case "follow":
		value = WebAudioUtils.split(value);
		break;


		default:


		break;

	}
	return value;

}

WebAudioUtils.evalConvString = (x=1, str) => {
	if(!str){
		return x;
	} else {
		return eval(str);
	}
}

WebAudioUtils.attributesToObject = attributes => {

	var obj = {};

	if(!attributes){return obj}
	if(!attributes.length){return obj}



	for (let i in attributes){
		if(attributes.hasOwnProperty(i)){

			// XML parser is inconsistent with the document
			// When the XML DOM is embeded inside HTML some
			// browsers interpret all attributes as written
			// with capital letters
			let param = attributes[i].name.toLowerCase();

		  	param = WebAudioUtils.caseFixParameter(param);

			let value = WebAudioUtils.typeFixParam(param, attributes[i].value);
			obj[param] = value;
		}

	}
	return obj;
}

WebAudioUtils.caseFixParameter = param => {


	switch(param){
	  	 case "q":
	  	 param = "Q";
	  	 break;

	  	 case "delaytime":
	  	 param = "delayTime";
	  	 break;

	  	 case "maxdelaytime":
	  	 param = "maxDelayTime";
	  	 break;

  	}


  	return param;
}

WebAudioUtils.addAudioPath = (path, fileName) => {
	if(fileName.includes("//")){
		return fileName;
	}
	var pathLength = path.length;
	path = path == fileName.substr(0, pathLength) ? "" : WebAudioUtils.widthEndingSlash(path);
	return path + fileName;
}

WebAudioUtils.widthEndingSlash = (str) => {
	return str.substring(str.length-1) == "/" ? str : str + "/";
}

WebAudioUtils.MIDInoteToFrequency = note => {
	return 440 * Math.pow(2, (note - 69) / 12);
}
WebAudioUtils.split = str => {
	let separator = str.includes(",") ? "," : " ";
	let arr = str.split(separator).map(item => item.trim());
	return arr;
}

module.exports = WebAudioUtils;

},{}]},{},[13]);
