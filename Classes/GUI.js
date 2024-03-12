
var Mapper = require('./Mapper.js');
var WebAudioUtils = require('./WebAudioUtils.js');
const XY_area = require('./XY_area.js');
//var Finder = require('../finderjs/index.js');
var VariableMatrix = require('./VariableMatrix');
var DynamicMixer = require('./dynamic-mixer/Mixer.js');
var SnapshotController = require('./variable-matrix/SnapshotController.js');
const OutputMonitor = require('./GUI/OutputMonitor.js');
const LinearArranger = require('./GUI/LinearArranger.js');




class GUI {

	constructor(xmlNode, waxml){

		this.waxml = waxml;
		this.elementCounter = 0;
		
		let style = document.createElement("style");
		style.innerHTML = `

			* {
				font-family: sans-serif;
			}

			.waxml-GUI-container {

				display: none;
				overflow: hidden;
				position: absolute;
				top: 10px;
				left: 10px;
				z-index: 1000;
				resize: both;

				width: 1300px;
				height: 800px;
				display: block;

				font-size: 80%;
				background-color: #6c6262;
				color: white;
				border: 1px solid #333;
				border-radius: 10px;
				
			}

			.hide {
				display: none !important;
			}

			#waxml-GUI, #iMusic-GUI {
				margin: 1em;
				overflow: scroll;
			}
			#iMusic-GUI {
				margin-top: 3em;
			}
			#waxml-GUI {
				width: 100%;
				height: 100%;
				box-sizing: border-box;
			}

			#waxml-GUI .container {
				border-top: 1px solid grey;
				margin-top: 1em;
				padding: 1em;

			}

			#waxml-GUI .triggers {
				margin-top: 2em;
			}
			#waxml-GUI button,
			#iMusic-GUI button {
				border-radius: 5px;
				padding: 0.2em 0.5em;
				min-width: 5em;
				margin-right: 0.5em;
			}

			.waxml-open-button {
				position: absolute;
				right: 5px;
				top: 5px;
			}


			#waxml-GUI button.active,
			#iMusic-GUI button.active {
				background-color: #6f6;
			} 
			#waxml-GUI button.pending,
			#iMusic-GUI button.pending {
				animation: blinking 500ms infinite;
			}

			@keyframes blinking {
				0% {
				  background-color: #fff;
				  border: 0px;
				}
				100% {
				  background-color: #ff3;
				}
			  }

			.waxml-button.close {
				display: inline-block;
				position: relative;
				background-color: red;
				margin-right: 1em;
				top: 5px;
				left: 5px;
				width: 15px;
				height: 15px;
				border: 1px solid black;
				border-radius: 7.5px;
			}

			#waxml-GUI .waxml-object {
				margin: 6px 2px;
				border: 1px solid #333;
				border-radius: 5px;
				background-color: rgba(0,0,0,0.05);
				box-sizing: content-box;
				width: fit-content;
			}
			#waxml-GUI .waxml-object.noID {
				margin: 0px;
				border: none;
			}
			#waxml-GUI .waxml-object header {
				margin: 5px 8px;
				font-weight: bold;
			}
			#waxml-GUI .audio > * {
				display: inline-block;
			}
			#waxml-GUI .mixer > *,
			#waxml-GUI .include > * {
				display: block;
			}
			#waxml-GUI .chain > * {
				display: block;
			}
			#waxml-GUI .audio,
			#waxml-GUI .include {
				background-color: rgba(255,255,255,0.8);
			}
			#waxml-GUI .waxml-object.chain {
				background-color: rgba(50,100,0,0.25);
			}
			#waxml-GUI .waxml-object.mixer {
				background-color: rgba(100,50,0,0.25);
			}

			.waxml-top-bar {
				display: block;
				position: absolute;
				top: 0px;
				left: 0px;
				height: 26px;
				width: 100%;
				background-color: #ccc;
				border-bottom: 1px solid #333;
			}
			.waxml-top-bar  * {
				color: black;
				font-weight: bold;
			}

			#waxml-GUI .sliderContainer {
				display: block;
				padding: 0.3em;
    			border-top: 1px solid grey;
			}

			#waxml-GUI .sliderContainer.unspecified label{
				width: 20em;
			}

			#waxml-GUI .sliderContainer.variable label {
				display: block;
				width: auto;
			}
			#waxml-GUI .sliderContainer label {
				display: inline-block;
				margin: 0px 5px;
				width: 5em;
			}

			#waxml-GUI .sliderContainer .numOutput {
				display: inline-block;
				text-align: right;
				padding: 2px;
				margin: 0px 5px;
				border: 1px solid grey;
				border-radius: 5px;
				width: 3.5em;
				height: 1.6em;
				background-color: white;
				box-sizing: border-box;
			}

			#waxml-GUI .sliderContainer input[type='range'] {
				display: inline-block;
				width: 10em;
				margin: 0px;
				vertical-align: middle;
			}
			#waxml-GUI .sliderContainer.variable input[type='range'] {
				width: 15.6em;
			}

			#waxml-GUI select,
			#iMusic-GUI select {
				margin: 1em;
				padding: 0.5em;
				min-width: 10em;
			}			

			#waxml-GUI .errorBox,
			#iMusic-GUI .errorBox {
				color: #900;
				background-color: white;
				border: 1px solid black;
				margin-top: 1em;
				padding: 1em;
				width: 80%;
			}

			waxml-variable-matrix {
				display: block;
				border: 1px solid #333;
				border-radius: 0.5em;
				background-color: #999;
				overflow: hidden;
			}
			waxml-variable-matrix table {
				border-collapse: collapse; 
				width: 100%;
			}
			waxml-variable-matrix th {
				text-align: left;
				padding-left: 1em;
			}
			waxml-variable-matrix tr {
				border-bottom: 1px solid #333;
			}
			waxml-variable-matrix thead {
				background-color: #444;
				color: #fff;
			}

			waxml-variable-matrix td,
			waxml-variable-matrix th {
				color: #fff;
				border-left: 1px solid #aaa;
				padding-left: 1em;
			}
			waxml-variable-matrix .selected,
			waxml-dynamic-mixer .selected {
				background-color: #bfbfe3;
			}
			waxml-variable-controller {
				display: inline-block;
				padding: 0.5em 1em;
			}
			waxml-variable-controller.selected {
				
			}
			waxml-variable-controller input[type="range"]{
				vertical-align: middle;
				border-radius: 0.5em;
				background-color: #333;
				-webkit-appearance: none;
				appearance: none;
				cursor: pointer;
				transition: 0.5s;
			}

			waxml-variable-controller input[type="range"]::-webkit-slider-runnable-track,
			waxml-variable-controller input[type="range"]::-moz-range-track  {
				background-color: #444;
				height: 1.5em;
				border-radius: 0.75em;
			}


			waxml-variable-controller input[type="range"]::-webkit-slider-thumb {
				-webkit-appearance: none; /* Override default look */
				appearance: none;
				background-color: #aaa;
				border: 1px solid #000;
				border-radius: 0.6em;
				height: 1.2em;
				width: 1.2em;    
			}


			waxml-variable-controller input[type="text"]{
				vertical-align: middle;
				text-align: right;
				border: 0px;
				background-color: rgba(255,255,255,0);
				color: #fff;
			}

			waxml-meter {
				width: 80%;
				height: 1em;
				background-color: black;
			}

			waxml-snapshot-controller {
				position: relative;
				display: block;
				border: 1px solid #333;
				border-radius: 0.5em;
				background-color: #999;
				padding: 10px;
			}
			waxml-snapshot-controller > * {
				background-color: #ccc;
				border: 1px solid #333;
    			border-radius: 10px;
				width: 47.9%;
				margin: 1em;
				height: 300px;
				overflow: auto;
				display: inline-block;
				box-sizing: border-box;
			}
			.waxml-snapshot-button-container {
			}
			waxml-snapshot-controller textarea {
			}
			.waxml-snapshot-button-container > div {

			}

			
			waxml-snapshot-component {
				
				border: 1px solid #333;
				border-radius: 0.5em;
				background-color: #999;
				margin: 1em;
				margin-right: 0em;
				padding: 0.7em;
				display: inline-grid !important;
			}
			waxml-snapshot-component button.delete {
				width: 1.5em;
				height: 1.5em;
				padding: 0em !important;
				min-width: auto !important;
				min-height: auto !important;
			}
			waxml-snapshot-controller button.add {
				width: 1.5em;
				height: 1.5em;
				padding: 0em !important;
				margin: 1em;
				min-width: auto !important;
				min-height: auto !important;
			}
			waxml-dynamic-mixer {
				display: inline-block;
				position: relative;
				color: #fff;
				border-radius: 0.5em;
				border: 1px solid #333;
				width: 45%;
				background-color: #999;
				overflow: hidden;
			}
			waxml-dynamic-mixer table {
				width: 100%;
				border-collapse: collapse;
			}

			waxml-dynamic-mixer thead {
				background-color: #333;
			}
			waxml-dynamic-mixer th {
				text-align: left;
				padding-left: 1em;
			}
			waxml-dynamic-mixer tr {
				border-bottom: 1px solid #333;
			}

			waxml-dynamic-mixer td {
				border-left: 1px solid #aaa;
				padding-left: 1em;
			}

			waxml-dynamic-mixer meter {
				width: 100px;
				height: 30px;
				vertical-align: middle;
			}

			waxml-dynamic-mixer meter::-webkit-meter-bar {
				background-color: black;
			}
			waxml-dynamic-mixer meter::-webkit-meter-optimum-value,
			waxml-dynamic-mixer meter:-moz-meter-optimum::-moz-meter-bar {
				#555;
			}

			waxml-output-monitor {
				display: block;
				width: 97%;
				height: 300px;
				border: 1px solid #333;
				background-color: #bbb;
				overflow-y: scroll;

				color: #000;
				font-size: 120%;
				font-family: Monospace;
				padding: 0.5em;
				border-radius: 0.5em;
				margin: 1em 0;
			}
			
			waxml-output-monitor table {
				width: 100%;
			}

			waxml-output-monitor tr.error {
				color: #c90202;
			}

			waxml-output-monitor table td {
				padding: 2px;
			}

			waxml-output-monitor table td.number {
				text-align: right;
			}

			waxml-linear-arranger {
				display: block;
				width: 100%;
				height: 50%;
				background: #777;
				margin-left: 1em;
				border-radius: 0.5em;
				border: 1px solid #333;
				margin: 1em auto;
			}

			waxml-linear-arranger > * {
				height: 100%;
				display: inline-block;
				position: relative;
				vertical-align: top;
			}

			waxml-linear-arranger > .list {
				width: 19%;
				background-color: #555;
				border-right: 1px solid black;
			}

			waxml-linear-arranger > .list > * {
				border-bottom: 1px solid black;
				box-sizing: border-box;
				margin-left: 1em;
				line-height: 2em;
			}
			

			waxml-linear-arranger > .main {
				width: 80%;
				overflow-y: hidden;
				overflow-x: scroll;
			}

			waxml-linear-arranger button.zoom {
				float: right;
				width: 1em;
				height: 1.7em;
				margin-right: 0 !important;
				background-color: #ccc;
				
			}

			waxml-linear-arranger .content {
				width: 100%;
				height: 100%;
				left: 0%;
				position: absolute;
			}


			waxml-linear-arranger .content > * {
				position: relative;
				width: 100%;
				border-bottom: 1px solid #777;
				box-sizing: border-box;
			}

			waxml-linear-arranger .position-pointer {
				height: 100%;
				left: 0%;
				position: absolute;
				z-index: 1;
				border-left: 3px solid #006;
			}

			waxml-linear-arranger .grid {
				width: 100%;
				height: 100%;
				position: absolute;
			}
			waxml-linear-arranger .grid > * {
				position: absolute;
				border-left: 1px solid black;
			}

			waxml-linear-arranger .grid .barline {
				height: 100%;
			}

			waxml-linear-arranger .grid .beatline {
				height: 100%;
				border-left: 1px dashed #333;
			}

			waxml-linear-arranger .object {
				height: 100%;
				position: absolute;
				border: 1px solid #333;
				border-radius: 5px;
				color: #333;
				padding-left: 0.5em;
			}



			waxml-linear-arranger .voice .object {
				background-color: rgba(185,108,106,0.8);
			}
			
			waxml-linear-arranger .class .object {
				background-color: rgba(119,140,196,0.8);
			}
			
			waxml-linear-arranger .other:nth-child(4n) .object {
				background-color: rgba(129,186,201,0.8);
			}
			
			waxml-linear-arranger .other:nth-child(4n+1) .object {
				background-color: rgba(158,198,118,0.8);
			}
			
			waxml-linear-arranger .other:nth-child(4n+2) .object {
				background-color: rgba(202,192,130,0.8);
			}
			
			waxml-linear-arranger .other:nth-child(4n+3) .object {
				background-color: rgba(198,160,119,0.8);
			}
			

			
		
		`;

		let container = document.createElement("div");
		container.id = "waxml-GUI";
		container.classList.add("WebAudioXML");

		let allNodes = xmlNode.querySelectorAll("*[controls='true'], *[controls='show']");
		let shadowContainer;

		// It might be better to separate
		document.head.appendChild(style);
		let shadowStyle = style.cloneNode(true);

		// GUI in shadow HTML
		shadowContainer = document.createElement("div");
		shadowContainer.classList.add("waxml-GUI-container");

		document.body.prepend(shadowContainer);


		let shadowElement = shadowContainer.attachShadow({mode: 'open'});
		shadowElement.appendChild(shadowStyle);

		shadowElement.appendChild(container);


		this.HTML = shadowElement;

		
		let openbtn = document.createElement("button");
		openbtn.innerHTML = "WAXML";
		openbtn.classList.add("waxml-open-button");
		openbtn.classList.add("button");
		
		document.body.appendChild(openbtn);
		openbtn.addEventListener("click", e => {
			e.target.classList.add("hide");
			shadowContainer.classList.remove("hide");

			container.querySelectorAll("waxml-xy-handle").forEach(el => {
				el.initRects();
				el.move();
			});
		});
		// openbtn.style.display = allNodes.length ? "block": "none";


		if(xmlNode.firstChild.getAttribute("controls") == "show"){
			openbtn.classList.add("hide");
		} else {
			shadowContainer.classList.add("hide");
		}


		let topBar = document.createElement("div");
		topBar.classList.add("waxml-top-bar");
		shadowElement.appendChild(topBar);

		this.dragElement(shadowContainer, topBar);

		let btn = document.createElement("div");
		// btn.innerHTML = "X";
		btn.classList.add("waxml-button");
		btn.classList.add("close");
		btn.classList.add("btn");
		topBar.appendChild(btn);
		btn.addEventListener("click", e => {
			shadowContainer.classList.add("hide");
			openbtn.classList.remove("hide");
		});

		topBar.insertAdjacentHTML("beforeend", "<span>WAXML - inspector</span>");
		
		
		// Generate triggers
		this.XMLtoTriggerButtons(xmlNode, container);

		this.linearArranger = new LinearArranger(this.waxml);
		container.appendChild(this.linearArranger);

		this.addDynamicMixers(waxml.querySelectorAll(`*[controls*="waxml-dynamic-mixer"]`), container);

		let matrixes = this.addVariableMatrixes(waxml.querySelectorAll(`*[controls*="waxml-variable-matrix"]`), container);
		
		if(matrixes) {
			this.addSnapshotController(container);
		}


		// ObjectBasedAudio
		this.XY_areaFromAudioObjects(waxml.querySelectorAll("ObjectBasedAudio"), container);


		// WAXML Console
		this.outputMonitor = new OutputMonitor();
		container.appendChild(this.outputMonitor);



		// Find variables in use without <var> elements
		let usedVariables = [];
		xmlNode.querySelectorAll("*").forEach(node => {
			[...node.attributes].forEach(attr => {
				WebAudioUtils.getVariableNames(attr.nodeValue).forEach(name => {
					usedVariables.push(name);
				});
			});
		});
		// remove duplicates
		this.usedVariables = [...new Set(usedVariables)];



		// Create container for unspecified variable sliders
		let unspecVarsContainer = document.createElement("div");
		container.appendChild(unspecVarsContainer);

		// Generate sliders for <var> elememts and audio parameters
		let specifiedContainer = document.createElement("div");
		//specifiedContainer.innerHTML = "<h2>&lt;var&gt; elements and Audio Parameters</h2>";
		specifiedContainer.classList.add("container");
		container.appendChild(specifiedContainer);



		allNodes.forEach(xmlNode => {
			//this.XMLtoSliders(xmlNode, specifiedContainer, true);
		});

		//this.addUnspecifiedVariableSliders(this.usedVariables, unspecVarsContainer);
		
		// let columnView = document.createElement("div");
		// columnView.classList.add("columnView");
		// document.body.appendChild(columnView);
		// this.XMLtoColumnView([this.waxml.structure.XMLtree], columnView);
	}


	remove(){
		// not implementet yet
	}

	addDynamicMixers(objects, container){

		if(!objects.length){
			return;
		}
		let header = document.createElement("h1");
		header.innerHTML = "Dynamic Mixers";
		container.appendChild(header);


		objects.forEach(obj => {
			// add a matrix for each object with controls="waxml-variable-matrix"
			let el = new DynamicMixer(obj);
			el.setAttribute("class", "waxml-dynamic-mixer");
			container.appendChild(el);
		});
	}

	addVariableMatrixes(objects, container){

		if(!objects.length){
			return;
		}
		let header = document.createElement("h1");
		header.innerHTML = "Mixer";
		container.appendChild(header);
		returnArray = [];

		objects.forEach(obj => {
			// add a matrix for each object with controls="waxml-variable-matrix"
			let matrix = new VariableMatrix(obj);
			matrix.setAttribute("class", "waxml-snapshot waxml-gui-matrix");
			container.appendChild(matrix);
			returnArray.push(matrix);
		});
		return returnArray;
	}

	addSnapshotController(container, group="waxml-gui"){
		let header = document.createElement("h1");
		header.innerHTML = "Snapshots";
		container.appendChild(header);
		let snapshotController = new SnapshotController({
			class: "waxml-snapshot waxml-gui-matrix"
		}, this.waxml);
		container.appendChild(snapshotController);
	}

	addUnspecifiedVariableSliders(names, container){
		container.innerHTML = "<h2>Unspecified variables</h2>";
		container.classList.add("container", "sliders", "variables", "unspecified");
		names.forEach(name => {
			this.addSlider(
				`$${name}`, 
				container,
				0,
				1,
				1/1000, 
				1, 
				"unspecified",
				e => {
					this.waxml.setVariable(name, e.target.value);
				}
			);
		});
	}

	XMLtoColumnView(structure, el){

		// let f = new Finder(el, structure, {});
		// f.on('leaf-selected', function(item) {
		// 	console.log('Leaf selected', item);
		//   });

	}

	XMLtoTriggerButtons(xmlNode, el){

		let IDs = [];
		let classNames = [];
		let container = document.createElement("div");
		container.classList.add("triggers");
		el.appendChild(container);


		let header = document.createElement("h3");
		header.innerHTML = "Triggers";
		container.appendChild(header);

		let idSelector = "Envelope[id], ObjectBasedAudio[id], AmbientAudio[id], AudioBufferSourceNode[id]";

		xmlNode.querySelectorAll(idSelector).forEach(xmlNode => {
			IDs.push(xmlNode.id);
		});
		[...new Set(IDs)].forEach(id => this.addButton(id, container, e => this.waxml.start(`#${id}`)));

		let selector = "Envelope[class], ObjectBasedAudio[class], AmbientAudio[class], AudioBufferSourceNode[class]";

		xmlNode.querySelectorAll(selector).forEach(xmlNode => {
			xmlNode.classList.forEach(className => classNames.push(className));
		});
		[...new Set(classNames)].forEach(className => this.addButton(className, container, e => this.waxml.start(`.${className}`)));

		container.style.display = classNames.length + IDs.length ? "block" : "none";

		container.appendChild(document.createElement("hr"));
	}

	XY_areaFromAudioObjects(objects, targetElement){

		if(!objects || !objects.length){return}


		let header = document.createElement("h3");
		header.innerHTML = "3D Object Based Audio";
		targetElement.appendChild(header);

		let maxValues = objects.reduce((prevObject, curObject) => {
			return {
				positionX: Math.max(Math.abs(prevObject.positionX), Math.abs(curObject.positionX)),
				positionZ: Math.max(Math.abs(prevObject.positionZ), Math.abs(curObject.positionZ))
			}
		}, {positionX: 1, positionZ: 1});
		let maxVal = Math.max(maxValues.positionX, maxValues.positionZ)*2;

		let range = maxVal * 2;
		while(range > 60){
			range *= 0.1; // auto adjust grid to 10, 100, 1000 etc
		}
		let XY_area = document.createElement("waxml-xy-area");
		XY_area.setAttribute("width", "500px");
		XY_area.setAttribute("height", "500px");
		XY_area.setAttribute("columns", range);
		XY_area.setAttribute("rows", range);
		XY_area.setAttribute("border", "2px solid black");
		XY_area.setAttribute("background-color", "#696");
		XY_area.setAttribute("gridColor", "grey");
		targetElement.appendChild(XY_area);

		let title;
		title = document.createElement("div");
		title.innerHTML = "<strong>Object:</strong>";
		targetElement.appendChild(title);

		let XYoutput = document.createElement("div");
		XYoutput.innerHTML = " ";
		targetElement.appendChild(XYoutput);

		title = document.createElement("div");
		title.innerHTML = "<strong>Listener:</strong>"
		targetElement.appendChild(title);

		let headPositionOutput = document.createElement("div");
		targetElement.appendChild(headPositionOutput);

		let headForwardOutput = document.createElement("div");
		targetElement.appendChild(headForwardOutput);

		let sndCnt = 0;
		
		objects.forEach(object => {
			let tempName = object.src ? object.src.split("/").pop() : `Sound ${++sndCnt}`;
			let label = object.name || object.id || tempName;
			let handle = document.createElement("waxml-xy-handle");
			handle.innerHTML = label;

			handle.setAttribute("minX", -maxVal);
			handle.setAttribute("minY", -maxVal);
			handle.setAttribute("maxX", maxVal);
			handle.setAttribute("maxY", maxVal);

			handle.setAttribute("direction", "xy");
			handle.setAttribute("x", (object.positionX + maxVal) / (maxVal*2));
			handle.setAttribute("y", (object.positionZ + maxVal) / (maxVal*2));

			XY_area.appendChild(handle);

			handle.addEventListener("input", e => {
				let x = e.target.getProperty("x");
				let y = e.target.getProperty("y");
				object.positionX = x;
				object.positionZ = y;
				XYoutput.innerHTML = `positionX: ${x.toFixed(1)} | positionZ: ${y.toFixed(1)}`;
			});
		});

		XY_area.addEventListener("pointerdown", e => {
			// turn listener
			let point = XY_area.coordinateTovalue({x:e.clientX, y:e.clientY});
			let deltaX = (point.x - head.x) * maxVal;
			let deltaY = (point.y - head.y) * maxVal;
			headForwardOutput.innerHTML = `forwardX: ${deltaX.toFixed(1)} | forwardZ: ${deltaY.toFixed(1)}`;
			this.waxml.setVariable("forwardX", deltaX);
			this.waxml.setVariable("forwardZ", deltaY);

			let rad = head.pointToRelativeRadians(point);
			head.style.transform = `rotate(${rad}rad)`;
		});
		headForwardOutput.innerHTML = `forwardX: ${this.waxml.getVariable("forwardX").toFixed(1)} | forwardZ: ${this.waxml.getVariable("forwardZ").toFixed(1)}`


		// listening head
		let head = document.createElement("waxml-xy-handle");
		head.setAttribute("icon", "arrow-up-circle-fill");

		head.setAttribute("size", "40px");
		head.setAttribute("x", 0.5);
		head.setAttribute("y", 0.5);
		head.setAttribute("minX", -maxVal);
		head.setAttribute("minY", -maxVal);
		head.setAttribute("maxX", maxVal);
		head.setAttribute("maxY", maxVal);

		XY_area.appendChild(head);
		head.addEventListener("input", e => {
			let x = e.target.getProperty("x");
			let y = e.target.getProperty("y");
			this.waxml.setVariable("positionX", x);
			this.waxml.setVariable("positionZ", y);
			headPositionOutput.innerHTML = `positionX: ${x.toFixed(1)} | positionZ: ${y.toFixed(1)}`;
		});

		head.style.transform = `rotate(${-90}deg)`;
		headPositionOutput.innerHTML = `positionX: ${this.waxml.getVariable("positionX").toFixed(1)} | positionZ: ${this.waxml.getVariable("positionZ").toFixed(1)}`

		return XY_area;
	
	}

	XMLtoSliders(xmlNode, el, displayContainer){
		let nodeName = xmlNode.localName.toLowerCase()

		// let variableContainer = document.createElement("div");
		// variableContainer.classList.add("sliders", "variables");
		// // variableContainer.innerHTML = "<h3>&lt;var&gt; elements</h3>";
		// el.appendChild(variableContainer);

		// let parameterContainer = document.createElement("div");
		// parameterContainer.classList.add("sliders", "parameters");
		// // parameterContainer.innerHTML = "<h2>Audio Parameters</h2>";
		// el.appendChild(parameterContainer);
		let slidersAdded = false;

		if(xmlNode.children.length){
			let subEl = document.createElement("div");
			let id;
			if(xmlNode.id || xmlNode.classList.length){
				id = xmlNode.id ? `#${xmlNode.id}` : `.${[...xmlNode.classList].join(".")}`;
				subEl.innerHTML = `<header>${xmlNode.localName + id}</header>`;
			} else if(xmlNode.localName == "include"){
				subEl.innerHTML = `<header>${xmlNode.getAttribute("href")}</header>`;
			} else {
				id = "";
				if(!displayContainer)subEl.classList.add("noID");
			}
			subEl.classList.add(xmlNode.localName.toLowerCase());
			subEl.classList.add("waxml-object");
			
			// 2022-08-30 - reduced to only show top level variables
			if(xmlNode.parentNode.nodeName == "#document"){
				Array.from(xmlNode.children).forEach(childNode => {
					//slidersAdded = this.XMLtoSliders(childNode, subEl) || slidersAdded;
				});
			}
			
			if(slidersAdded)el.appendChild(subEl);

		} else {
			switch(nodeName){

				case "var":
				let obj = xmlNode.obj;
				//if(typeof obj._params.value == "undefined"){
					// remove variable from list so there will be no slider duplicates
					this.usedVariables = this.usedVariables.filter(name => name != obj.name);;

					this.addSlider(
						//`&lt;var name="${obj.name}"&gt;`, 
						obj.name,
						el,
						obj.minIn,
						obj.maxIn,
						(obj.maxIn-obj.minIn)/1000, 
						obj.default, 
						"variable",
						e => obj.value = e.target.value
					);
					slidersAdded = true;
				//}
				break;
	
				case "envelope":
				break;
	
				default:
				if(xmlNode.obj._node instanceof AudioParam && typeof xmlNode.obj._params.value == "undefined"){
					// avoid making sliders for parameters with predefined or variable controlled values
					let name = WebAudioUtils.caseFixParameter(nodeName);
					let range = WebAudioUtils.paramNameToRange(name);
					this.addSlider(
						xmlNode.localName,
						el,
						range.min,
						range.max,
						(range.max - range.min) / 1000, 
						range.default, 
						"audio-parameter",
						e => xmlNode.obj[name] = e.target.value
					);
					slidersAdded = true;
				} 
				break;
			}
		}
		return slidersAdded;
	}

	addButton(name, parent, fn){
		let btn = document.createElement("button");
		btn.innerHTML = name;
		btn.addEventListener("click", fn);
		parent.appendChild(btn);
	}


	addSlider(name, parent, min, max, step, val, className, fn){
		let sliderContainer = document.createElement("div");
		sliderContainer.classList.add("sliderContainer", className);
		parent.appendChild(sliderContainer);

		let sliderID = `slider-${this.elementCounter++}`;
		// if(name == "$multi_pan"){
		// 	console.log("$multi_pan");
		// }

		let label = document.createElement("label");
		label.innerHTML = name;
		label.setAttribute("for", sliderID);
		sliderContainer.appendChild(label);

		let slider = document.createElement("input");
		slider.setAttribute("type", "range");
		slider.setAttribute("min", min);
		slider.setAttribute("max", max);
		slider.setAttribute("step", step);
		slider.setAttribute("value", val);
		slider.setAttribute("id", sliderID);
		sliderContainer.appendChild(slider);

		let output = document.createElement("span");
		output.innerHTML = val;
		output.classList.add("numOutput");
		sliderContainer.appendChild(output);

		slider.addEventListener("input", e => {
			output.innerHTML = e.target.value;
			fn(e);
		});

		return sliderContainer;
	}

	log(message){
		this.outputMonitor.log(message);
	}

	initLinearArranger(structure){
		this.linearArranger.init(structure);
	}

	visualize(obj){
		return this.linearArranger.visualize(obj);
	}
	visualFadeOut(data){
		this.linearArranger.visualFadeOut(data);
	}

	scrollArrangeWindow(time){
		this.linearArranger.scrollTo(time);
	}

	// Make the GUI window draggable:

	dragElement(container, headerElement) {
		var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
		(headerElement || container).onmousedown = dragMouseDown;

		function dragMouseDown(e) {
			e = e || window.event;
			e.preventDefault();
			// get the mouse cursor position at startup:
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.addEventListener("pointerup", closeDragElement);
			// call a function whenever the cursor moves:
			document.addEventListener("pointermove", elementDrag);
		}

		function elementDrag(e) {
			e = e || window.event;
			e.preventDefault();
			// calculate the new cursor position:
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;
			// set the element's new position:
			container.style.top = (container.offsetTop - pos2) + "px";
			container.style.left = (container.offsetLeft - pos1) + "px";
		}

		function closeDragElement() {
			if(container.offsetTop < 0){
				container.style.top = "0px";
			}
			if(container.offsetLeft < 0){
				container.style.left = "0px";
			}
			document.removeEventListener("pointerup", closeDragElement);
			document.removeEventListener("pointermove", elementDrag);
		}
	}


}


module.exports = GUI;





