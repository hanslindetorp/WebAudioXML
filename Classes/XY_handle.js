var WebAudioUtils = require('./WebAudioUtils.js');

class XY_handle extends HTMLElement {

	constructor(){
		super();
		this.style.position = "absolute";
		this.style.minWidth = this.getAttribute("width") || this.getAttribute("size")  || "20px";
		this.style.minHeight = this.getAttribute("height") || this.getAttribute("size") || "20px";
		this.style.backgroundColor = this.getAttribute("background-color") || "#555";
		this.style.color = this.getAttribute("color") || "#fff";
		this.style.border = "2px solid black";
		this.style.boxSizing = "border-box";
		this.style.borderRadius = parseFloat(this.style.minWidth) / 2 + "px";
		this.style.fontFamily = "sans-serif";
		this.style.fontSize = this.getAttribute("font-size") || "10px";
		this.style.textAlign = "center";
		this.style.verticalAlign = "middle";
		this.style.lineHeight = "1.3em";
		this.style.padding = "3px";
		this.style.cursor = "pointer";

		// ensure that the XY_area has a specified position
		this.parentElement.style.position = this.parentElement.style.position || "relative";

		this.initRects();

		let dir = this.getAttribute("direction") || "xy";
		this.direction = {
			x: dir.includes("x"),
			y: dir.includes("y")
		}


		let sources = this.getAttribute("sources") || "x, y, angle, radius, dragged";
		this.sources = WebAudioUtils.split(sources).map(item => item.trim());

		let targets = this.getAttribute("targets") || this.dataset.waxmlTargets || "x, y, angle, radius, dragged";
		this.targets = WebAudioUtils.split(targets).map(item => {
			return item.split("$").join("").trim();
		});

		let type = this.parentElement.getAttribute("type") || "square";
		let x =  this.getAttribute("x") || (type == "circle" ? 0.5 : 0);
		let y = this.getAttribute("y") || (type == "circle" ? 0.5 : 0);

		this.x = parseFloat(x);
		this.y = parseFloat(y);
		this._angle = this.XYtoAngle();
		this._radius = this.XYtoRadius();

		this._angleOffset = this.getAttribute("angleoffset");

		this.move(this.x, this.y);



		this.addEventListener("pointerdown", e => this.pointerDown(e), false);

		this.addEventListener("pointerup", e => {
			this.dragged = false;
			this.dispatchEvent(new CustomEvent("input"));
			this.classList.remove("dragged");
		}, false);

		this.addEventListener("pointermove", e => this.pointerMove(e), false);

		this.style.touchAction = "none";

	}

	pointerDown(e){
		this.initRects();
		this.dragged = true;
		this.clickOffset = {x: e.offsetX, y:e.offsetY};
		this.setPointerCapture(e.pointerId);
		this.pointerMove(e);
	}

	pointerMove(e){
		//event.preventDefault();
		if(this.dragged){

			if(this.direction.x){
				let x = e.clientX-this.clickOffset.x-this.boundRect.left;
				x = Math.max(0, Math.min(x, this.boundRect.width));
				this.x = x / this.boundRect.width;
				this.style.left = `${x}px`;
			}

			if(this.direction.y){
				let y = e.clientY-this.clickOffset.y-this.boundRect.top;
				y = Math.max(0, Math.min(y, this.boundRect.height));
				this.y = y / this.boundRect.height;
				this.style.top = `${y}px`;
			}

			if(this.parentElement.type == "circle"){
				// make sure handle is inside circle boundaries
				let radius = this.getProperty("radius");
				if(radius > 1){
					radius = 1;
					let angle = (this.XYtoAngle() + 0.5) % 1;
					let XY = this.angleRadiusToXY(angle, 1);
					this.x = XY.x;
					this.y = XY.y;
					this.move(XY.x, XY.y);
					// this.style.left = `${this.x * this.boundRect.width}px`;
					// this.style.top = `${this.y * this.boundRect.height}px`;
				}
				this._radius = radius;
				this._angle = this.XYtoAngle();

			}
			this.dispatchEvent(new CustomEvent("input"));
		}
	}

	rectOffset(rect, pix = 0){
		return new DOMRectReadOnly(rect.x-pix, rect.y-pix, rect.width+pix*2, rect.height+pix*2);
	}

	insideRect(point, rect){
		return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
	}

	pointsOver(points){
		let br = this.getBoundingClientRect();
		br = this.rectOffset(br, 30);
		let inside = false;
		points.forEach(point => inside = this.insideRect(point, br) || inside);

		if(inside) this.classList.add("remoteOver");
		else this.classList.remove("remoteOver");		
	}

	remoteControl(points){
		
		let br;

		if(this.isRemoteControlled){
			br = this.parentElement.getBoundingClientRect();
		} else {
			br = this.getBoundingClientRect();
			br = this.rectOffset(br, 25);
		}

		let point = points.filter(point => this.insideRect(point, br)).pop();
		
		if(point){
			// inside area
			let val = this.coordinateTovalue(point);
			this.value = val;
			this.isRemoteControlled = true;

			if(this.direction.x){
				this.style.left = `${this.x * this.boundRect.width}px`;
			}
			if(this.direction.y){
				this.style.top = `${this.y * this.boundRect.height}px`;
			}
			this.dispatchEvent(new CustomEvent("input"));

			this.classList.add("remoteControl");
		} else {
			this.classList.remove("remoteControl");
			this.isRemoteControlled = false;
		}
		
	}

	coordinateTovalue(point){

		let br = this.parentElement.getBoundingClientRect();
		let x = (point.x-br.left)/br.width;
		let y = (point.y-br.top)/br.height;
		return {x: x, y: y}
	}

	update(key, val){
		
		if(key == "x" && this.direction.x){
			this.x = x;
			this.style.left = `${x * this.boundRect.width}px`;
		}
		if(key == "y" && this.direction.y){
			this.y = y;
			this.style.top = `${y * this.boundRect.height}px`;
		}
		this.dispatchEvent(new CustomEvent("input"));

	}

	get dragged(){
		return this._dragged;
	}

	set dragged(state){
		this._dragged = state;
		if(state){
			this.classList.add("changed");
			this.classList.add("dragged");
		} else {
			this.classList.remove("dragged");
		}
	}

	get value(){
		// if(this.direction.x && this.direction.y){
		// 	return [this.x, this.y];
		// } else if(this.direction.x){
		// 	return this.x;
		// } else if(this.direction.y){
		// 	return this.y;
		// }
		
		let values = this.sources.map(source => {
			return this.getProperty(source);
		});
		return values;
		
	}

	getProperty(prop, x = this.x, y = this.y){
		let deltaX, deltaY, rad, angle;
		switch(prop){
			case "x":
			return x;
			break;

			case "y":
			return y; 
			break;

			case "angle":
			// offset with stored value
			let angle = this.XYtoAngle(x, y);
			angle = (angle + this._angleOffset) % 1;
			return angle;
			break;
			

			case "radius":
			deltaX = (x * 2)-1;
			deltaY = (y * 2)-1;
			return this.XYtoRadius(x, y);
			break;

			case "dragged":
			return this.dragged ? 1 : 0;
			break;

		}
	}	


	angleRadiusToXY(angle = this._angle, radius = this._radius){
		let obj = {};
		obj.x = (radius - Math.cos(Math.PI * 2 * angle)) / 2;
		obj.y = (radius - Math.sin(Math.PI * 2 * angle)) / 2;
		return obj;
	}

	XYtoRadius(x = this.x, y = this.y){
		let deltaX = (x * 2)-1;
		let deltaY = (y * 2)-1;
		return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
	}

	XYtoAngle(x = this.x, y = this.y){
		let deltaX = (x * 2) - 1;
		let deltaY = (y * 2) - 1;
		let rad = Math.atan2(deltaY, deltaX);
		// convert to 0-1 with 0 being x=1, y=0
		return (0.5 + (rad / Math.PI + 1) / 2) % 1;
	}

	set value(point){
		this.x = Math.max(0, Math.min(1, point.x));
		this.y = Math.max(0, Math.min(1, point.y));
	}

	set angle(val){
		this._angle = val;
		let XY = this.angleRadiusToXY(val);
		this.move(XY.x, XY.y);
	}

	set radius(val){
		this._radius = val;
		let XY = this.angleRadiusToXY();
		this.move(XY.x, XY.y);
	}

	set angleOffset(val = 0){
		val = parseFloat(val);
		val = Math.max(0, Math.min(val, 1));
		this._angleOffset = val;
	}

	get angleOffset(){
		return this._angleOffset || 0;
	}

	initRects(){

		this.rect = this.getBoundingClientRect();
		let br = this.parentNode.getBoundingClientRect();
		this.boundRect = {
			left: br.left,
			top: br.top,
			width: br.width - this.rect.width,
			height: br.height - this.rect.height
		};
	}

	move(x, y){
		if(this.direction.x)this.style.left = x * this.boundRect.width + "px";
		if(this.direction.y)this.style.top = y * this.boundRect.height + "px";
	}
	connectedCallback() {

	}
}

module.exports = XY_handle;
