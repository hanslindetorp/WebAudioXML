const BaseAudioObject = require('./BaseAudioObject.js');


class Select extends BaseAudioObject{

	constructor(xmlNode, waxml, params){
		super(xmlNode, waxml, params);
		
		this.waxml = waxml;
		this._ctx = this.waxml._ctx;

		this._params["selected-index"] = params["selected-index"] || 0;
	
	}
	
	set selectedIndex(val){
		if(this.params["selected-index"] == val){
			this.children[val].start();
		} else {
			switch(this.getParameter("strategy")){

				case "sync-points":
	
				// Find next sync point //
	
				let i = this.params["selected-index"];
				let currentSequence = this.children[i];
				this.params["selected-index"] = val;
				let nextSequence = this.children[val];
	
				// This is looking for currently playing slices and gets the 
				// next syncPoint following that slice
				let targetSyncPoint = currentSequence.getNextSyncPoint(); // {index, time, pos}
	
				nextSequence.start(targetSyncPoint);
	
				// Look for potential slices or fade-offsets controlling the crossfade times
				// differenly for different voices. Forward those time positions to
				// the old sequence to (possibly) adjust the fadeout times for matching 
				// voices. 
				let pendingTimes = nextSequence.voiceGroupPendingTimes;
				// console.log("nextSequence.voiceGroupPendingTimes", pendingTimes, targetSyncPoint.time);
				targetSyncPoint.pendingTimes = pendingTimes;
	
				// forward theses
				currentSequence.stop(targetSyncPoint);
				break;
			}
		}

	}

	start(){
		// only  built for one selected index at the moment
		let i = this.getParameter("selected-index");
		let targetObj = this.children[i];
		if(targetObj){

			// call if object has the function
			targetObj.start?.();
		}
	}

	stop(){
		// call if objects has the function
		this.children.forEach(obj => obj.stop?.());
	}
	    
}

module.exports = Select;


/*
Bugs:
- Rapid change between sequences causes a mess with several sequences playing at the same time. Make sure they are cancelled if PENDING
*/