
const noteNames = "c,c#,d,d#,e,f,f#,g,g#,a,a#,b".split(",");

class MIDIController extends HTMLElement {


	constructor(){
		super();

		document.addEventListener("keydown", e => this.keyCommandDown(e));
		document.addEventListener("keyup", e => this.keyCommandUp(e));
	}

	keyCommandDown(e){

		let el = this.elements.find(el => el.keyCommand == e.key);
		if(el){
			el.dispatchEvent(new CustomEvent("pointerdown"))
		}
	}
	keyCommandUp(e){
		let el = this.elements.find(el => el.keyCommand == e.key);
		if(el){
			el.dispatchEvent(new CustomEvent("pointerup"))
		}
	}

	connectedCallback(){
		
		let shadowElement = this.attachShadow({mode: 'open'});

		let hoverColor = this.getAttribute("hoverColor") || this.getAttribute("hovercolor") || "#ccc";
		let activeColor = this.getAttribute("activeColor") || this.getAttribute("activecolor") || "#66f";
		let selectedColor = this.getAttribute("selectedColor") || this.getAttribute("selectedcolor") || "red";
		let rootColor = this.getAttribute("rootColor") || this.getAttribute("rootcolor") || "#ccf";
		this.type = (this.getAttribute("type") || "keyboard").toLowerCase();
		this.rows = parseInt(this.getAttribute("rows") || 8);
		this.cols = parseInt(this.getAttribute("cols") || 8);
		this.scaleType = (this.getAttribute("scale") || "major").toLowerCase();
		this.midiIn = (this.getAttribute("midiIn") || this.getAttribute("midiin")) == "true";
		
		let keyCommands = this.getAttribute("keyCommands") || this.getAttribute("keycommands") || "";
		let delimiter = keyCommands.includes(",") ? "," : "";
		this.keyCommands = keyCommands.split(delimiter);
		
		let labels = this.getAttribute("labels") || "";
		delimiter = labels.includes(",") ? "," : "";
		this.labels = labels.split(delimiter);

		
		this.overlap = parseInt(this.getAttribute("overlap") || 0);

		

		this.padMargin = parseInt(this.getAttribute("padMargin") || this.getAttribute("padmargin") || 5)
		
		switch(this.scaleType){
			case "major":
			this.scale = [0,2,4,5,7,9,11,12];
			break;

			case "minor":
			this.scale = [0,2,3,5,7,8,10,12];
			break;
			
			case "chromatic":
			this.scale = [0,1,2,3,4,5,6,7,8,9,10,11,12];
			break;
			
			case "pentatonic":
			this.scale = [0,2,4,7,9,12];
			break;
			
			case "blues":
			this.scale = [0,3,5,6,7,10,12];
			break;

			default:
			// defined with numbers
			let scale;
			let useLetters = false;
			let delimiter = this.scaleType.includes(",") ? "," : "";
			scale = this.scaleType.split(delimiter).map(str => {			
				let keyNum = parseInt(str);
				if(isNaN(keyNum)){
					// map letters to numbers
					keyNum = Math.max(0,noteNames.indexOf(str));
					useLetters = true;
				}
				return keyNum;
			});
			if(useLetters){
				// add octave
				scale.push(12);
			}
			this.scale = scale.length ? scale : [0,2,4,5,7,9,11,12];
			break;
		}
		this.scaleMod = this.scale.pop();


		let style = document.createElement("style");
		style.innerHTML = `
			.controller {
				display: block;
				position: absolute;
			}

			.pad {
				display: flex;
				position: absolute;
				border: 1px solid black;
				border-radius: 5px;
				box-sizing: border-box;
				background-color: white;
				justify-content: center;
				align-items: center;
				font-size: 120%;
				user-select: none;
			}
			.pad.root {
				background-color: ${rootColor};
			}
			.key {
				display: flex;
				position: absolute;
				border: 1px solid black;
				user-select: none;
				font-size: 100%;
				justify-content: center;
				align-items: end;
			}
			.key.white {
				height: 100%;
				background-color: white;
				z-index: 0;
			}
			.key.black {
				height: 100%;
				background-color: black;
				z-index: 1;
				color: white;
				font-size: 70%;
			}
			.key:hover, .pad:hover {
				background-color: ${hoverColor};
			}
			.key.active, .pad.active  {
				background-color: ${activeColor};
			}
			.key.selected, .pad.selected {
				background-color: ${selectedColor};
			}
			.key.selected:hover, .pad.selected:hover {
				background-color: ${hoverColor};
			}
			.key.selected.active, .pad.selected.active {
				background-color: ${activeColor};
			}
		`;


		let w = parseFloat(this.getAttribute("width"));
		let h = parseFloat(this.getAttribute("height"));

		let channel = this.getAttribute("channel");
		this.channel = channel ? parseInt(channel) : 1;
		
		let velocity = this.getAttribute("velocity");
		this.velocity = velocity ? parseInt(velocity) : 127;


		let min = this.getAttribute("min");
		min = min ? nearestWhiteKey(parseInt(min), -1) : 36;
		let max = this.getAttribute("max");
		max = max ? nearestWhiteKey(parseInt(max), 1) : 84;
		this.min = min;
		this.max = max;

		this.width = w;
		this.height = h;

		this.minIndex = whiteKeyIndex(this.min);
		this.maxIndex = whiteKeyIndex(this.max);
		this.range = this.maxIndex - this.minIndex + 1;
		this.whiteKeyWidth = this.width / this.range;

		this.style.display = "block";
		this.style.width =  `${w}px`;
		this.style.height =  `${h}px`;
		//this.style.backgroundColor = "red";

		shadowElement.appendChild(style);

		let controllerElement =	this.generateController(min, max);
		shadowElement.appendChild(controllerElement);

		this.keys = [];

		this.addEventListener("down", e => {
			let keyNum = e.detail.key.value;
			this.keys[keyNum] = true;
			this.value = keyNum;

			let data = {channel: this.channel, keyNum: keyNum, velocity: this.velocity};
			this.dispatchEvent(new CustomEvent("keydown", {detail:data}));
			this.indicateKey(keyNum, true);
		});
		this.addEventListener("up", e => {
			let keyNum = e.detail.key.value;
			this.keys[keyNum] = false;
			this.value = keyNum;

			let data = {channel: this.channel, keyNum: keyNum, velocity: this.velocity};
			this.dispatchEvent(new CustomEvent("keyup", {detail:data}));
			this.indicateKey(keyNum, false);
		});
		this.addEventListener("pointerleave", e => {
			if(this.pointerDown){
				this.pointerDown = false;
				this.releaseAllKeys();
			}
		});
		this.addEventListener("pointerup", e => {
			if(this.pointerDown){
				this.pointerDown = false;
				this.releaseAllKeys();
			}
		});
		
	}

	indicateKey(keyNum, state = false){
		this.elements.forEach(el => {
			if(el.keyNum == keyNum){
				if(state){
					el.classList.add("active");
				} else {
					el.classList.remove("active");
				}
				
			}
		});
	}

	generateController(min, max){
		let el = document.createElement("div");
		el.classList.add("controller");
		this.elements = [];
		
		let child;
		switch(this.type){
			case "launchpad":
			for(let row = 0; row<this.rows; row++){
				for(let col = 0; col<this.cols; col++){
					child = this.generatePad(row,col);
					el.appendChild(child);
					this.elements.push(child);
				}
			}
			
			break;

			default:
			for(let keyNum = min; keyNum<=max; keyNum++){
				child = this.generateKey(keyNum);
				el.appendChild(child);
				this.elements.push(child);
			}
			break;

		}
			
		
		return el;
	}

	generatePad(row,col){
		let el = document.createElement("div");
		el.classList.add("pad");
		let rect = this.rowAndColToRect(row,col);
		setElementRect(el, rect);
		

		let index = row * this.cols + col - (row * this.overlap);
		let octave = Math.floor(index / this.scale.length);
		let relIndex = index % this.scale.length;
		let keyNum = this.min + octave * this.scaleMod + this.scale[relIndex];
		

		if(!relIndex){
			el.classList.add("root");
		}
		el.keyDown = false;
		el.keyNum = keyNum;
		el.value = keyNum;
		this.addLabel(el, index);
		this.addKeyCommand(el, index)

		this.addEventListeners(el);
		return el;
	}

	rowAndColToRect(row,col){
		let rect = {};
		rect.x = col / this.cols * (this.width + this.padMargin);
		rect.y = (1 - (row+1) / this.rows) * (this.height + this.padMargin);
		rect.width = (this.width - this.padMargin * (this.cols-1)) / this.cols;
		rect.height = (this.height - this.padMargin * (this.rows -1)) / this.rows;
		return rect;
	}

	generateKey(keyNum){

		let el = document.createElement("div");
		el.classList.add("key");
		el.classList.add(isBlackKey(keyNum) ? "black" : "white");

		let rect = this.keyNumToRect(keyNum);
		setElementRect(el, rect);

		el.keyDown = false;
		el.keyNum = keyNum;
		el.value = keyNum;

		let index = keyNum-this.min;
		this.addLabel(el, index);
		this.addKeyCommand(el, index)
		this.addEventListeners(el);
		return el;
	}

	addEventListeners(el){

		this.pointerDown = false;

		el.addEventListener("pointerenter", e => {
			if(this.pointerDown && !el.keyDown){
				el.keyDown = true;
				this.dispatchEvent(new CustomEvent("down", {detail:{key: el}}));
				this.releaseAllKeys([el]);	
			}
		});
		el.addEventListener("pointerdown", e => {
			e.preventDefault();
			this.pointerDown = true;
			el.keyDown = true;
			// el.classList.add("active");
			this.dispatchEvent(new CustomEvent("down", {detail:{key: el}}));
		});
		el.addEventListener("pointerup", e => {
			el.keyDown = false;
			this.pointerDown = false;
			// el.classList.remove("active");
			this.dispatchEvent(new CustomEvent("up", {detail:{key: el}}));
		});
	}



	

	releaseAllKeys(omit = []){
		this.elements.forEach(el => {
			if(el.keyDown && !omit.includes(el)){
				el.keyDown = false;
				el.classList.remove("active");
				this.dispatchEvent(new CustomEvent("up", {detail:{key: el}}));
			}
		});
	}
	
	
	keyNumToRect(keyNum){
		let rect = {};
		rect.x = this.whiteKeyNumToX(keyNum);
		rect.y = 0;

		if(isBlackKey(keyNum)){
			let blackKeyWidth = this.whiteKeyWidth * 0.7;
			let blackKeyHeight = this.height * 0.6;
			rect.x += this.whiteKeyWidth - blackKeyWidth / 2;
			rect.width = blackKeyWidth;
			rect.height = blackKeyHeight;
		} else {
			rect.width = this.whiteKeyWidth;
			rect.height = this.height;
		}
		return rect;
	}
	

	whiteKeyNumToX(keyNum){
		let keyIndex = whiteKeyIndex(keyNum);
		return (keyIndex - this.minIndex) / this.range * this.width;
	}
	addLabel(el, index){
		if(this.labels.length){
			el.innerHTML = this.labels[index % this.labels.length];
		}
	}

	addKeyCommand(el, index){
		if(index<this.keyCommands.length){
			el.keyCommand = this.keyCommands[index];
		}
	}

}

function isBlackKey(keyNum){
	return [1,3,6,8,10].includes(keyNum % 12);
}
function nearestWhiteKey(keyNum, dir = -1){
	return isBlackKey(keyNum) ? keyNum + dir : keyNum;
}

function whiteKeyIndex(keyNum){
	let wk = nearestWhiteKey(keyNum);
	let octave = Math.floor(wk / 12);
	let relKey = wk % 12;
	return [0,2,4,5,7,9,11].indexOf(relKey) + octave * 7;
}

function setElementRect(el, rect){
	el.style.left = `${rect.x}px`;
	el.style.top = `${rect.y}px`;
	el.style.width = `${rect.width}px`;
	el.style.height = `${rect.height}px`;
}





module.exports = MIDIController;
