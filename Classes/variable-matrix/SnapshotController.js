var SnapshotComponent = require('./SnapshotComponent.js');


class SnapshotController extends HTMLElement {

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

		let variables = this.parentElement.querySelectorAll(`waxml-variable-controller`);
		if(!variables.length){
			this.classList.add("hide");
		}

		this.inited = true;
		this.style.display = "block";
		this.snapshotComponents = [];


		this.snapshotContainer = document.createElement("div");
		this.snapshotContainer.classList.add("waxml-snapshot-button-container");


		let selector = `waxml-variable-controller`;
		this.appendChild(this.snapshotContainer);
		

		this.output = document.createElement("textarea");
		this.output.classList.add("output");
		this.output.setAttribute("cols", "70");
		this.output.setAttribute("rows", "20");
		this.appendChild(this.output);

		let filter = `.${[...this.classList].join(".")}`;

		// I skip the filter function for the moment 2023-09-13
		// this.snapshots = this.waxml.querySelectorAll(`Snapshot${filter}`)
		this.snapshots = this.waxml.querySelectorAll(`Snapshot`)

		this.addBtn = document.createElement("button");
		this.addBtn.classList.add("add");
		this.addBtn.innerHTML = "+";
		this.snapshotContainer.appendChild(this.addBtn);
		this.addBtn.addEventListener("click", e => {
			let data = this.getData();
			if(data){
				let snapshotComponent = new SnapshotComponent(data);
				this.add(snapshotComponent);
			} else {
				alert("Please select one or more settings in the mixer.")
			}
			
		});

		this.snapshots.forEach(data => {
			this.add(data);
		});

		
		return this;
	}

	add(snapshotComponent){
		// find numbering in id-name
		let id = parseInt(snapshotComponent.getAttribute("class").split("-").pop());
		
		if(!isNaN(id)){
			this.curID = Math.max(this.curID, id);
		}
		// let snapshotComponent = new SnapshotComponent(data);
		snapshotComponent.addEventListener("recall", e => {
			this.output.innerHTML = e.target.toString();
		});
		snapshotComponent.addEventListener("sendData", e => {
			// select variables in matrix 
			// let selector = `*.${[...this.classList].join(".")} waxml-variable-controller`;
			// let vcs = this.parentElement.querySelectorAll(selector);

			// select all variable controllers
			let selector = `waxml-variable-controller`;
			let vcs = this.parentElement.querySelectorAll(selector);
			
			// deselect all variable controllers
			vcs.forEach(vc => vc.selected = false);
			
			// select all variable controllers in snapshot
			e.target.variableNames.forEach(vn => {
				[...vcs].filter(vc => {
					if(vc.watchedVariable == vn){
						vc.selected = true;
					}
				});
			});
		
		});

		this.snapshotContainer.insertBefore(snapshotComponent, this.addBtn);
	}

	getData(){
		// let selector = `*.${[...this.classList].join(".")} waxml-variable-controller.selected`;
		let selector = `waxml-variable-controller.selected`;
		let variables = this.parentElement.querySelectorAll(selector);
		if(!variables.length){
			return false;
		}

		let snapshot = document.createElement("Snapshot");
		// snapshot.setAttribute("class", this.attributes.class.value);
		// snapshot.setAttribute("id", `snapshot-${this.newID}`);
		snapshot.setAttribute("class", `snapshot-${this.newID}`);

		variables.forEach(variableController => {
			let command = document.createElement("Command");
			command.setAttribute("type", "set");
			command.setAttribute("variable", variableController.watchedVariable);
			command.setAttribute("value", variableController.value);
			snapshot.appendChild(command);
		});
		return snapshot;
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

module.exports = SnapshotController;
