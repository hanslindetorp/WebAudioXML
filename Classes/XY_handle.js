


class XY_handle extends HTMLElement {

	constructor(){
		super();
		this.style.position = "absolute";
		this.style.minWidth = this.getAttribute("width") || this.getAttribute("size")  || "20px";
		this.style.minHeight = this.getAttribute("height") || this.getAttribute("size") || "20px";
		this.style.backgroundColor = this.getAttribute("background-color") || "#555";
		this.style.border = "2px solid black";
		this.style.boxSizing = "border-box";
		this.style.borderRadius = parseFloat(this.style.minWidth) / 2 + "px";
		this.style.fontFamily = "sans-serif";
		this.style.textAlign = "center";
		this.style.verticalAlign = "middle";
		this.style.lineHeight = "1.3em";
		this.style.padding = "3px";
		this.style.cursor = "pointer";

		// ensure that the XY_area has a specified position
		this.parentElement.style.position = this.parentElement.style.position || "relative";

		this.initRects();

		let dir = this.getAttribute("direction");
		this.direction = {
			x: dir.includes("x"),
			y: dir.includes("y")
		}



		let x =  this.getAttribute("x") || 0;
		let y = this.getAttribute("y") || 0;

		this.x = parseFloat(x);
		this.y = parseFloat(y);

		this.move(this.x, this.y);



		this.addEventListener("pointerdown", e => {
			this.initRects();
			this.dragged = true;
			this.clickOffset = {x: e.offsetX, y:e.offsetY};
			this.setPointerCapture(e.pointerId);
		}, false);

		this.addEventListener("pointerup", e => {
			this.dragged = false;
		}, false);

		this.addEventListener("pointermove", e => {
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
				this.dispatchEvent(new CustomEvent("input"));
			}
		}, false);

		this.style.touchAction = "none";

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

	get value(){
		if(this.direction.x && this.direction.y){
			return [this.x, this.y];
		} else if(this.direction.x){
			return this.x;
		} else if(this.direction.y){
			return this.y;
		}
		
	}

	set value(point){
		this.x = Math.max(0, Math.min(1, point.x));
		this.y = Math.max(0, Math.min(1, point.y));
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
