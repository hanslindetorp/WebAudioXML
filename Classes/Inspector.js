

class Inspector extends HTMLElement {

	constructor(){
		super();
		this.variables = [];
		this.inspectedValues = [];
		this.nrOfValues = 200;
	}

	connectedCallback(){

		let w = parseFloat(this.getAttribute("width")) || 400;
		let h = parseFloat(this.getAttribute("height")) || 200;
		this.style.position = `relative`;

		let mappingDisplay = document.createElement("div");
		mappingDisplay.style.width = w * 0.5;
		mappingDisplay.style.height = h * 0.5;
		mappingDisplay.style.left = `${w * 0.52}px`;
		mappingDisplay.style.position = `absolute`;
		this.appendChild(mappingDisplay);

		this.mappingCanvas = document.createElement("canvas");
		this.mappingCanvas.width = w * 0.5;
		this.mappingCanvas.height = h * 0.5;
		mappingDisplay.appendChild(this.mappingCanvas);

		this.mappingCanvasCtx = this.mappingCanvas.getContext("2d");
		this.mappingCanvasCtx.lineWidth = 2;
		this.mappingCanvasCtx.strokeStyle = "#EEE";


		// create dancing dot
		let dot = document.createElement("div");
		let dotSize = Math.min(w,h) / 35;
		dot.style.width = `${dotSize}px`;
		dot.style.height = `${dotSize}px`;
		dot.style.borderRadius = `${dotSize/2}px`;
		dot.style.backgroundColor = `white`;
		dot.style.border = `1px solid grey`;
		dot.style.position = "absolute";
		mappingDisplay.appendChild(dot)
		this.dot = dot;
		this.dotSize = dotSize;



		this.inputCanvas = document.createElement("canvas");
		this.appendChild(this.inputCanvas);
		this.inputCanvas.width = w * 0.5;
		this.inputCanvas.height = h * 0.5;
		this.inputCanvas.style.top = `${h * 0.55}px`;
		this.inputCanvas.style.left = `${w * 0.52}px`;
		this.inputCanvas.style.position = `absolute`;

		this.inputCanvasCtx = this.inputCanvas.getContext("2d");
		this.inputCanvasCtx.lineWidth = 2;
		this.inputCanvasCtx.strokeStyle = "orange";

		let label = document.createElement("span");
		label.style.position = "absolute";
		label.style.top = `${h * 0.55}px`;
		label.style.left = `${w * 0.53}px`;
		label.style.backgroundColor = "black";
		label.style.color = "orange";
		label.style.fontFamily = "sans-serif";
		this.appendChild(label);
		this.minInputHTML = label;
		
		label = document.createElement("span");
		label.style.position = "absolute";
		label.style.top = `${h * 0.55}px`;
		label.style.right = `-15px`;
		label.style.textAlign = `right`;
		label.style.backgroundColor = "black";
		label.style.color = "orange";
		label.style.fontFamily = "sans-serif";
		this.appendChild(label);
		this.maxInputHTML = label;



		this.outputCanvas = document.createElement("canvas");
		this.appendChild(this.outputCanvas);
		this.outputCanvas.width = w * 0.5;
		this.outputCanvas.height = h * 0.5;
		this.outputCanvas.style.position = `absolute`;

		this.outputCanvasCtx = this.outputCanvas.getContext("2d");
		this.outputCanvasCtx.lineWidth = 2;
		this.outputCanvasCtx.strokeStyle = "green";

		label = document.createElement("span");
		label.style.position = "absolute";
		label.style.top = `${h * 0.44}px`;
		label.style.right = `${w * 0.5}px`;
		label.style.textAlign = `right`;
		label.style.backgroundColor = "black";
		label.style.color = "green";
		label.style.fontFamily = "sans-serif";
		this.appendChild(label);
		this.minOutputHTML = label;
		
		label = document.createElement("span");
		label.style.position = "absolute";
		label.style.top = `0px`;
		label.style.right = `${w * 0.5}px`;
		label.style.textAlign = `right`;
		label.style.backgroundColor = "black";
		label.style.color = "green";
		label.style.fontFamily = "sans-serif";
		this.appendChild(label);
		this.maxOutputHTML = label;


		this.width = w;
		this.height = h;

		this.style.display = "block";
		this.style.width =  `${w}px`;
		this.style.height =  `${h}px`;

		this.inputSelector = this.getAttribute("target");

		this.draw = this.drawRealTimeData;


		// create selector
		this.selector = document.createElement("select");
		this.selector.style.position = `absolute`;
		this.selector.style.top = `${h * 0.65}px`;
		this.selector.addEventListener("change", e => {
			if(e.target.selectedIndex > 0){
				this.selectVariable(parseInt(e.target.selectedIndex-1));
			}
		});
		this.appendChild(this.selector);


	}


	init(waxml){
		this.waxml = waxml;

		if(this.variables.length == 1){
			this.selectVariable(0);
			this.selector.style.display = "none";
		} else {
			let option = document.createElement("option");
			option.innerHTML = "Select variable";
			option.setAttribute("selected", "true")
			this.selector.prepend(option);
		}
		this.update();
	}

	selectVariable(index){
		this.inspectedValues = [];
		delete(this.minInput);
		this.targetVariable = this.variables[index];
		this.drawMappingCurve(this.targetVariable);
	}

	addVariable(variable){
		this.variables.push(variable);

		let option = document.createElement("option");
		option.innerHTML = variable.name;

		this.selector.appendChild(option);
	}

	update(){
		requestAnimationFrame(e => this.update());
		if(!this.targetVariable){return}

		let curValuePair = this.targetVariable.valuePairs;
		this.inspectedValues.unshift(curValuePair);
		while(this.inspectedValues.length > this.nrOfValues){
			this.inspectedValues.pop();
		}
		this.moveDot(curValuePair);
		this.setMinAndMaxValues(curValuePair);
		this.draw();
	}

	moveDot(curValuePair){
		let x = (curValuePair.input - this.mappingValues.minX) / this.mappingValues.rangeX * this.mappingCanvas.width;
		let y = this.mappingCanvas.height - (curValuePair.output - this.mappingValues.minY) / this.mappingValues.rangeY * this.mappingCanvas.height;
		this.dot.style.top = `${y}px`;
		this.dot.style.left = `${x-this.dotSize/2}px`;
	}

	setMinAndMaxValues(curValuePair){
		if(typeof this.minInput == "undefined" || typeof curValuePair.input == "undefined"){
			this.minInput = curValuePair.input;
			this.maxInput = curValuePair.input;
			this.minOutput = curValuePair.output;
			this.maxOutput = curValuePair.output;
		} else {
			this.minInput = Math.min(this.minInput, curValuePair.input);
			this.maxInput = Math.max(this.maxInput, curValuePair.input);
			this.minOutput = Math.min(this.minOutput, curValuePair.output);
			this.maxOutput = Math.max(this.maxOutput, curValuePair.output);
		}
		this.inputRange = this.maxInput - this.minInput;
		this.outputRange = this.maxOutput - this.minOutput;

		this.minInputHTML.innerHTML = this.minInput.toPrecision(3);
		this.maxInputHTML.innerHTML = this.maxInput.toPrecision(3);
		this.minOutputHTML.innerHTML = this.minOutput.toPrecision(3);
		this.maxOutputHTML.innerHTML = this.maxOutput.toPrecision(3);
	}

	drawMappingCurve(targetVariable){
		this.mappingCanvasCtx.clearRect(0, 0, this.mappingCanvas.width, this.mappingCanvas.height);
		this.mappingCanvasCtx.beginPath();

		let points = targetVariable.getMappingPoints();
		let minX = points.reduce((point1, point2) => point2.x > point1.x ? point1 : point2).x;
		let maxX = points.reduce((point1, point2) => point2.x < point1.x ? point1 : point2).x;
		let minY = points.reduce((point1, point2) => point2.y > point1.y ? point1 : point2).y;
		let maxY = points.reduce((point1, point2) => point2.y < point1.y ? point1 : point2).y;
		let rangeX = maxX - minX;
		let rangeY = maxY - minY;

		this.mappingValues = {
			minX: minX,
			maxX: maxX,
			minY: minY,
			maxY: maxY,
			rangeX: rangeX,
			rangeY: rangeY
		}

		let w = this.mappingCanvas.width;
		let h = this.mappingCanvas.height;

		points.forEach((point, i) => {
			let x = (point.x-minX)/rangeX * w;
			let y = h - ((point.y-minY)/rangeY * h);
			if (!i) {
				this.mappingCanvasCtx.moveTo(x, y);
			} else {
				this.mappingCanvasCtx.lineTo(x, y);
			}
		});
		this.mappingCanvasCtx.lineTo(this.mappingCanvas.width, 0);
		this.mappingCanvasCtx.stroke();

	}

	drawRealTimeData() {

		if(!this.targetVariable){return}

		this.inputCanvasCtx.clearRect(0, 0, this.inputCanvas.width, this.inputCanvas.height);
		this.outputCanvasCtx.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);

		this.inputCanvasCtx.beginPath();
		this.outputCanvasCtx.beginPath();

		this.inspectedValues.forEach((valuePair, i) => {
			if(this.inputRange == 0 || this.outputRange == 0){return} // avoid dividing by zero
			let inputX = (valuePair.input - this.minInput) / this.inputRange * this.inputCanvas.width;
			let inputY = i / this.nrOfValues * this.outputCanvas.height;
			let outputX = (1 - i / this.nrOfValues) * this.outputCanvas.width;
			let outputY = (1 - (valuePair.output - this.minOutput) / this.outputRange) * this.outputCanvas.height;
			if (!i) {
				this.inputCanvasCtx.moveTo(inputX, inputY);
				this.outputCanvasCtx.moveTo(outputX, outputY);
			} else {
				this.inputCanvasCtx.lineTo(inputX, inputY);
				this.outputCanvasCtx.lineTo(outputX, outputY);
			}
		});

		this.inputCanvasCtx.stroke();
		this.outputCanvasCtx.stroke();
	}



}

module.exports = Inspector;
