var WebAudioUtils = require('./WebAudioUtils.js');


class Envelope {

	constructor(xmlNode, waxml, params){

		this.waxml = waxml;
		this._ctx = this.waxml._ctx;
		this._xml = xmlNode;

		params.max = typeof params.max == "undefined" ? 1 : params.max;
		params.dynamictimes = typeof params.dynamictimes == "undefined" ? [1] : params.dynamictimes;
		params.dynamicvalues = typeof params.dynamicvalues == "undefined" ? [0] : params.dynamicvalues;

		this._params = params;
		let parentAudioObj
		if(xmlNode.parentNode.obj){
			parentAudioObj = xmlNode.parentNode.obj;
		} else {
			// to let external objects like iMusic host envelopes
			parentAudioObj = waxml.master;
		}
		
		this._parentAudioObj = parentAudioObj;
		this.timeScale = this.getParameter("timescale") || 1;


		// convert ADSR attribute to times and values
		if(this._params.adsr){
			this._params.times = [this._params.adsr.attack, this._params.adsr.decay, this._params.adsr.release];
			this._params.values = [params.max, this._params.adsr.sustain, 0];
		}
		if(!this._params.times){
			console.error(`No times specified for ${this._xml}`);
			this._params.times = [0,100];
		}
		this._params.times = this._params.times.valueOf().map(time => time * this.timeScale);

		if(!this._params.values){
			console.error(`No values specified for ${this._xml}`);
			this._params.values = [1,0];
		}

		this.timeModVal = this._params.times.valueOf().length;
		this._listeners = [];

		this._params.targetvariables = this._params.targetvariables  || [];

		if(this._params.target){
			let targetParam; // = "frequency"; // default
			let selector = this._params.target.split("_").map(str => {
				str = str.trim();
				if(str.includes(".")){
					let ta = str.split(".");
					str = ta[0];
					targetParam = ta[1];
				}
				return `.${str.trim()}`;
			}).join(" ");

			let convertStr = this._params.convert ? this._params.convert[0] : "x";
			waxml.querySelectorAll(selector).forEach(targetObject => {
				let audioNode = targetObject._node;
				targetParam = targetParam || (audioNode.detune ? "detune" : "gain");
				if(audioNode[targetParam]){
					this.addListener(targetObject._node[targetParam], convertStr);
				}
			});
			
		}
	}

	addListener(param, expression = "x"){

		if(expression.includes("€")){
			// kolla på det här! Jag behöver styra upp hela kopplingen med ENV
			expression = WebAudioUtils.replaceEnvelopeName(expression);
		}
		
		let values = this._params.values.map(x => {
			let val;
			switch(expression){
				case "MIDI->frequency":
				val = WebAudioUtils.MIDInoteToFrequency(x);
				break;

				case "dB->power":
				val = WebAudioUtils.dbToPower(x);
				break;

				default:
				val = this.mapValue(x, expression);
				break;
			}
			return val;
		});

		if(typeof this._params.default != "undefined"){
			let def;
			switch(expression){
				case "MIDI->frequency":
				def = WebAudioUtils.MIDInoteToFrequency(this._params.default);
				break;

				case "dB->power":
				def = WebAudioUtils.dbToPower(this._params.default);
				break;

				default:
				def = this.mapValue(this._params.default, expression);
				break;
			}
			param.setTargetAtTime(def, this._ctx.currentTime, 0.001);
		}
		
		this._listeners.push(
			{
				obj: param,
				values: values
			}
		);
	}

	mapValue(x, expression = "x"){
		x /= this._params.max;
		return eval(expression);
	}

	setTimes(times){

		let curOffset = times[0];
		times = times.map(t => {
			let relTime = t - curOffset;
			curOffset = relTime + 0.01;
			return relTime;
		});
		
		this._params.times = times;
	}

	start(args = []){

		args = [...args];
		let factor = typeof args[0] == "undefined" ? 1 : args[0];


		// make it possible to update variables with data from event (like velocity or key)
		this._params.targetvariables.forEach((varName, index) => {
			this.waxml.setVariable(varName, args[index % args.length]);
		});

		this.running = true;



		let delay = this.getParameter("delay");
        let startTime = delay * this.timeScale + this._ctx.currentTime + 0.001;

		// map values and times to (possibly be modified by dynamic values * factor (like velocity)
		let times = this._params.times.valueOf().map((val, index) => this.mapDynamicValue(val, factor, this._params.dynamictimes, index));
		
		if(this._params.mode == "mono" && args[2] == 0){
			// don't retrigger if legato
		} else {
			this._listeners.forEach(target => {
				target.obj.cancelScheduledValues(startTime);
				let timeOffset = 0;
				let values = target.values.map((val, index) => this.mapDynamicValue(val, factor, this._params.dynamicvalues, index));
			
				// remove release value seemed good when doing ADSR but not in general
				// values.pop();
				console.log("Env startTime: ", startTime);
				values.forEach((value, index) => {
					let time = times[index % this.timeModVal];
					// See info about timeConstant and reaching the target value:
					// https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
					// let timeFactor = target.obj.value < value ? 1 : 0.2;
					target.obj.setTargetAtTime(value, startTime + timeOffset, time);
					console.log(value, startTime + timeOffset, time)
					timeOffset += time;
				});
			});
		}
		

		if(this._params.loop){
			// let loopLength = times.reduce((a, b) => a + b, 0);
			let loopLength = this._params.loopEnd.valueOf() * this.timeScale
			this.nextStartTime = startTime + loopLength;
			let timeToNextLoop = this.nextStartTime - this._ctx.currentTime;
			setTimeout(() => {
				this.start(args);
			}, timeToNextLoop * 1000-20);
		}

	}

	mapDynamicValue(val, factor, arr, index){
		let f;
		let fVal = arr[index % arr.length];
		if(fVal == 0){
			f = 1;
		} else if(fVal < 0){
			f = 1 - fVal * factor;
		} else {
			f = fVal * factor;
		}
		return f * val;
	}

	stop(args = []){

		args = [...args];
		let factor = typeof args[0] == "undefined" ? 1 : args[0];

		this.running = false;
		this.nextStartTime = 0;

		let delay = this.getParameter("delay");
		let releaseTime = this._ctx.currentTime + delay * this.timeScale;

		let vIndex = this._params.values.length-1;
		

		let tIndex = this.timeModVal-1;
		let t = this._params.times.valueOf()[tIndex];
		let time = this.mapDynamicValue(t, factor, this._params.dynamicvalues, tIndex)
		
		if(this._params.mode == "mono" && args[2] == 0){
			// Don't release if mono mode and still keys down
		} else {
			this._listeners.forEach(target => {

				let v = target.values[vIndex];
				let value = this.mapDynamicValue(v, factor, this._params.dynamicvalues, vIndex)
			
				// See info about timeConstant and reaching the target value:
				// https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
				
				target.obj.setTargetAtTime(value, releaseTime, time/3);
			});
		}
		
	}

	
	setTargetAtTime(val){
		// at the moment this play a risk of overwriting a Watcher. Think this trough thouroughly!
	}

    getParameter(paramName){
		if(typeof this._params[paramName] === "undefined"){
			
			if(this._parentAudioObj){
				return this._parentAudioObj.getParameter(paramName);
			} else {
				return 0;
			}
  
		} else {
			let val = this._params[paramName];
  
			switch(paramName){
				case "transitionTime":
				case "loopEnd":
				case "loopStart":
				case "delay":
				val *= this.timeScale;
				break;
  
			}
			return val;
		}
	}


	// is this method in use or is it obsolete?
	getWAXMLparameters(){
		let waxmlParams = [];
		let paramNames = [];
		switch (this._nodeType) {
		  default:
  
		}
		paramNames.forEach((item, i) => {
		  let obj = WebAudioUtils.paramNameToRange(item);
		  obj.name = item;
		  obj.target = this[item];
		  obj.parent = this;
		  obj.path = e => this.path;
		  waxmlParams.push(obj);
		});
		return waxmlParams;
	}

	get parameters(){
		return this._params;
	}

}

module.exports = Envelope;
