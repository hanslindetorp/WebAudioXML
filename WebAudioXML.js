(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

var WebAudioUtils = require('./WebAudioUtils.js'); 
var Loader = require('./Loader.js');
var Watcher = require('./Watcher.js');
var Mapper = require('./Mapper.js');


  	
class AudioObject{
	  	
  	constructor(xmlNode, _ctx, localPath){
	  	
	  	this._params = WebAudioUtils.attributesToObject(xmlNode.attributes);
	  	this._localPath = localPath;

		let nodeType = xmlNode.nodeName.toLowerCase();
		
	  	this._ctx = _ctx;
	  	let fn, src;
	  	this._nodeType = nodeType;
	  	
	  	switch(nodeType){
		  	
		  	
		  	case "analysernode":
		  	this._node = this._ctx.createAnalyser();
		  	break;
		  	
		  	
		  	case "audiobuffernode":
		  	this._node = this._ctx.createAudioBuffer();
		  	src = Loader.getPath(this._params.src, this._localPath);
		  	
		  	fetch(src)
		        .then(response => response.arrayBuffer())
		        .then(arrayBuffer => this._ctx.decodeAudioData(arrayBuffer, 
		        	audioBuffer => this._node.buffer = audioBuffer, 
		        	e => reject(e)
		        ));    
		  	break;
		  	
		  	
		  	
		  	
		  	case "oscillatornode":
		  	this._node = this._ctx.createOscillator();
		  	this._node.start();
		  	break;
		  	
		  	
		  	case "biquadfilternode":
		  	this._node = this._ctx.createBiquadFilter();
		  	break;
		  	
		  	case "convolvernode":
		  	if(!this._params.src){return}
		  	
		  	src = Loader.getPath(this._params.src, this._localPath);
		  	this._node = this._ctx.createConvolver();    
		  	fetch(src)
		        .then(response => response.arrayBuffer())
		        .then(arrayBuffer => this._ctx.decodeAudioData(arrayBuffer, 
		        	audioBuffer => this._node.buffer = audioBuffer, 
		        	e => reject(e)
		        ));
		  	break;
		  	
		  	case "delaynode":
		  	this._node = this._ctx.createDelay();
		  	break;
		  	
		  	case "dynamicscompressornode":
		  	break;	
		  	
		  	case "waveshapernode":
		  	break;	
		  	
		  	case "periodicwavenode":
		  	break;		
		  	
		  	case "iirfilternode":
		  	break;	 			  	
		  	
		  	case "gainnode":
		  	case "send":
		  	this._node = this._ctx.createGain();
		  	break;
		  	
		  	case "audio":
		  	this._node = this._ctx.createGain();
		  	break;
		  	
		  	case "mixer":
		  	this._node = this._ctx.createGain();
		  	break;
		  	
		  	case "chain":
		  	this.input = this._ctx.createGain();
		  	console.log("chain input", this.input.__resource_id__);
		  	this._node = this._ctx.createGain();
		  	break;
		  	
		  	case "voice":
		  	this._node = this._ctx.createGain();
		  	this.gain = 0;
		  	break;
		  	
		  	
		  	case "envelope":
		  	this._node = xmlNode.parentNode.audioObject._node;
		  	this._params.max = this._params.max || 1;
		  	this._params.valueScale = this._params.max / 100;
		  			  	
		  	switch(this._params.timeUnit){
			  	case "s":
			  	this._params.timeScale = 1;
			  	break;
			  	
			  	default:
			  	this._params.timeScale = 1/1000;
			  	break;
		  	}
		  	
		  	break;
		  	
		  	
		  	// parameters
		  	default:
		  	this.mapper = new Mapper(this._params.map);
		  	this._node = xmlNode.parentNode.audioObject.getParameterNode(nodeType);
		  	if(this._params.value){
			  	this._params.value = WebAudioUtils.typeFixParam(nodeType, this._params.value);
			  	this._node.value = this._params.value;
			}
			
			if(this._params.follow){
				this.watcher = new Watcher(xmlNode, this._params.follow, val => {
					this.setTargetAtTime(this._node, this.mapper.getValue(val), 0, 0, true);
				});
			}
		  	break;

	  	}
	  	
	  	console.log(nodeType, this._node.__resource_id__);
	  	
	  	// set parameters
	  	if(this._params){Object.keys(this._params).forEach(key => this[key] = this._params[key])};
	  	
  	}
  	


  	
  	get connection(){
	  	return this._node;
  	}
  	
  	get input(){
	  	
	  	switch(this._nodeType){
		  	
		  	case "oscillatornode":
		  	case "audiobuffernode":
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
	  	return this._node[param];
  	}
  	  	
  	disconnect(ch){
	  	ch = ch || 0;
	  	this._node.disconnect(ch);
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
  	
  	inputFrom(sourceObject){
	  	switch(this._nodeType){
		  	
		  	case "oscillatornode":
		  	case "audiobuffernode":
		  	break;
		  	
		  	default:
		  	sourceObject.connect(this.input);
		  	break;
		}	  	
  	}
  	
  	start(data){
	  	switch(this._nodeType){
		  	
		  	case "oscillatornode":
		  	if(this.followKeyboard){
			  	let x = WebAudioUtils.MIDInoteToFrequency(data.note);
			  	if(this.followKeyboard.includes("x")){
				  	x = eval(this.followKeyboard);
			  	}
			  	this.frequency = x;
		  	}
		  	break;
		  	
		  	
		  	
		  	case "voice":
		  	this.gain = 1;
		  	break;
		  	
		  	
		  	case "envelope":
		  	if(this.ADSR){
			  	this.setTargetAtTime(this._node, this._params.valueScale * 100, 0, this.ADSR.attack * this._params.timeScale, true);
			  	this.setTargetAtTime(this._node, this._params.valueScale * this.ADSR.sustain, this.ADSR.attack * this._params.timeScale, this.ADSR.decay * this._params.timeScale);
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
		  	if(this.ADSR){
			  	this.setTargetAtTime(this._node, 0, 0, this.ADSR.release * this._params.timeScale, true);
		  	}
		  	break;
	  	}
  	}
  	
  	

  	
  	setTargetAtTime(param, value, delay, transitionTime, cancelPrevious){
	  		  	
	  	let startTime = this._ctx.currentTime + (delay || 0);
	  	transitionTime = transitionTime || 0.001;
	  	//console.log(value, delay, transitionTime, cancelPrevious);
	  	
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
  	
  	set gain(val){
	  	this.setTargetAtTime("gain", val);
  	}
  	
  	get gain(){
	  	return this.gain.value;
  	}
  	
  	set frequency(val){
  		this.setTargetAtTime("frequency", val);
  	}
  	
  	get frequency(){
	  	return this.frequency.value;
  	}
  	
  	set detune(val){
	  	this.setTargetAtTime("detune", val);
  	}
  	
  	get detune(){
	  	return this.detune.value;
  	}
  	
  	set Q(val){
	  	this.setTargetAtTime("Q", val);
  	}
  	
  	get Q(){
	  	return this.Q.value;
  	}
  	
  	set type(val){
	  	
	  	switch(val){
		  	
		  	
		  	case "periodicWave":
		  	let n = 4096;
			let real = new Float32Array(n);
			let imag = new Float32Array(n);
			    
			
			
			for(let x=1; x<n; x++){
				//let y = 0.1; // Sine
				let y = 2 / (Math.pow(-1, x) * Math.PI * x); // sawtooth
				//let y = 1.0 / (Math.PI * x); // Square
				imag[x] = y;
				console.log(y);
			}
			let wave = this._ctx.createPeriodicWave(real, imag);
			
			this._node.setPeriodicWave(wave); 
		  	break;
		  	
		  	default:
		  	this._node.type = val;
		  	break;
	  	}	  	


	  	
  	}
  	
  	get type(){
	  	return this._node.type;
  	}
  	
  	set(key, value){
	  	if(typeof this._node[key] !== "undefined"){
		  	this[key] = value;
	  	}
  	}  	


}


module.exports = AudioObject;

},{"./Loader.js":3,"./Mapper.js":4,"./Watcher.js":7,"./WebAudioUtils.js":9}],2:[function(require,module,exports){

	
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
						case "send":
						case "oscillatornode":
						case "audiobuffernode":
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



	
class Loader {



	constructor(src, callBack){
		
		this.href = src;
		this.complete = false;
	
		if(src){
		  	fetch(src, {mode: 'no-cors'})
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

},{}],4:[function(require,module,exports){


class Mapper{
  	
  	
	constructor(str = ""){
		
		let arr = str ? str.split(",") : null;
		let obj = {};
		
		if(arr){			
		  	obj.minIn = Number(arr.shift());
		  	obj.maxIn = Number(arr.shift());
		  	obj.minOut = Number(arr.shift());
		  	obj.maxOut = Number(arr.shift());
		  	obj.exp = arr.shift();	
		  	if(Number(obj.exp) == obj.exp){obj.exp = "Math.pow(x, " + obj.exp + ")"};		  	
	  	} 
				
		this.minIn = typeof obj.minIn == "number" ? obj.minIn : 0;
		this.maxIn = typeof obj.maxIn == "number" ? obj.maxIn : 1;
		this.rangeIn = this.maxIn - this.minIn;
		
		
		this.minOut = typeof obj.minOut == "number" ? obj.minOut : 0;
		this.maxOut = typeof obj.maxOut == "number" ? obj.maxOut : 1;
		this.rangeOut = this.maxOut - this.minOut;
		this.exp = obj.exp || "x";
				
	}
	
	
	getValue(x){
		
		//x = Math.max(x, this.minIn);
		//x = Math.min(x, this.maxIn);
		
		let valIn = this.exp == "x" ? x : eval(this.exp);
		
		let relVal = (valIn - this.minIn)/this.rangeIn;
		let valOut = relVal * this.rangeOut + this.minOut;
		
		return valOut;
	}
	
}
	
module.exports = Mapper;
},{}],5:[function(require,module,exports){

var Loader = require('./Loader.js');
var AudioObject = require('./AudioObject.js');
var Synth = require('./Synth.js');


	
class Parser {
		  	
	constructor(source, _ctx, callBack){
		
		this.callBack = callBack;
		this.externalFiles = [];
		this._ctx = _ctx;
		
		if(source){
			if(!source.includes("/")){
				this._xml = document.querySelector(source);
			}
			
			
			if(this._xml){
				this.parseXML(this._xml);
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
			console.error("No WebAudioXML source specified")
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
		if(href && !xmlNode.loaded){
			
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
			let nodeType = xmlNode.nodeName.toLowerCase();
			
			switch(nodeType){
				
				case "parsererror":
				break;
				
				case "synth":
				let synth = new Synth(xmlNode, this._ctx, localPath);				
				xmlNode.audioObject = synth;
				xmlNode.querySelectorAll("voice").forEach(node => this.parseXML(node, localPath));
				break;
				
				default:
				xmlNode.audioObject = new AudioObject(xmlNode, this._ctx, localPath);
				Array.from(xmlNode.children).forEach(node => this.parseXML(node, localPath));				
				break;
			}

			
		
		}
		
		
	}
}
  	

  	
module.exports = Parser;

},{"./AudioObject.js":1,"./Loader.js":3,"./Synth.js":6}],6:[function(require,module,exports){

var WebAudioUtils = require('./WebAudioUtils.js'); 
var Watcher = require('./Watcher.js'); 

class Synth{
  	
  	
	constructor(xmlNode, _ctx, localPath){
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
				
		
		this.watcher = new Watcher(xmlNode, this._params.follow, note => {
			if(note[0]){
				this.noteOn(note[1]);
			} else {
				this.noteOff(note[1]);
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
	
	noteToVoice(note){
		return Array.from(this.voiceNodes).find(voiceNode => voiceNode.MIDInote == note);
	}
	
	
}
	
module.exports = Synth;
},{"./Watcher.js":7,"./WebAudioUtils.js":9}],7:[function(require,module,exports){



class Watcher {

	constructor(xmlNode, str, callBack){
		
		
		let arr = str.split(",");
		
		
		// allow for different ways of specifying target, event and variable
		let target, variable, targetStr, event;
		if(arr.length){
			variable = arr.pop().trim();
		} else {
			console.log("Web Audio XML error. 'follow' attribute requires at least one parameter.")
			return false;
		}
		
		if(arr.length){
			// target object is an XML node closest to the calling object
			// variable is a property of WebAudioXML.
			targetStr = arr.shift().trim();
		} else {
			// target object is top XML node of this document
			// variable is a property of the audioObject connected to that XML node
			target = xmlNode.getRootNode().querySelector("audio");
		}
		
		if(arr.length){
			// target object is a DOM element
			// event to use with addEventListener
			// variable expected to be a property of the event object in the callback of addEventListener
			event = arr.shift().trim();
		}
			
		target = target || xmlNode.closest(targetStr) || document.querySelector(targetStr) || eval(targetStr);		
		
		if(target){

			
			if(target.nodeName.toLowerCase() == "audio"){
				
				// if target is an WebAudioXML-node
				
				if(target.audioObject){
					Object.defineProperty(target.audioObject, variable, {
					  get() {
						let varName = "_" + variable;
					    return this[varName];
					  },
					  set(val) {
						let varName = "_" + variable;
						if(this[varName] != val){
							this[varName] = val;
							callBack(val);
						}
					  }
					});	
					
				}
			
				

			} else if(target.addEventListener){
				
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
						callBack(val);
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
	
	
	    
}

module.exports = Watcher;

},{}],8:[function(require,module,exports){
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
	
			
		this._ctx = _ctx;
		
		if(source){
			window.addEventListener("load", () => {
				new Parser(source, _ctx, xmlDoc => {
					this._xml = xmlDoc;
					new Connector(xmlDoc, _ctx)
				});
			});
		} else {
			console.error("No WebAudioXML source specified")
		}
		
	}
	
	
	start(){
		this._xml.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.start());
	}
	
	stop(){
		this._xml.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.stop());
	}
	
		
		
}


let webAudioXML = new WebAudio(); 
var ctxInited = false;
document.addEventListener("mousedown", e => {
	if(!ctxInited){
		ctxInited = true;
		webAudioXML._ctx.resume();
	}
	webAudioXML._xml.audioObject.mousedown = 1;
});
document.addEventListener("mouseup", e => webAudioXML._xml.audioObject.mousedown = 0);

window.webAudioXML = webAudioXML;
module.exports = WebAudio;



/*
	
	Test: Files on remote servers
	
*/
},{"./Connector.js":2,"./Parser.js":5}],9:[function(require,module,exports){
	

	
	


class WebAudioUtils {



}



WebAudioUtils.typeFixParam = (param, value) => {

		
	switch(param){
		
		case "volume":
		case "gain":
		if(value.includes("dB")){
			value = Math.pow(2, Number(value.split("dB")[0]) / 3);
		} else {
			value = Number(value);
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
		value = Number(value);
		break;
		
		
		
		case "ADSR":
		let arr = value.split(",");
		value = {
			attack: Number(arr[0]),
			decay: Number(arr[1]),
			sustain: Number(arr[2]),
			release: Number(arr[3])
		};
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
			let param = attributes[i].name;
			let value = WebAudioUtils.typeFixParam(param, attributes[i].value);
			obj[param] = value;
		}
		
	}
	return obj;
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

module.exports = WebAudioUtils;

},{}]},{},[8]);
