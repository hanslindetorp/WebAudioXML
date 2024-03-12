var Loader = require('./Loader.js');
var WebAudioUtils = require('./WebAudioUtils.js');


class BufferSourceObject {

	constructor(obj, params){
		this._ctx = obj._ctx;
		this._node = new AudioBufferSourceNode(this._ctx);
		this._params = {...params};
		this._parentAudioObj = obj;
		this.callBackList = [];
		this.playingNodes = [];
	}

	connect(destination){
		this.destination = destination;
		this._node.connect(destination);
		return destination;
	}
	
	start(time = this._ctx.currentTime, offset = 0, duration){
		if(this._playing) {
			//return;
		}
		// if(this.autoStopTimer){
		// 	clearTimeout(this.autoStopTimer);
		// 	this.autoStopTimer = 0;
		// }
		let params = {}
		if(typeof this._params.offset != "undefined"){params.offset = this._params.offset}
		if(typeof this._params.loop != "undefined"){params.loop = this._params.loop}
		if(typeof this._params.loopStart != "undefined"){params.loopStart = this._params.loopStart * this._params.timescale}
		if(typeof this._params.loopEnd != "undefined"){params.loopEnd = this._params.loopEnd * this._params.timescale}
		if(typeof this._params.playbackRate != "undefined"){
			params.playbackRate = this._params.playbackRate;
		} else {
			params.playbackRate = 1;
		}
		if(typeof this._params.randomDetune != "undefined"){params.playbackRate *= WebAudioUtils.centToPlaybackRate(this._params.randomDetune)}

		if(this.currentNode && this._params.mono == true){
			let oldNode = this.currentNode;
			setTimeout(() => oldNode.disconnect(), 10);
		}
		
		let node = new AudioBufferSourceNode(this._ctx, params);
		this.currentNode = node;
		this.playingNodes.push(node);

		node.buffer = this._buffer;
		node.loopEnd = this._buffer.duration;

		offset = offset || this._params.offset * this._params.timescale || 0;

		if(offset >= this._buffer.duration){
			offset = 0;
		}

		let factor = Math.abs(this._params.playbackRate || 1);
		duration = duration || this._buffer.duration;

		node.connect(this.destination);
		this.lastStarted = time;
		this.offset = offset;
		// important to set this._playing to true AFTER setting this.offset (otherwise it will make an endless call stack via resume)
		this._playing = true;

		if(params.loop){
			node.start(time, offset * factor);
		} else {
			node.start(time, offset * factor, duration * factor);

			factor = factor || 0.0001;

			this.autoStopTimer = setTimeout(() => {
				let lastNode = this.playingNodes.shift();
				if(lastNode){lastNode.disconnect(0)}

				if(!this.playingNodes.length){
					// reset when all samples are quiet
					this._offset = 0;
					this._relOffset = 0;
					this._playing = false;
				}
				
			}, (duration - offset) / Math.abs(factor) * 1000);
		}
		this._node = node;
		
	}

	resume(){
		this.start(this._ctx.currentTime, this._offset);
	}


	continue(){
		this.resume();
	}

	stop(p = {}){
		clearTimeout(this.autoStopTimer);
		this.autoStopTimer = 0;
		if(this._playing){
			if(!params.dontDisconnect){
				// this._node.disconnect();
				this._node.stop();
			}
			this._playing = false;
			this.updateOffset();
		}
	}

	disconnect(){
		this._node.disconnect();
	}

	updateOffset(val=this.lastStarted ? (this._ctx.currentTime - this.lastStarted + this._offset) /  this._buffer.duration: 0){
		this._relOffset = val;
		let duration = this._buffer ? this._buffer.duration : 0;
		this._offset = val * duration;
	}

	get playing(){
		return this._playing;
	}
	set playing(state){
		this._playing = state;
	}

	get relOffset(){
		return this._playing ? (this._ctx.currentTime - this.lastStarted + this._offset) / this._buffer.duration : (this._relOffset || 0);
	}

	set relOffset(val){
		this._relOffset = val;
		let duration = this._buffer ? this._buffer.duration : 0;
		this._offset = val * duration;

		if(this._playing){
			this._node.disconnect();
			this._playing = false;
			this.resume();
		}

	}

	get offset(){
		return this._playing ? this._ctx.currentTime - this.lastStarted + this._offset : (this._offset || 0);
	}

	set offset(val){
		this._offset = val;
		let duration = this._buffer ? this._buffer.duration : 1;
		this._relOffset = val / duration;
		
		if(this._playing){
			this._node.disconnect();
			this._playing = false;
			this.resume();
		}
	}



	getParameter(paramName){
		if(typeof this._params[paramName] === "undefined"){
			
			if(this._parentAudioObj){
				return this._parentAudioObj.getParameter(paramName);
			} else {
				return 0;
			}

		} else {
			let val = this._params[paramName];

			switch(paramName){
				case "transitionTime":
				case "loopEnd":
				case "loopStart":
				case "delay":
				let timescale = this.getParameter("timescale") || 1;
				val *= timescale;
				break;

			}
			return val;
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

	get loop(){
		return this._params.loop;
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
		
		this.playingNodes.forEach(node => {
			node.playbackRate.setTargetAtTime(val, 0, this.getParameter("transitionTime"));

		});
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
