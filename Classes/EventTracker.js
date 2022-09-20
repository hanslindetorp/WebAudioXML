
var Sequence = require('./Sequence.js');


class EventTracker {

	constructor(waxml){
		this.waxml = waxml;

		this._sequences = [];
		this._registeredEvents = [];

		this._curSeqName = "default";
		this.addSequence();
	}

	getSequence(name = "_storedGesture"){
		return this._sequences.find(seq => seq.name == name);
	}

	addSequence(name = this._curSeqName, events = []){
		let seq = this.getSequence(name);
		if(seq){
			seq.update(events);
		} else {
			seq = new Sequence(this, name, events);
			this._sequences.push(seq);
		}
		return seq;
	}

	addSequenceFromLastGesture(name){
		let events = this.lastGesture;
		let seq = new Sequence(this, name, events);
		return seq;
	}

	deleteSequence(name){
		let i = this._sequences.findIndex(seq => seq.name == name);
		if(i){
			this._sequences.splice(i, 1);
		}
	}

	registerEvent(name, execute){
		return this.getEventObject(name, execute);
	}



	registerEventListener(name, target = document, eventName, execute, process){

		if(typeof target == "string"){
			target = document.querySelector(target);
		}

		let ev = this.getEventObject(name, execute, process, target);
		if(target && target.addEventListener){
			target.addEventListener(eventName, (e => ev.send(e)));
		} else {
			console.error("EventTracker error: " +  target + " does not support addEventListener()");
		}
		return ev;
	}

	getEventObject(name, execute, process, target){
		let ev = this._registeredEvents.find(ev => ev.name == name);
		if(!ev){ev = this.createEvent(name, execute, process, target)}
		return ev;
	}

	createEvent(name, execute, process, target){

		let ev = {
			name: name,
			target: target,
			process: process,
			execute: execute,
			send: (event => {

				if(!this.playing){
					// if process is set, then run it
					let data = ev.process ? ev.process(event, target) : event;

					// store data in sequencer
					this.currentSequence.store(name, data);

					// execute function
					if(ev.execute){ev.execute(data)}
				}
			})
		}
		this._registeredEvents.push(ev);

		return ev;
	}

	// added 2022-05-11 as a simpler way of recording variable changes
	store(key, value){
		this.currentSequence.store(key, value);
	}

	trigEvent(name, value){
		// Kolla vad de här två raderna gjorde i gamla tider
		// let ev = this._registeredEvents.find(ev => ev.name == name);
		// if(ev.execute){ev.execute(value)}

		// Till Ficson har jag fixat denna istället:
		this.waxml.setVariable(name, value, 0, true);
		this.waxml.plugins.forEach(plugin => {
			if(plugin.setVariable){
				plugin.setVariable(name, value);
			}
		});

	}

	clear(name = this._curSeqName){
		let seq = this.getSequence(name);
		if(seq){
			seq.clear();
		}
		
	}

	allEvents(name = this._curSeqName, filter = []){
		return this.getSequence().allEvents(filter);
	}

	get currentSequence(){
		return this.getSequence(this._curSeqName);
	}

	get lastTouchGesture(){
		let seq = this.getSequence("default");
		let name = seq.name;
		let events = seq.filterEvents("touchstart", "touchend", ["touchstart", "touchmove", "touchend"], ["relX", "relY"]);
		return new Sequence(this, name, events);
	}

	get lastGesture(){
		let seq = this.getSequence("default");
		let name = seq.name;
		let events = seq.filterEvents("pointerdown", "pointerup", ["pointerdown", "pointermove", "pointerup"], ["relX", "relY"]);
		return new Sequence(this, name, events);
	}

	set playing(state){
		this._playing = state;
	}
	get playing(){
		return this._playing;
	}
}


module.exports = EventTracker;
