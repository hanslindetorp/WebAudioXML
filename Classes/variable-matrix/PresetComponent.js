

class PresetComponent extends HTMLElement {

	constructor(data, waxml=window.waxml){
		super();
		this.inited = false;
		this.waxml = waxml;
		if(data){
			this.init(data);
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
		
		let presetTriggerBtn = document.createElement("button");
		let nameAttribute = data.attributes.name || data.attributes.id;
		
		if(data.attributes.id){
			this.setAttribute("id", data.attributes.id.value);
		}
		if(data.attributes.class){
			this.setAttribute("class", data.attributes.class.value);
		}

		presetTriggerBtn.innerHTML = nameAttribute.value;
		presetTriggerBtn.classList.add("preset");
		presetTriggerBtn.addEventListener("click", e => {
			this.dispatchEvent(new CustomEvent("recall"));
			this.sendData();
		});

		let presetDeleteBtn = document.createElement("button");
		presetDeleteBtn.innerHTML = "-";
		presetDeleteBtn.classList.add("delete");
		presetDeleteBtn.addEventListener("click", e => {
			if(confirm(`Do you want to delete "${nameAttribute.value}"?`)){
				this.parentElement.removeChild(this);
			}
		});

		this.appendChild(presetTriggerBtn);
		this.appendChild(presetDeleteBtn);
		return this;
	}

	sendData(){
		[...this.data.children].forEach(option => {
			let key = option.attributes.key.value;
			let value = parseFloat(option.attributes.value.value);
			this.waxml.setVariable(key, value);
		});
		this.dispatchEvent(new CustomEvent("sendData"));
	}

	get variableNames(){
		let variableNames = [];
		[...this.data.children].forEach(option => {
			variableNames.push(option.attributes.key.value);
		});
		return variableNames;
	}

	toString(){
		let data = this.data;
		let idStr = data.attributes.id ? ` id="${data.attributes.id.value}"` : ``;
		let nameStr = data.attributes.name ? ` name="${data.attributes.name.value}"` : ``;
		let classStr = data.attributes.class ? ` class="${data.attributes.class.value}"` : ``;
		
		let str = "";
		str += `<datalist${idStr+nameStr+classStr}>\n`;

		let varArr = [];
		[...data.children].forEach(option => {
			str += `  <option key="${option.attributes.key.value}" value="${option.attributes.value.value}" />\n`;
			varArr.push(`${option.attributes.key.value}=${option.attributes.value.value}`);
		});
		str += `</datalist>\n\n`;

		str += `<a data-waxml-click-preset="${data.attributes.id.value}">${data.attributes.id.value}</a>`;
		
		str += `\n\n- - - - - - - - - - - - - -\n`;
		str += `OR\n`;
		str += `- - - - - - - - - - - - - -\n\n`;
		str += `<a data-waxml-click-set="${varArr.join(";")}">${data.attributes.id.value}</a>`;
		
		
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

module.exports = PresetComponent;
