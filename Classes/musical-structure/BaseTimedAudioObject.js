const BaseAudioObject = require('../BaseAudioObject.js');


class BaseTimedAudioObject extends BaseAudioObject {

	static get STOPPED(){return 0};
	static get PENDING(){return 1};
	static get PLAYING(){return 2};
	static get STOPPING(){return 3};

	constructor(xmlNode, waxml, params){
		super(xmlNode, waxml, params);

		let r = this.params.repeat;
		this.params.repeat = r ? r == "true" ? -1 : r : 0; // true = -1 // default = 0 
		this.repeatCount = 0;
		this.state = BaseTimedAudioObject.STOPPED;
		this.timeStamp = 0;
		this._localTime = 0;

		// only support for seconds at the moment. Add milliseconds and musical meter.
		if(this.params["repeat-length"]){
			this.params["repeat-length"] = parseFloat(params["repeat-length"] || 1);
		}	
		this.params["pos"] = parseFloat(params["pos"] || 0);

		if(this.params.fadein || this.params.fadeout || this.params.fadetime){
			// All parameters need to be retrieved dynamically to use Watchers
			// this.params.fadein = parseFloat(params.fadein || this.params.fade || 0);
			// this.params.fadeout = parseFloat(params.fadeout || this.params.fade || 0);
			// this.params["fade-offset"] = parseFloat(params["fade-offset"] || 0);
			this.params.fade = true;
		}

		// add support for musical values
		this.params.pos = this.params.pos || 0; 
	}

	start(params = {}){
		// return if pending, playing or stopping (if it's not a retrig-call)
		if(this.state != BaseTimedAudioObject.STOPPED && !params.retrig){return}

		let currentTime = this.currentTime;

		// merge and overwrite values from different objects
		let defaultValues = {time: currentTime, offset: 0, minPos: 0};
		params = {...this.params, ...defaultValues, ...params};


		// adjust time for position
		if(!params.offset){
			params.time += this.params.pos; // correct if upbeat - wrong if in the middle!!
		} else {
			params.offset -= this.params.pos;
		}

		// adjust time for fade-offset
		let fadeOffset = this.params["fade-offset"];
		if(params.time + fadeOffset > this.currentTime){
			params.time += fadeOffset;
			params.offset += fadeOffset;
			// console.log(this.name, "fadeout, offset: ", this.params["fade-offset"], this.params.fadeout);
		}

		// console.log(this.name, params.time);
		this.timeStamp = params.time - params.offset; // store objects start position (even if triggered in the middle)
		// params.offset -= this.params.pos;
		// console.log(this.name, (this.timeStamp).toFixed(2), params.offset);

		let delay = this.timeStamp + params.offset - currentTime;
		if(!params.retrig){
			this.state = BaseTimedAudioObject.PENDING;
			clearTimeout(this.stateTimeout);
			this.stateTimeout = setTimeout(() => {
				this.state = BaseTimedAudioObject.PLAYING;
			}, delay * 1000);
		}


		// repeat
		if(this.params.repeat){
			if(this.params.repeat == -1 || ++this.repeatCount < this.params.repeat){
				// if infinite repeat or still repeats to do
				this.repeat(params);
			}
		}

		if(this.params.fade && !params.blockFade){
			this.crossFade(1, params.time);
		}
		

		this.children.forEach(obj => obj.start(params));
		return params;
	}

	repeat(params = {}){

		// params = {...params};
		clearTimeout(this.repeatTimeout);

		let repeatLength = this.getParameter("repeat-length");
		
		// if time is after repeat 
		if(params.time >= this.timeStamp + repeatLength){
			return;
		}

		let localTime = (this.currentTime - this.timeStamp);
		let timeToTriggerRepeat = repeatLength - localTime + params.minPos;
		// console.log(this.selector + ".repeat");

		

		this.repeatTimeout = setTimeout(() => {
			
			this.timeStamp += repeatLength;
			params.time = this.timeStamp;
			params.retrig = true;
			params.offset = 0;
			params.syncPointIndex = 0;

			// this.stop(repeatParams);
			this.start(params);
		}, timeToTriggerRepeat * 1000 - this.utils.timeWindow)

		// return params;
	}


	stop(params = {}){
		if(this.state == BaseTimedAudioObject.STOPPED){return}

		// params.time = Math.max(this.currentTime, params.time + this.params["fade-offset"]);

		// adjust time for fade-offset
		// (this might be override by slices)
		let fadeOffsetTime = params.time + this.params["fade-offset"];
		if(fadeOffsetTime > this.currentTime){
			params.time = fadeOffsetTime;
			// console.log("fadeout, offset: ", this.params["fade-offset"], this.params.fadeout);
		}


		let delay = params.time - this.currentTime;
		this.state = BaseTimedAudioObject.STOPPING;

		clearTimeout(this.repeatTimeout);
		this.repeatCount = 0;

		clearTimeout(this.stateTimeout);
		this.stateTimeout = setTimeout(() => {
			this._localTime = this.localTime; // stores current time
			// this.timeStamp = 0;
			this.state = BaseTimedAudioObject.STOPPED;
		}, delay * 1000);

		if(this.params.fade && !params.blockFade){
			this.crossFade(0, params.time);
		}

		this.children.forEach(obj => obj.stop(params));

		return params;
	}


	continue(params = {}){
		if(this.state != BaseTimedAudioObject.STOPPED){return}

		// let delay = params.time - this.currentTime;
		// this.state = BaseTimedAudioObject.PENDING;

		// clearTimeout(this.stateTimeout);
		// this.stateTimeout = setTimeout(() => {
		// 	this.state = BaseTimedAudioObject.PLAYING;
		// }, delay * 1000);
		// this.children.forEach(obj => obj.continue(params));

		return params;
	}

	crossFade(to, time = this.currentTime, fadeTime, fn = () => {}){

		if(isNaN(time)){
			console.error("crossfade time error", time);
			return;
		}
		let delay = time - this.currentTime;
		this.output.gain.cancelScheduledValues(time);
		let fadeCurve = to ? this.utils.crossFadeIn() : this.utils.crossFadeOut();

		fadeTime = fadeTime || (to ? this.params.fadein : this.params.fadeout) || this.params.fadeinout || 0.001;
		fadeTime = fadeTime.valueOf() || 0.001;

		this.output.gain.setValueCurveAtTime(fadeCurve, time, fadeTime);
		// this.output.gain.setTargetAtTime(to, time, fadeTime);
		console.log(`${this.params.src} fadetime: ${fadeTime}`);

		setTimeout(() => {
			fn();
			// we don't need to reset gain now. It happens on start()
			// this.output.gain.cancelScheduledValues(time);
			// this.output.gain.setValueAtTime(1, time);
		}, (delay + fadeTime) * 1000 + this.utils.timeWindow);
	}



	get minPos(){
		// returns a negative offset value for the earliest child object
		return this.params.pos + Math.min(0, ...this.children.map(obj => obj.minPos || 0));
	}
	    
	get relPos(){
		let relPos = this.localTime / this.params["repeat-length"];
		return relPos;
	}


	get localTime(){
		let time;
		if(this.state){
			if(this.params.repeat){
				let rl = this.params["repeat-length"];
				time = (this.currentTime + rl - this.timeStamp) % rl;
			} else {
				time = this.currentTime - this.timeStamp;
			}

		} else {
			time = this._localTime;
		}
		return time;
	}


	get currentTime(){
		return this._ctx.currentTime;
	}
	    
}

module.exports = BaseTimedAudioObject;
