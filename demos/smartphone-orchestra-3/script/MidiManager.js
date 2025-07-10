class MidiManager extends EventTarget {

	constructor(){
        super();
		this.keysPressed = Array(16).fill(Array(127).fill(false));
		this.keysSustained = Array(16).fill(Array(127).fill(false));
		this.sustain = Array(16).fill(0);
	}


	midiIn(midiEvent){
        const {channel, status, data1, data2} = midiEvent;
        console.log(midiEvent);

		switch(status){
			case 9:
			case 8:
			// note on & off
			if(status == 9 && data2 > 0){
				this.noteOn(channel, data1);
			} else {
				this.noteOff(channel, data1);
			}
			break;

			case 11:
			// controlChange
			if(data1 == 64){
				this.sustain[channel] = data2;
				if(!data2){
					// release sustained notes
					this.keysSustained[channel].forEach((state, key) => {
						if(state){
							this.keysPressed[channel][key] = false;
						}
					});
				}
			}
			break;

		}
	}

	noteOn(ch,key){
		this.keysPressed[ch][key] = true;
		console.log(this.keyToName(key));
	}

	noteOff(ch,key){
		if(this.sustain[ch]){
			this.keysSustained[ch][key] = true;
		} else {
			this.keysPressed[ch][key] = false;
		}
	}

	keyToName(key){
		let octave = Math.floor(key / 12)-2;
		let name = ["C","C#","D","D#","E","F","F#","G","G#","A","Bb","B"][key % 12];
		return name + octave;
	}

    getCurrentKeys(ch = 0){
        return this.keysPressed[ch].map((state, key) => state ? key : -1).filter(key => key >= 0);
    }

}


module.exports = MidiManager; 