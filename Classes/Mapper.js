

class Mapper{
  	
  	
	constructor(str = ""){
		
		let arr = str ? str.split(",") : null;
		let obj = {};
		
		if(arr){			
		  	obj.minIn = Number(arr.shift());
		  	obj.maxIn = Number(arr.shift());
		  	obj.minOut = Number(arr.shift());
		  	obj.maxOut = Number(arr.shift());
		  	obj.exp = arr.shift();	
		  	if(Number(obj.exp) == obj.exp){obj.exp = "Math.pow(x, " + obj.exp + ")"};		  	
	  	} 
				
		this.minIn = typeof obj.minIn == "number" ? obj.minIn : 0;
		this.maxIn = typeof obj.maxIn == "number" ? obj.maxIn : 1;
		this.rangeIn = this.maxIn - this.minIn;
		
		
		this.minOut = typeof obj.minOut == "number" ? obj.minOut : 0;
		this.maxOut = typeof obj.maxOut == "number" ? obj.maxOut : 1;
		this.rangeOut = this.maxOut - this.minOut;
		this.exp = obj.exp || "x";
				
	}
	
	
	getValue(x){
		
		//x = Math.max(x, this.minIn);
		//x = Math.min(x, this.maxIn);
		
		let valIn = this.exp == "x" ? x : eval(this.exp);
		
		let relVal = (valIn - this.minIn)/this.rangeIn;
		let valOut = relVal * this.rangeOut + this.minOut;
		
		return valOut;
	}
	
}
	
module.exports = Mapper;