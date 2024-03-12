

class SnapshotComponent extends HTMLElement {

	constructor(xmlNode, waxml=window.waxml){
		super();
		this.inited = false;
		this.timeouts = [];
		this.waxml = waxml;
		if(xmlNode){
			this.init(xmlNode);
		}
	}

	// connectedCallback(){
	// 	if(!this.inited){
	// 		this.init({

	// 		});
	// 	}
		
	// }


	init(data){
		this.data = data;
		
		let snapshotTriggerBtn = document.createElement("button");
		let nameAttribute = data.attributes.id || data.attributes.class;
		
		if(data.attributes.id){
			this.setAttribute("id", data.attributes.id.value);
		}
		if(data.attributes.class){
			this.setAttribute("class", data.attributes.class.value);
		}

		snapshotTriggerBtn.innerHTML = nameAttribute.value;
		snapshotTriggerBtn.classList.add("snapshot");
		snapshotTriggerBtn.addEventListener("click", e => this.trig());

		let snapshotDeleteBtn = document.createElement("button");
		snapshotDeleteBtn.innerHTML = "-";
		snapshotDeleteBtn.classList.add("delete");
		snapshotDeleteBtn.addEventListener("click", e => {
			if(confirm(`Do you want to delete "${nameAttribute.value}"?`)){
				this.parentElement.removeChild(this);
			}
		});

		this.appendChild(snapshotTriggerBtn);
		this.appendChild(snapshotDeleteBtn);
		return this;
	}

	trig(data = {}){
		let fn = () => {
			this.dispatchEvent(new CustomEvent("recall"));
			this.sendData();
		}
		if(data.time){
			let delay = data.time - this.waxml._ctx.currentTime;
			this.timeouts.push(setTimeout(fn, delay*1000));
		} else {
			fn();
		}
		
	}

	sendData(){
		[...this.data.children].forEach(option => {
			let variable = option.attributes.variable.value;
			let value = parseFloat(option.attributes.value.value);
			this.waxml.setVariable(variable, value);
		});
		this.dispatchEvent(new CustomEvent("sendData"));
	}


	clear(){
		while(this.timeouts.length){
			clearTimeout(this.timeouts.pop());
		}
	}

	get variableNames(){
		let variableNames = [];
		[...this.data.children].forEach(option => {
			variableNames.push(option.attributes.variable.value);
		});
		return variableNames;
	}

	toString(){
		let data = this.data;
		let idStr = data.attributes.id ? ` id="${data.attributes.id.value}"` : ``;
		let nameStr = data.attributes.name ? ` name="${data.attributes.name.value}"` : ``;
		let classStr = data.attributes.class ? ` class="${data.attributes.class.value}"` : ``;
		
		let str = "";
		str += `- - - - - - - - - - - - - -\n`;
		str += `WAXML:\n`;
		str += `- - - - - - - - - - - - - -\n\n`;
		str += `<Snapshot${classStr}>\n`;

		let varArr = [];
		[...data.children].forEach(command => {
			str += `  <Command type="set" variable="${command.attributes.variable.value}" value="${command.attributes.value.value}" />\n`;
			varArr.push(`${command.attributes.variable.value}=${command.attributes.value.value}`);
		});
		str += `</Snapshot>\n\n`;
		str += `- - - - - - - - - - - - - -\n`;
		str += `HTML:\n`;
		str += `- - - - - - - - - - - - - -\n\n`;

		let nameAttribute = data.attributes.id || data.attributes.class;
		str += `<a data-waxml-click-trig="${nameAttribute.value}">${nameAttribute.value}</a>`;
		
		return str;
	}

	setAttributes(el = this, data){
		Object.entries(data).forEach(([key, value]) => {
			if(typeof value == "string" || typeof value == "number"){
				el.setAttribute(key, value);
			}
		});
	}
}

module.exports = SnapshotComponent;
