
var Mapper = require('./Mapper.js');


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
		
		let params = this.getParameters(node);
		
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

			params.forEach(param => this.addElement(param, el));
		} else {
			// attach child elements to the parent if this was not a node
			el = targetElement;
		}
				
		Array.from(xmlNode.children).forEach(childNode => this.parseXML(childNode, el));
		return el;
	}
	
	addElement(param, targetElement){
		
		let labelEl = document.createElement("label");
		let header = document.createElement("header");
		header.innerHTML = param.label;
		
		let el = document.createElement(param.nodeName);
		let output = document.createElement("span");
		output.className = "output";
		
		Object.keys(param.attributes).forEach(key => el.setAttribute(key, param.attributes[key]));
			
		
		el._attributes = param.attributes;
		
		labelEl.appendChild(header);
		labelEl.appendChild(el);
		labelEl.appendChild(output);
		targetElement.appendChild(labelEl);

		el.addEventListener("input", e => {
			let val = Mapper.getValue(e.target.value, el._attributes);
			output.innerHTML = val;
			
			
			param.audioParam.setTargetAtTime(val, 0, 0.001);
		});		
	}
	
	getParameters(node){
		
		let params = [];
		

		Object.keys(node.__proto__).forEach(key => {
			
			let param = node[key];		
			if(param instanceof AudioParam){
				
				let obj = {};
				obj.audioParam = param;
				obj.label = key;
				let attr = {};
				obj.attributes = attr;
				params.push(obj);
				
				obj.nodeName = "input";
				attr.type = "range";
				attr.value = param.value;
					
				switch(key){
					
					
					case "frequency":
					attr.min = 0;
					attr.max = 22050;
					attr.conv = "Math.pow(10, x*3)/1000";
					break;
					
					case "detune":
				  	attr.min = -4800;
				  	attr.max = 4800;
				  	attr.conv = 1;
				  	break;
					
					case "q":
				  	attr.min = 0;
				  	attr.max = 100;
				  	attr.conv = 1;
				  	break;
					
					default:
				  	attr.min = 0;
				  	attr.max = 1;
				  	attr.conv = "x";
				  	break;
					
				}
				attr.step = (attr.max - attr.min) / 100;
				
			} else if(param instanceof String){
				console.log(key, node[key]);
			}
			
		});	
		
		return params;
		
		
	}
	
	
	    
}




module.exports = GUI;
