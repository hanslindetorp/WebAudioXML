
var Sequence = require('./Sequence.js');


class Sequencer {

	constructor(_varRouter){
		this.variableRouter = _varRouter;
	}

	clear(){

		this._events = [];
	}

	get events(){
		return this._events;
	}

	get lastTouchGesture(){

	}

	addEvent(variable, val){
			let time = new Date().getTime();

	}

}


module.exports = Sequencer;
