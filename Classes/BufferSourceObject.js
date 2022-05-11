var Loader = require('./Loader.js');
var WebAudioUtils = require('./WebAudioUtils.js');


class BufferSourceObject {

	constructor(obj, params){
		this._ctx = obj._ctx;
		this._node = new AudioBufferSourceNode(this._ctx);
		this._params = {...params};
		this._parentAudioObj = obj;
		this.callBackList = [];
	}

	connect(destination){
		this.destination = destination;
		this._node.connect(destination);
		return destination;
	}
	
	start(time, offset, duration){
		let params = {}
		if(typeof this._params.loop != "undefined"){params.loop = this._params.loop}
		if(typeof this._params.loopStart != "undefined"){params.loopStart = this._params.loopStart * this._params.timescale}
		if(typeof this._params.loopEnd != "undefined"){params.loopEnd = this._params.loopEnd * this._params.timescale}
		if(typeof this._params.playbackRate != "undefined"){params.playbackRate = this._params.playbackRate}
		if(typeof this._params.randomDetune != "undefined"){params.playbackRate *= WebAudioUtils.centToPlaybackRate(this._params.randomDetune)}

		this._node.disconnect();
		this._node = new AudioBufferSourceNode(this._ctx, params);
		this._node.buffer = this._buffer;

		// this.loop = this._params.loop;
		// if(this.loop){
		// 	if(typeof this._params.loopEnd != "undefined"){
		// 	this.loopEnd = this._params.loopEnd;
		// 	}
		// 	if(typeof this._params.loopStart != "undefined"){
		// 	this.loopStart = this._params.loopStart;
		// 	}
		// }
		// if(typeof this._params.playbackRate != "undefined"){
		// 	this.playbackRate = this._params.playbackRate;
		// }
		let factor = Math.abs(this._params.playbackRate || 1)
		this._node.connect(this.destination);	
		this._node.start(time, offset * factor, duration * factor);

	}

	stop(){
		this._node.disconnect();
	}



	getParameter(paramName){
        if(typeof this._params[paramName] === "undefined"){
            
            if(this._parentAudioObj){
                return this._parentAudioObj.getParameter(paramName);
            } else {
                return 0;
            }

        } else {
            return this._params[paramName];
        }
    }

	addCallBack(fn){
		this.callBackList = [];
		this.callBackList.push(fn);
	}

	doCallBacks(){
		while(this.callBackList.length){
			let fn = this.callBackList.pop();
			fn();
		}
	}

	get buffer(){
		return this._node.buffer;
	}

	get output(){
		return this._node;
	}

	get _node(){
		return this.node;
	}

	set _node(obj){
		this.node = obj;
	}

	set src(src){
		let localPath = this.getParameter("localpath") || "";
		Loader.loadAudio(localPath + src, this._ctx).then(audioBuffer => {
			this._buffer = audioBuffer;
			this.doCallBacks();
		});
	}

	get loopEnd(){
		return this._params.loopEnd;
	}

	set loopEnd(val){
		this._params.loopEnd = val;
		this._node.loopEnd = val;
	}

	get loopStart(){
		return this._params.loopStart;
	}

	set loopStart(val){
		this._params.loopStart = val;
		this._node.loopStart = val;
	}

	set playbackRate(val){
		if(!isFinite(val)){
			console.log("non-finite");
			return;
		  }
		this._params.playbackRate = val;
		//this._node.setTargetAtTime("playbackRate", val, 0);
		this._node.playbackRate.setTargetAtTime(val, 0, this.getParameter("transitionTime"));

	}

	set randomDetune(val){
        val = Math.max(0, Math.min(val, 1));
        this._params.randomDetune = val;
    }

	// funkar inte på loop
	set onended(fn){
		this._node.buffer.onended = fn;
	}

	    
}

module.exports = BufferSourceObject;
