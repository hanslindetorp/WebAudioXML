var WebAudioUtils = require('./WebAudioUtils.js');
var Range = require('./Range.js');

class Mapper{


	constructor(params){

		this.params = params;

		if(params.map){
			this.minIn = params.map.minIn;
			this.maxIn = params.map.maxIn;
			this.minOut = params.map.minOut;
			this.maxOut = params.map.maxOut;
			this.conv = params.map.conv;
		}

		this.steps = params.steps;
		this.curve = params.curve;
		this.value = params.value;
		if(params.range){
			this.range = new Range(params.range);
		}
	}


	getValue(x){

		if(typeof this.minIn == "undefined"){return x}

		let rangeObj, targetRange, relVal, rangeIn, rangeOut, valOut;

		rangeObj = {
			values: {min: this.minIn, max: this.maxIn},
			index: 0
		}

		if(this.range){
			let ro = this.range.getRange(x);
			if(ro.index == -1){
				rangeObj.values.min = 0;
				rangeObj.values.max = 0;
			} else {
				rangeObj = ro;
			}
		}

		targetRange = rangeObj.values;
		rangeIn = targetRange.max - targetRange.min;
		rangeOut = this.maxOut - this.minOut;
		x = (x - targetRange.min)/rangeIn;


		// kanske kolla alla ranges vilken som ger högst output
		// multiplicera med "gain" för att göra kurvorna brantare

		// crop
		x = Math.max(0, Math.min(x, 1));


		if(this.curve){
			let curve = this.curve[rangeObj.index % this.curve.length];

			switch (curve) {
				case "bell":
					x = this.mapToBell(x);
					console.log(x);
					break;

				case "sine":
					x = Math.sin(2 * x * Math.PI) / 2 + 0.5;
					break;

				case "half-sine":
					x = Math.sin(x * Math.PI);
					break;

				default:
					break;

			}

		}
		// scale
		// use curve and levels (what about max?)
		// to calculate output
		if(this.level){
			let level = this.level[rangeObj.index % this.level.length];

			x = x * level / 100;
		}

		if(x > 1){
			//console.log(x);
		}


		if(this.conv == "MIDI"){
			let noteOffs;
			if(this.steps){
				//let cycle = Math.floor(noteOffs / obj.stepsCycle);
				//let noteInCycle = noteOffs % obj.stepsCycle;

	      let notesInCycle = this.steps.length-1;
				let stepsCycle = this.steps[notesInCycle];
	      let nrOfCycles = rangeOut / stepsCycle;
	      rangeOut = notesInCycle * nrOfCycles + 1;
	      noteOffs = Math.floor(x * rangeOut);

	      let cycle = Math.floor(noteOffs / notesInCycle);
	      let noteInCycle = Math.floor(noteOffs % notesInCycle);
				noteOffs = cycle * stepsCycle + this.steps[noteInCycle];
			} else {
	      noteOffs = Math.floor(x * rangeOut);
	    }
			valOut = WebAudioUtils.MIDInoteToFrequency(this.minOut + noteOffs);

		} else {
			valOut = eval(this.conv);
			valOut = valOut * rangeOut + this.minOut;
		}


		return valOut;
	}

	mapToBell(x, stdD = 1/4, mean = 0.5, skew = 0){
		//let v = 1;
		//x = Math.sqrt( -2.0 * Math.log( x ) ) * Math.cos( 2.0 * Math.PI * v );

	  //This is the real workhorse of this algorithm. It returns values along a bell curve from 0 - 1 - 0 with an input of 0 - 1.
		// I found the example here: https://codepen.io/zapplebee/pen/ByvmMo

		//https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve

		let max = this.bellFn(0, stdD, mean, skew);
		let min = this.bellFn(mean, stdD, mean, skew);
		x = this.bellFn(x, stdD, mean, skew);
		return (max - x) / (max-min);
	}

	bellFn(x, stdD, mean, skew){
		return  1 / (( 1/( stdD * Math.sqrt(2 * Math.PI) ) ) * Math.pow(Math.E , -1 * Math.pow(x - mean, 2) / (2 * Math.pow(stdD,2))));
	}

}

module.exports = Mapper;
