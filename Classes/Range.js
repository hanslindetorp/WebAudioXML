var WebAudioUtils = require('./WebAudioUtils.js');


class Range {

	constructor(arr){
		this._valueType = "number";
		this.values = [];

			arr.forEach(val => {

				if(val.includes("...")){
					var minMaxStrings = val.split("...");
					var numValMin = parseFloat(minMaxStrings[0]);
					var numValMax = parseFloat(minMaxStrings[1]);

					this.values.push(new MinMax(numValMin, numValMax));
				} else {
					// These lines are used in iMusic. Should it maybe be used here as well?

					// let v = Number(val);
					// if(isNaN(v)){
					// 	this._valueType = "string";
					// } else {
					// 	val = v;
					// }
					// this.values.push(val);
				}
				//this.values.sort();
			});

	}

	getRange(x){
		let i = this.values.findIndex(item => x >= item.min && x <= item.max);
		return {values: this.values[i], index: i}
	}

	get value(){

		return Range.getRandomVal(this.values);

	}

	getRandomVal(dec, fn){
		return Range.getRandomVal(this.values, dec, fn);
	}


	get min() {
		return this.values[0];
	}

	get max(){
		return this.values[this.values.length-1];
	}

	get type(){
		return this._valueType;
	}

	get isNumber(){
		return this._valueType == "number";
	}


}

Range.getRandomVal = function(arr, dec, fn){

	if(!arr){return 0}
	if(!arr.length){return 0}


	var ln = fn == "other" ? arr.length - 1 : arr.length;
	var rnd = Math.floor(Math.random()*ln);
	var val;
	dec = dec || 0;

	// pick from array
	switch(fn){
		case "remove":
		val = arr.splice(rnd, 1).pop();
		break;

		case "other":
		val = arr.splice(rnd, 1).pop();
		arr.push(val);
		break;

		case "sequence":
		val = arr.shift();
		arr.push(val);
		break;

		case "shuffle":
		default:
		val = arr[rnd];
		break;
	}

	if(val instanceof MinMax){

		// random between two values

		var range = val.max-val.min+1;
		var num = val.min + Math.random()*range;

		var factor = Math.pow(10, dec);
		num*=factor;
		num = Math.floor(num);
		num/=factor;
		val = num;

	}
	return val;

}

class MinMax {

	constructor(min, max){
		this.min = Math.min(min, max);
		this.max = Math.max(min, max);
	}

}




module.exports = Range;
