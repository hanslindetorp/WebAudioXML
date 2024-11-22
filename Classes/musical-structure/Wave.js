const BaseTimedAudioObject = require('./BaseTimedAudioObject.js');
const Loader = require('../Loader.js');


class Wave extends BaseTimedAudioObject {
	
	constructor(xmlNode, waxml, params){
		super(xmlNode, waxml, params);

		// defult values
		this._params = {...params};
	
		// load file
		if(params.src){this.src = params.src}
	}
	
	
	start(params = {}){

		params = {...params}; // make a local copy

		params.blockFade = true; // to avoid fading from super class
		if(!(params = super.start(params))){return} // local offsets are calculated


		// console.log(this.params.src, "before: adjustOffsetToSlice", params);
		this.adjustOffsetToSlice(params);

		this.adjustOffsetToTime(params);
		// console.log(this.params.src, "after: adjustOffsetToSlice", params);

		// This is annoying while it's already set in the parent class, 
		// but timeStamp needs to be reset after any eventual change
		this.timeStamp = params.time - params.offset;


		this.crossFade(1, params.time);

		if(params.offset >= 0){
			this.startBuffer(params);
		}

		this.pendingTime = params.time;

	}

	startBuffer(params){
		if(this._buffer){
			let sourceNode = new AudioBufferSourceNode(this._ctx, params);
			sourceNode.buffer = this._buffer;
			sourceNode.start(params.time, params.offset);
			sourceNode.connect(this.output);
			
			this.sourceNode = sourceNode;
			
		} else {
			this.addEventListener("loaded", e => this.startBuffer(params));
		}
	}


	stop(params = {}){

		// console.log(this.params.src + " stop");
		// support for individual slices
		// if(!this.adjustStopToSlice(params)){return}; // this line makes folk music not stop playing on changing sequence

		// control state

		params = {...params}; // make a local copy

		// console.log(this.params.src, "before: adjustStopToSlice", params);
		params.blockFade = true; // to avoid fading from super class
		if(!(params = super.stop(params))){return}

		this.adjustStopToSlice(params);
		// console.log(this.params.src, "after: adjustStopToSlice", params);
		
		// callback after fadeout
		let fadeCallback = () => {
			if(this.sourceNode){
				this.sourceNode.stop(params.time);
				this.sourceNode.disconnect();
			}
		};

		this.crossFade(0, params.time, undefined, fadeCallback);



	}


	// this function is currently needed to correctly offset wave objects when
	// started from the first slice. BUT the logic to find the appropriate 
	// position for cutting in and out voices should really be on the 
	// sequence level. Eller inte?


	adjustOffsetToSlice(params){
		// let localTargetTime = (params.nextBreak || this.currentTime) - this.timeStamp;
		// let localTime = this.localTime;

		let localTargetTime = params.offset + params.breakOffset;
		
		// Start last slice BEFORE offset AT or AFTER nextBreak
		// let targetSlice = this.children.filter(slice => slice.params.from < params.offset && slice.params.to >= localTime).pop();
		let targetSlice = this.children.filter(slice => slice.params.from > params.offset + params.breakOffset && slice.params.from < params.offset).pop();

		if(!targetSlice){
			// OR first slice AFTER offset
			targetSlice = this.children.find(slice => slice.params.from > params.offset);
		}


		if(targetSlice){
			// set crossfade to next slice in wave
			params.time = targetSlice.params.from + this.timeStamp;
			params.offset = targetSlice.params.from;

			// console.log(this.params.src, "id: ", targetSlice.childIndex, "from:", targetSlice.params.from, "localTime:", this.currentTime - this.timeStamp, params);
		}
			
		
	}


	adjustStopToSlice(params){

		let pendingTime;
		let targetSlices;
		let offset; // is changed if conditions are met
		let localTime = this.currentTime - this.timeStamp;
		let children = this.children; //
		
		if(params.pendingTimes && this.params.voice && children.length){
			pendingTime = params.pendingTimes[this.params.voice] || params.time;
			if(pendingTime){

				let localPendingTime = pendingTime-this.timeStamp;
				// If voice:
				// Stop at pendingTime for same voice
				// but never later than the last slice before pendingTime starts
				// targetSlices = this.children.filter(obj => obj.params.from <= localPendingTime && obj.params.to > localPendingTime);
				targetSlices = children.filter(obj => obj.params.from < localPendingTime && obj.params.from > localTime && obj.params.to >= localTime);

				let lastSliceBeforePendingTime = targetSlices.sort((a,b) => a.from - b.from).pop();
				if(lastSliceBeforePendingTime){
					localPendingTime = Math.min(localPendingTime, lastSliceBeforePendingTime.params.from);
					// console.log(`${this.params.src} from (${lastSliceBeforePendingTime.params.from}) < ${localPendingTime} && to (${lastSliceBeforePendingTime.params.to}) >= ${localTime}`);
				}
				offset = localPendingTime;
			}
		}

		if(!pendingTime){


			// If no voice with pendingTime
			// stop after last slice BEFORE offset
			// AT or AFTER nextBreak
			targetSlices = children.filter(obj => obj.to <= params.offset && obj.to >= params.nextBreak);
			if(targetSlices.length){
				offset = targetSlices.map(obj => obj.params.to || 0).sort((a,b) => a - b).pop();
			} else {
				return true;
			}

		}


		// adjust params
		if(typeof offset !== "undefined"){

			// console.log(this.params.src, "moveStop + ", this.timeStamp + offset - params.time);
			if(isNaN(offset)){
				return false;
			}
			params.time = this.timeStamp + offset;
		} 
	
	}


	adjustOffsetToTime(params){
		if(params.offset < 0){
			// there are various reasons why the offset might be negative:
			// a negative fade-offset value might be the current biggest issue (as per 2024-04-17)
			// but it can possibly be a result of various hierarchical settings in 
			// the future. For now, I try to move the time, otherwise move offset.
			let time = params.time + params.offset;
			if(time >= this.currentTime){
				params.time = time;
				params.offset = 0;
			} else {
				params.time = this.currentTime;
				params.offset = params.time - time;
			}
			
		}
	}

	


	getNextBreak(time = this.currentTime){
		let localTime = time - this.timeStamp;

		// find a currently playing slice
		let slice = this.children.find(obj => {
			return obj.params.from < localTime && obj.params.to > localTime;
		});
		if(slice){
			// console.log(`${this.params.src} time: ${time.toFixed(2)}, from: ${slice.params.from}, to: ${slice.params.to}`);
			return slice.params.to + this.timeStamp;
		}

	}


	// get offset(){
	// 	return this._playing ? this._ctx.currentTime - this.lastStarted + this._offset : (this._offset || 0);
	// }

	// set offset(val){
	// 	this._offset = val;
		
	// 	if(this._playing){
	// 		this.stop();
	// 		this._playing = false;
	// 		this.continue({from: val});
	// 	}
	// }

	set src(src){
		let localPath = this.getParameter("localpath") || "";
		Loader.loadAudio(localPath + src, this._ctx).then(audioBuffer => {
			this._buffer = audioBuffer;
			this.dispatchEvent(new Event("loaded"));
		});
	}


	get minPos(){
		// returns the offset value for the earliest child (slice) object
		// or the pos of the wave object if there are no slices
		let children = this.children;
		let pos = this.params.pos;

		if(children.length){
			pos += Math.min(...children.map(obj => obj.params.from || 0));
		}
		return pos; 
	}

	    
	get relPos(){
		
		return this._buffer ? this.localTime / this._buffer.duration : 0;
	}

	get pendingTime(){
		if(this.children.length)return this._pendingTime;
	}

	set pendingTime(val){
		this._pendingTime = val;
	}
}

module.exports = Wave;
