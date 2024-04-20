const BaseTimedAudioObject = require('./BaseTimedAudioObject.js');


class Sequence extends BaseTimedAudioObject {

	constructor(xmlNode, waxml, params){
		super(xmlNode, waxml, params);
		// init params
		params["sync-points"] = (params["sync-points"] || "").split(",").map(str => {
			return parseFloat(str);
		}).sort((a,b) => a - b);

		this._params = params;
	
	}
	

	start(params = {}){

		// merge and overwrite values from different objects
		params = {...{time: this.currentTime, offset: 0, minPos: this.minPos}, ...params};

		if(params.syncPointIndex && this.params["sync-points"]){
			params.offset = this.params["sync-points"][params.syncPointIndex] || params.offset;
		}
		
		if(params.offset <= 0){

			// start playback from beginning (and therefore, look for children with negative offset so all gets included)
			// if offset is positive, then child objects will trigger as soon as they are allowed to

			// params.offset = params.minPos;
			if(params.time + params.minPos < this.currentTime){
				// offset if needed
				params.time = this.currentTime - params.minPos;
			}
		} 

		super.start(params); // calls all children
	}
	
	stop(params = {}){
		// merge and overwrite values from different objects
		params = {...{time: this.currentTime}, ...params};

		super.stop(params); // calls all children
	}

	getNextSyncPoint(time = this.currentTime){

		let syncPoint = {syncPointIndex: 0, time: time, pos: 0};
		let localTime = this.localTime;
		let nextBreak, localNextBreak;

		// 		○ Välj ut den eller de slices som har högts priority (har inte gjort priority än)
		// 		○ Hitta end på denna slice
		let sliceBreaks = this.children.map(obj => obj.getNextBreak?.(time)).filter(t => t);


		if(sliceBreaks.length){
			nextBreak = Math.max(...sliceBreaks);
			// provide information about last slice end for next
			// sequence to use as a basis for fadeins 
			// syncPoint.nextBreak = nextBreak;
		} else {

		}
		nextBreak = nextBreak || time;
		localNextBreak = nextBreak - this.timeStamp;


		
		// 		○ Ta nästa synkpunkt efter. Spara ID
		if(this.params["sync-points"].length && this.state){

			// step 1 - get next 
			// let index = this.params["sync-points"].findIndex(pos => pos >= nextBreak - this.timeStamp); // tillfälligt bortkommenterad
			let index = this.params["sync-points"].findIndex(pos => pos >= localNextBreak); 
			let repeatOffset = 0;
			if(index == -1){
				// pos is after last syncPoint
				if(this.params.repeat){
					index = 0;
					repeatOffset = this.params["repeat-length"];
				}
			}
			syncPoint.syncPointIndex = index;
			syncPoint.pos = this.params["sync-points"][index];
			syncPoint.time = syncPoint.pos + this.timeStamp + repeatOffset;

			// it is important to forward the time position relative to 
			// the next syncPoint. That's the only stable position in
			// time at this moment.
			syncPoint.breakOffset = nextBreak - syncPoint.time;
			// console.log("breakOffset", syncPoint.breakOffset);

		} else {
			// this is not recommendable. 
			// to not use syncPoints
			// It will probably default to currentTime 
			syncPoint.time = nextBreak;
		}

		// console.log(`syncPoint.time = ${syncPoint.time}`);

		return syncPoint;
	}

	get voiceGroupPendingTimes(){

		// Only works on voices directly as children to a sequence
		// collect the voice objects with adjusted time positions
		const voiceGroups = this.children.reduce((group, obj) => {
			let { voice } = obj.params;
			voice = voice ?? "unnamed";
			group[voice] = group[voice] ?? [];
			group[voice].push(obj);
			return group;
		}, {});

		// console.log(voiceGroups);

		// 
		const entries = Object.entries(voiceGroups).map(([voice, objects]) => {
			// it should really be just one object per voice in a sequence
			// but for the sake of it...
			let pendingTime = Math.min(...objects.map(obj => obj.pendingTime)) || undefined;
			return [voice, pendingTime];
		});

		return Object.fromEntries(entries);

	}

	    
}

module.exports = Sequence;



/*

Vid vissa övergångar stannar fiolen och dragspelet tillsammans med vocal. Det verkar beroende av slices




*/