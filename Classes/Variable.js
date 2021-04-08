var Watcher = require('./Watcher.js');
var Mapper = require('./Mapper.js');


class Variable {

	constructor(params){
		this._params = params;
		this._callBackList = [];
		this.waxml = params.waxml;
		//this._mapper = new Mapper(params);

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
			this.value = params.value;
		}

	}

	addCallBack(callBack){
		this._callBackList.push(callBack);
		if(typeof this.value != "undefined"){
			callBack(this.value);
		}
	}

	valueOf(){
		return this.value;
	}

	get value() {
		return this._value;
	}

	set value(val) {
		if(this._value != val){
			this._value = val;
			this.doCallBacks();
		}
	}



	get getterNsetter(){
		return {
			get: this.get,
			set: this.set
		}
	}

	doCallBacks(){
		this._callBackList.forEach(_callBack => _callBack(this.value));
	}

	getVariable(key){
		return this[key];
	}


}

module.exports = Variable;
