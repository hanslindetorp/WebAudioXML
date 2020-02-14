


class Range {

	constructor(str){
		
		this.values = [];
		if(str){

			let arr = str.split(",");
			arr.forEach(val => {
				
				if(val.includes("...")){
					var minMaxStrings = val.split("...");
					var numValMin = eval(minMaxStrings[0]);
					var numValMax = eval(minMaxStrings[1]);
					
					this.values.push(new MinMax(numValMin, numValMax));						
				} else {
					this.values.push(Number(val));
				}
				this.values.sort();
				
			});
			
			if(!this.values.length){
				this.values.push({min:0,max:1});
			}
			
		}

	}
	
	
	
	get value(){
		
		return Range.getRandomVal(this.values);
		
	}
	
	getRandomVal(dec, fn){
		return Range.getRandomVal(this.values, dec, fn);
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




module.exports = Range;
