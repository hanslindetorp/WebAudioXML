var Channel = require('./Channel.js');

class DynamicMixer extends HTMLElement {

	constructor(mixerObject, waxml=window.waxml){
		super();
		this.inited = false;
		this.waxml = waxml;
		this.mixerObject = mixerObject;
	}

	connectedCallback(){
		if(!this.inited){
			this.init({
			});
		}
		
	}


	init(){

		this.inited = true;

		let table = document.createElement("table");
		this.appendChild(table);

		this.mixerObject.childObjects.forEach(subChannel => {
			let channel = new Channel(subChannel);
			this.appendChild(channel.el);
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
