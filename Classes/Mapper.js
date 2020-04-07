var WebAudioUtils = require('./WebAudioUtils.js'); 

class Mapper{
  	
  	
	constructor(str = "", steps = ""){
		// str is a comma separated string with at least four values
		// minIn, maxIn, minOut, mixOut
		// potentially also a fifth value indicating 
		let arr = str ? str.split(",") : null;
		let obj = {};
		
		if(arr){			
		  	obj.minIn = Number(arr.shift());
		  	obj.maxIn = Number(arr.shift());
		  	obj.minOut = Number(arr.shift());
		  	obj.maxOut = Number(arr.shift());
		  	obj.conv = arr.shift();
		  	
		  	if(obj.conv){
			  	obj.conv = obj.conv.trim();
		  	}
		  	
		  	if(Number(obj.conv) == obj.conv){obj.conv = "Math.pow(x, " + obj.conv + ")"};	
		  	
		  	// backwords compatible
		  	obj.steps = arr.shift() || steps;
		  	if(obj.steps){
			  	obj.steps = obj.steps.trim().split(" ").map(item => parseInt(item, 10));
			  	obj.stepsCycle = obj.steps.pop();
			  	if(!obj.steps.length){
				  	obj.steps.push(0);
			  	}
		  	}
		  	
	  	} 
				
		this.minIn = typeof obj.minIn == "number" ? obj.minIn : 0;
		this.maxIn = typeof obj.maxIn == "number" ? obj.maxIn : 1;

		
		this.minOut = typeof obj.minOut == "number" ? obj.minOut : 0;
		this.maxOut = typeof obj.maxOut == "number" ? obj.maxOut : 1;
		
		this.conv = obj.conv;
		this.steps = obj.steps;
		this.stepsCycle = obj.stepsCycle;
				
	}
	
	
	getValue(x, obj){
		
		return Mapper.getValue(x, this);
		
	}
	
}


Mapper.getValue = function(x, obj) {
	//x = Math.max(x, this.minIn);
	//x = Math.min(x, this.maxIn);
	
	let minIn, maxIn, minOut, maxOut, relVal, rangeIn, rangeOut, valOut;
	x = parseFloat(x);
	
	maxIn = parseFloat(obj.maxIn || obj.max || 1);
	minIn = parseFloat(obj.minIn || obj.min || 0);
	
	maxOut = parseFloat(obj.maxOut || obj.max || 1);
	minOut = parseFloat(obj.minOut || obj.min || 0);
	
	rangeIn = maxIn - minIn;
	rangeOut = maxOut - minOut;
	x = (x - minIn)/rangeIn;
	x = Math.max(0, Math.min(x, 1));
	
	// probably not needed
	obj.conv = obj.conv || 1;
	
	
	
	if(obj.conv == "MIDI"){
		let noteOffs = Math.floor(x * rangeOut);
		if(obj.steps){
			let cycle = Math.floor(noteOffs / obj.stepsCycle);
			let noteInCycle = noteOffs % obj.stepsCycle;
			noteOffs = cycle * obj.stepsCycle + obj.steps[Math.floor(noteInCycle/obj.stepsCycle*obj.steps.length)];
		} 
		valOut = WebAudioUtils.MIDInoteToFrequency(minOut + noteOffs);
		
	} else {
		if(Number(obj.conv) == obj.conv){obj.conv = "Math.pow(x, " + obj.conv + ")"};
		valOut = eval(obj.conv);
		valOut = valOut * rangeOut + minOut;
	}
	
		
	return valOut;	
};
	
module.exports = Mapper;