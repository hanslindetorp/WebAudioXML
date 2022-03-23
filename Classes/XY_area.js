

class XY_area extends HTMLElement {

	constructor(){
		super();
		// this.style.backgroundColor = this.getAttribute("background-color") || "#555";

		// grid
		let columns = parseInt(this.getAttribute("columns") || 1);
		let rows = parseInt(this.getAttribute("rows") || 1);

		if(columns * rows > 1){
			let gridColor = this.getAttribute("grid-color") || "black";

			let colWidth = 100 / columns;
			let rowHeight = 100 / rows;
	
			this.style.backgroundImage = `linear-gradient(${gridColor} 1px, transparent 0),
			linear-gradient(90deg, ${gridColor} 1px, transparent 0)`;
			this.style.backgroundSize = `${colWidth}% ${rowHeight}%`;
		}

		this.style.touchAction = "none";
		this.style.display = "block";

	}



	rectOffset(rect, pix = 0){
		return new DOMRectReadOnly(rect.x-pix, rect.y-pix, rect.width+pix*2, rect.height+pix*2);
	}

	insideRect(point, rect){
		return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
	}

	pointsOver(points){
		this.querySelectorAll("waxml-xy-handle").forEach(handle => {
			let br = handle.getBoundingClientRect();
			br = this.rectOffset(br, 25);
			let inside = false;
			points.forEach(point => inside = this.insideRect(point, br) || inside);

			if(inside) handle.classList.add("remoteOver");
			else handle.classList.remove("remoteOver");	

			// extra safety to stop handles from beeing controlled
			handle.remoteID = 0;
			handle.classList.remove("remoteControl");
		});	
		
	}

	remoteControl(points){

		let handles = [...this.querySelectorAll("waxml-xy-handle")];
		handles.forEach(handle => {
			let br, point;

			if(handle.remoteID){
				br = this.getBoundingClientRect();
				point = points.filter(point => this.insideRect(point, br) && point.id == handle.remoteID).pop();
			} else {
				br = handle.getBoundingClientRect();
				br = this.rectOffset(br, 25);
				point = points.filter(point => {
					let pointIsInUse = handles.filter(h => h.remoteID == point.id).length > 0;
					let isInside = this.insideRect(point, br);
					// if(isInside && pointIsInUse > 0){
					// 	console.log("colliding");
					// }
					return isInside && pointIsInUse == 0;
				}).pop();
			}
			
			if(point){
				//points = points.filter(point => !this.insideRect(point, br));

				handle.remoteID = point.id;

				let val = this.coordinateTovalue(point);
				handle.value = val;

				if(handle.direction.x){
					handle.style.left = `${handle.x * handle.boundRect.width}px`;
				}
				if(handle.direction.y){
					handle.style.top = `${handle.y * handle.boundRect.height}px`;
				}
				handle.dispatchEvent(new CustomEvent("input"));

				handle.classList.add("remoteControl");
				
			} else {
				handle.remoteID = 0;
				handle.classList.remove("remoteControl");
			}	
		});	
		
	}

	coordinateTovalue(point){

		let br = this.getBoundingClientRect();
		let x = (point.x-br.left)/br.width;
		let y = (point.y-br.top)/br.height;
		x = Math.max(0, Math.min(1, x));
		y = Math.max(0, Math.min(1, y));
		return {x: x, y: y}
	}



	connectedCallback() {
	}
}

module.exports = XY_area;
