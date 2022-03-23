


class VariableContainer {

	constructor(){
		this._props = {};
		this._listeners = {}
	}

	setVariable(key, val){
		this[key] = val;
		if(this._listeners[key]){
			this._listeners[key].array.forEach(element => {
				element.update(key, val);
			});
		}
	}
	getVariable(key){
		return this[key];
	}

	getVariableObject(key){
		return this._props[key];
	}

	addListener(key, listener){
		if(!this._listeners[key]) this._listeners[key] = [];
		this._listeners[key].push(listener);
	}
}


module.exports = VariableContainer;
