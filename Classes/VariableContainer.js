


class VariableContainer {

	constructor(){
		this._props = {};
	}

	setVariable(key, val){
		this[key] = val;
	}
	getVariable(key){
		return this[key];
	}

}


module.exports = VariableContainer;
