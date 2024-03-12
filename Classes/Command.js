var WebAudioUtils = require('./WebAudioUtils.js');


class Command extends EventTarget {

	constructor(params, waxml){
		super();
		this.waxml = waxml;
		this._params = params;
		this.timeouts = [];
	}

	get pos(){
		return this._params.pos;
	}

	set pos(val){
		this._params.pos = val;
	}

	get type(){
		return this._params.type;
	}

	get selector(){
		return this._params.selector;
	}

	get variable(){
		return this._params.key;
	}

	get value(){
		return this._params.value;
	}

	set offset(val){
		this._params.offset = val;
	}


	get offset(){
		return this._params.offset || 0;
	}


	trig(time = this.waxml._ctx.currentTime){

		switch(this.type){
			case "trig":
				this.waxml.trig(this.selector, {time:time});
				// console.log(this.selector);
			break;

			case "set":
				// delay += this.offset; // check this!!
				let delay = time - this.waxml._ctx.currentTime;
				this.timeouts.push({
					id: setTimeout(() => {
						this.waxml.setVariable(this.variable, this.value);
					}, delay*1000-1), // to rather prepare variable than do it too late 
					time: time
				});
			break;
		}
		

		// this.timeouts.push(setTimeout(() => {

		// 	switch(this.type){
		// 		case "trig":
		// 			this.waxml.trig(this.selector, {time:time});
		// 		break;
		// 		case "set":
		// 			this.waxml.setVariable(this.variable, this.value);
		// 		break;
		// 	}

		// }, delay*1000));
	}

	clear(time){
		// clear timeout 
		let currentTime = this.waxml._ctx.currentTime;
		time = time || currentTime;
		this.timeouts.filter(timeout => timeout.time >= currentTime).forEach(timeout => {
			clearTimeout(timeout.id);
		});
		this.timeouts = this.timeouts.filter(timeout => timeout.time <  currentTime);
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
				val *= this.timeScale;
				break;
  
			}
			return val;
		}
	}

	get parameters(){
		return this._params;
	}

}

module.exports = Command;
