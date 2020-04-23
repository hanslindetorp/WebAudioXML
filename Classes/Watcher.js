var WebAudioUtils = require('./WebAudioUtils.js');


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
			// target object is an XML node closest to the calling object
			// variable is a property of WebAudioXML.
			targetStr = arr.shift().trim();
		} else {
			// target object is top XML node of this document
			// variable is a property of the audioObject connected to that XML node
			//xmlNode.getRootNode().querySelector("audio");
			this.addVariableWatcher(params.waxml.variables, variable, params);

			//params.waxml.addVariableWatcher(variable, callBack);
			return;
		}

		if(arr.length){
			// target object is a DOM element
			// event to use with addEventListener
			// variable expected to be a property of the event object in the callback of addEventListener
			event = arr.shift().trim();
		}

		target = xmlNode.closest(targetStr) || document.querySelector(targetStr);
		if(!target){
			try{
				target = eval(targetStr);
			}
			catch(error){
				console.error("WebAudioXML error: No valid target specified - " + targetStr);
			}

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
			console.error("Web Audio XML Parameter follow error. Target object not found: ", targetStr);
		}

	}

	addVariableWatcher(obj, variable, params){

		let oNv = this.varablePathToObject(obj, variable);
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
						//if(variable == "relY"){console.log(val)}
					}
				}
			});
		}

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
		obj._props[variable].callBackList.push(callBack);

	}


	varablePathToObject(obj = window, variable = ""){



		let varArray = variable.split(".");
		let v = varArray.pop();
		let varPath = varArray.length ? "." + varArray.join(".") : "";
		let o = eval("obj" + varPath);
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
