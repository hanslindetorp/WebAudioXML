var WebAudioUtils = require('./WebAudioUtils.js');
var Variable = require('./Variable.js');


class Watcher {

	constructor(xmlNode, arr, params){

		// allow for different ways of specifying target, event, variable and delay
		// possible structures:
		// variable
		// variable.property
		// XMLelement
		// XMLelement, variable
		// XMLelement, variable.property
		// HTMLelement
		// HTMLelement, variable
		// HTMLelement, event, variable

		this.type = "watcher";

		
		this._variables = this.strToVariables(arr, xmlNode, Variable, params);
		if(Object.keys(this._variables).length > 0){
			this.callBack = params.callBack;
			arr = WebAudioUtils.replaceVectorDistMethod(arr);
			this.value = WebAudioUtils.replaceVariableNames(arr);
			this.update(this.value, 0.001);
			return;
		}


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

			target = WebAudioUtils.getVariableContainer(variable, xmlNode, Variable);
			// let curNode = xmlNode;
			// let rootNode = curNode.getRootNode();
			// while(!target && curNode != rootNode){
			// 	if(curNode.obj && curNode.obj.getVariable(variable) instanceof Variable){
			// 		// if target is the name of a variable that is specified
			// 		// for a parent object (at any distans from xmlNode)
			// 		// as a dynamic variable object using the "var" element
			// 		target = curNode.obj;
			// 	}
			// 	curNode = curNode.parentNode;
			// }

			let curNode = xmlNode;
			let rootNode = curNode.getRootNode();
			while(!target && curNode.parentNode != rootNode){
				try {
					target = curNode.querySelector(variable);
				} catch(e){
					//console.log(e);
				}
				if(target && target.obj){
						// if target is any element near xmlNode
						// (at any distanse from xmlNode, but the closest will be selected)
						// Is this really a good idea?? There ought to be a strict hierarchical
						// rule for variable referencing. Or?
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
					if(variable.substr(0, 7) != "target."){
						variable = "target." + variable;
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

	addVariableWatcher(obj, variable, params = {}){

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
			variableObj = new Variable(undefined, params);
			//variableObj = params.variableObj || new Variable(undefined, params);


			Object.defineProperty(obj, variable, {
				get() {
					if(typeof variableObj.value != "undefined"){
						return variableObj.value;
					} else {
						return this._props[variable].value;
					}
					
				},
				set(val) {
					variableObj.value = val;
					// this has been moved to the Variable object
					// return;
					// if(this._props[variable].value != val){
					// 	this._props[variable].value = val;
					// 	this._props[variable].callBackList.forEach(callBack => callBack(val));
					// }
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
			variableObj.addCallBack(callBack, oNv.prop);
		}

		//obj._props[variable].callBackList.push(callBack);

	}

	variablePathToProp(str){
		let prop = str.split(".").pop();

		switch (prop) {
			case "derivative":
			case "derivative2":
			case "acceleration":
				break;
			default:
				prop = "value";
		}
		return prop;
	}

	variablePathToName(str){
		return str.split(".").shift();
	}

	varablePathToObject(obj = window, variable = ""){

		let varArray = variable.split(".");
		let prop = varArray.pop();
		let v;

		switch (prop) {
			case "derivative":
			case "derivative2":
			case "acceleration":
				v = varArray.pop();
				break;
			default:
				v = prop;
				prop = "value";
		}

		// this supports hierarchical objects in the target object
		// e.g. client[0].touch[0] It's probably not a good idea
		// I'd rather prefer a flat naming structure where the dot
		// syntax is used to separate the variable from "derivative"
		// or similar.
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
		return {object: o, variable: v, prop: prop};
	}


	// consider if this is the correct place for this conversion
	// of stored _variables
	// It's ment as a short for e.g. frequency="relX*100" like formulas
	// in a spread sheet
	getVariable(varName){

		// To support derivate, I think this function needs to return the object
		// rather than the value
		return this._variables[varName];
		// return this._variables[varName].valueOf();

	}

	getVectorDist(v1, v2){

		// fill with zeros to match length (and make the vectors a minimum two dimentional)
		v1 = [...v1];
		v2 = [...v2];
		let l = Math.max(v1.length, v2.length, 2);
		while(v1.length < l)v1.push(0);
		while(v2.length < l)v2.push(0);

		// calculate hypothenuses
		let d2s = v1.map((el, i) => (v2[i] - el) ** 2);
		return d2s.reduce((a,b) => a + b) ** 0.5;
	}

	get variableNames(){
		return Object.entries(this._variables).map(([key]) => key);
	}

	replaceVariableNames(str) {
		// regExp
		// ${x} || var(x) -> this.getVariable(x)
		if(typeof str != "string"){return 0};

		let rxp = WebAudioUtils.rxp;
		return str.replaceAll(rxp, (a, b, c) => b ? `this.getVariable('${b}')` : `this.getVariable('${c}')`);

	}

	// Den här funktionen borde delas. Den gör för mycket. Den inte bara
	// regExpar strängen, den letar också efter Variable-object
	// och skapar nya med relationer till dem.
	strToVariables(str = "", xmlNode, variableType, params){
		// regExp
		if(typeof str != "string"){return 0};
		// ${x} || var(x) -> this.getVariable(x)
		let rxp = WebAudioUtils.rxp;
		let variables = {};

		[...str.matchAll(rxp)].forEach(match => {
			let arr = (match[1] || match[2] || match[3]).split(".");
			let varName = arr[0];
			let prop = arr[1] || "value";
			let parentObj = WebAudioUtils.getVariableContainer(varName, xmlNode, variableType);
			// let prop = this.variablePathToProp(str);

			let props;
			if(parentObj){
				props = parentObj.variables;
			} else {
				props = params.waxml.variables._props;
				this.addVariableWatcher(params.waxml.variables, varName);
			}
			let varObj = props[varName];
			varObj.addCallBack((v,t) => this.update(v,t), prop);
			variables[varName] = varObj;

		});

		return variables;
	}

	update(val, time){

		if(this.callBack){
			val = this.valueOf(val);
			if(typeof val !== "undefined")this.callBack(val, time);
		}

	}

	valueOf(val){
		if(typeof val == "number" && false){
			// det här verkar knasigt. Det är väl bara watchern som kan räkna 
			// ut sitt värde som ska retureras.
		} else {

			if(typeof this.value == "string"){
				let values = [];
				try {
	
					let me = this; // this is undefined inside forEach:eval

					
					if(this.value.includes(",") && !this.value.includes("[")){
						// support comma separated values
						this.value.split(",").forEach(v => {
							// if(v.includes("getVariable")){
							// 	// add the default property "value"
							// 	// if not specified (like "derivative")
							
							// 	if(v.substr(-1) == ")"){
							// 		v += ".value";
							// 	}
							// }
							let v1 = eval(v);
							v1 = (Number.isNaN(v1) ? val : v1) || 0;
							values.push(v1);
						});
					} else {
						// multiple arrays like dist([$x1,$y1], [$x2,$y2])

						let v1 = eval(this.value);
						v1 = Number.isNaN(v1) ? 0 : v1;
						values.push(v1);
					}
					
	
				} catch {
	
				}
				val = values.length == 1 ? values.pop() : values;
			}
			
		}
		
		// single value or array

		// Fundera på denna. Farligt att returnera 0! Men om det är undefined 
		// behöver detta också stoppas från att försöka sätta parameter till 
		// undefined.
		return val; // || 0;
	}

}

module.exports = Watcher;
