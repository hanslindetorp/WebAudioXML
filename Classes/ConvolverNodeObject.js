var Loader = require('./Loader.js');


// Skriv en Loader.fetch som funkar med "then"

class ConvolverNodeObject {

	constructor(obj, src){
        this._ctx = obj._ctx;
        this.src = src;
        this._node = this._ctx.createConvolver();
		this._parentAudioObj = obj;
        Loader.loadAudio(src, this._ctx).then(audioBuffer => this._node.buffer = audioBuffer);
	}
	
	get _node(){
        return this.node;
    }

    set _node(n){
        this.node = n;
    }

    get input(){
        return this._node;
    }

    connect(destination){
        this._node.connect(destination);
        return destination;
    }

    disconnect(ch=0){
        this._node.disconnect(ch);
    }
	    
    
}

module.exports = ConvolverNodeObject;
