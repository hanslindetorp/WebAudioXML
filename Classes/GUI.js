
var Mapper = require('./Mapper.js');
var WebAudioUtils = require('./WebAudioUtils.js');


class GUI {

	constructor(xmlNode, targetElement){
		let el = this.parseXML(xmlNode, targetElement);
		el.classList.add("WebAudioXML");
	}


	parseXML(xmlNode, targetElement){

		let nodeName = xmlNode.nodeName.toLowerCase();


		switch(nodeName){
			case "link":
			case "style":
			case "parsererror":
			return;
			break;
		}


		let node = xmlNode.audioObject._node;

		let params = WebAudioUtils.getParameters(node);

		let el;

		if(params.length){

			el = document.createElement("div");

			el.className = nodeName;
			if(nodeName.substr(-4) == "node"){
				el.classList.add("node");
			}
			targetElement.appendChild(el);
			let title = document.createElement("header");
			title.innerHTML = nodeName;
			el.appendChild(title);

			params.forEach(param => this.addElement(node, el, param));
		} else {
			// attach child elements to the parent if this was not a node
			el = targetElement;
		}

		Array.from(xmlNode.children).forEach(childNode => this.parseXML(childNode, el));
		return el;
	}

	addElement(node, targetElement, param){

		let labelEl = document.createElement("label");
		let header = document.createElement("header");
		header.innerHTML = param.label;

		let el = document.createElement(param.nodeName);
		let output = document.createElement("span");
		output.className = "output";

		//Object.keys(param.attributes).forEach(key => el.setAttribute(key, param.attributes[key]));


		//el._attributes = param.attributes;

		labelEl.appendChild(header);
		labelEl.appendChild(el);
		labelEl.appendChild(output);
		targetElement.appendChild(labelEl);

		el.addEventListener("input", e => {
			let val = node.mapper.getValue(e.target.value);
			output.innerHTML = val;


			param.audioParam.setTargetAtTime(val, 0, 0.001);
		});
	}
}




module.exports = GUI;
