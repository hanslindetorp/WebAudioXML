const Variable = require('./Variable.js');
const VariableMatrixRow = require('./VariableMatrixRow.js');
const Watcher = require('./Watcher.js');


class VariableMatrix extends HTMLElement {

	constructor(variableContainer=[]){
		super();
		this.inited = false;
		this.variableContainer = variableContainer;
	}

	connectedCallback(){
		if(!this.inited){
			// collect data from attributes first (if added from HTML)
			this.init();
		}
	}

	init(variableContainer=this.variableContainer){
		this.inited = true;
		this.waxml = variableContainer.waxml;
		this.variableContainer = variableContainer;
		this.rows = [];

		let table = document.createElement("table");
		this.appendChild(table);


		// count total variables
		this.columLabels = [];
		this.variableContainer.childObjects.forEach(row => {
			Object.entries(row.variables).forEach(([name, obj]) => {
				if(obj instanceof Variable){
					if(!this.columLabels.includes(name)){
						this.columLabels.push(name);
					}
				}
			});
		});


		let thead = document.createElement("thead");
		table.appendChild(thead);
		let tr = document.createElement("tr");
		thead.appendChild(tr);
		let th = document.createElement("th");
		th.addEventListener("click", e => {
			let index = [...tr.children].indexOf(th);
			let VCs = this.getVariables(`:nth-child(${index+1})`);
			let unselectedVC = VCs.find(vc => vc.selected == false);
			let state = unselectedVC ? true : false;
			VCs.forEach(vc => vc.selected = state);
		});
		tr.appendChild(th);

		this.columLabels.forEach(colName => {
			th = document.createElement("th");
			th.innerHTML = colName;
			tr.appendChild(th);
		});
		
		
		this.variableContainer.childObjects.forEach(row => {
			let variables = Array(this.columLabels.length).fill(0);

			Object.entries(row.variables).forEach(([name, obj]) => {
				if(obj instanceof Variable){

					let colIndex = this.columLabels.indexOf(name);
					let watchedVariable = obj.watchedVariableNames[0]; // it assumes only one source variable
					if(watchedVariable){
						variables[colIndex] = {
							label: name,
							targetVariable: obj,
							watchedVariable: watchedVariable,
							min: obj.minIn,
							max: obj.maxIn,
							value: obj.default
						}
					}
				}
			});
			table.appendChild(new VariableMatrixRow(row.id, variables, this.waxml).element);
		});

		return this;
	}

	getVariables(selector = ""){
		return this.querySelectorAll(`waxml-variable-controller${selector}`);
	}

	get selectedVariables(){
		return this.getVariables(".selected");
	}
}
module.exports = VariableMatrix;
