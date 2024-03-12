

class VariableController extends HTMLElement {

	constructor(){
		super();
		this.inited = false;
	}

	connectedCallback(){
		if(!this.inited){
			this.init({
				type: this.getAttribute("type") || "slider",
				label: this.getAttribute("name"),
				targetVariable: this.getAttribute("targetVariable"),
				min: parseFloat(this.getAttribute("min") || 0),
				max: parseFloat(this.getAttribute("max") || 1)
			});
		}

		this.parentElement.addEventListener("click", e => {
			this.selected = !this.selected;
		});
		
	}


	init(data={}, waxml=window.waxml){

		this.inited = true;
		this.type = data.type ||"slider";

		data.step = data.steps ||0.01;
		let range = data.max - data.min;
		this.decimals = Math.ceil(Math.max(0, 2 - Math.log(range || 1)/Math.log(10)));

		this.waxml = waxml;
		this.targetVariable = data.targetVariable;
		this.watchedVariable = data.watchedVariable;
		let interactionElement;
		let textElement;
		switch(this.type){
			case "knob":
			data.type = "range";
			break;

			default:
			data.type = "range";
			interactionElement = document.createElement("input");
			break;
		}

		this.setAttributes(this, {
			watchedVariable: data.watchedVariable
		});
		data["data-default"] = data.value;
		this.setAttributes(interactionElement, data);
		// interactionElement.style.position = "absolute";
		// interactionElement.style.width = "100%";
		
		interactionElement.addEventListener("input", e => {
			let val = parseFloat(e.target.value);
			this.targetVariable.value = val;
			this.textElement.value = val.toFixed(this.decimals);
		});
		interactionElement.addEventListener("click", e => {
			e.stopPropagation();
		});
		interactionElement.addEventListener("dblclick", e => {
			e.stopPropagation();
			let val = parseFloat(e.target.dataset.default);
			this.value = val;
			this.targetVariable.value = val;
			this.textElement.value = val.toFixed(this.decimals);
		});

		let meter = document.createElement("meter");
		this.setAttributes(meter, data);
		// meter.style.position = "absolute";
		// meter.style.width = "100%";

		textElement = document.createElement("input");
		textElement.setAttribute("type", "text");
		textElement.setAttribute("size", "4");
		textElement.value = data.value;
		textElement.addEventListener("click", e => {
			e.stopPropagation();
		});

		this.interactionElement = interactionElement;
		this.textElement = textElement;

		this.appendChild(interactionElement);
		// this.appendChild(meter);
		this.appendChild(textElement);

		this.selected = false;
		
		return this;
	}

	set selected(state){
		this._selected = state;
		if(state){
			this.classList.add("selected");
			if(this.parentElement)this.parentElement.classList.add("selected");
		} else {
			this.classList.remove("selected");
			if(this.parentElement)this.parentElement.classList.remove("selected");
		}
	}
	get selected(){
		return this._selected;
	}

	get value(){
		return this.interactionElement.value;
	}

	set value(targetValue){

		let time = this.targetVariable.getParameter("transitionTime") * 1000;
		let steps = Math.ceil(Math.min(time / 10, 100));
		steps = Math.max(1, steps);
		let curVal = parseFloat(this.interactionElement.value);
		let diff = targetValue - curVal;
		let step = 0;
		let fn = () => {
			let val = curVal + diff * (++step / steps);
			this.textElement.value = val.toFixed(this.decimals);
			this.interactionElement.value = val;
			if(step < steps){
				setTimeout(fn, time / steps);
			}
		}
		fn();
	}



	setAttributes(el = this, data){
		Object.entries(data).forEach(([key, value]) => {
			if(typeof value == "string" || typeof value == "number"){
				el.setAttribute(key, value);
			}
		});
	}
}

module.exports = VariableController;
