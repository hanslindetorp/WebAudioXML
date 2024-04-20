const fnNames = ["start", "stop", "trig"];

class MidiManager {

	constructor(waxml){
		this.waxml = waxml;
		this.keysPressed = Array(16).fill(Array(127).fill(false));
		this.listeners = [];
		this.eventListeners = [];

		if (navigator.requestMIDIAccess) {
			console.log('This browser supports WebMIDI!');
			navigator.requestMIDIAccess()
			.then(midiAccess => {
				// If the user accepts MIDI input
				// connect incoming MIDI messages from all potential MIDI inputs to getMIDIMessage()
				for (var input of midiAccess.inputs.values()) {
					input.onmidimessage = e => this.getMIDIMessage(e);
				}
			}, () => {
				console.warn('Could not access your MIDI devices.');
			});
		} else {
			console.warn('WebMIDI is not supported in this browser.');
		}

	}

	getMIDIMessage(event) {
	
		// the MIDI event contains the property "data" which is
		// actual MIDI data
		
		
		// example
		// MIDI NoteOn, channel 1, Middle C, velocity 127
		// event.data = [144, 60, 127]
		let status = event.data[0]; 
		let data1 = event.data[1];
		let data2 = event.data[2]; 
		
		
		
		// to remove the channel information (accepting input from all MIDI channels)
		// then perform this magic line
		// (read more: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators	
		let channel = status % 0x10 + 1;
		status = status >> 4;
		
		let val;
		switch (status) {
			case 9: // NoteOn
			if (data2 > 0) {
				this.noteOn(channel, data1, data2);
				this.remoteControl(`NoteOn=${channel}:${data1}`, data2);
				this.remoteControl(`NoteOn=${data1}`, data2);
			} else {
				this.noteOff(channel, data1);
				this.remoteControl(`NoteOff=${channel}:${data1}`, 0);
				this.remoteControl(`NoteOff=${data1}`, 0);
			}
			break;


			case 8: // NoteOff
			this.noteOff(channel, data1, data2);
			this.remoteControl(`NoteOff=${channel}:${data1}`, data2);
			this.remoteControl(`NoteOff=${data1}`, data2);
			break;


			case 11: // control change (volyme, pan, etc)
			val = data2/127;
			this.waxml.setVariable(`MIDI:CC:${data1}`, val);
			this.waxml.setVariable(`MIDI:ControlChange:${data1}`, val);
			this.remoteControl(`ControlChange=${channel}:${data1}:${data2}`);
			this.remoteControl(`ControlChange=${data1}:${data2}`);
			this.remoteControl(`ControlChange=${channel}:${data1}`, data2);
			this.remoteControl(`ControlChange=${data1}`, data2);
			break;
				
			case 14: // pitch bend
			val = (data2 + data1/128)/64 - 1;
			this.waxml.setVariable(`MIDI:PB`, val);
			this.waxml.setVariable(`MIDI:PitchBend`, val);
			this.remoteControl(`PitchBend:${channel}`, val);
			this.remoteControl("PitchBend", val);
			break;

			default:
			return;
			break;
		}
		console.log({status: status, channel: channel, data1: data1, data2: data2});
	}

	addListener(obj){
		this.listeners.push(obj);
	}

	remoteControl(filter, val){
		this.listeners.filter(obj => obj.filter == filter).forEach(obj => {
			switch(obj.task){
				case "trig":
				obj.element.dispatchEvent(new CustomEvent(obj.target));
				break;

				case "set":
				if(filter.includes("PitchBend")){
					val = (val+1) / 2 * (obj.max-obj.min) + obj.min;
				} else {
					val = val / 127 * (obj.max-obj.min) + obj.min;
				}

				val = Math.round(val/obj.step)*obj.step;
				
				obj.element[obj.target] = val;
				obj.element.dispatchEvent(new CustomEvent("input"));
				obj.element.dispatchEvent(new CustomEvent("change"));
				break;
			}
		});
	}

	noteOn(ch, key, vel){
		//console.log(ch, key, vel);)
		vel = vel / 127; // MIDI 1.0

		if(!this.keysPressed[ch][key]){

			let legato = this.keysPressed[ch].find(state => state); // ? false : true;
			this.keysPressed[ch][key] = true;
			let data = {channel: ch, keyNum: key, velocity: vel, legato: legato};
			let ev = `MIDI:NoteOn`;

			fnNames.forEach(fn => {
				[ev, `${ev}:${ch}`, `${ev}:${ch}:${key}`, `${ev}:${ch}:${key}:${vel}`].forEach(targetEv => {
					this.waxml[fn](targetEv, data);
				});
			});

			this.dispatchEvent(new CustomEvent(ev, {detail:data}));

		}
	}

	noteOff(ch, key, vel = 0){
		vel = vel / 127; // MIDI 1.0

		if(this.keysPressed[ch][key]){

			this.keysPressed[ch][key] = false;
			let legato = this.keysPressed[ch].find(state => state); // ? false : true;
	
			let data = {channel: ch, keyNum: key, velocity: vel, legato: legato};
			let NOff = `MIDI:NoteOff`;
			let NoteOffEvents = [NOff, `${NOff}:${ch}`, `${NOff}:${ch}:${key}`, `${NOff}:${ch}:${key}:${vel}`];
			
			let NOn = `MIDI:NoteOn`;
			let NoteOnEvents = [NOn, `${NOn}:${ch}`, `${NOn}:${ch}:${key}`, `${NOn}:${ch}:${key}:${vel}`];

			fnNames.forEach(fn => {
				NoteOffEvents.forEach(targetEv => {
					this.waxml[fn](targetEv, data);

					// extra call to variables that need to reset value from NoteOn with 0 velocity
					if(fn == "trig" && vel == 0){
						NoteOnEvents.forEach(noteOnEvent => {
							this.waxml[fn](noteOnEvent, data);
						});
					}
				});
			});

			this.dispatchEvent(new CustomEvent(ev, {detail:data}));

		}
	}
	addEventListener(name, fn){
		if(typeof name !== "string"){return}
		if(typeof fn !== "function"){return}
		this.eventListeners[name] = this.eventListeners[name] || [];
		this.eventListeners[name].push(fn);
	}

	dispatchEvent(e){
		this.eventListeners[e.type] = this.eventListeners[e.type] || [];
		this.eventListeners[e.type].forEach(fn => fn(e));
	}

}

module.exports = MidiManager;