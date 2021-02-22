var WebAudioUtils = require('./WebAudioUtils.js');
var Variable = require('./Variable.js');


class Watcher {

	constructor(xmlNode, arr, params){

		// allow for different ways of specifying target, event, variable and delay
		// possible structures:
		// variable
		// targetStr, variable
		// targetStr, event, variable
		let target, variable, targetStr, event;
		if(arr.length){
			variable = arr.pop().trim();
		} else {
			console.log("WebAudioXML error: 'follow' attribute requires at least one parameter.")
			return false;
		}

		if(arr.length){
			// variable is a property of WebAudioXML.
			// Check if this is really used!
			targetStr = arr.shift().trim();
			target = xmlNode.closest(targetStr);
			if(target && target.obj){target = target.obj.variables}
		}

		if(!target) {

			let curNode = xmlNode;
			let rootNode = curNode.getRootNode();
			while(!target && curNode != rootNode){
				if(curNode.obj && curNode.obj.getVariable(variable) instanceof Variable){
					// if target is the name of a variable that is specified
					// for a parent object (at any distans from xmlNode)
					// as a dynamic variable object using the "var" element
					target = curNode.obj;
				}
				curNode = curNode.parentNode;
			}

			curNode = xmlNode;
			while(!target && curNode.parentNode != rootNode){
				try {
					target = curNode.querySelector(variable);
				} catch(e){
					console.log(e);
				}
				if(target && target.obj){
						// if target is any element near xmlNode
						// (at any distanse from xmlNode, but the closest will be selected)
						target = target.obj;
						variable = "value";
				}
				curNode = curNode.parentNode;
			}

		}

		if(!target) { 
			// connect to an HTML element
			target = document.querySelector(targetStr);
		}

		if(!target){
			try{
				target = eval(targetStr);
			}
			catch(error){
				console.error("WebAudioXML error: No valid target specified - " + targetStr);
			}
		}


		if(arr.length){
			// target object is a DOM element
			// event to use with addEventListener
			// variable expected to be a property of the event object in the callback of addEventListener
			event = arr.shift().trim();
		} else {
			// target object is top XML node of this document
			// variable is a property of the audioObject connected to that XML node
			// or a DOM object with a variable to watch
			// xmlNode.getRootNode().querySelector("audio");
			target = target || params.waxml.variables;
			this.addVariableWatcher(target, variable, params);
			return;
		}


		if(target){
			if(target.addEventListener){

				// make sure variable starts with e.
				if(variable.substr(0, 2) != "e."){
					if(variable.substr(0, 6) == "event."){
						variable = variable.substr(6);
					}
					variable = "e." + variable;
				}

				target.addEventListener(event, e => {
					let val = eval(variable);
					if(typeof val !== "undefined"){
						params.callBack(val);
					} else {
						console.error("Web Audio XML Parameter follow error. Target object event does not contain variable.", variable);
					}
				});

			} else {
				console.error("Web Audio XML Parameter follow error. Target object does not support addEventListener.", targetStr);
			}
		} else {
			console.error("Web Audio XML Parameter follow error. Target not found: ", targetStr);
		}

	}

	addVariableWatcher(obj, variable, params){

		let oNv = this.varablePathToObject(obj, variable);
		if(!oNv){return}
		obj = oNv.object || obj;

		// allow for simple variable names or variables inside an Object
		// i.e. "relX" or "client[0].touch[0].relX"
		variable = oNv.variable || variable;

		// prepare the container to add a dynamic variable
		// Note: This should be a part of the Base Class!!
		obj._props = obj._props || {};

		// add variable if this is the first call to that variable name
		let variableObj = obj._props[variable];
		if(!variableObj) {
			variableObj = obj.getVariable ? obj.getVariable(variable) : obj[variable];
		}

		if(!(variableObj instanceof Variable)){
			variableObj = params.variableObj || new Variable(params);


			Object.defineProperty(obj, variable, {
				get() {
					return variableObj.value;
					return this._props[variable].value;
				},
				set(val) {
					variableObj.value = val;
					return;
					if(this._props[variable].value != val){
						this._props[variable].value = val;
						this._props[variable].callBackList.forEach(callBack => callBack(val));
					}
				}
			});
		}
		obj._props[variable] = variableObj;

		if(params.callBack){
			let callBack = params.callBack;
			if(params.delay){
				// wrap callBack in a timeout if delay is specified
				var origCallBack = callBack;
				callBack = val => {
					return setTimeout(e => {
						origCallBack(val);
					}, params.delay);
				};
			}
			variableObj.addCallBack(callBack);
		}

		//obj._props[variable].callBackList.push(callBack);

	}


	varablePathToObject(obj = window, variable = ""){

		let varArray = variable.split(".");
		let v = varArray.pop();
		let varPath = varArray.length ? "." + varArray.join(".") : "";
		let o;

		try {
		    o = eval("obj" + varPath);
		} catch (e) {
		    //console.warn(e.message);
				return;
		}


		/*
		varArray.forEach(v => {
			let o = obj[v];
			if(typeof o == "object"){
				obj = o;
			}
		});
		*/
		return {object: o, variable: v};
	}

}

module.exports = Watcher;
