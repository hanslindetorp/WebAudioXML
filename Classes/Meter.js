

class Meter extends HTMLElement {

	constructor(){
		super();
		this.sources = [];
	}

	connectedCallback(){
		this.type = this.getAttribute("type") ||"loudness";
		this.type = this.type.toLowerCase();

		let w = parseFloat(this.getAttribute("width"));
		let h = parseFloat(this.getAttribute("height"));

		this.inputSelector = this.getAttribute("input");

		switch(this.type){
			case "loudness":
			this.draw = this.drawLoudness;
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
		let colors = this.getAttribute("colors") || "";
		this.colors = colors.split(",");
		
		switch(this.type){
			case "loudness":
			fftSize = fftSize || 2048;
			this.colors = this.colors.length ? this.colors : ["green", "yellow", "red"]

			this.input = new BiquadFilterNode(audioContext, {type: "highpass", frequency: 200});
			this.input.connect(this.analyser);
			let timeFrame = this.getAttribute("timeFrame") || this.getAttribute("timeframe") || "";
			switch(timeFrame){
					
				case "short":
				timeFrame = 2;
				break;

				case "true":
				timeFrame = 0;
				break;

				case "momentary":
				default:
				let timeScale = timeFrame.includes("ms") ? 0.001 : 1;
				timeFrame = parseFloat(timeFrame || 0.4) * timeScale;
				break;

			}
			this.timeFrame = timeFrame;
			this.peakArray = [];
			break;

			case "fft":
			fftSize = fftSize || 2048;
			this.input = this.analyser;
			this.colors = this.colors.length ? this.colors : ["green", "yellow", "red"]
			break;

			case "oscilloscope":
			fftSize = fftSize || 4096;
			this.input = this.analyser;
			this.colors = this.colors = this.colors.length ? this.colors :  ["#ccc", "yellow"];
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

		
		let colorRegions = this.getAttribute("segments") || this.getAttribute("colorregions");
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
		source.connect(this.input);
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

	drawLoudness(){
		this.analyser.getByteTimeDomainData(this.dataArray);

		let curTime = this.analyser.context.currentTime;

		// remove old peaks
		let startTime = Math.max(curTime, curTime - this.timeFrame);
		this.peakArray = this.peakArray.filter(peak => peak.time > startTime);

		// add new peak
		let peakPower = 0;
		for (let i = 0; i < this.dataArray.length; i++) {
		  let power = ((this.dataArray[i]-128)/128) ** 2;
		  peakPower = Math.max(power, peakPower);
		}
		let peakDecibels = 10 * Math.log10(peakPower);
		peakDecibels = Math.max(peakDecibels, this.analyser.minDecibels);
		this.peakArray.push({amplitude: peakDecibels, time: curTime});

		// calculate average
		let avg = this.peakArray.reduce((a,b) => {
			return {amplitude: a.amplitude + b.amplitude};
		}).amplitude / this.peakArray.length;

		let range = this.analyser.maxDecibels - this.analyser.minDecibels;
		// let relPeak = 1 + peakDecibels / range;
		avg = Math.min(avg, this.analyser.maxDecibels);
		avg = Math.max(avg, this.analyser.minDecibels);
		avg -= this.analyser.minDecibels;
		let relPeak = avg / range;
		
		if(relPeak > this.relPeak){ //relPeak > this.relPeak){
			// quick raise to new peak
			this.relPeak = relPeak;
		} else {
			// slow fall-off to lower value
			let diff = relPeak - this.relPeak;
			this.relPeak += diff / 10;
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

module.exports = Meter;
