var PresetComponent = require('./PresetComponent.js');


class PresetController extends HTMLElement {

	constructor(attributes, waxml=window.waxml){
		super();
		this.inited = false;
		this.waxml = waxml;
		if(attributes){
			this.setAttributes(this, attributes);
		}
		this.curID = 1;
	}

	connectedCallback(){
		if(!this.inited){
			this.init({

			});
		}
		
	}


	init(){

		this.inited = true;
		this.style.display = "block";
		this.presetComponents = [];


		this.presetContainer = document.createElement("div");
		this.presetContainer.classList.add("waxml-preset-button-container");
		this.appendChild(this.presetContainer);

		this.output = document.createElement("textarea");
		this.output.classList.add("output");
		this.output.setAttribute("cols", "70");
		this.output.setAttribute("rows", "20");
		this.appendChild(this.output);

		let filter = `.${[...this.classList].join(".")}`;
		this.presets = document.querySelectorAll(`datalist.waxml-preset${filter}`)

		this.addBtn = document.createElement("button");
		this.addBtn.classList.add("add");
		this.addBtn.innerHTML = "+";
		this.presetContainer.appendChild(this.addBtn);
		this.addBtn.addEventListener("click", e => {
			let data = this.getData();
			if(data){
				this.add(data);
			} else {
				alert("Please select one or more settings in the mixer.")
			}
			
		});

		this.presets.forEach(data => {
			this.add(data);
		});

		
		return this;
	}

	add(data){
		// find numbering in id-name
		let id = parseInt(data.getAttribute("id").split("-").pop());
		if(!isNaN(id)){
			this.curID = Math.max(this.curID, id);
		}
		let presetComponent = new PresetComponent(data);
		presetComponent.addEventListener("recall", e => {
			this.output.innerHTML = e.target.toString();
		});
		presetComponent.addEventListener("sendData", e => {
			// select variables in matrix 
			let selector = `*.${[...this.classList].join(".")} waxml-variable-controller`;
			let vcs = this.parentElement.querySelectorAll(selector);
			
			// deselect all variable controllers
			vcs.forEach(vc => vc.selected = false);
			
			// select all variable controllers in preset
			e.target.variableNames.forEach(vn => {
				[...vcs].filter(vc => {
					if(vc.watchedVariable == vn){
						vc.selected = true;
					}
				});
			});
		
		});

		this.presetContainer.insertBefore(presetComponent, this.addBtn);
	}

	getData(){
		let selector = `*.${[...this.classList].join(".")} waxml-variable-controller.selected`;
		let variables = this.parentElement.querySelectorAll(selector);
		if(!variables.length){
			return false;
		}

		let datalist = document.createElement("datalist");
		datalist.setAttribute("class", this.attributes.class.value);
		datalist.setAttribute("id", `preset-${this.newID}`);

		variables.forEach(variableController => {
			let option = document.createElement("option");
			option.setAttribute("key", variableController.watchedVariable);
			option.setAttribute("value", variableController.value);
			datalist.appendChild(option);
		});
		return datalist;
	}

	get newID(){
		return ++this.curID;
	}

	setAttributes(el = this, data){
		Object.entries(data).forEach(([key, value]) => {
			if(typeof value == "string" || typeof value == "number"){
				el.setAttribute(key, value);
			}
		});
	}
}

module.exports = PresetController;
