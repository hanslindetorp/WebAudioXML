var WebAudioUtils = require('./WebAudioUtils.js');
var Range = require('./Range.js');

class Mapper{


	constructor(params){

		this.params = params;
		this.sourceValues = [];

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
		this.level = params.level;
		if(params.range){
			this.range = new Range(params.range);
		}

		if(params.mapIn){
			this.mapIn = params.mapIn.sort((a,b) => a-b);
			this.mapOut = params.mapOut || this.mapIn;
			this.minIn = Math.min(...this.mapIn);
			this.maxIn = Math.max(...this.mapIn);
			this.minOut = Math.min(...this.mapOut);
			this.maxOut = Math.max(...this.mapOut);
		}
	}


	getValue(x){

		if(typeof this.minIn == "undefined"){return x}

		x = Math.max(x, this.minIn);
		x = Math.min(x, this.maxIn);

		if(typeof this.minOut != "undefined"){
			return this.mapValueSimple(x);
		} else if(this.mapIn){
			return this.mapValueComplex(x);
		}

	}

	mapValueSimple(x){

		// Hahahaha. "Simple" is maybe not the best word but it refers to the
		// simplified syntax for mapping where minIn, maxIn, minOut, maxOut and
		// convert algorith is specified in one attribute - "map"

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
					//console.log(x);
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


		if(this.conv.includes("MIDI")){
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
			valOut = WebAudioUtils.convert(x, this.conv[0]);
			valOut = valOut * rangeOut + this.minOut;
		}


		return valOut;
	}



	mapValueComplex(x){

		// This method supports a more flexible mapping than the "simple"
		// Given that the attributes "mapIn" and "mapOut" are specified
		// it will use those two (comma- or space separated) vectors to
		// map the incoming value (the variable this object is following)
		// to an "outgoing" value before it stored it in its property "value".

		// There are also posibilities to use different curves between different
		// mapping values to control how values in between the specifed ones
		// are interpolated.

		// The output can be rounded to specific steps using the "steps"
		// attribute. This is useful for mapping values to non-linear output
		// values, like a musical scale. Steps could be one or multiple arrays with values
		// If multiple values are used, then a JSON-formated hierarchical array should be
		// specified with the "steps" attribute. E.g.
		// steps="[[0,2,4,5,7,9,11,12], [0,2,3,5,7,8,10,12]]" for a major + minor scale
				
		// Finally a "convert" algorithm can be specified for
		// each region between the mapOut values. It can be a javascript expression
		// using "x" as the processed value or a preset (like "midi->frequency")


    let i = this.mapIn.findIndex(entry => entry == x);

    if(i != -1){
			// index is one of the in-values
			if(val == this.maxIn){
				return this.maxOut;
			} else {
				return valObj.mapOut[i % valObj.mapOut.length];
			}

    } else {

      // interpolate between two in-values
      let i1 = this.mapIn.findIndex(entry => entry < x);
      let i2 = this.mapIn.findIndex(entry => entry > x);
			let in1 = this.mapIn[i1];
			let in2 = this.mapIn[i2];
			let out1 = this.mapOut[i1 % this.mapOut.length];
			let out2 = this.mapOut[i2 % this.mapOut.length];


      let relInDiff = (x-in1)/(in1-in2);
      let valOutDiff = out1 - out2;
      return out1 + relInDiff * valOutDiff;
    }

		let conv = this.conv[i1 % this.conv.length];


  }

	convertUsingMIDI(x, min, range){

		let noteOffs;
		if(this.steps){
			//let cycle = Math.floor(noteOffs / obj.stepsCycle);
			//let noteInCycle = noteOffs % obj.stepsCycle;

      let notesInCycle = this.steps.length-1;
			let stepsCycle = this.steps[notesInCycle];
      let nrOfCycles = rangeOut / stepsCycle;
      rangeOut = notesInCycle * nrOfCycles + 1;
      noteOffs = Math.floor(x * range);

      let cycle = Math.floor(noteOffs / notesInCycle);
      let noteInCycle = Math.floor(noteOffs % notesInCycle);
			noteOffs = cycle * stepsCycle + this.steps[noteInCycle];
		} else {
      noteOffs = Math.floor(x * range);
    }
		return WebAudioUtils.MIDInoteToFrequency(min + noteOffs);
	}

	convertUsingMath(x, conv){
		if(typeof conv == "number"){
			x = Math.pow(x, conv);
		} else {
			x = eval(conv);
		}

		valOut = valOut * rangeOut + this.minOut;
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
