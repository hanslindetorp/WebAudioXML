// var Watcher = require('./Watcher.js');
var Mapper = require('./Mapper.js');
var WebAudioUtils = require('./WebAudioUtils.js');


class Variable {

	constructor(params){
		this._params = params;
		this._callBackList = [];
		this.waxml = params.waxml;
		this.lastUpdate = Date.now();
		this.derivataFactor = 0;
		this.name = params.name;

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

		if(typeof params.value != "undefined"){
			this.value = params.value.valueOf();
		}

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
			this.setDerivative(val);
			this._value = val;
			this.doCallBacks(transistionTime);
		}
	}

	get value() {
		//return this._value;
		if(typeof this._value == "undefined" && this.default != "undefined"){
			this._value = this.default;
		}
		return this._mapper.getValue(this._value);
		//
		// if(typeof this._value == "undefined"){
		// 	return this._value;
		// } else {
		// 	//if(this.name)console.log(this.name, this._value);
		// 	return this._mapper.getValue(this._value);
		// }
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


	get derivative(){
		return this._derivative || 0;
	}

	get acceleration(){
		return this.derivative;
	}

	setDerivative(newVal){
		let diff = newVal - (this.value || newVal);
		let now = Date.now();
		let time = now - this.lastUpdate;
		this.lastUpdate = now;
		let newDerivative = diff / time;
		// auto scale to keep derivatives between -1 and 1
		this.derivataFactor = Math.max(Math.abs(newDerivative), this.derivataFactor);
		newDerivative /= this.derivataFactor;

		this.setDerivative2(newDerivative);
		this._derivative = newDerivative;
	}

	get derivative2(){
		return this._derivative2 || 0;
	}

	setDerivative2(newDerivative){
		this._derivative2 = newDerivative - this._derivative;
	}


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

}

module.exports = Variable;
