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

var version = "1.5";


var WebAudioUtils = require('./WebAudioUtils.js');
var Parser = require('./Parser.js');
var Connector = require('./Connector.js');
var GUI = require('./GUI.js');
var InteractionManager = require('./InteractionManager.js');
var ConvolverNodeObject = require('./ConvolverNodeObject.js');
var Variable = require('./Variable.js');
var InputBusses = require('./InputBusses.js');

var XY_area = require('./XY_area.js');
var XY_handle = require('./XY_handle.js');
var Meter = require('./Meter.js');
var MIDIController = require('./MIDIController.js');
var Inspector = require('./Inspector.js');


const VariableMatrix = require('./VariableMatrix.js');
const VariableController = require('./VariableController.js');
const SnapshotController = require('./variable-matrix/SnapshotController.js');
const SnapshotComponent = require('./variable-matrix/SnapshotComponent.js');

const DynamicMixer = require('./dynamic-mixer/Mixer.js');
const Channel = require('./dynamic-mixer/Channel.js');
const OutputMonitor = require('./GUI/OutputMonitor.js');
const LinearArranger = require('./GUI/LinearArranger.js');


const MusicalStructure = require('./musical-structure/Music.js');





var HL2 = require("./HL2.js");




var source = document.currentScript.dataset.src || document.currentScript.dataset.source;

navigator.getUserMedia = (
	navigator.getUserMedia ||
	navigator.webkitGetUserMedia ||
	navigator.mozGetUserMedia ||
	navigator.msGetUserMedia
);



class WebAudio {

	constructor(_ctx, src){
		

		if(!_ctx){

			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			if (AudioContext) {
					// Web Audio API is available.
					_ctx = new AudioContext();
					_ctx.destination.channelCount = _ctx.destination.maxChannelCount || 2;

					console.log("WAXML is installed. Version " + version + " - Made by Hans Lindetorp - waxml.org");
			} else {
				console.error("This browser does not support Web Audio API");
			}

		}

		// this.HL = new HL2(_ctx);

		this.fps = 60; // used to update variable "currentTime"
		this._ctx = _ctx;
		this._listeners = [];
		this.plugins = [];
		this.reset();
		this._muteState = false;

		this.audioInited = false;
		this.parser = new Parser(this);

		this.inputBusses = new InputBusses(_ctx);
		this.snapShots = [];

		source = source || src;

		if(source){
			window.addEventListener("load", () => {

				
				this.parser.init(source)
				.then(xmlDoc => {
					this._xml = xmlDoc;

					// skriv om hela denna del så att kopplingen sker från HTML istället
					let interactionArea = this._xml.getAttribute("interactionArea");
					if(interactionArea){
						let el = document.querySelector(interactionArea);
						if(el){
							this.ui.registerEvents(interactionArea);
						}
						
					} else {
						document.querySelectorAll("*[data-waxml-pointer]").forEach(el => {
							if(el.dataset.waxmlPointer == "true"){
								this.ui.registerEvents(el);
							}
						});
					}

					this.initGUI(this._xml);
					this.initAudio(this._xml);
					this.initEvents();


					this.dispatchEvent(new CustomEvent("inited"));
					this.dispatchEvent(new CustomEvent("init"));

					// ugly workaround to make it make sure the variables are initing depending audio parameters
					this.setVariable("pointerdown", 0);
					this.setVariable("mousedown", 0);
					this.setVariable("touchdown", 0);


					this.init();

				});
			});
		} else {
			console.warn("No WebAudioXML source specified")
		}

		
		this.defineCustomElements();

		this.ui = new InteractionManager(this);

		this.addEventListener("init", e => {
			this.stop("Envelope");
		});

	}

	/*
	// Maybe to be implemented when moved from AudioObject
	addVariableWatcher(variable, callBack){
		this.variableRouter.addVariableWatcher(variable, callBack);
	}
	*/
	// init(){
	// 	if(!this.audioInited){
	// 		this._ctx.resume().then(() => {
	// 			this.audioInited = true;
	// 			this.start("*[trig='auto'], *[start='auto']");
	
	// 			setInterval(e => {
	// 				//this.setVariable("currentTime", this._ctx.currentTime/this._xml.obj.parameters.timescale);
	// 			}, 1000/this.fps);
	// 		}, () => console.log("Web Audio API cannot be initialized"));
			
	// 	}
	// }

	

	defineCustomElements(){
		customElements.define('waxml-xy-area', XY_area);
		customElements.define('waxml-xy-handle', XY_handle);
		customElements.define('waxml-meter', Meter);
		customElements.define('waxml-midi-controller', MIDIController);	
		customElements.define('waxml-inspector', Inspector);	

		customElements.define('waxml-variable-matrix', VariableMatrix);	
		customElements.define('waxml-variable-controller', VariableController);	
		customElements.define('waxml-snapshot-controller', SnapshotController);	
		customElements.define('waxml-snapshot-component', SnapshotComponent);	
		
		customElements.define('waxml-dynamic-mixer', DynamicMixer);	
		customElements.define('waxml-output-monitor', OutputMonitor);	
		customElements.define('waxml-linear-arranger', LinearArranger);
	}

	init(){
		if(!this.audioInited){
			this._ctx.resume().then(result => {
				this.audioInited = true;
				this.start("*[trig='auto'], *[start='auto']");
				
				setInterval(e => {
				//this.setVariable("currentTime", this._ctx.currentTime/this._xml.obj.parameters.timescale);
				}, 1000/this.fps);
			}, result => {
				// failure
				console.log("Web Audio API cannot be inited");
			});
		
		}
	}

	mute(){
		this._muteState = true;
		this.master.fadeOut(0.1);
	}

	unmute(){
		this._muteState = false;
		this.master.fadeIn(0.1);
	}

	get muted(){
		return this._muteState;
	}

	get XMLstring(){
		return this.parser.XMLstring;
	}

	toString(){
		return new XMLSerializer().serializeToString(this._xml);
	}


	updateFromString(str){
		return new Promise((resolve, reject) => {
			this.reset();
			let xml = this.parser.initFromString(str)
			.then(xml => {
				this._xml = xml;
				this.initGUI(xml);
				this.initAudio(xml);

				this.dispatchEvent(new CustomEvent("inited"));
				this.dispatchEvent(new CustomEvent("init"));
				resolve(xml);
			});
		});
	}

	updateFromFile(url){
		this.reset();

		return new Promise((resolve, reject) => {

			this.parser.init(url).then(xml => {
				this._xml = xml;
				this.initGUI(xml);
				this.initAudio(xml);

				this.dispatchEvent(new CustomEvent("inited"));
				this.dispatchEvent(new CustomEvent("init"));
				resolve(xml);
			});

		});
	}

	reset(){

		// this.plugins = [];
		this.convolvers = [];

		if(this._xml){
			if(this.GUI) this.GUI.remove(); // inte fixad än
			this._xml = this.removeObjects(this._xml);
		}
		
	}

	removeObjects(xml){
		if(xml.obj){
			if(xml.obj.disconnect){
				xml.obj.disconnect();
			}
			xml.obj = null;
			xml.audioObject = null;
		}
		[...xml.children].forEach(childNode => this.removeObjects(childNode));

		this.inputBusses.disconnectAll();
		return null;
	}

	initGUI(xmlDoc){
		this.GUI = new GUI(xmlDoc.parentNode, this);
	}

	initAudio(xmlDoc){

		this.master = this._xml.audioObject;

		//webAudioXML = xmlDoc.audioObject;
		//webAudioXML.touch = touches;

		// Det skulle vara snyggare att lyfta ut audio-in till en egen class 
		if(this.parser.allElements.mediastreamaudiosourcenode){
			navigator.getUserMedia({audio: true}, stream => this.onStream(stream), error => this.onStreamError(error));
		}


		new Connector(xmlDoc, this._ctx);
		this.plugins.forEach(plugin => {
			plugin.init();
			if(plugin.connect){
				let destination = this.getInputBus("#music").input;
				if(destination){
					plugin.connect(destination);
				}
				
			}
		});

		// make all variable elements broadcast their init values
		this.querySelectorAll("var").forEach(obj => {
			obj.update();
		});

		// set mix attributes (needs all children to be inited before execution)
		this.querySelectorAll("*[mix]").forEach(obj => {
			obj.update();
		});

		this.convolvers.forEach(entry => {
			entry.obj.connect(this.master.output);
		});

		this.inputBusses.all.forEach(bus => {
			this.querySelectorAll(bus.selector).forEach(obj => {
				bus.input.connect(obj.input);
			});
		});


	}

	initEvents(){

		// activate child-nodes to pass trig-events to parent
		this.querySelectorAll("Mixer").forEach(mixer => mixer.addEventsFromChildren());
	}


	onStream(stream){
		this.parser.allElements.mediastreamaudiosourcenode.forEach(inputNode => inputNode.obj.initStream(stream));
	}

	onStreamError(){
		console.warn("Audio input error");
	}

	getInputBus(selector){
		let destinations = [];
		this.querySelectorAll(selector).forEach(obj => {
			destinations.push(obj.input);
		});
		return this.inputBusses.getBus(selector, destinations);
	}

	start(selector="", options={}){
		
		if(!this._xml){return}

		let selectStr;
		if(!selector){
			selectStr = "*";
		} else if(selector.includes("[") || selector.includes("#") || selector.includes(".") ){
			// complex and correct selector expected
			selectStr = selector;
		} else if(selector.includes(":")){
			// special case for keydown:x and keyup:x
			selectStr = selector.split(",").map(sel => `*[noteon='${sel.trim()}'], *[start='${sel.trim()}']`).join(",");
		} else {
			// select both elements with attribute "start="selector" and class="selector"
			selectStr = selector.split(",").map(sel => `*[noteon='${sel.trim()}'], *[start='${sel.trim()}'], .${sel.trim()}`).join(",");
		}
		if(this._ctx.state != "running"){
			this.init();
		}
		this._xml.querySelectorAll(selectStr).forEach(XMLnode => {
			if(XMLnode.obj.start){
				XMLnode.obj.start(options);
			} else if(XMLnode.obj.noteOn){
				XMLnode.obj.noteOn(options);
			}
		});

		return this.callPlugins("start", selector, options);
		
		
	}

	trig(selector="", options={}){
		
		
		if(!this._xml){return}

		let selectStr;
		if(!selector){
			selectStr = "*";
		} else if(selector.includes("[") || selector.includes("#") || selector.includes(".") ){
			// complex and correct selector expected
			selectStr = selector;
		} else if(selector.includes(":")){
			// special case for keydown:x and keyup:x
			selectStr = selector.split(",").map(sel => `*[noteon='${sel.trim()}'], *[start='${sel.trim()}'], *[trig='${sel.trim()}']`).join(",");
		} else {
			// select both elements with attribute "start="selector", "trig="selector" and class="selector" and id="selector"
			selectStr = selector.split(",").map(sel => `*[noteon='${sel.trim()}'], *[start='${sel.trim()}'], *[trig='${sel.trim()}'], .${sel.trim()}, #${sel.trim()}`).join(",");
		}
		if(this._ctx.state != "running"){
			this.init();
		}
		
		this._xml.querySelectorAll(selectStr).forEach(XMLnode => {
			if(XMLnode.obj.start){
				XMLnode.obj.start(options);
			} else if(XMLnode.obj.noteOn){
				XMLnode.obj.noteOn(options);
			} else if(XMLnode.obj.trig){
				XMLnode.obj.trig(options);
			}
		});
		return this.callPlugins("trig", selector, options);
	}

	continue(selector="", options={}){
		if(!this._xml){return}

		if(selector){
			let selectStr = `*[start='${selector}']`;
			if(!selector){
				selectStr = "*";
			} else if(!(selector.includes("#") || selector.includes(".") || selector.includes("[") || selector.includes(":"))){
				// select both elements with attribute "start="selector" and class="selector"
				selectStr = selector.split(",").map(sel => `*[start='${sel.trim()}'], .${sel.trim()}`).join(",");
			}
			if(this._ctx.state != "running"){
				this.init();
			}
			this._xml.querySelectorAll(selectStr).forEach(XMLnode => {
				if(XMLnode.obj.continue){
					XMLnode.obj.continue();
				} 
			});
		}
		this.callPlugins("continue", selector, options);

	}

	resume(selector="", options={}){
		if(!this._xml){return}

		if(selector){
			let selectStr = `*[start='${selector}']`;
			if(!selector){
				selectStr = "*";
			} else if(!(selector.includes("#") || selector.includes(".") || selector.includes("[") || selector.includes(":"))){
				// select both elements with attribute "start="selector" and class="selector"
				selectStr = selector.split(",").map(sel => `*[start='${sel.trim()}'], .${sel.trim()}`).join(",");
			}
			if(this._ctx.state != "running"){
				this.init();
			}
			this._xml.querySelectorAll(selectStr).forEach(XMLnode => {
				if(XMLnode.obj.resume){
					XMLnode.obj.resume();
				} 
			});
		}
		this.callPlugins("resume", selector, options);
	}
	
	// check if "release" is used anywhere. Otherwise - remove it completely
	release(selector="", options={}){
		if(!this._xml){return}
		if(selector){
			let selectStr = `*[noteoff='${selector}'], *[stop='${selector}']`;
			if(!(selector.includes("#") || selector.includes(".") || selector.includes("[") || selector.includes(":"))){
				// select both elements with attribute "stop="selector" and class="selector"
				selectStr += ", " + selector.split(",").map(sel => `*[stop='${sel.trim()}'], .${sel.trim()}`).join(",");
			}
			this._xml.querySelectorAll(selectStr).forEach(XMLnode => {
				if(XMLnode.obj.stop){
					XMLnode.obj.stop(options);
				} else if(XMLnode.obj.noteOff){
					XMLnode.obj.noteOff(options);
				}
			});
		}
		this.callPlugins("release", selector, options);
	}



	stop(selector="", options={}){
		

		if(!this._xml){return}

		let selectStr;
		if(!selector){
			selectStr = "*";
		} else if(selector.includes("[") || selector.includes("#") || selector.includes(".") ){
			// complex and correct selector expected
			selectStr = selector;
		} else if(selector.includes(":")){
			// special case for keydown:x and keyup:x
			selectStr = selector.split(",").map(sel => `*[noteoff='${sel.trim()}'], *[stop='${sel.trim()}']`).join(",");
		} else {
			// select both elements with attribute "start="selector" and class="selector"
			selectStr = selector.split(",").map(sel => `*[noteoff='${sel.trim()}'], *[stop='${sel.trim()}'], .${sel.trim()}`).join(",");
		}

		this._xml.querySelectorAll(selectStr).forEach(XMLnode => {
			if(XMLnode.obj.stop){
				XMLnode.obj.stop(options);
			} else if(XMLnode.obj.noteOff){
				XMLnode.obj.noteOff(options);
			}
		});


		this.callPlugins("stop", selector, options);
	}
	

	// stop(selector = "*"){
	// 	this._xml.querySelectorAll(selector).forEach(XMLnode => {
	// 		if(XMLnode.obj && XMLnode.obj.stop){
	// 			XMLnode.obj.stop();
	// 		}
	// 	});
	// }

	registerPlugin(plugin){

		this.plugins.push(plugin);
		// consider returning an interface to
		// variables here
	}

	callPlugins(fn, arg1, arg2, arg3){
		let returnVal;
		this.plugins.forEach(plugin => {
			// console.log("callPlugins", fn, arg1, arg2, arg3)
			if(plugin.call){
				let v = plugin.call(fn, arg1, arg2, arg3);
				returnVal = returnVal || v;
			}
		});
		return returnVal;
	}

	addEventListener(name, fn){
		if(typeof name !== "string"){return}
		if(typeof fn !== "function"){return}
		this._listeners[name] = this._listeners[name] || [];
		this._listeners[name].push(fn);
	}
	removeEventListener(name, fn){
		if(this._listeners[name]){
			this._listeners[name] = this._listeners[name].filter(item => item != fn);
		}
	}

	dispatchEvent(e){
		this._listeners[e.type] = this._listeners[e.type] || [];
		this._listeners[e.type].forEach(fn => fn(e));
	}

	get statistics(){
		return {
			elementCount: this.parser.elementCount,
			followCount: this.parser.followCount
		}
	}

	get structure(){
		// returns the whole configuration in the following format:
		// [{name: name, children: children}]
		// children are either child nodes or parameters

		if(!this._xml){return}

		let counter = 0;
		let parameters = [];
		let level = 0;
		let audioObjects = [];

		var retrieveObjects = (el, parentObj = {}, params = {}) => {
			let obj = {};

			if(el.obj){
				obj.name = el.id || [...el.classList].join(".") || el.nodeName;
				obj.label = el.getAttribute("name") || obj.name;
				obj.children = [];
				obj.type = el.nodeName;
				obj.level = (parentObj.level || 0) + 1;
				obj.id = counter++;
				obj.target = el.obj;
				obj.parent = parentObj;
				obj.path = el.obj.path;

				audioObjects.push(obj);

				if(obj.type == "var"){
					// only one parameter - 'value' - for var-elements
					// assign propertieas directly to obj
					// let param = el.obj.getWAXMLparameters().pop();
					obj.min = el.obj.minIn;
					obj.max = el.obj.maxIn;
					obj.default = el.obj.default || el.obj.value;
					obj.conv = 1;
					parameters.push(obj);

				} else {
					// add webAudioXML parameters
					el.obj.getWAXMLparameters().forEach(paramObj => {
						paramObj.id = counter++;
						// add to tree
						obj.children.push(paramObj);
						paramObj.parent = obj;
						paramObj.target = obj.target;
						paramObj.path = obj.path + "." + paramObj.name;
						paramObj.label = paramObj.label || paramObj.name;

						// add to linear list with parameter objects
						parameters.push(paramObj);
					});
				}
				
				


				// add parameters for audioNode
				if(el.obj._node && !params.onlyXML){
					for(let key in el.obj._node){
						let param = el.obj._node[key];
						if(param instanceof AudioParam){
							let range = WebAudioUtils.paramNameToRange(key);
							let paramObj = {
								id: counter++,
								name: key,
								label: key,
								target: param,
								min: range.min,
								max: range.max,
								conv: range.conv,
								level: obj.level + 1,
								default: range.default,
								path: obj.path + "." + key,
								parent: obj
							}
							// add to tree
							obj.children.push(paramObj);
							// add to linear list with parameter objects
							parameters.push(paramObj);
						}
					}
				}


				// add children to containers
				Array.from(el.children).forEach(childNode => {
					let childObj = retrieveObjects(childNode, obj, params);
					if(childObj){obj.children.push(childObj)}
				});
			}
			return obj;
		}
		let struct = {
			parameters: parameters,
			audioObjects: audioObjects,
			tree: retrieveObjects(this._xml),
			XMLtree: retrieveObjects(this._xml, {}, {onlyXML:true}),
			xml: this._xml.outerHTML
		}
		return struct;
	}

	get _variables(){
		return this.ui.variables;
	}

	set _variables(val){
		this.ui.variables = val;
	}

	get variables(){
		return this.ui.variables;
	}

	set variables(val){
		this.ui.variables = val;
	}

	addSnapshot(snapshot){
		this.snapShots.push(snapshot);
	}

	recallSnapshot(selector){
		this.GUI.HTML.querySelectorAll(`waxml-snapshot${selector}`).forEach(snapshotComponent => {
			snapshotComponent.sendData();
			snapshotComponent.parentElement.selectComponent(snapshotComponent);
		});
		this.snapShots.filter(snapShot => snapShot.id == selector).forEach(snapShot => {

		});
	}

	setVariable(key, val, transitionTime, fromSequencer){

		// move to a separate object
		// read transitionTime
		let xTime = transitionTime
		if(this._xml){
			if(typeof xTime == "undefined"){
				xTime = this.master.getParameter("transitionTime");
			} 
		}
		xTime = xTime || 0.01;

		let floatVal = parseFloat(val);
		if(typeof floatVal == "number"){
			let listener = this._ctx.listener;
			switch(key){
				case "positionx":
				case "positionX":
				listener.positionX.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
				case "positiony":
				case "positionY":
				listener.positionY.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
				case "positionz":
				case "positionZ":
				listener.positionZ.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
	
				case "forwardx":
				case "forwardX":
				listener.forwardX.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
				case "forwardy":
				case "forwardY":
				listener.forwardY.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
				case "forwardz":
				case "forwardZ":
				listener.forwardZ.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
	
				case "upx":
				case "upX":
				listener.upX.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
				case "upy":
				case "upY":
				listener.upY.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
				case "upz":
				case "upZ":
				listener.upZ.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
			}
			if(val == floatVal){val = floatVal}
		}
		
		
		this.ui.setVariable(key, val, transitionTime, fromSequencer);

		this.plugins.forEach(plugin => {
			if(plugin.setVariable){
				plugin.setVariable(key, val);
			}
		});


		// Update
		if(this.GUI){
			let vcsSelector = `waxml-variable-controller[watchedvariable="${key}"]`;
			[...this.GUI.HTML.querySelectorAll(vcsSelector),
			...document.querySelectorAll(vcsSelector)].forEach(vc => vc.value = val);
	
		}
		

	}

	set variablesToStore(varNames){
		this.ui.variablesToStore = varNames;
	}

	get variablesToStore(){
		return this.ui.variablesToStore;
	}
	
	getVariable(key){
		switch(key){

			case "positionX":
			return this._ctx.listener.positionX.value;
			break;
			case "positionY":
			return this._ctx.listener.positionY.value;
			break;
			case "positionZ":
			return this._ctx.listener.positionZ.value;
			break;

			case "forwardX":
			return this._ctx.listener.forwardX.value;
			break;
			case "forwardY":
			return this._ctx.listener.forwardY.value;
			break;
			case "forwardZ":
			return this._ctx.listener.forwardZ.value;
			break;

			default:
			return this.ui.getVariable(key);
			break;

		}
		
	}

	// InteractionManager
	get lastGesture(){
		return this.ui.lastGesture;
	}

	initSensors(){
		this.ui.initSensors();
	}

	addSequence(name = "default", events){
		this.ui.addSequence(name, events);
	}

	clearSequence(name = "default"){
		this.ui.clearSequence(name);
	}

	getSequence(name = "default"){
		return this.ui.getSequence(name);
	}

	getSequenceData(options = {}){
		let name = options.name || "default";
		let seq = this.ui.getSequence(name);
		return seq.getData(options);
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
		switch(selector){
			case "master":
			arr.push(this.master);
			break;

			default:
			this._xml.querySelectorAll(selector).forEach(xml => {
				arr.push(xml.obj);
			});
			break;
		}

		
		return arr;
	}
	querySelector(selector){

		switch(selector){
			case "master":
			this.master;
			break;

			default:
			let xml = this._xml.querySelector(selector);
			if(xml){
				return xml.obj;
			}
			break;
		}
		return undefined;
	}

	getConvolver(path){
		let targetEntry = this.convolvers.find(entry => entry.path == path);
		let convolverNodeObject;
		if(!targetEntry){
			convolverNodeObject = new ConvolverNodeObject(this, path);
			this.convolvers.push({path: path, obj: convolverNodeObject});
		} else {
			convolverNodeObject = targetEntry.obj;
		}
		return convolverNodeObject;
	}

	// a way to create WAXML objects from iMusicXML
	createObject(xmlNode){
		return this.parser.createObject(xmlNode);
	}


	// returns the current value for an (imagined) oscillator with 
	// the frequency of 1 starting at audioContext init
	OSC(freq = 1){
		return Math.sin(this._ctx.currentTime / 2 * freq * Math.PI);
	}

	initLinearArranger(structure){
		this.GUI.initLinearArranger(structure);
	}

	log(message){
		this.GUI.log(message);
	}

	toSignificant(floatVal){
		return WebAudioUtils.toSignificant(floatVal);
	}

	pathToFileName(path){
		return WebAudioUtils.pathToFileName(path);
	}

	visualize(obj){
		return this.GUI.visualize(obj);
	}
	visualFadeOut(data){
		this.GUI.visualFadeOut(data);
	}

	scrollArrangeWindow(time){
		this.GUI.scrollArrangeWindow(time);
	}

}

WebAudio.prototype.noteOn = WebAudio.prototype.trig;
WebAudio.prototype.noteOff = WebAudio.prototype.release;



let webAudioXML = new WebAudio();

window.webAudioXML = webAudioXML;
window.waxml = webAudioXML;
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

	Bugs and ideas from DT2213 at KTH 2020-06-04
	* Offset problem for interactionArea when window is scrolled
	* init() needs to be called. Doesn't alway happen from touching touchArea
	* comma separation on "map" breaks Math.pow(x,y)
	* sequencer interfers with live events
	* performance is sometimes low. I.e. slow  update for touchMove events


	Wishes:
	* Use internal variables and properties in "follow" (inkl relative links -> i.e. this.parent.frequency)
	* Better documentation on nmp installation and init()
	* Better documentation on javascript hijacking graph
	* Better structured code for contributions from the community
	* Ta bort


*/
