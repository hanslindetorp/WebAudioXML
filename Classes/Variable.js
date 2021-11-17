// var Watcher = require('./Watcher.js');
var Mapper = require('./Mapper.js');
var WebAudioUtils = require('./WebAudioUtils.js');


class Variable {

	constructor(params){
		this._params = params;
		this._callBackList = [];
		this.waxml = params.waxml;
		this.lastUpdate = this.time;
		this._derivative = 0;
		this._derivative2 = 0;
		this.name = params.name;

		this.derivativeValues = [0];
		// this.derivative2Values = [0];
		this.smoothDerivative = 6;


		this._mapper = new Mapper(params);
		this.scheduledEvents = [];


		// it seems hard to add a watcher from here
		// when Watcher is calling this contructor

		// if(params.follow){
		// 	this.watcher = new Watcher(xmlNode, params.follow, {
		//
		// 		callBack: val => {
		// 			this.set(val);
		// 		}
		// 	});
		// }
		if(typeof params.default != undefined){
			this.value = this.default;
		} else if(typeof params.value != "undefined"){
			this.value = params.value.valueOf();
		}

		// setInterval(e => {
		// 	console.log(this.name, this.mappedValue, this.derivative, this.derivative2);
		// }, 500);
		
	}

	addCallBack(callBack, prop){
		this._callBackList.push({callBack: callBack, prop: prop});
		if(typeof this.value != "undefined"){
			callBack(this[prop]);
		}
	}

	valueOf(){
		return this.value;
	}

	setValue(val, transistionTime){

		if(this._value != val){
			// this.setDerivative(val);



			this._value = val;
			this.mappedValue = this._mapper.getValue(this._value);

			if(typeof this.lastMappedValue == "undefined"){
				this.lastMappedValue = this.mappedValue;
			} else {
				let diff = this.mappedValue - this.lastMappedValue;
				this.lastMappedValue = this.mappedValue;
				let now = this.time;
				let time = 1; // now - this.lastUpdate;
			
				if(time){
					let newDerivative = diff; // / time;
					this.lastUpdate = now;
	
					let lastAVG = this._derivative;
					let newAVG = this.setDerivative(newDerivative);
					this._derivative = newAVG;
					
					this._derivative2 = newAVG - lastAVG;

					// this._derivative2 = newDerivative - this._derivative;
					// this._derivative = newDerivative;
				}
				
				// this._derivative = newDerivative;
			}


			this.doCallBacks(transistionTime);
		}
	}

	get value() {
		//return this._value;
		// if(typeof this._value == "undefined" && this.default != "undefined"){
		// 	this._value = this.default;
		// }
		// return this._mapper.getValue(this._value);
		return this.mappedValue;

	}

	set value(val) {
		this.setValue(val);
	}

	setTargetAtTime(param, val=0, delay=0, time=0){
		switch(param){
			case "value":
			// transition time is not implemented
			// value is set after defined delay + time
			this.scheduledEvents.push(setTimeout(() => this.value = val, (delay+time)*1000));
			break;
		}
	}

	cancelScheduledValues(){
		this.scheduledEvents.forEach(id => clearTimeout(id));
	}

	average(arr){
		return arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
	}

	setDerivative(val){
		if(isNaN(val)){
			console.log(`setDerivative(${val})`);
		}
		this.derivativeValues.push(val);
		if(this.derivativeValues.length > this.smoothDerivative){
			this.derivativeValues.shift();
		}
		return this.average(this.derivativeValues);
	}

	get derivative(){
		return this.average(this.derivativeValues);
		// return this._derivative || 0;
	}

	get derivative2(){
		// return this.average(this.derivative2Values);
		return this._derivative2 || 0;
	}

	get acceleration(){
		return this.derivative;
	}

	get speed(){
		return Math.abs(this.derivative);
	}

	get time(){
		if(this.waxml){
			return this.waxml._ctx.currentTime;
		} else {
			return Date.now();
		}
	}

	// setDerivative(newVal){
	// 	let diff = newVal - (this._value || newVal);
	// 	let now = Date.now();
	// 	let time = now - this.lastUpdate;
		
	// 	if(time){
	// 		this.lastUpdate = now;
	// 		let newDerivative = diff / time;

	// 		// this.calibrationValues.push(newDerivative);
	// 		// this.calibrationValues.sort((a,b) => a-b);
	// 		// this.derivataFactor = 1 / this.calibrationValues[Math.floor(0.95*this.calibrationValues.length)];

	// 		// if(this.calibrationValues.length < 100){
	// 		// 	// store values for calibration
	// 		// 	this.calibrationValues.push(newDerivative);
	// 		// } else if(this.calibrationValues.length == 100 && !this.derivataFactor){
	// 		// 	this.calibrationValues.sort((a,b) => a-b);
	// 		// 	this.derivataFactor = 1 / this.calibrationValues[95];
	// 		// } else {
	// 		// 	// this.derivataFactor = Math.min(1/Math.abs(newDerivative), this.derivataFactor);
	// 		// 	newDerivative *= this.derivataFactor;
	// 		// 	this.setDerivative2(newDerivative);
	// 		// 	this._derivative = newDerivative;
	// 		// 	// console.log(this._derivative, this.derivataFactor);
	// 		// }

	// 		// if(this.calibrationValues.length > 100){
	// 		// 	if(Math.abs(newDerivative * this.derivataFactor) > 1){
	// 		// 		this.derivataFactor = 1 / newDerivative;
	// 		// 	}
	// 		// 	newDerivative *= this.derivataFactor;
	// 		// 	this.setDerivative2(newDerivative);
	// 		// 	this._derivative = newDerivative;
	// 		// 	console.log(this._derivative, this.derivataFactor, this.calibrationValues.length)
			
	// 		// }
	// 		this.setDerivative2(newDerivative);
	// 		this._derivative = newDerivative;

	// 		this.minDerivative = Math.min(this.minDerivative, newDerivative);
	// 		this.maxDerivative = Math.max(this.maxDerivative, newDerivative);
	// 		this.minVal = Math.min(this.minVal, newVal);
	// 		this.maxVal = Math.max(this.maxVal, newVal);

	// 		this.derivativeCounter++;
	// 		if(this.derivativeCounter == 200){
	// 			console.log(this.name, this.minVal, this.maxVal, this.minDerivative, this.maxDerivative);
	// 		}
			
	// 	}
		
	// }

	// setDerivative2(newDerivative){
	// 	this._derivative2 = newDerivative - this._derivative;
	// }


	get getterNsetter(){
		return {
			get: this.get,
			set: this.set
		}
	}

	get minIn(){
		return this._params.mapin ? Math.min(...this._params.mapin) : 0;
	}

	get maxIn(){
		return this._params.mapin ? Math.max(...this._params.mapin) : 1;
	}

	get default(){
		return this._params.default ? this._params.default : 1;
	}

	doCallBacks(transistionTime){
		this._callBackList.forEach(obj => {
			obj.callBack(this[obj.prop], transistionTime);
		});
	}

	getVariable(key){
		return this[key];
	}

	getWAXMLparameters(){
		let obj = WebAudioUtils.paramNameToRange("var");
		obj.name = "value";
		obj.target = this;
		obj.path = e => this.path;
		return [obj];
	}

	update(){
		this.doCallBacks(0.001);
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
				let timescale = this.getParameter("timescale") || 1;
				val *= timescale;
				break;
  
			}
			return val;
		}
	  }

}

module.exports = Variable;
