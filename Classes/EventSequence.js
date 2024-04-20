


class EventSequence {

	constructor(eventTracker, name, events = []){
		this._eventTracker = eventTracker;
		this._name = name;
		this._eventTypes = [];
		this._events = events;
		this._timeouts = [];
	}

	allEvents(filter = []){
		return this.filterEvents(0, this._events.length, filter);
	}

	get events(){
		return this.allEvents();
	}

	getData(options = {}){
		let data = {};
		let timeOffset = options.timeOffset || (this._events.length ? this._events[0].time : 0);
		let precision = typeof options.precision == "undefined" ? 100 : options.precision;
		let precisionFactor = Math.pow(10, precision);

		let frameRate = options.frameRate || 1000;
		data.name = this._name;

		let lastEvents = {};
		let eventList = [];

		this._events.forEach(evt => {
			let time = evt.time - timeOffset;
			let value = Math.round(evt.value * precisionFactor) / precisionFactor;
			let name = evt.name;
			if(!lastEvents[name] || time - lastEvents[name] > (1000 / frameRate)){
				// add one event per 100ms
				lastEvents[name] = time;
				eventList.push([time, evt.name, value]);
			}
			
		});
		data.events = eventList;
		return data;
	}

	filterEvents(start = 0, end, filter = [], variableFilter = []){

		let startIndex, endIndex, i, ev;
		if(typeof start == "string"){
			// last
			for(i=this._events.length-1; i>=0; i--){
				ev = this._events[i];
				if(ev.name == start){
					startIndex = i;
					break;
				}
			}

		} else if(typeof start == "number"){
			startIndex = start;
		}
		if(typeof startIndex == "undefined"){
			startIndex = 0;
		}

		if(typeof end == "string"){
			// last
			for(i=this._events.length-1; i>startIndex; i--){
				ev = this._events[i];
				if(ev.name == end){
					endIndex = i;
					break;
				}
			}
		} else if(typeof end == "number"){
			endIndex = end;
		}
		endIndex = Math.min(endIndex, this._events.length - 1);

		let newEventList = [];
		if(this._events.length){
			let offset = this._events[startIndex].time;
			for(i = startIndex; i <= endIndex; i++){
				ev = this._events[i];
				if(!filter.length || filter.includes(ev.name)){
					let newEv = {}
					newEv.time = ev.time - offset;
					newEv.name = ev.name;
					newEv.value = {}
					Object.keys(ev.value).forEach(key => {
						if(!variableFilter.length || variableFilter.includes(key)){
							newEv.value[key] = ev.value[key];
						}
					});
					newEventList.push(newEv);
				}
			}
		}
		
		return newEventList;
	}


	store(name, value){
		if(typeof name == "undefined"){return}
		if(typeof value == "undefined"){return}

		let ev = {
			time: new Date().getTime(),
			name: name,
			value: value
		};

		this._events.push(ev);
	}

	clear(){
		this._events = [];
	}

	update(events){
		this._events = events;
	}

	play(){
		if(!this._events.length){
			console.log("EventTracker error: Sequence is empty");
			return;
		}

		let now = new Date().getTime();
		let offset = this._events[0].time;
		let length = this._events[this._events.length-1].time - offset;

		this._events.forEach(ev => {
			let t = setTimeout(e => this._eventTracker.trigEvent(ev.name, ev.value), ev.time - offset + 1);
			this._timeouts.push(t);
		});
		this._eventTracker.playing = true;
		this._timeouts.push(setTimeout(e => this._eventTracker.playing = false, length));

	}

	stop(){
		while(this._timeouts.length){
			clearTimeout(this._timeouts.pop());
		}
	}

	get name(){
		return this._name;
	}

}


module.exports = EventSequence;
