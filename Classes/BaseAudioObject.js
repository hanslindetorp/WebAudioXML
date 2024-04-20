const Loader = require('./Loader.js');
const WebAudioUtils = require('./WebAudioUtils.js');
const VariableContainer = require('./VariableContainer.js');



class BaseAudioObject extends EventTarget {

	constructor(xmlNode, waxml, params){
		super();

		this.waxml = waxml;
		this._ctx = this.waxml._ctx;
		this._xml = xmlNode;

		xmlNode.obj = this;

		this.childIndex = [...xmlNode.parentNode.children].indexOf(xmlNode);
		this._node = new GainNode(this._ctx);

		this._params = params;

		let parentAudioObj = xmlNode.parentNode.obj;
		this._parentAudioObj = parentAudioObj;

		this.utils = WebAudioUtils;


		this.variables = new VariableContainer();

	}

	get name(){
		return this._xml.localName.toLowerCase();
	}

	get selector(){
		let id = this._xml.id;
		let classList = this._xml.classList;
		let str = this.name;
		if(id)str += `#${id}`;
		if(classList.length)str += `.${[...classList].join(".")}`;
		return str;
	}

	get params(){
		return this._params;
	}

	set params(params){
		this._params = params;
	}


    get parent(){
		return this._parentAudioObj;
	}

	set parent(audioObj){
		this._parentAudioObj = audioObj;
	}

	get children(){
		return [...this._xml.children].map(el => el.obj);
	}
	
	
	get connection(){
		return this._node;
	}

	get input(){
		return this._input || this._node;
	}
	
	set input(node){
		this._input = node;
	}

	get output(){
		return this._output || this._node;
	}

	set output(destination){
		this.output.connect(destination);
	}


	connect(destination){

		let source = this.output;
		if(source){
			if(source.connect){
				if(!destination){
					destination = this._ctx.destination;
				}
				if(!(destination instanceof Array)){
					destination = [destination];
				}
				destination.forEach(d => {
					d = d.input || d;
					source.connect(d);
				});
			}
		}
		this._destination = destination;;

	}


	disconnect(ch){
		if(!this._node || !this._node.disconnect){return}
		ch = ch || 0;
		this._node.disconnect(ch);
	}

	setParameter(paramName, value){
		this._params[paramName] = value;
	}

	getParameter(paramName){
		if(typeof this._params[paramName] === "undefined"){
			
			if(this._parentAudioObj){
				return this._parentAudioObj.getParameter(paramName);
			} else {
				return 0;
			}

		} else {
			let val = this._params[paramName];

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



	get variables(){
		return this._variables;
	}

	set variables(val){
		this._variables = val;
	}

	setVariable(key, val){
		this._variables[key] = val;
	}

 	getVariable(key){
		return this._variables[key];
	}

	querySelector(selector){
		let target = this._xml.querySelector(selector);
		if(target){
			return target.obj;
		}
		
	}

	querySelectorAll(selector){
		return [...this._xml.querySelectorAll(selector)].map(xml => xml.obj);
	}

}

module.exports = BaseAudioObject;
