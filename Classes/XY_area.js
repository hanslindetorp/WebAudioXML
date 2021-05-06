

class XY_area extends HTMLElement {

	constructor(){
		super();
		this.style.position = "relative";
		this.style.backgroundColor = this.getAttribute("background-color") || "#555";

		// grid
		let columns = parseInt(this.getAttribute("columns") || 10);
		let rows = parseInt(this.getAttribute("rows") || 10);
		let gridColor = this.getAttribute("grid-color") || "black";

		let colWidth = 100 / columns;
		let rowHeight = 100 / rows;

		this.style.backgroundImage = `linear-gradient(${gridColor} 1px, transparent 0),
		linear-gradient(90deg, ${gridColor} 1px, transparent 0)`;
		this.style.backgroundSize = `${colWidth}% ${rowHeight}%`;

		this.style.touchAction = "none";

	}
	connectedCallback() {
	}
}

module.exports = XY_area;
