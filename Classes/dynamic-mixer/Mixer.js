var Channel = require('./Channel.js');
var VariableMatrixRow = require('./../VariableMatrixRow.js');

class DynamicMixer extends HTMLElement {

	constructor(mixerObject, waxml=window.waxml){
		super();
		this.inited = false;
		this.waxml = waxml;
		this.mixerObject = mixerObject;
		if(mixerObject){
			this.init(mixerObject);
		}
	}

	connectedCallback(){
		if(!this.inited){
			// get target WAXML dynamic mixer by target
			let id = this.getAttribute("target");
			this.mixerObject = this.waxml.querySelector(id);
			this.init(this.mixerObject);
		}
	}


	init(){

		let table, thead, tr, th, td, name, variables, watchedVariable;
		this.inited = true;
		this.channelCount = this.mixerObject.childObjects.length;

		
		table = document.createElement("table");this.appendChild(table);
		thead = document.createElement("thead");
		tr = document.createElement("tr");

		th = document.createElement("th");
		th.innerHTML = "&nbsp;";
		tr.appendChild(th);

		th = document.createElement("th");
		th.innerHTML = "Transition Time";
		tr.appendChild(th);

		th = document.createElement("th");
		th.innerHTML = "Blend";
		tr.appendChild(th);

		th = document.createElement("th");
		th.innerHTML = "Mix";
		tr.appendChild(th);


		thead.appendChild(tr);
		table.appendChild(thead);
		
		// settings for component
		variables = [];
		
		let attributeData = [];
		attributeData.push({name: "transitionTime", max: 4000, value: 1000});
		attributeData.push({name: "crossfaderange", max: 1, value: 0});
		attributeData.push({name: "selectindex", max: this.channelCount-1, value: 0});

		this.variables = {};

		attributeData.forEach(attribute => {
			let parameter = this.mixerObject.parameters[attribute.name];
			name = parameter.variableNames[0];
			watchedVariable = parameter._variables[name];
			this.variables[attribute.name] = name;

			variables.push({
				label: name,
				targetVariable: watchedVariable,
				watchedVariable: name,
				min: 0,
				max: attribute.max,
				value: attribute.value
			});
		});

		table.appendChild(new VariableMatrixRow("Settings", variables, this.waxml).element);


		table = document.createElement("table");
		this.appendChild(table);
		thead = document.createElement("thead");
		tr = document.createElement("tr");

		th = document.createElement("th");
		th.innerHTML = this.mixerObject.id;
		tr.appendChild(th);

		th = document.createElement("th");
		th.innerHTML = "Level";
		tr.appendChild(th);

		th = document.createElement("th");
		th.innerHTML = "Trigger";
		tr.appendChild(th);


		thead.appendChild(tr);
		table.appendChild(thead);


		this.mixerObject.childObjects.forEach((subChannel, i) => {
			let channel = new Channel(i, subChannel);
			table.appendChild(channel.el);

			channel.addEventListener("change", e => {
				// let value = e.detail.index / (this.channelCount - 1)
				// this.waxml.setVariable(this.variables.mix, value);
				this.waxml.setVariable(this.variables.selectindex, e.detail.index);
			});
		});
		
		return this;
	}

	setAttributes(el = this, data){
		Object.entries(data).forEach(([key, value]) => {
			if(typeof value == "string" || typeof value == "number"){
				el.setAttribute(key, value);
			}
		});
	}
}

module.exports = DynamicMixer;
