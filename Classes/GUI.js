
var Mapper = require('./Mapper.js');
var WebAudioUtils = require('./WebAudioUtils.js');
const XY_area = require('./XY_area.js');
//var Finder = require('../finderjs/index.js');

class GUI {

	constructor(xmlNode, waxml){

		this.waxml = waxml;
		this.elementCounter = 0;
		
		let style = document.createElement("style");
		style.innerHTML = `

			* {
				font-family: sans-serif;
			}
			#waxml-GUI, #iMusic-GUI {
				font-size: 80%;
				overflow: auto;
				padding: 1em;
				transition: 0.5s;
				background-color: white;
				color: black;
			}

			#waxml-GUI .container {
				border-top: 1px solid grey;
				margin-top: 1em;
			}
			#waxml-GUI button,
			#iMusic-GUI button {
				border-radius: 5px;
				padding: 0.2em 0.5em;
				min-width: 5em;
				margin-right: 0.5em;
			}

			#waxml-GUI > button.close {
				min-width: 40px;
				font-weight: bold;
				background-color: red;
				position: absolute;
				top: 2px;
				right: 30px;
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
				border: 1px solid black;
				margin-top: 1em;
				padding: 1em;
				width: 80%;
			}
		
		`;

		let container = document.createElement("div");
		container.id = "waxml-GUI";
		container.classList.add("WebAudioXML");

		let allNodes = xmlNode.querySelectorAll("*[controls='true'], *[controls='show']");


		if(xmlNode.firstChild.getAttribute("controls") == "show"){
			document.head.appendChild(style);
			document.body.append(container);
		} else {


			let shadowContainer = document.createElement("div");
			shadowContainer.style.width = "0%";
			shadowContainer.style.height = "0%";
			shadowContainer.style.display = "none";
			shadowContainer.style.overflow = "visible";
			shadowContainer.style.position = "absolute";
			shadowContainer.style.zIndex = "1";
			shadowContainer.style.backgroundColor = "white";

			document.body.prepend(shadowContainer);


			let shadowElement = shadowContainer.attachShadow({mode: 'open'});
			shadowElement.appendChild(style);

			shadowElement.appendChild(container);


			this.HTML = shadowElement;

			
			let openbtn = document.createElement("button");
			openbtn.innerHTML = "Music and Mixer";
			openbtn.style.position = "absolute";
			openbtn.style.right = "2px";
			openbtn.style.top = "2px";
			openbtn.classList.add("waxml-gui-btn");
			document.body.appendChild(openbtn);
			openbtn.addEventListener("click", e => {
				e.target.style.display = "none";
				shadowContainer.style.width = "100%";
				shadowContainer.style.height = "100%";
				shadowContainer.style.display = "block";

				container.querySelectorAll("waxml-xy-handle").forEach(el => {
					el.initRects();
					el.move();
				});
			});
			openbtn.style.display = allNodes.length ? "block": "none";


			let btn = document.createElement("button");
			btn.innerHTML = "X";
			btn.classList.add("close");
			container.appendChild(btn);
			btn.addEventListener("click", e => {
				openbtn.style.display = "block";
				shadowContainer.style.width = "0%";
				shadowContainer.style.height = "0%";
				shadowContainer.style.display = "none";
			});
		}
		
		

		let header = document.createElement("h1");
		header.innerHTML = "WebAudioXML";
		container.appendChild(header);


		// ObjectBasedAudio

		this.XY_areaFromAudioObjects(waxml.querySelectorAll("ObjectBasedAudio"), container);

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


		// Generate triggers
		this.XMLtoTriggerButtons(xmlNode, container);

		// Create container for unspecified variable sliders
		let unspecVarsContainer = document.createElement("div");
		container.appendChild(unspecVarsContainer);

		// Generate sliders for <var> elememts and audio parameters
		let specifiedContainer = document.createElement("div");
		//specifiedContainer.innerHTML = "<h2>&lt;var&gt; elements and Audio Parameters</h2>";
		specifiedContainer.classList.add("container");
		container.appendChild(specifiedContainer);



		allNodes.forEach(xmlNode => {
			this.XMLtoSliders(xmlNode, specifiedContainer, true);
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
		container.classList.add("container", "triggers");
		container.innerHTML = "<h2>Triggers</h2>";
		el.appendChild(container);

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
	}

	XY_areaFromAudioObjects(objects, targetElement){

		if(!objects || !objects.length){return}

		let maxValues = objects.reduce((prevObject, curObject) => {
			return {
				positionX: Math.max(Math.abs(prevObject.positionX), Math.abs(curObject.positionX)),
				positionZ: Math.max(Math.abs(prevObject.positionZ), Math.abs(curObject.positionZ))
			}
		}, {positionX: 1, positionZ: 1});
		let maxVal = Math.max(maxValues.positionX, maxValues.positionZ)*2;

		let range = maxVal * 2;
		let XY_area = document.createElement("waxml-xy-area");
		XY_area.setAttribute("width", "500px");
		XY_area.setAttribute("height", "500px");
		XY_area.setAttribute("columns", range);
		XY_area.setAttribute("rows", range);
		XY_area.setAttribute("border", "2px solid black");
		XY_area.setAttribute("background-color", "#696");
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
					slidersAdded = this.XMLtoSliders(childNode, subEl) || slidersAdded;
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

}


module.exports = GUI;





