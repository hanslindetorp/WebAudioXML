
var WebAudioUtils = require('./WebAudioUtils.js');
var Watcher = require('./Watcher.js');
var Trigger = require('./Trigger.js');

class Synth{


	constructor(xmlNode, waxml, localPath, params){

  	this.waxml = waxml;
  	let _ctx = this.waxml._ctx;

		this._xml = xmlNode;
		this._ctx = _ctx;
		this._localPath = localPath;

		this._params = params;
		this._voices = this._params.voices || 1;
		this._voiceID = 0;

		this.variables = {};

		this._node = this._ctx.createGain();
		this._node.gain.value = 1/this._voices;
	  	// console.log(xmlNode.nodeName, this._node.__resource_id__);

		// duplicate XML nodes until there are correct number of voices
		this.voiceNodes = this._xml.children;
		let voiceNodeCount = xmlNode.querySelectorAll("voice, Voice").length;

		this.hasEnvelope = xmlNode.querySelectorAll("envelope, Envelope").length > 0;

		if(voiceNodeCount){
			let curID = 0;
			while(this._xml.children.length < this._voices){
				let targetNode = this._xml.children[curID];
				if(targetNode.nodeName.toLowerCase() != "voice"){continue}

				let newNode = targetNode.cloneNode(true);
				this._xml.appendChild(newNode);
				curID++;
			}
			this.voiceNodes = xmlNode.querySelectorAll("voice, Voice");
		} else {
			console.error("Web Audio XML error. Voice node(s) are missing in Synth node.");
		}

		if(this._params.follow){
			this.watcher = new Watcher(xmlNode, this._params.follow, {
				delay: this.getParameter("delay"),
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


		this.trigger = new Trigger(this, 0, waxml);

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

	trig(note, vel){
		this.noteOn(note, vel);
	}

	start(note, vel){
		this.trigger.start();
	}

	stop(note, vel){
		this.trigger.stop();
	}

	noteOff(note, vel=1){
		let voiceNode = this.noteToVoice(note);

		let data = {note:note, vel:vel};
		if(!this.hasEnvelope){voiceNode.audioObject.stop(data)};
		voiceNode.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.stop(data));
		voiceNode.MIDInote = 0;

		this.trigger.stop();
	}


	get nextVoice(){
		let voice;
		switch (this._params.voiceselect) {
			case "next":
				voice = this.voiceNodes[this._voiceID++ % this._voices];
				break;

			case "random":
				let rnd = Math.floor(Math.random() * this.voiceNodes.length);
				voice = this.voiceNodes[rnd];
				break;
			default:

		}
		return voice;

	}

	// set trigger(val){
	// 	this._trigger.frequency = val;
	// }
	//
	// get trigger(){
	// 	return this._trigger.frequency;
	// }

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
  	if(typeof param == "string"){
			let targetParam = this._node[param];
			if(!targetParam){targetParam = this[param]}
			param = targetParam;
		}

  	if(cancelPrevious){
	  	param.cancelScheduledValues(this._ctx.currentTime);
  	}
  	if(transitionTime){
	  	param.setTargetAtTime(value, startTime, transitionTime);
  	} else {
	  	param.setValueAtTime(value, startTime);
  	}

	}

	getWAXMLparameters(){
		let waxmlParams = [];
		let paramNames = ["trigger"];

		paramNames.forEach((item, i) => {
			let obj = WebAudioUtils.paramNameToRange(item);
			obj.name = item;
			obj.target = this[item];
			obj.parent = this;
			waxmlParams.push(obj);
		});
		return waxmlParams;
	}


	get variables(){
		return this._variables;
	}

  set variables(val){
    this._variables = val;
  }

	setVariable(key, val){
		this._variables[key] = val;
	}

  getVariable(key){
		return this._variables[key];
	}

}

module.exports = Synth;
