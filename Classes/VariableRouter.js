


class VariableRouter {

	constructor(_parent){
		this.parent = _parent;

	}


	addVariableWatcher(variable, callBack){

		let oNv = this.varablePathToObject(variable);
		obj = oNv.object || obj;

		// allow for simple variable names or variables inside an Object
		variable = oNv.variable || variable;

		obj._props = obj._props || {};

		if(!obj._props[variable]){

			obj._props[variable] = {};
			obj._props[variable].callBackList = [];

			Object.defineProperty(obj, variable, {
				get() {
					return this._props[variable].value;
				},
				set(val) {
					if(this._props[variable].value != val){
						this._props[variable].value = val;
						this._props[variable].callBackList.forEach(callBack => callBack(val));
						//output.log(val);
					}
				}
			});
		}


		varablePathToObject(variable = ""){

			let obj = this.parent;

			let varArray = variable.split(".");
			let v = varArray.pop();
			let varPath = varArray.length ? "." + varArray.join(".") : "";
			let o = eval("obj" + varPath);

			return {object: o, variable: v};
		}

}


module.exports = VariableRouter;
