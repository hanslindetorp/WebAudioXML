var WebAudioUtils = require('./../WebAudioUtils.js');


class Channel extends EventTarget {

	constructor(index, channelObject, waxml=window.waxml){
		super();
		this.waxml = waxml;

		this.min = -30;
		this.max = 0;
		this.high = 0;
		this.init(index, channelObject);
		
	}

	connectedCallback(){
		if(!this.inited){
			// this.init();
		}
		
	}


	init(index, channelObject){

		let tr, td;
		tr = document.createElement("tr");

		td = document.createElement("td");
		td.innerHTML = channelObject.id;

		let UVmeter = document.createElement("waxml-meter");
		UVmeter.setAttribute("type", "loudness");
		UVmeter.setAttribute("width", "100px");
		UVmeter.setAttribute("height", "10px");
		UVmeter.setAttribute("timeframe", "2s");
		UVmeter.setAttribute("maxDecibels", "0");
		UVmeter.setAttribute("minDecibels", "-40");

		UVmeter.setAttribute("colors", "green, yellow, red");
		UVmeter.setAttribute("segments", "60,20,20");
		
		UVmeter.setAttribute("input", `#${channelObject.id}`);
		td.appendChild(UVmeter);
		tr.appendChild(td);


		td = document.createElement("td");
		let meter = document.createElement("meter");
		this.setAttributes(meter, {
			min: this.min,
			max: this.max,
			high: this.high,
			value: 0
		})
		td.appendChild(meter);
		tr.appendChild(td);
		this.meter = meter;


		td = document.createElement("td");
		let btn = document.createElement("button");
		btn.innerHTML = index;
		btn.addEventListener("click", e => {
			this.dispatchEvent(new CustomEvent("change", {detail: {index: index}}));
		});
		td.appendChild(btn);
		tr.appendChild(td);

		this.el = tr;

		channelObject.addEventListener("change", e => {
			// console.log(e.detail);
			this.animateTo(e.detail.value, e.detail.time * 1000);
		});
		return this;
	}
	animateTo(targetValue, time){

		if(this.timeOut){
			clearTimeout(this.timeOut);
		}
		targetValue = WebAudioUtils.powerTodB(targetValue, 1);
		targetValue = Math.max(this.min, Math.min(targetValue, this.max));

		let steps = Math.ceil(Math.min(time / 10, 100));
		steps = Math.max(1, steps);
		let curVal = parseFloat(this.meter.value);
		let diff = targetValue - curVal;
		let step = 0;

		let fn = () => {
			this.meter.value = curVal + diff * (++step / steps);
			// this.meter.value = Math.max(this.min, Math.min(val, this.max));
			if(step < steps){
				this.timeOut = setTimeout(fn, time / steps);
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

module.exports = Channel;
