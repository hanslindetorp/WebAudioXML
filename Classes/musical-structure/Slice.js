const BaseTimedAudioObject = require('./BaseTimedAudioObject.js');


class Slice extends BaseTimedAudioObject {

	constructor(xmlNode, waxml, params){
		super(xmlNode, waxml, params);

		this.params.from = parseFloat(this.params.from || 0);
		this.params.to = parseFloat(this.params.to || 0);
	}
	
	    
}

module.exports = Slice;
