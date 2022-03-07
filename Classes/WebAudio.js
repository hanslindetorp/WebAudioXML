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

var version = "1.0.7";


var WebAudioUtils = require('./WebAudioUtils.js');
var Parser = require('./Parser.js');
var Connector = require('./Connector.js');
var GUI = require('./GUI.js');
var InteractionManager = require('./InteractionManager.js');
var ConvolverNodeObject = require('./ConvolverNodeObject.js');
var Variable = require('./Variable.js');
var InputBusses = require('./InputBusses.js');




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

					console.log("WebAudioXML is installed. Version " + version);
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

		this.audioInited = false;
		this.parser = new Parser(this);

		this.inputBusses = new InputBusses(_ctx);

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

		this.ui = new InteractionManager(this);


	}

	/*
	// Maybe to be implemented when moved from AudioObject
	addVariableWatcher(variable, callBack){
		this.variableRouter.addVariableWatcher(variable, callBack);
	}
	*/
	init(){
		if(!this.audioInited){
			this.audioInited = true;
			this._ctx.resume();
			this.start("*[trig='auto'], *[start='auto']");

			setInterval(e => {
				this.setVariable("currentTime", this._ctx.currentTime/this._xml.obj.parameters.timescale);
			}, 1000/this.fps);
		}
	}

	mute(){
		this.master.fadeOut(0.1);
	}

	unmute(){
		this.master.fadeIn(0.1);
	}

	getXMLString(){
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
		new Connector(xmlDoc, this._ctx);
		this.plugins.forEach(plugin => {
			plugin.init();
		});

		// make all variable elements broadcast their init values
		this.querySelectorAll("var").forEach(el => {
			el.update();
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

	getInputBus(selector){
		let destinations = [];
		this.querySelectorAll(selector).forEach(obj => {
			destinations.push(obj.input);
		});
		return this.inputBusses.getBus(selector, destinations);
	}

	start(selector = "*", options){

		if(this._ctx.state != "running"){
			this.init();
		}
		this._xml.querySelectorAll(selector).forEach(XMLnode => {
			if(XMLnode.obj.start){
				XMLnode.obj.start(options);
			} else if(XMLnode.obj.noteOn){
				XMLnode.obj.noteOn(options);
			}
		});
		
	}

	trig(selector, options){
		
		this._xml.querySelectorAll(`*[trig='${selector}'],*[noteon='${selector}'],*[start='${selector}']`).forEach(XMLnode => {
			if(XMLnode.obj.start){
				XMLnode.obj.start(options);
			} else if(XMLnode.obj.noteOn){
				XMLnode.obj.noteOn(options);
			}
		});
	}
	

	release(selector, options){
		this._xml.querySelectorAll(`*[noteoff='${selector}'], *[stop='${selector}']`).forEach(XMLnode => {
			if(XMLnode.obj.stop){
				XMLnode.obj.stop(options);
			} else if(XMLnode.obj.noteOff){
				XMLnode.obj.noteOn(options);
			}
		});
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

	addEventListener(name, fn){
		if(typeof name !== "string"){return}
		if(typeof fn !== "function"){return}
		this._listeners[name] = this._listeners[name] || [];
		this._listeners[name].push(fn);
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

	setVariable(key, val, transitionTime){

		// move to a separate object
		// read transitionTime
		let xTime = transitionTime
		if(this._xml){
			xTime = xTime || this._xml.obj.getParameter("transitionTime");
		}
		xTime = xTime || 0.001;

		let floatVal = parseFloat(val);
		if(typeof floatVal == "number"){
			let listener = this._ctx.listener;
			switch(key){
				case "positionx":
				listener.positionX.setTargetAtTime(floatVal, 0, xTime);
				break;
				case "positiony":
				listener.positionY.setTargetAtTime(floatVal, 0, xTime);
				break;
				case "positionz":
				listener.positionZ.setTargetAtTime(floatVal, 0, xTime);
				break;
	
				case "forwardx":
				listener.forwardX.setTargetAtTime(floatVal, 0, xTime);
				break;
				case "forwardy":
				listener.forwardY.setTargetAtTime(floatVal, 0, xTime);
				break;
				case "forwardz":
				listener.forwardZ.setTargetAtTime(floatVal, 0, xTime);
				break;
	
				case "upx":
				listener.upX.setTargetAtTime(floatVal, 0, xTime);
				break;
				case "upy":
				listener.upY.setTargetAtTime(floatVal, 0, xTime);
				break;
				case "upz":
				listener.upZ.setTargetAtTime(floatVal, 0, xTime);
				break;
			}
			if(val == floatVal){val = floatVal}
		}
		
		this.ui.setVariable(key, val, transitionTime);
	}
	getVariable(key){
		return this.ui.getVariable(key);
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
			let audioObject = xml.obj;
			arr.push(xml.obj);
		});
		return arr;
	}
	querySelector(selector){
		let xml = this._xml.querySelector(selector);
		if(xml){
			return xml.obj;
		}
		return -1;
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

}

WebAudio.prototype.noteOn = WebAudio.prototype.trig;
WebAudio.prototype.noteOff = WebAudio.prototype.release;
WebAudio.prototype.stop = WebAudio.prototype.release;



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
