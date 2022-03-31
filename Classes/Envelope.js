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
		let parentAudioObj = xmlNode.parentNode.obj;
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
		this._params.times = this._params.times.map(time => time * this.timeScale);

		if(!this._params.values){
			console.error(`No values specified for ${this._xml}`);
			this._params.values = [1,0];
		}

		this.timeModVal = this._params.times.length;
		this._listeners = [];

		this._params.targetvariables = this._params.targetvariables  || [];
	}

	addListener(param, expression){

		expression = WebAudioUtils.replaceEnvelopeName(expression);
		let values = this._params.values.map(x => this.mapValue(x, expression));

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

	start(args = []){

		args = [...args];
		let factor = typeof args[0] == "undefined" ? 1 : args[0];

		// make it possible to update variables with data from event (like velocity or key)
		this._params.targetvariables.forEach((varName, index) => {
			this.waxml.setVariable(varName, args[index % args.length]);
		});

		this.running = true;
		console.log("New ENV.start");

		let delay = this.getParameter("delay");
        let startTime = delay * this.timeScale + this._ctx.currentTime;

		// map values and times to (possibly be modified by dynamic values * factor (like velocity)
		let times = this._params.times.map((val, index) => this.mapDynamicValue(val, factor, this._params.dynamictimes, index));
		
		this._listeners.forEach(target => {
			target.obj.cancelScheduledValues(startTime);
			let timeOffset = 0;
			let values = target.values.map((val, index) => this.mapDynamicValue(val, factor, this._params.dynamicvalues, index));
		
			// remove release value
			values.pop();
			values.forEach((value, index) => {
				let time = times[index % this.timeModVal];
				// See info about timeConstant and reaching the target value:
				// https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
				target.obj.setTargetAtTime(value, startTime + timeOffset, time/3);
				timeOffset += time;
			});
		});

		if(this._params.loop){
			// let loopLength = times.reduce((a, b) => a + b, 0);
			let loopLength = this._params.loopEnd.valueOf() * this.timeScale
			this.nextStartTime = startTime + loopLength;
			let timeToNextLoop = this.nextStartTime - this._ctx.currentTime;
			setTimeout(() => {
				this.start(factor);
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

	stop(factor = 1){

		this.running = false;
		this.nextStartTime = 0;

		let delay = this.getParameter("delay");
		let releaseTime = this._ctx.currentTime + delay * this.timeScale;

		let vIndex = this._params.values.length-1;
		

		let tIndex = this.timeModVal-1;
		let t = this._params.times[tIndex];
		let time = this.mapDynamicValue(t, factor, this._params.dynamicvalues, tIndex)
		
		this._listeners.forEach(target => {

			let v = target.values[vIndex];
			let value = this.mapDynamicValue(v, factor, this._params.dynamicvalues, vIndex)
		
			// See info about timeConstant and reaching the target value:
			// https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
			
			target.obj.setTargetAtTime(value, releaseTime, time/3);
		});
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
