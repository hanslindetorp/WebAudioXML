// var Watcher = require('./Watcher.js');
var Mapper = require('./Mapper.js');
// var WebAudioUtils = require('./WebAudioUtils.js');


class Variable {

	constructor(xmlNode, params){

		if(xmlNode){
			this._parentAudioObj = xmlNode.parentNode.audioObject;
		}
		

		this._params = params;
		this._callBackList = [];
		this.waxml = params.waxml;
		this.lastUpdate = 0;
		this._polarity = 0;
		this._derivative = 0;
		this._derivative2 = 0;
		this._derivative3 = 0;
		this._xml = xmlNode;
		this.name = params.name;

		this.derivativeValues = [0];
		// this.derivative2Values = [0];
		// this.smoothDerivative = 3;
		this.registeredTimes = [];


		this._mapper = new Mapper(params);
		this.scheduledEvents = [];

		this.autoTriggerTimeout = 0;
		this.lastBroadCastedValues = {};

		// if(this.name == "pan"){
		// 	console.log("hej");
		// }


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

		if(params.trig){
			//this.argumentIndex = parseInt((params.value || "").split("[").pop()) || 0;
			this.targetParameter = params.value;
		}	
		if(typeof params.default != "undefined"){
			this.value = params.default;
		} else if(!params.trig && typeof params.value != "undefined"){
			this.value = params.value.valueOf();
		}

		// setInterval(e => {
		// 	console.log(this.name, this.mappedValue, this.derivative, this.derivative2);
		// }, 500);

		this.trig;
		
	}

	addCallBack(callBack, prop){
		this._callBackList.push({callBack: callBack, prop: prop});
		if(typeof this.value != "undefined"){
			callBack(this[prop]);
		}
	}

	trig(){
		// this feature lets the variable update to one argument 
		// passed to the function. I.e. MIDI:NoteOn, {channel: ch, keyNum: nr, velocity: vel}
		this.setValue(arguments[0][this.targetParameter]);
	}

	getMappingPoints(steps = 1000){

		let points = [];
		let minIn = typeof this.minIn == "undefined" ? 0 : this.minIn;
		let maxIn = typeof this.maxIn == "undefined" ? 1 : this.maxIn;

		let inputRange = maxIn - minIn;

		for(let i = 0; i <= steps; i++){
			let x = minIn + i / steps * inputRange;
			let y = this._mapper.getValue(x);
			points.push({x: x, y: y});
		}
		return points;
	}

	valueOf(){
		return this.value;
	}

	setValue(val = this._value, transistionTime = 0, autoTrigger = false){

		this.lastInputValue = val;
		
		if(this.autoInputRange){
			this.autoAdjustInputRange(val);
		}

		// clear autoTrigger (no matter if the function is triggered manually or automatically)
		// the autoTrigger makes sure derivatas are reset even if no data is updated
		if(this.autoTriggerTimeout){
			clearTimeout(this.autoTriggerTimeout);
			this.autoTriggerTimeout = 0;
		}

		if(typeof val == "boolean"){
			// pick minin if false, maxin if true
			val = val ? this.maxIn : this.minIn;
		}

		let oldValue = this._value;
		let newValue = val;

		let curFrame = this.curFrame;

		if(val == parseFloat(val))val = parseFloat(val);
		this._value = val;

		this.mappedValue = this._mapper.getValue(this._value);
		
		if(typeof this.mappedValue != "undefined"){

			// successful mapping
			let frames = 1;

			if(typeof this.lastMappedValue != "undefined"){
				// don't run on first data value

				let diff = this.mappedValue - this.lastMappedValue;
				this.lastMappedValue = this.mappedValue;
				frames = curFrame - this.lastUpdate;
			
				if(frames){
					if(diff >= 0 && this._polarity <= 0){
						this._polarity = 1;
						this.broadCastEvent("trough");
						this.polarityChange();
					} else if(diff <= 0 && this._polarity >= 0){
						this._polarity = -1;
						this.broadCastEvent("crest");
						this.polarityChange();
					}

					let newDerivative1;
					if(diff){
						newDerivative1 = diff / frames;
					} else {
						// let the derivative fall towards zero if set
						newDerivative1 = this._derivative ? this._derivative * this.fallOffRatio : 0;
					}

					newDerivative1 = this.getDerivativeAVG(newDerivative1);
					
					let newDerivative2 = newDerivative1 - this._derivative;
					let newDerivative3 = newDerivative2 - this._derivative2;

					// let lastAVG = this._derivative;
					// let newAVG = this.setDerivative(newDerivative);

					this._derivative = newDerivative1;
					this._derivative2 = newDerivative2;
					this._derivative3 = newDerivative3;

					// this._derivative2 = newDerivative - this._derivative;
					// this._derivative = newDerivative;
				}
				
				// this._derivative = newDerivative;
				
			}
			this.doCallBacks(transistionTime);
			this.lastUpdate = curFrame;
			this.lastMappedValue = this.mappedValue;

			let delay;
			if(autoTrigger){
				delay = 1 / this.frameRate;
			} else {
				delay = this.AVGtime(frames / this.frameRate);
			}
			
			if(this._params.stream){
				this.autoTriggerTimeout = setTimeout(e => this.setValue(val, transistionTime, true), delay * 2000);
			}

		}
		
	}

	autoAdjustInputRange(val){
		this.minIn = Math.min(this.minIn, val);
		this.maxIn = Math.max(this.maxIn, val);
	}

	get value() {
		//return this._value;
		// if(typeof this._value == "undefined" && this.default != "undefined"){
		// 	this._value = this.default;
		// }
		// return this._mapper.getValue(this._value);
		let val = this.mappedValue;
		// console.log(this.name, val);
		return val;

	}

	set value(val) {
		this.setValue(val);
	}

	get valuePairs(){
		return {input: this.lastInputValue, output: this.lastMappedValue};
	}

	setTargetAtTime(param, val=0, delay=0, time=0){
		this.scheduledEvents.push(setTimeout(() => this.value = val, (delay+time)*1000));
			
		// switch(param){
		// 	case "value":
		// 	// transition time is not implemented
		// 	// value is set after defined delay + time
		// 	this.scheduledEvents.push(setTimeout(() => this.value = val, (delay+time)*1000));
		// 	break;
		// }
	}

	setValueAtTime(val, delay){
		this.setTargetAtTime("value", val, delay);
	}

	cancelScheduledValues(){
		this.scheduledEvents.forEach(id => clearTimeout(id));
	}

	average(arr){
		return arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
	}

	getDerivativeAVG(val){
		// feature used to smooth the derivative, but it also slows down the responsitivity
		if(isNaN(val)){
			console.log(`setDerivative(${val})`);
		}
		this.derivativeValues.push(val);
		if(this.derivativeValues.length > this.smoothDerivative){
			this.derivativeValues.shift();
		}
		return this.average(this.derivativeValues);
	}

	get smoothDerivative(){
		if(!this._smoothDerivative){
			this._smoothDerivative = this.getParameter("smoothDerivative");
		}
		return this._smoothDerivative;
	}

	get frameRate(){
		if(!this._frameRate){
			this._frameRate = this.getParameter("frameRate");
		}
		return this._frameRate;
	}

	get fallOffRatio(){
		if(!this._fallOffRatio){
			this._fallOffRatio = this.getParameter("fallOffRatio");
		}
		return this._fallOffRatio;
	}

	get derivative(){
		return this._derivative || 0;
	}

	get derivative2(){
		return this._derivative2 || 0;
	}

	get derivative3(){
		return this._derivative3 || 0;
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
			return Date.now() / 1000;
		}
	}

	get curFrame(){
		return this.time * this.frameRate;
	}

	broadCastEvent(eventName){
		if(this._xml){
			let selector = `[start="${this.name}.${eventName}"]`;
			this._xml.parentElement.querySelectorAll(selector).forEach(xmlNode => {
				xmlNode.obj.start();
			});
		}
		
	}

	polarityChange(){
		this.derivativeValues = [];
		this.broadCastEvent("polarityChange");
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
		return typeof this._params.default == "undefined" ? 1 : this._params.default;
	}

	get defaultValue(){
		return this.default;
	}

	AVGtime(time = 0){
		// I decided to use frameRate instead of this auto-detect update rate for incoming data
		// It defaults to 30 but can be set for any element

		// But then I changed my mind. I think it will too much effort to specify all values manually.
		// Better if the system can handle quite a lot automatically
		let nrOfTimeValues = 10;
		if(this._AVGtime) {
			return this._AVGtime;
		} else {
			if(time){
				this.registeredTimes.push(time);
				if(this.registeredTimes.length > 10){
					this.registeredTimes.shift();
				}
				return this.registeredTimes.reduce((a,b) => a + b) / nrOfTimeValues;

				// time = this.registeredTimes.sort((a,b) => a < b);
			} else {
				return 0.1;
			}
			
			// if(this.registeredTimes.length > 10){
			// 	// calculate average time. Exclude outliers
			// 	let sortedArr = this.registeredTimes.sort((a,b) => a < b);
			// 	let filteredArr = sortedArr.filter((el, i) => i > 20 && i < 80);
			// 	this._AVGtime = filteredArr.reduce((a,b) => a + b) / filteredArr.length;
			// } else {
			// 	return time || 0.1;
			// }
		}
	}

	doCallBacks(transistionTime){
		let lastBroadCastedValues;
		this._callBackList.forEach(obj => {
			// if(this.lastBroadCastedValues != this[obj.prop]){ // Det här ställde till det!!! Loopen kördes bara
			// för det första objektet
				obj.callBack(this[obj.prop], transistionTime);
				// this.lastBroadCastedValues = this[obj.prop];
				// lastBroadCastedValues = this.lastBroadCastedValues;
			// }
			
		});
	}

	getVariable(key){
		return this[key];
	}

	get watchedVariableNames(){
		if(typeof this._params.value == "object" && this._params.value.type == "watcher"){
			return Object.entries(this._params.value._variables).map(([key]) => key);
		} else {
			return [];
		}
	}

	get unMappedValue(){
		return this._mapper.unMappedValue;
	}

	getWAXMLparameters(){
		// this is not really used anymore
		// Becaues 'value' is the only parameter. The var element is rather the 
		// parameter itself in the Sonification Toolkits perspective (where it's currently used)
		// let obj = WebAudioUtils.paramNameToRange("var");
		let obj = {};
		obj.name = "value";
		obj.label = this.name;
		obj.target = this;
		obj.path = e => this.path;

		obj.min = this.minIn;
		obj.max = this.maxIn;
		obj.default = this.default || this.value;
		obj.conv = 1;
		
		return [obj];
	}

	update(){
		this.doCallBacks(0.001);
	}

	
    getParameter(paramName){
		let val;
  
		if(typeof this._params[paramName] === "undefined"){
			
			if(this._parentAudioObj){
				return this._parentAudioObj.getParameter(paramName);
			} else {
  
				// return default values
				switch(paramName){
				  case "transitionTime":
					val = 0.001;
				  break;
  
				  case "frameRate":
					val = 30;
				  break;
  
				  case "fallOffRatio":
					val = 0.5;
				  break;

				  case "smoothDerivative":
					val = 5;
				  break;
  
				  case "loopEnd":
					// avoid setting loopEnd to 0
					// ideally (maybe) setting it to duration
					// of audio buffer
				  break;
  
				  default:
					val = 0;
				  break;
				}
				return val;
			}
  
		} else {
			val = this._params[paramName];
  
			// adjust time
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
