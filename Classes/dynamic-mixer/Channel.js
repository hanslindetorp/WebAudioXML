

class Channel {

	constructor(channelObject, waxml=window.waxml){
		this.waxml = waxml;
		if(channelObject){
			this.init(channelObject);
		} else{
			this.inited = false;
		}
		
	}

	connectedCallback(){
		if(!this.inited){
			this.init();
		}
		
	}


	init(channelObject){

		let tr, td;
		tr = document.createElement("tr");

		td = document.createElement("td");
		let label = document.createElement("td");
		label.innerHTML = channelObject.id;
		td.appendChild(label);
		tr.appendChild(td);


		td = document.createElement("td");
		let meter = document.createElement("meter");
		td.appendChild(meter);
		tr.appendChild(td);

		this.el = tr;
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

module.exports = Channel;
