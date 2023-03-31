

class KeyboardManager {

	constructor(waxml){

		document.addEventListener("keydown", e => this.keyDown(e));
		document.addEventListener("keyup", e => this.keyUp(e));
		this.keysPressed = {};
		this.waxml = waxml;
		this.blockKeys = `.,;:#'*¨^´?+=)(/&%€#!"${"`"}`;
	}

	keyDown(e){
		if(this.blockKeys.includes(e.key)){return}
		if(!this.keysPressed[e.key]){

			let monoTrig = false;
			if(!Object.entries(this.keysPressed).find(([key, state]) => state)){
				monoTrig = true;
			}
			
			this.keysPressed[e.key] = true;
			//event.preventDefault();
	
			// 1 is factor (eg velocity)
			// e.key is key (eg note)
			this.waxml.start(`keydown`, [1, e.key, monoTrig]);
			this.waxml.stop(`keydown`, [1, e.key, monoTrig]);
	
			this.waxml.start(`keydown:${e.key}`);
			this.waxml.stop(`keydown:${e.key}`);

			this.waxml.setVariable(`keydown:${e.key}`, 1);
		}
		
	}

	keyUp(e){
		if(this.blockKeys.includes(e.key)){return}
		if(this.keysPressed[e.key]){

			this.keysPressed[e.key] = false;
			//event.preventDefault();	
			let monoTrig = false;
			if(!Object.entries(this.keysPressed).find(([key, state]) => state)){
				monoTrig = true;
			}
		
			// 1 is factor (eg velocity)
			// e.key is key (eg note)
			this.waxml.start(`keyup`, [1, e.key, monoTrig]);
			this.waxml.stop(`keyup`, [1, e.key, monoTrig]);
	
			this.waxml.start(`keyup:${e.key}`);
			this.waxml.stop(`keyup:${e.key}`);

			this.waxml.setVariable(`keydown:${e.key}`, 0);
		}

		
	}

}

module.exports = KeyboardManager;
