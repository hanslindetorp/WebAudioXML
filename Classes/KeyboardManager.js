

class KeyboardManager {

	constructor(waxml){

		document.addEventListener("keydown", e => this.keyDown(e));
		document.addEventListener("keyup", e => this.keyUp(e));
		this.keysPressed = {};
		this.waxml = waxml;
	}

	keyDown(e){
		this.keysPressed[e.key] = true;
		event.preventDefault();

		// 1 is factor (eg velocity)
		// e.key is key (eg note)
		this.waxml.start(`keydown`, [1, e.key]);
		this.waxml.stop(`keydown`, [1, e.key]);

		this.waxml.start(`keydown\\/${e.key}`);
		this.waxml.stop(`keydown\\/${e.key}`);
	}

	keyUp(e){
		this.keysPressed[e.key] = false;
		event.preventDefault();	
	
		// 1 is factor (eg velocity)
		// e.key is key (eg note)
		this.waxml.start(`keyup`, [1, e.key]);
		this.waxml.stop(`keyup`, [1, e.key]);

		this.waxml.start(`keyup/${e.key}`);
		this.waxml.stop(`keyup/${e.key}`);
	}

}

module.exports = KeyboardManager;
