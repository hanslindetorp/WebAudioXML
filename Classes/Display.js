

class Display extends HTMLElement {

	constructor(){
		super();
		this.sources = [];
	}

	connectedCallback(){
		this.type = this.getAttribute("type") ||"VU";
		this.type = this.type.toLowerCase();

		let w = parseFloat(this.getAttribute("width"));
		let h = parseFloat(this.getAttribute("height"));

		// sets a lower limit for visualized amplitude
		this.inputSelector = this.getAttribute("input");

		switch(this.type){
			case "vu":
			this.draw = this.drawVU;
			w = w ||200;
			h = h ||20;
			break;

			case "fft":
			this.draw = this.drawFFT;
			w = w ||200;
			h = h ||100;
			break;

			case "oscilloscope":
			this.draw = this.drawOscilloscope;
			w = w ||200;
			h = h ||100;
			break;

			default:
			this.draw = () => {};
			break;

		}
		this.canvas = document.createElement("canvas");
		this.appendChild(this.canvas);
		this.canvasCtx = this.canvas.getContext("2d");
		
		this.canvasCtx.lineWidth = 2;
		this.canvasCtx.strokeStyle = "rgb(0, 0, 0)";

		this.width = w;
		this.height = h;

		this.canvas.width = w;
		this.canvas.height = h;

		this.style.display = "block";
		this.style.width =  `${w}px`;
		this.style.height =  `${h}px`;
	}


	init(audioContext){
		this.inited = true;
		this.analyser = audioContext.createAnalyser();
		let fftSize = this.getAttribute("fftSize") || this.getAttribute("fftsize");
		
		switch(this.type){
			case "vu":
			fftSize = fftSize || 2048;
			break;

			case "fft":
			fftSize = fftSize || 2048;
			break;

			case "oscilloscope":
			fftSize = fftSize || 4096;
			break;
		}
		if(fftSize){
			fftSize = parseInt(fftSize);
			let pow = Math.log2(fftSize)
			pow = Math.round(pow);
			this.analyser.fftSize = 2 ** pow;
		}
		this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

		let maxDecibels = this.getAttribute("maxDecibels") || this.getAttribute("maxdecibels");
		if(maxDecibels){this.analyser.maxDecibels = parseFloat(maxDecibels)}

		let minDecibels = this.getAttribute("minDecibels") || this.getAttribute("mindecibels");
		if(minDecibels){this.analyser.minDecibels = parseFloat(minDecibels)}
		this.relPeak = minDecibels;
		
		let halfSampleRate = audioContext.sampleRate / 2;
		let minFrequency = this.getAttribute("minFrequency") || this.getAttribute("minfrequency");
		minFrequency = minFrequency ? parseFloat(minFrequency) : 0;
		this.firstIndex = Math.floor(minFrequency / halfSampleRate * this.analyser.frequencyBinCount);

		let maxFrequency = this.getAttribute("maxFrequency") || this.getAttribute("maxfrequency");
		maxFrequency = maxFrequency ? parseFloat(maxFrequency) : halfSampleRate;
		this.lastIndex = Math.floor(maxFrequency / halfSampleRate * this.analyser.frequencyBinCount);

		let colors = this.getAttribute("colors");
		this.colors = colors ? colors.split(",") : ["green", "yellow", "red"];
		
		let colorRegions = this.getAttribute("colorRegions") || this.getAttribute("colorregions");
		if(colorRegions){
			this.colorRanges = JSON.parse(`[${colorRegions}]`);
			let sum = this.colorRanges.reduce((a,b) => a + b);
			this.colorRanges = this.colorRanges.map(el => el / sum).map((el, i, arr) => {
				if(i){
					return el + arr[i-1];
				} else {
					return el;
				}
			});
			this.colorRanges.unshift(0);
			this.colorRanges.pop();

		} else {
			this.colorRanges = [0,0.6,0.8];
		}
		this.colorBackwardsRanges = this.colorRanges.sort((a,b) => a > b)
		

		this.update();
	}

	inputFrom(source){
		if(!source){return -1;}
		if(!this.inited){
			this.init(source.context);
		}
		this.sources.push(source);
		source.connect(this.analyser);
	}

	connect(target){
		this.analyser.connect(target);
	}

	disconnect(source){
		if(source){
			source.disconnect(0);
			this.sources = this.sources.filter(src => src != source);
		} else {
			while(this.sources.length){
				let src = this.sources.pop();
				src.disconnect(0);
			}
		}
	}

	update(){
		this.canvasCtx.clearRect(0, 0, this.width, this.height);
		this.draw();
		requestAnimationFrame(e => this.update());
	}

	drawVU(){
		this.analyser.getByteTimeDomainData(this.dataArray);

		let peakPower = 0;
		for (let i = 0; i < this.dataArray.length; i++) {
		  let power = ((this.dataArray[i]-128)/128) ** 2;
		  peakPower = Math.max(power, peakPower);
		}
		let peakDecibels = 10 * Math.log10(peakPower);
		peakDecibels = Math.max(peakDecibels, this.analyser.minDecibels);

		let range = this.analyser.maxDecibels - this.analyser.minDecibels;
		let relPeak = 1 + peakDecibels / range;
		
		if(relPeak > this.relPeak){
			this.relPeak = relPeak;
		} else {
			let diff = relPeak - this.relPeak;
			this.relPeak += diff / 100;
		}

	
		this.colorRanges.forEach((range, i, arr) => {
			if(this.relPeak > range){
				let y = 0;
				let x1 = range * this.width;
				let x2 = Math.min(this.relPeak, arr[i+1] || 1) * this.width;
				let w = x2 - x1;
				this.canvasCtx.fillStyle = this.colors[i];
				this.canvasCtx.fillRect(x1, y, w, this.height);
			}
		});

		
		
	}

	

	drawFFT(){
		this.analyser.getByteFrequencyData(this.dataArray);

		const barWidth = (this.width / (this.lastIndex-this.firstIndex));
		let barHeight;
		this.canvasCtx.fillStyle = "red";
	  
		for (let i = this.firstIndex; i < this.lastIndex; i++) {
			let relVal = this.dataArray[i] / 255;
			barHeight = relVal * this.height;
		//   this.canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
			let colorIndex = this.colorRanges.reverse().findIndex(range => {
				return relVal > range;
			});

			let color = this.colors.reverse()[colorIndex];
			this.canvasCtx.fillStyle = color;
			this.canvasCtx.fillRect(i * barWidth, this.height - barHeight, barWidth, barHeight);
		}

	}

	drawOscilloscope() {
		this.analyser.getByteTimeDomainData(this.dataArray);
		let maxVal = 256;
		let sampleCnt = this.dataArray.length / 2;
		let sliceWidth = this.width / sampleCnt;

		
		let lastVal = this.dataArray[0];
		let increasing = false;
		let belowZero = false;
		let firstCycle = true;
		let offset = 0;

		// zero crossing line
		this.canvasCtx.beginPath();
		this.canvasCtx.strokeStyle = "#ccc";
		this.canvasCtx.lineWidth = 0.5;
		this.canvasCtx.setLineDash([5,2]);
		this.canvasCtx.moveTo(0, this.height / 2);
		this.canvasCtx.lineTo(this.width, this.height / 2);
		this.canvasCtx.stroke();



		this.canvasCtx.beginPath();
		this.canvasCtx.strokeStyle = "yellow";
		this.canvasCtx.lineWidth = 1;
		this.canvasCtx.setLineDash([]);


		// find lowest val
		let minVal = Math.min(...this.dataArray);
		let minIndex = this.dataArray.indexOf(minVal);

		for (let i = minIndex; i < (sampleCnt+offset); i++) {
			let curVal = this.dataArray[i];


			if(!offset){
				belowZero = curVal < maxVal / 2;
				if(!belowZero){
					// found zero crossing
					offset = i;
				} else {
					continue;
				}

				// increasing = curVal > lastVal;
				// if(increasing && firstCycle){
				// 	belowZero = curVal < maxVal / 2;
				// }
			}

			let x = (i - offset) * sliceWidth;
			let y = (curVal / maxVal) * this.height;

			if (!i) {
				this.canvasCtx.moveTo(x, y);
			} else {
				this.canvasCtx.lineTo(x, y);
			}
		}
		//canvasCtx.lineTo(canvas.width, canvas.height / 2);
		this.canvasCtx.stroke();
	}



}

module.exports = Display;
