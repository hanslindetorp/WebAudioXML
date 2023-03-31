

class XY_area extends HTMLElement {

	constructor(){
		super();
	}


	connectedCallback(){
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


		let extCtrl = this.getAttribute("external-control");
		if(extCtrl){
			extCtrl = extCtrl.split(",");
			extCtrl.forEach((str, i) => extCtrl[i] = str.trim());
			this.externalControl = extCtrl;
		}



		this.style.touchAction = "none";
		this.style.display = "inline-block"; // not good

		let w = parseFloat(this.getAttribute("width")) || 200;
		let h = parseFloat(this.getAttribute("height")) || 200;
		this.style.width =  `${w}px`;
		this.style.height =  `${h}px`;
		this.style.boxSizing = "border-box";
		this.style.backgroundColor = this.getAttribute("background-color") || "#CCC";
		this.style.border = this.getAttribute("border") || "1px solid black";

		this.style["-webkit-touch-callout"] = "none"; /* iOS Safari */
    	this.style["-webkit-user-select"] = "none"; /* Safari */
    	this.style["-khtml-user-select"] = "none"; /* Konqueror HTML */
		this.style["-moz-user-select"] = "none"; /* Old versions of Firefox */
        this.style["-ms-user-select"] = "none"; /* Internet Explorer/Edge */
        this.style["user-select"] = "none"; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */


		this.colWidth = w / columns;
		this.rowHeight = h / rows;
		
		this.type = this.getAttribute("type") || "square";
		switch(this.type){
			case "square":
			break;

			case "circle":
			this.style.borderRadius = `${parseFloat(this.style.width) / 2}px`;
			break;
		}


		this.initialRect = this.getBoundingClientRect();

		let catchHandles = this.querySelectorAll("waxml-xy-handle[catch]");
		if(catchHandles.length){
			this.style.cursor = "pointer";
			let eventName = catchHandles[0].getAttribute("catch");
			if(eventName == "true"){eventName = "pointerdown"}
			this.addEventListener(eventName, e => {
				let data = {
					clientX: e.clientX,
					clientY: e.clientY,
					pointerId: e.pointerId,
					preventDefault: () => {}
				}
				catchHandles.forEach(handle => {
					let br = handle.getBoundingClientRect();
					data.offsetX = -br.width / 2;
					data.offsetY = -br.height / 2;
					
					handle.pointerDown(data);
					handle.pointerMove(data);
				});
			});
		} 
		
	}



	rectOffset(rect, pix = 0){
		return new DOMRectReadOnly(rect.x-pix, rect.y-pix, rect.width+pix*2, rect.height+pix*2);
	}

	insideRect(point, rect){
		return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
	}

	pointsWithMatchingID(points){

		let arr = [];

		if(points instanceof Array){
			points.forEach(point => {
				if(point instanceof Object){
					if(this.externalControl.filter(id => point.id == id || id == "true").length > 0){
						arr.push(point);
					}
				}
			});
		} else if(points instanceof Object){
			Object.entries(points).forEach(([pointID, point]) => {
				if(point instanceof Object){
					if(this.externalControl.filter(id => pointID == id || id == "true").length > 0){
						point.id = pointID;
						arr.push(point);
					}
				}
			});
		}
		
		return arr;
	}

	pointsOver(points){
		points = this.pointsWithMatchingID(points);

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
		points = this.pointsWithMatchingID(points);

		let handles = [...this.querySelectorAll("waxml-xy-handle")];
		handles.forEach(handle => {
			let br, point;

			if(handles.length > 1){
				// select corresponding handle
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
			} else {
				// move the only one if inside XY-area
				br = this.getBoundingClientRect();
				point = points.filter(point => this.insideRect(point, br)).pop();
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


}

module.exports = XY_area;
