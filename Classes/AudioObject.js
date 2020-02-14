
var WebAudioUtils = require('./WebAudioUtils.js'); 
var Loader = require('./Loader.js');
var Watcher = require('./Watcher.js');
var Mapper = require('./Mapper.js');


  	
class AudioObject{
	  	
  	constructor(xmlNode, _ctx, localPath){
	  	
	  	this._params = WebAudioUtils.attributesToObject(xmlNode.attributes);
	  	this._localPath = localPath;

		let nodeType = xmlNode.nodeName.toLowerCase();
		
	  	this._ctx = _ctx;
	  	let fn, src;
	  	this._nodeType = nodeType;
	  	
	  	switch(nodeType){
		  	
		  	
		  	case "analysernode":
		  	this._node = this._ctx.createAnalyser();
		  	break;
		  	
		  	
		  	case "audiobuffernode":
		  	this._node = this._ctx.createAudioBuffer();
		  	src = Loader.getPath(this._params.src, this._localPath);
		  	
		  	fetch(src)
		        .then(response => response.arrayBuffer())
		        .then(arrayBuffer => this._ctx.decodeAudioData(arrayBuffer, 
		        	audioBuffer => this._node.buffer = audioBuffer, 
		        	e => reject(e)
		        ));    
		  	break;
		  	
		  	
		  	
		  	
		  	case "oscillatornode":
		  	this._node = this._ctx.createOscillator();
		  	this._node.start();
		  	break;
		  	
		  	
		  	case "biquadfilternode":
		  	this._node = this._ctx.createBiquadFilter();
		  	break;
		  	
		  	case "convolvernode":
		  	if(!this._params.src){return}
		  	
		  	src = Loader.getPath(this._params.src, this._localPath);
		  	this._node = this._ctx.createConvolver();    
		  	fetch(src)
		        .then(response => response.arrayBuffer())
		        .then(arrayBuffer => this._ctx.decodeAudioData(arrayBuffer, 
		        	audioBuffer => this._node.buffer = audioBuffer, 
		        	e => reject(e)
		        ));
		  	break;
		  	
		  	case "delaynode":
		  	this._node = this._ctx.createDelay();
		  	break;
		  	
		  	case "dynamicscompressornode":
		  	break;	
		  	
		  	case "waveshapernode":
		  	break;	
		  	
		  	case "periodicwavenode":
		  	break;		
		  	
		  	case "iirfilternode":
		  	break;	 			  	
		  	
		  	case "gainnode":
		  	case "send":
		  	this._node = this._ctx.createGain();
		  	break;
		  	
		  	case "audio":
		  	this._node = this._ctx.createGain();
		  	break;
		  	
		  	case "mixer":
		  	this._node = this._ctx.createGain();
		  	break;
		  	
		  	case "chain":
		  	this.input = this._ctx.createGain();
		  	console.log("chain input", this.input.__resource_id__);
		  	this._node = this._ctx.createGain();
		  	break;
		  	
		  	case "voice":
		  	this._node = this._ctx.createGain();
		  	this.gain = 0;
		  	break;
		  	
		  	
		  	case "envelope":
		  	this._node = xmlNode.parentNode.audioObject._node;
		  	this._params.max = this._params.max || 1;
		  	this._params.valueScale = this._params.max / 100;
		  			  	
		  	switch(this._params.timeUnit){
			  	case "s":
			  	this._params.timeScale = 1;
			  	break;
			  	
			  	default:
			  	this._params.timeScale = 1/1000;
			  	break;
		  	}
		  	
		  	break;
		  	
		  	
		  	// parameters
		  	default:
		  	this.mapper = new Mapper(this._params.map);
		  	this._node = xmlNode.parentNode.audioObject.getParameterNode(nodeType);
		  	if(this._params.value){
			  	this._params.value = WebAudioUtils.typeFixParam(nodeType, this._params.value);
			  	this._node.value = this._params.value;
			}
			
			if(this._params.follow){
				this.watcher = new Watcher(xmlNode, this._params.follow, val => {
					this.setTargetAtTime(this._node, this.mapper.getValue(val), 0, 0, true);
				});
			}
		  	break;

	  	}
	  	
	  	console.log(nodeType, this._node.__resource_id__);
	  	
	  	// set parameters
	  	if(this._params){Object.keys(this._params).forEach(key => this[key] = this._params[key])};
	  	
  	}
  	


  	
  	get connection(){
	  	return this._node;
  	}
  	
  	get input(){
	  	
	  	switch(this._nodeType){
		  	
		  	case "oscillatornode":
		  	case "audiobuffernode":
		  	break;
		  	
		  	default:
		  	return this._input || this._node;
		  	break;
		}
	  	
  	}
  	
  	set input(node){
	  	this._input = node;
  	}
  	
  	
  	getParameterNode(param){
	  	return this._node[param];
  	}
  	  	
  	disconnect(ch){
	  	ch = ch || 0;
	  	this._node.disconnect(ch);
  	}
  	
  	connect(destination){
	  	
	  	if(this._node){
		  	if(this._node.connect){
			  	destination = destination || this._ctx.destination;
			  	this._node.connect(destination);
			  	this.destination = destination;
		  	}
	  	}
	  	
  	}
  	
  	inputFrom(sourceObject){
	  	switch(this._nodeType){
		  	
		  	case "oscillatornode":
		  	case "audiobuffernode":
		  	break;
		  	
		  	default:
		  	sourceObject.connect(this.input);
		  	break;
		}	  	
  	}
  	
  	start(data){
	  	switch(this._nodeType){
		  	
		  	case "oscillatornode":
		  	if(this.followKeyboard){
			  	let x = WebAudioUtils.MIDInoteToFrequency(data.note);
			  	if(this.followKeyboard.includes("x")){
				  	x = eval(this.followKeyboard);
			  	}
			  	this.frequency = x;
		  	}
		  	break;
		  	
		  	
		  	
		  	case "voice":
		  	this.gain = 1;
		  	break;
		  	
		  	
		  	case "envelope":
		  	if(this.ADSR){
			  	this.setTargetAtTime(this._node, this._params.valueScale * 100, 0, this.ADSR.attack * this._params.timeScale, true);
			  	this.setTargetAtTime(this._node, this._params.valueScale * this.ADSR.sustain, this.ADSR.attack * this._params.timeScale, this.ADSR.decay * this._params.timeScale);
		  	}
		  	break;
	  	}
  	}
  	
  	stop(data){
	  	
	  	switch(this._nodeType){
		  	
		  	case "voice":
		  	this.gain = 0;
		  	break;
		  	
		  	case "envelope":
		  	if(this.ADSR){
			  	this.setTargetAtTime(this._node, 0, 0, this.ADSR.release * this._params.timeScale, true);
		  	}
		  	break;
	  	}
  	}
  	
  	

  	
  	setTargetAtTime(param, value, delay, transitionTime, cancelPrevious){
	  		  	
	  	let startTime = this._ctx.currentTime + (delay || 0);
	  	transitionTime = transitionTime || 0.001;
	  	//console.log(value, delay, transitionTime, cancelPrevious);
	  	
	  	if(typeof param == "string"){param = this._node[param]}
	  		  	
	  	if(cancelPrevious){
		  	param.cancelScheduledValues(this._ctx.currentTime);
	  	}
	  	if(transitionTime){
		  	param.setTargetAtTime(value, startTime, transitionTime);
	  	} else {
		  	param.setValueAtTime(value, startTime);
	  	}
	  	
  	}
  	
  	set gain(val){
	  	this.setTargetAtTime("gain", val);
  	}
  	
  	get gain(){
	  	return this.gain.value;
  	}
  	
  	set frequency(val){
  		this.setTargetAtTime("frequency", val);
  	}
  	
  	get frequency(){
	  	return this.frequency.value;
  	}
  	
  	set detune(val){
	  	this.setTargetAtTime("detune", val);
  	}
  	
  	get detune(){
	  	return this.detune.value;
  	}
  	
  	set Q(val){
	  	this.setTargetAtTime("Q", val);
  	}
  	
  	get Q(){
	  	return this.Q.value;
  	}
  	
  	set type(val){
	  	
	  	switch(val){
		  	
		  	
		  	case "periodicWave":
		  	let n = 4096;
			let real = new Float32Array(n);
			let imag = new Float32Array(n);
			    
			
			
			for(let x=1; x<n; x++){
				//let y = 0.1; // Sine
				let y = 2 / (Math.pow(-1, x) * Math.PI * x); // sawtooth
				//let y = 1.0 / (Math.PI * x); // Square
				imag[x] = y;
				console.log(y);
			}
			let wave = this._ctx.createPeriodicWave(real, imag);
			
			this._node.setPeriodicWave(wave); 
		  	break;
		  	
		  	default:
		  	this._node.type = val;
		  	break;
	  	}	  	


	  	
  	}
  	
  	get type(){
	  	return this._node.type;
  	}
  	
  	set(key, value){
	  	if(typeof this._node[key] !== "undefined"){
		  	this[key] = value;
	  	}
  	}  	


}


module.exports = AudioObject;
