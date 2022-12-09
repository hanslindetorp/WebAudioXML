
var EventTracker = require('./EventTracker.js');
var VariableContainer = require('./VariableContainer.js');
var Watcher = require('./Watcher.js');
var WebAudioUtils = require('./WebAudioUtils.js');
var XY_area = require('./XY_area.js');
var XY_handle = require('./XY_handle.js');
var Variable = require("./Variable.js");
var KeyboardManager = require("./KeyboardManager.js");
var MidiManager = require("./MidiManager.js");


class InteractionManager {

	constructor(waxml){
		this.defineCustomElements();

		

		let initCall = e => {
			this.waxml.init();
			window.removeEventListener("pointerdown", initCall);
		}
		window.addEventListener("pointerdown", initCall);

		this.eventTracker = new EventTracker(waxml);
		this.waxml = waxml;
		this.inited = false;
		this.variables = new VariableContainer();
		this.watchers = [];

		this._variablesToStore = [];

		// variables
		// create a way of keeping track of each touch
		// during a multi touch
		let touches = [];
		while(touches.length < (navigator.maxTouchPoints || 1)){
			touches.push({});
		}
		this._variables.touch = touches;
		this.touchIDs = [];
		this._variables.pointerdown = 0;

		this._variables.client = [];

		while(this._variables.client.length < 10){
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

			this._variables.client.push(c);
		}

		this.waxml.addEventListener("inited", e => {
			this.keyboardManager = new KeyboardManager(this.waxml);
			this.midiManager = new MidiManager(this.waxml);
			this.connectToHTMLelements();
		});

	}

	set variablesToStore(varNames){
		this._variablesToStore = varNames;
	}

	get variablesToStore(){
		return this._variablesToStore;
	}

	defineCustomElements(){
		customElements.define('waxml-xy-area', XY_area);
		customElements.define('waxml-xy-handle', XY_handle);
	}


	init(){
		this.inited = true;
		this.waxml.init();
	}

	initSensors(){

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


	connectToHTMLelements(){

		// add waxml commands to HTML elements
		[...document.querySelectorAll("*")].forEach( el => {

			[...el.attributes].forEach( attr => {

				if(attr.localName.startsWith("data-waxml-")){
					let val = attr.nodeValue;
					let attrNameArr = attr.localName.split("-");
					let fn, commandName;
					let eventName = attrNameArr[2];

					if(eventName == "midi"){
						// remote control HTML elements with MIDI
						val.split(";").map(str => str.trim()).forEach(filter => {
							this.midiManager.addListener({
								element: el,
								task: attrNameArr[3],
								target: attrNameArr[4],
								filter: filter,
								min: parseFloat(el.getAttribute("min") ||0),
								max: parseFloat(el.getAttribute("max") || 100),
								step: parseFloat(el.getAttribute("step") || 1)
							});

						});
	
					} else {
	
						commandName = attrNameArr[3];
	
						switch(eventName){
	
							case "style":
								let CSSprop = val.split("=").shift().trim();
								val = val.split("=").pop().trim();
								let watcher = new Watcher(this.waxml._xml, val, {
									waxml: this.waxml,
									callBack: (val, time) => {
										el.style[CSSprop] = val;
									}
								});
	
								this.watchers.push(watcher);
							break;
	
	
							default:
	
								// Create empty link for <a> elements
								if(el.localName == "a"){
									var deadLink = "javascript:void(0)";
									if(!el.attributes.href){
										el.setAttribute("href", deadLink);
									} else if(el.attributes.href.nodeValue == "#"){
										el.attributes.href.nodeValue = deadLink;
									}
								}
								
								switch(commandName){
									case "start":
									case "play":
										fn = e => {
											this.waxml.start(val);
											this.waxml.setVariable(val, 1);
										}
										break;
			
									case "stop":
										fn = e => {
											this.waxml.stop(val);
	
											// trix för att sätta resp keydown variable rätt
											val = val.replace("keyup:", "keydown:");
											this.waxml.setVariable(val, 0);
										}
										break;
	
									case "continue":
										fn = e => {
											this.waxml.continue(val);
											this.waxml.setVariable(val, 1);
										}
										break;
	
	
									case "set":
										if(val.includes("=")){
											let values = [];
											// allow for multiple values
											let rules = val.split(";").forEach(expression => {
												let arr = expression.split("=").map(v => v.trim());
												let key = arr[0];
												let value = arr[1];
												if(key){
	
													if(value.includes("this.")){
														// allow for dynamic values from slider, switches etc.
														let targetProperty = value.replace("this", "el");
														value = {
															valueOf: () => {
																return eval(targetProperty);
															}
														}
													} 
													values.push({key: key, value: value});
												}
											});
											fn = e => {
												values.forEach(entry => {
													this.waxml.setVariable(entry.key, entry.value.valueOf());
												});
											}
											
										} 
	
	
	
	
										break;
			
									default:
										fn = e => {
											this.waxml.setVariable(commandName, val.valueOf());
										}
										break;
								}
								let frFn;
								if(eventName == "timeupdate" && el.requestVideoFrameCallback){
									// allow for frame synced updates
									frFn = (now, metaData) => {
										fn();
										el.requestVideoFrameCallback(frFn);
									}
									el.requestVideoFrameCallback(frFn);
								} else {
									el.addEventListener(eventName, fn);
								}
			
								if(eventName == "play" && el.autoplay && el.currentTime){
									// trig function manually if video has already begun playback
									(frFn || fn)();
								}
							break;
	
	
						}
	
	
						
					}

				}

			});

		});


		// add waxml commands HTML input and waxml-xy-handle elements
		// I earlier supported to HTML input elements with this syntax but it's now 
		// included in the generic listener using data-waxml-input syntax
		//let filter = "[data-waxml-target]:not([data-waxml-target=''])";
		[...document.querySelectorAll(`waxml-xy-handle[targets]`)].forEach( el => {
			
			
			el.addEventListener("input", e => {
				let values = e.target.value;
				values = values instanceof Array ? values : [values];
				el.targets.forEach((target, i) => {
					this.waxml.setVariable(target, values[i % values.length], 0.001);
				});
				
			});

			if(el.dataset.waxmlAutomation){
				let data = el.dataset.waxmlAutomation.split(",");
				let waveForm = data[0] ? data[0].trim() : "sine";
				let frequency = eval(data[1] ? data[1].trim() : 1);
				let min = parseFloat(el.getAttribute("min") || 0);
				let max = parseFloat(el.getAttribute("max") || 0);
				let range = max - min;
				let updateFrequency = 100;
				
				let x = 0;

				setInterval(() => {
					let factor;
					switch(waveForm){
						case "sine":
						factor = (Math.sin(Math.PI * x * frequency / updateFrequency)+1)/2;
						break;

						case "sawtooth":
						factor = (x * frequency / updateFrequency) % 1;
						break;

						case "square":
						factor = (x * frequency) % updateFrequency < updateFrequency / 2;
						break;
					}
					
					let val = min + factor * range;
					el.value = val;

					var event = new CustomEvent("input");
					el.dispatchEvent(event);

					x++;
				}, 1000 / updateFrequency);
			}
		});

	}

	get variables(){
		return this._variables;
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

	setDeviceMotion(e){
		this.setVariable("deviceMotionAccelerationX", e.acceleration.x);
		this.setVariable("deviceMotionAccelerationY", e.acceleration.y);
		this.setVariable("deviceMotionAccelerationZ", e.acceleration.z);
		this.setVariable("deviceMotionRotationRateAlpha", e.rotationRate.alpha);
		this.setVariable("deviceMotionRotationRateBeta", e.rotationRate.beta);
		this.setVariable("deviceMotionRotationRateGamma", e.rotationRate.gamma);
	}

	setDeviceOrientation(e){
		this.setVariable("deviceOrientationAlpha", e.alpha);
		this.setVariable("deviceOrientationBeta", e.beta);
		this.setVariable("deviceOrientationGamma", e.gamma);
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
			let newX = (event.clientX-event.target.offsetLeft) / event.target.offsetWidth * 100;
			let newY = (event.clientY-event.target.offsetTop) / event.target.offsetHeight * 100;
			obj.relX = newX;
			obj.relY = newY;
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
			let identifier = this.touchIDs.find((el, id) => this._variables.touch[id].down != 1);
			let i;

			if(identifier){
				i = this.touchIDs.indexOf(identifier);
				this.touchIDs[i] = touch.identifier;
			} else {
				i = this.touchIDs.length;
				this.touchIDs.push(touch.identifier);
			}

			let touchObj = this._variables.touch[i];
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
			let touchObj = this._variables.touch[touchIDs.indexOf(touch.identifier)];

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


			let touchObj = this._variables.touch[i];
			if(touchObj){
				touchObj.down = 0;
				touchObj.force = 0;
				setMovePos(touchObj);
				this.waxml.stop("*[trig='touch[" + i + "]']");

			}

			// reset touch list if last touch
			let stillDown = 0;
			this._variables.touch.forEach(touch => {
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

			let touchObj = this._variables.touch[0];
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

			let touchObj = this._variables.touch[0];
			this.copyTouchProperties(e, touchObj);
			this.setRelativePos(touchObj, e);
			this.setMovePos(touchObj);

			this.waxml.start("*[trig='touch[0]']");
			this.waxml.start("*[trig='client[0].touch[0]']");
		}

		this._variables.mouseX = e.clientX;
		this._variables.mouseY = e.clientY;

		this._variables.pointerX = e.clientX;
		this._variables.pointerY = e.clientY;

		this._variables.relX = e.relX;
		this._variables.relY = e.relY;

		this._variables.moveX = e.moveX;
		this._variables.moveY = e.moveY;
		this._variables.relMoveX = e.relMoveX;
		this._variables.relMoveY = e.relMoveY;

		this._variables.mousedown = 1;
		this._variables.pointerdown = 1;
		this._variables.touchdown = 1;
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
		this._variables.mouseX = e.clientX;
		this._variables.mouseY = e.clientY;

		this._variables.pointerX = e.clientX;
		this._variables.pointerY = e.clientY;

		let oldX = this._variables.relX || e.relX;
		let oldY = this._variables.relY || e.relY;
		let diffX = e.relX - oldX;
		let diffY = e.relY - oldY;

		let dirX = diffX ? (diffX > 0 ? 1 : -1) : 0;
		let dirY = diffY ? (diffY > 0 ? 1 : -1) : 0;

		this._variables.dirX = dirX;
		this._variables.dirY = dirY;

		if(diffX && diffY){

			let dir = (Math.atan2(diffY,diffX) / Math.PI * 180 + 360 + 90) % 360;
			this._variables.dir = dir;
		}

		this._variables.relX = e.relX;
		this._variables.relY = e.relY;

		this._variables.moveX = e.moveX;
		this._variables.moveY = e.moveY;
		this._variables.relMoveX = e.relMoveX;
		this._variables.relMoveY = e.relMoveY;

		// simulate touch behaviour if needed
		if(!navigator.maxTouchPoints){

			let touchObj = this._variables.touch[0];
			this.copyTouchProperties(e, touchObj);
			this.setRelativePos(touchObj, e);
			this.setMovePos(touchObj);

			//this.setRelativePos(touchObj);
			//this.setMovePos(touchObj, e.clientX, e.clientY);

			touchObj = this._variables.client[0].touch[0];
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
		this._variables.mousedown = 0;
		this._variables.pointerdown = 0;
		this._variables.touchdown = 0;

		this.waxml.stop("*[trig='mouseup']");
		this.waxml.stop("*[trig='pointerup']");

		this.waxml.stop("*[trig='mouse']");
		this.waxml.stop("*[trig='pointer']");

		// simulate touch behaviour if needed
		if(!navigator.maxTouchPoints){

			let touchObj = this._variables.touch[0];
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

	clearSequence(name){
		this.eventTracker.clear(name);
	}

	getSequence(name = "_storedGesture"){
		return this.eventTracker.getSequence(name);
	}


	get variables(){
		return this._variables;
	}
	set variables(val){
		this._variables = this._variables || val;
	}

	setVariable(key, val, transistionTime, fromSequencer){
		// 2022-03-23
		// This is really bad design. There is a global layer of "invisible"
		// variable objects stored in this._variables and there are global
		// variable objects created by XML stored in this.waxml.master.variables
		// These really ought to be the same container, but for now, they aren't...
		
		let container;

		// remove initial dollar sign
		if(key.substr(0,1) == "$"){
			key = key.substr(1);
		}
		if(this.waxml.master && this.waxml.master.variables[key] instanceof Variable){
			container = this.waxml.master.variables;
		} else if(this._variables[key] instanceof Variable){
			container = this._variables;
		}
		let updated = false;
		if(container){
			updated = container[key].valueOf() != val;
			if(transistionTime){
				// override transitionTime if specified
				container[key].setValue(val, transistionTime);
			} else {
				container[key].value = val;
			}
			
		} else {
			updated = this._variables[key] != val;
			this._variables[key] = val;
		}

		// store in sequencer if specified
		if(!fromSequencer && updated && this.variablesToStore.includes(key)){
			this.eventTracker.store(key, val);
		}
		
	}
	getVariable(key, val){
		return this._variables[key];
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
