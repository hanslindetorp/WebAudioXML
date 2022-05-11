var BufferSourceObject = require('./BufferSourceObject.js');
var WebAudioUtils = require('./WebAudioUtils.js');


class AmbientAudio {

	constructor(obj, params, waxml){

        // ambient sounds are always looped through 
        // overlayering two buffers with crossfade.
        params.loop = false;
    
        this._ctx = obj._ctx;
		this._parentAudioObj = obj;
        this.cnt = 0;

        this._params = this.initParams(params);

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

    initParams(params = {}){

        let timescale = this.getParameter("timescale");

        if(typeof params.fadeTime == "undefined")params.fadeTime = 1 / timescale;
        if(typeof params.loopStart == "undefined")params.loopStart = 0;
        if(typeof params.detune == "undefined")params.detune = 0;
        if(typeof params.randomPosition  == "undefined")params.randomPosition = 0;
        if(typeof params.randomDuration  == "undefined")params.randomDuration = 0;
        if(typeof params.randomDetune  == "undefined")params.randomDetune  = 0;
        return params;
    }


  	getParameter(paramName){
        if(!this._params)this._params = {}
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
                case "loopLength":
                case "delay":
                case "crossFade":
                case "fadeTime":
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
        // it's SOOO confusing with timescale. Think it through carefully. Where
        // is it stored, when is it used. On setting or getting etc.
        this._params.loopStart = val / this.getParameter("timescale");
    }

    get loopStart(){
        return this._params.loopStart;
    }

    set loopEnd(val){
        // it's SOOO confusing with timescale. Think it through carefully. Where
        // is it stored, when is it used. On setting or getting etc.
        this._params.loopEnd = val / this.getParameter("timescale");
    }

    get loopEnd(){
        return this._params.loopEnd;
    }

    set loopLength(val){
        // it's SOOO confusing with timescale. Think it through carefully. Where
        // is it stored, when is it used. On setting or getting etc.
        this._params.loopLength = val / this.getParameter("timescale");
    }

    get loopLength(){
        return this._params.loopLength;
    }

    set src(val){
        this._params.src = val;
        this.bufferSource1.src = val;
        this.bufferSource2.src = val;
    }

    get src(){
        return this._params.src;
    }

    set playbackRate(val){
        this._params.playbackRate = val;
        this.bufferSource1.playbackRate = val;
        this.bufferSource2.playbackRate = val;
    }

    get playbackRate(){
        return this._params.playbackRate;
    }

    set detune(val){
        this.playbackRate = WebAudioUtils.centToPlaybackRate(val);
    }

    get detune(){
        return WebAudioUtils.playbackRateToCent(this.playbackRate);
    }

    set fadeTime(val){
        // it's SOOO confusing with timescale. Think it through carefully. Where
        // is it stored, when is it used. On setting or getting etc.
        this._params.fadeTime = val / this.getParameter("timescale");
    }

    get fadeTime(){
        return this._params.fadeTime;
    }
  

    set gain(val){
        this._params.gain = val;
        this.output.gain.setTargetAtTime(val, 0, this.getParameter("transitionTime"));
    }
  
    get gain(){
        return this._params.gain;
    }
     


    set randomPosition(val){
        val = Math.max(0, Math.min(val, 1));
        this._params.randomPosition = val;
    }
    get randomPosition(){
        return this._params.randomPosition;
    }


    set randomDuration(val){
        val = Math.max(0, Math.min(val, 1));
        this._params.randomDuration = val;
    }
    get randomDuration(){
        return this._params.randomDuration;
    }


    set randomDetune(val){
        val = Math.max(0, Math.min(val, 1));
        this._params.randomDetune = val;
        this.bufferSource1.randomDetune = val;
        this.bufferSource2.randomDetune = val;
    }
    get randomDetune(){
        return this._params.randomDetune;
    }

    connect(destination){
        this.output.connect(destination);
        return destination;
    }
	
    start(){
        if(this.bufferSource1._buffer && this.bufferSource2._buffer){
            // turn on buffer1
            this.fade1.gain.setTargetAtTime(1, 0, 0.001);
            if(!this.inited){
                this.trigSample();
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

    trigSample(){
        // calculate offset and duration
        let start = this.getParameter("loopStart");
        let length = this.getParameter("loopLength");

        let randomDetune = this.getParameter("randomDetune") || 0;
        let randomDetuneValue = (Math.random() * 2 - 1) * randomDetune;

        let playbackRate = this._params.playbackRate;
        let randomPlaybackRate = WebAudioUtils.centToPlaybackRate(randomDetuneValue);
        playbackRate *= randomPlaybackRate;
        let factor = 1 / playbackRate;
        this.bufferSource1.playbackRate = playbackRate;
        this.bufferSource2.playbackRate = playbackRate;
        
        let bufferDuration = this.bufferSource1._buffer.duration * factor;
        let duration = length || (this.getParameter("loopEnd") || bufferDuration) - start;
        let fadeTime =  this.getParameter("fadeTime");

        start = Math.max(0, Math.min(start, bufferDuration-duration));
        fadeTime = Math.max(0.001, Math.min(fadeTime, duration / 2));

        // random start
        let minStartPos = 0;
        let maxStartPos = bufferDuration - length;
        let positionRange = (maxStartPos - minStartPos) * factor;
        let randomPos = Math.random() * positionRange + minStartPos;
        let diff = randomPos - start;
        let offset = start + diff * this.getParameter("randomPosition") || 0;

        let minDelay = 0.1;
        let maxDelay = bufferDuration - fadeTime;
        let delayRange = maxDelay - minDelay;
        let randomDelay = Math.random() * delayRange + minDelay;
        let delay = duration - fadeTime;
        let delayDiff = randomDelay - delay;
        delay = delay + delayDiff * this.getParameter("randomDuration") || 0;
        duration = delay + fadeTime;

        // Trig the current buffer of the two possible ones
        let targetBuffer = this.cnt % 2 ? this.bufferSource2 : this.bufferSource1;
        this.nextTime = this.nextTime || this._ctx.currentTime;
        targetBuffer.start(this.nextTime, offset, duration);

        // Evaluate if setTargetAtTime is the best method. It might not give equal power.
        // fade in or out
        this.fade1.gain.setTargetAtTime((this.cnt+1) % 2, this.nextTime, fadeTime / 5);
        //this.fade1.gain.linearRampToValueAtTime((this.cnt+1) % 2, this._ctx.currentTime + fadeTime);
        // fade in or out
        this.fade2.gain.setTargetAtTime(this.cnt % 2, this.nextTime, fadeTime / 5);
        //this.fade2.gain.linearRampToValueAtTime(0, 0, this._ctx.currentTime + fadeTime);

        this.nextTime += delay;
        this.cnt++;
        let timeToNextTrig = this.nextTime - this._ctx.currentTime - 0.01;
        setTimeout(e => this.trigSample(), timeToNextTrig * 1000);
    }
    
	    
}

module.exports = AmbientAudio;
