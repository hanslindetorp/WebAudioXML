
class MidiManager {

	constructor(waxml){
		this.waxml = waxml;
		this.keysPressed = Array(16).fill(Array(127).fill(false));

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
		let channel = status % 0x10;
		status = status >> 4;
		
		let val;
		switch (status) {
			case 9: // NoteOn
			if (data2 > 0) {
				this.noteOn(channel, data1, data2);
			} else {
				this.noteOff(channel, data1);
			}
			break;


			case 8: // NoteOff
			this.noteOff(channel, data1, data2);
			break;


			case 11: // control change (volyme, pan, etc)
			val = data2/127;
			this.waxml.setVariable(`MIDI:CC:${data1}`, val);
			this.waxml.setVariable(`MIDI:ControlChange:${data1}`, val);
			break;
				
			case 14: // pitch bend
			val = (data2 + data1/128)/64 - 1;
			this.waxml.setVariable(`MIDI:PB`, val);
			this.waxml.setVariable(`MIDI:PitchBend`, val);
			break;

			default:
			return;
			break;
		}
		console.log({status: status, channel: channel, data1: data1, data2: data2});
	}

	noteOn(ch, key, vel){

		if(!this.keysPressed[ch][key]){

			let monoTrig = this.keysPressed[ch].find(state => state) ? false : true;
			this.keysPressed[ch][key] = true;

			this.waxml.start(`MIDI:NoteOn`, [vel/127, key, monoTrig]);
			this.waxml.start(`MIDI:NoteOn:${ch}`, [vel/127, key, monoTrig]);
			this.waxml.start(`MIDI:NoteOn:${ch}:${key}`, [vel/127]);
			this.waxml.start(`MIDI:NoteOn:${ch}:${key}:${vel}`);

			this.waxml.stop(`MIDI:NoteOn`, [vel/127, key, monoTrig]);
			this.waxml.stop(`MIDI:NoteOn:${ch}`, [vel/127, key, monoTrig]);
			this.waxml.stop(`MIDI:NoteOn:${ch}:${key}`, [vel/127]);
			this.waxml.stop(`MIDI:NoteOn:${ch}:${key}:${vel}`);

		}
	}

	noteOff(ch, key, vel = 127){

		if(this.keysPressed[ch][key]){

			this.keysPressed[ch][key] = false;
			let monoTrig = this.keysPressed[ch].find(state => state) ? false : true;
	
			this.waxml.start(`MIDI:NoteOff`, [vel/127, key, monoTrig]);
			this.waxml.start(`MIDI:NoteOff:${ch}`, [vel/127, key, monoTrig]);
			this.waxml.start(`MIDI:NoteOff:${ch}:${key}`, [vel/127]);
			this.waxml.start(`MIDI:NoteOff:${ch}:${key}:${vel}`);

			this.waxml.stop(`MIDI:NoteOff`, [vel/127, key, monoTrig]);
			this.waxml.stop(`MIDI:NoteOff:${ch}`, [vel/127, key, monoTrig]);
			this.waxml.stop(`MIDI:NoteOff:${ch}:${key}`, [vel/127]);
			this.waxml.stop(`MIDI:NoteOff:${ch}:${key}:${vel}`);
		}
	}

}

module.exports = MidiManager;