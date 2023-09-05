const VariableController = require('./VariableController.js');


class VariableMatrixRow{

	constructor(id, variables, waxml){
		this.variables = variables;
		this.waxml = waxml;
		this.cols = [];
		let tr = document.createElement("tr");
		this._element = tr;

		let td = document.createElement("td");
		td.innerHTML = id;
		let meter = document.createElement("waxml-meter");
		meter.setAttribute("type", "loudness");
		meter.setAttribute("width", "100px");
		meter.setAttribute("height", "10px");
		meter.setAttribute("timeframe", "2s");
		meter.setAttribute("maxDecibels", "0");
		meter.setAttribute("minDecibels", "-40");

		meter.setAttribute("colors", "green, yellow, red");
		meter.setAttribute("segments", "60,20,20");
		
		meter.setAttribute("input", `#${id}`);
		
		td.appendChild(meter);
		// meter.init(this.waxml._ctx);

		tr.appendChild(td);
		td.addEventListener("click", e => {
			let unselected = this.variables.find(variable => variable ? variable.controller.selected == false : false);
			let state = unselected ? true : false;
			this.variables.forEach(variable => {
				if(variable.controller){
					variable.controller.selected = state;
				}
				
			});
		});

		variables.forEach((variable, i) => {
			td = document.createElement("td");
			
			tr.appendChild(td);
			if(variable){
				let vc = new VariableController().init(variable, waxml);
				variable.controller = vc;
				td.appendChild(vc);
			} else {
				td.innerHTML = "&nbsp;";
			}
		});

	}

	connectedCallback(){

	}

	get element(){
		return this._element;
	}

}

module.exports = VariableMatrixRow;
