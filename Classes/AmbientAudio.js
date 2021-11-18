var BufferSourceObject = require('./BufferSourceObject.js');


class AmbientAudio {

	constructor(obj, params, waxml){

        // ambient sounds are always looped through 
        // overlayering two buffers with crossfade.
        params.loop = false;
        if(typeof params.crossFade == "undefined")params.crossFade = 1;

        this._params = params;
        this._ctx = obj._ctx;
		this._parentAudioObj = obj;
        this.cnt = 0;

        this.input = new GainNode(this._ctx);
        this.fade = new GainNode(this._ctx);
        this.fade1 = new GainNode(this._ctx);
        this.fade2 = new GainNode(this._ctx);
        this.send = new GainNode(this._ctx);
        this.output = new GainNode(this._ctx);

        this.input.connect(this.fade).connect(this.send).connect(this.output);
        this.fade1.connect(this.fade);
        this.fade2.connect(this.fade);

        this.fade.gain.value = 0;
        this.fade1.gain.value = 0;
        this.fade2.gain.value = 0;

        if(params.src){
            this.bufferSource1 = new BufferSourceObject(this, params);
            this.bufferSource1.connect(this.fade1);

            this.bufferSource2 = new BufferSourceObject(this, params);
            this.bufferSource2.connect(this.fade2);
        } else {
            // console.error("No src specified for ObjectBasedAudio", params);
        }

        if(params.convolution){
            this.convolverNode = waxml.getConvolver(params.convolution).node;
            this.send.connect(this.convolverNode);
            if(!(typeof params.convolutionGain == "undefined" || typeof params.convolutionGain.valueOf() == "undefined")){
                this.send.gain.value = params.convolutionGain;
            }
        }

        
	}


  	getParameter(paramName){
        if(typeof this._params[paramName] === "undefined"){
            
            if(this._parentAudioObj){
                return this._parentAudioObj.getParameter(paramName);
            } else {
                return 0;
            }

        } else {
            let val = this._params[paramName];

            switch(paramName){
                case "transitionTime":
                case "loopEnd":
                case "loopStart":
                case "delay":
                case "crossFade":
                let timescale = this.getParameter("timescale") || 1;
                val *= timescale;
                break;

            }
            return val;
        }
    }
	
    get input(){
        return this._input;
    }

    set input(node){
        this._input = node;
    }

    get output(){
        return this._output;
    }

    set output(node){
        this._output = node;
    }

    set loop(val){
        this._params.loop = val;
    }

    get loop(){
        return this._params.loop;
    }

    set loopStart(val){
        this._params.loopStart = val;
    }

    get loopStart(){
        return this._params.loopStart;
    }

    set loopEnd(val){
        this._params.loopEnd = val;
    }

    get loopEnd(){
        return this._params.loopEnd;
    }

    set src(val){
        this._params.src = val;
        this.bufferSource1.src = val;
        this.bufferSource2.src = val;
    }

    get src(){
        return this._params.src;
    }

    set crossFade(val){
        this._params.crossFade = val;
        return this._params.src;
    }

    get crossFade(){
        return this._params.crossFade;
    }

    set playbackRate(val){
        this._params.playbackRate = val;
        this.bufferSource1.playbackRate = val;
        this.bufferSource2.playbackRate = val;
    }

    get playbackRate(){
        return this._params.playbackRate;
    }

    
  

    set gain(val){
        this._params.gain = val;
        this.output.gain.setTargetAtTime(val, 0, this.getParameter("transitionTime"));
    }
  
    get gain(){
        return this._params.gain;
    }
     
    connect(destination){
        this.output.connect(destination);
        return destination;
    }
	
    start(){
        if(this.bufferSource1._buffer && this.bufferSource2._buffer){
            if(!this.inited){
                this.initLoop();
                this.inited = true;
            }
            let transitionTime = this.getParameter("transitionTime") || 2;
            this.fade.gain.setTargetAtTime(1, 0, transitionTime);
        } else {
            let fn = () => this.start();
            if(!this.bufferSource1._buffer){
                this.bufferSource1.addCallBack(fn);
            }
            if(!this.bufferSource2._buffer){
                this.bufferSource2.addCallBack(fn);
            }
        }
    }

    stop(){
        let transitionTime = this.getParameter("transitionTime") || 2;
        this.fade.gain.setTargetAtTime(0, 0, transitionTime);
    }

    initLoop(){
        this.trigSample();

        // wait the length of bufferSource - this.crossFade before starting
        // this.bufferSource2
        let delay = 1000 * (this.bufferSource1._buffer.duration - this.crossFade);
        setInterval(e => this.trigSample(), delay);

        // turn on buffer1
        this.fade1.gain.setTargetAtTime(1, 0, 0.001);
    }

    trigSample(){
        let targetBuffer = this.cnt % 2 ? this.bufferSource2 : this.bufferSource1;
        targetBuffer.start();
        this.fade1.gain.setTargetAtTime((this.cnt+1) % 2, 0, this.crossFade);
        this.fade2.gain.setTargetAtTime(this.cnt % 2, 0, this.crossFade);
        this.cnt++;
    }
    
	    
}

module.exports = AmbientAudio;
