// var Watcher = require('./Watcher.js');
var Mapper = require('./Mapper.js');


class Variable {

	constructor(params){
		this._params = params;
		this._callBackList = [];
		this.waxml = params.waxml;
		this.lastUpdate = Date.now();
		this.derivataFactor = 0;
		this.name = params.name;

		this._mapper = new Mapper(params);

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

	get value() {
		//return this._value;
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
		if(this._value != val){
			this.setDerivative(val);
			this._value = val;
			this.doCallBacks();
		}
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

	doCallBacks(){
		this._callBackList.forEach(obj => obj.callBack(this[obj.prop]));
	}

	getVariable(key){
		return this[key];
	}


}

module.exports = Variable;
