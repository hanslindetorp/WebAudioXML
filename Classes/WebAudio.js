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


var WebAudioUtils = require('./WebAudioUtils.js');
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
		this._listeners = [];

		if(source){
			window.addEventListener("load", () => {

				this.parser = new Parser(source, this, xmlDoc => {
					this._xml = xmlDoc;
					let interactionArea = this._xml.getAttribute("interactionArea");
					if(interactionArea){
						this.ui.registerEvents(interactionArea);
					}

					this.master = this._xml.audioObject;

					//webAudioXML = xmlDoc.audioObject;
					//webAudioXML.touch = touches;
					new Connector(xmlDoc, _ctx);
					this.plugins.forEach(plugin => {
						plugin.init();
					});
					if(this._xml.getAttribute("controls") == "true"){
						new GUI(xmlDoc, document.body);
					}

					this.dispatchEvent(new CustomEvent("inited"));

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
		this.init();
		this._xml.querySelectorAll(selector).forEach(XMLnode => {
			if(XMLnode.audioObject && XMLnode.audioObject.start){
				XMLnode.audioObject.start();
			}
		});
	}

	trig(selector = "*"){
		this._xml.querySelectorAll(selector).forEach(XMLnode => {
			if(XMLnode.audioObject.start){
				XMLnode.audioObject.start();
			} else if(XMLnode.audioObject.noteOn){
				XMLnode.audioObject.noteOn();
			}
		});
	}

	stop(selector = "*"){
		this._xml.querySelectorAll(selector).forEach(XMLnode => {
			if(XMLnode.audioObject && XMLnode.audioObject.stop){
				XMLnode.audioObject.stop();
			}
		});
	}

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

		var retrieveObjects = (el, parentObj = {}) => {
			let obj = {};
			if(el.audioObject){
				obj.name = el.id || [...el.classList].join(".") || el.nodeName;
				obj.children = [];
				obj.type = el.nodeName;
				obj.level = (parentObj.level || 0) + 1;
				obj.id = counter++;
				obj.target = el.audioObject;
				obj.parent = parentObj;

				audioObjects.push(obj);

				// add webAudioXML parameters
				el.audioObject.getWAXMLparameters().forEach(paramObj => {
					paramObj.id = counter++;
					// add to tree
					obj.children.push(paramObj);
					paramObj.parent = obj;
					// add to linear list with parameter objects
					parameters.push(paramObj);
				});


				// add parameters for audioNode
				if(el.audioObject._node){
					for(let key in el.audioObject._node){
						let param = el.audioObject._node[key];
						if(param instanceof AudioParam){
							let range = WebAudioUtils.paramNameToRange(key);
							let paramObj = {
								id: counter++,
								name: key,
								target: param,
								min: range.min,
								max: range.max,
								conv: range.conv,
								level: obj.level + 1,
								default: range.default,
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
					let childObj = retrieveObjects(childNode, obj);
					if(childObj){obj.children.push(childObj)}
				});
			}
			return obj;
		}
		let struct = {
			parameters: parameters,
			audioObjects: audioObjects,
			tree: retrieveObjects(this._xml),
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

	setVariable(key, val){
		this.ui.setVariable(key, val);
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
			let audioObject = xml.audioObject;
			arr.push(xml.audioObject);
		});
		return arr;
	}
	querySelector(selector){
		let xml = this._xml.querySelector(selector);
		if(xml){
			return xml.audioObject || xml.obj;
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
