(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var BufferSourceObject = require('./BufferSourceObject.js');
var WebAudioUtils = require('./WebAudioUtils.js');


class AmbientAudio {

	constructor(obj, params, waxml){

        // ambient sounds are always looped through 
        // overlayering two buffers with crossfade.
        params.loop = false;
        params.mono = true;
    
        this._ctx = obj._ctx;
		this._parentAudioObj = obj;
        this.cnt = 0;

        this._params = this.initParams(params);

        this.input = new GainNode(this._ctx);
        this.fade = new GainNode(this._ctx);
        this.fade1 = new GainNode(this._ctx);
        this.fade2 = new GainNode(this._ctx);

        this.fades = [this.fade1, this.fade2];
        this.send = new GainNode(this._ctx);
        this.output = new GainNode(this._ctx);

        this.input.connect(this.fade);
        this.fade.connect(this.send);
        this.send.connect(this.output);

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
        this._params.loopStart = val; // / this.getParameter("timescale");
    }

    get loopStart(){
        return this._params.loopStart;
    }

    set loopEnd(val){
        // it's SOOO confusing with timescale. Think it through carefully. Where
        // is it stored, when is it used. On setting or getting etc.
        this._params.loopEnd = val; // / this.getParameter("timescale");
    }

    get loopEnd(){
        return this._params.loopEnd;
    }

    set loopLength(val){
        // it's SOOO confusing with timescale. Think it through carefully. Where
        // is it stored, when is it used. On setting or getting etc.
        this._params.loopLength = val; //  / this.getParameter("timescale");
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
        if(this.bufferSource1){this.bufferSource1.playbackRate = val}
        if(this.bufferSource2){this.bufferSource2.playbackRate = val}
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
            // let transitionTime = this.getParameter("transitionTime") || 2;
            let fadeTime =  this.getParameter("fadeTime");
            this.fade.gain.setTargetAtTime(1, 0, fadeTime);
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
        // let transitionTime = this.getParameter("transitionTime") || 2;
        let fadeTime =  this.getParameter("fadeTime");
        this.fade.gain.setTargetAtTime(0, 0, fadeTime);
    }

    trigSample(){
        // calculate offset and duration
        let start = this.getParameter("loopStart");
        let length = this.getParameter("loopLength");

        let randomDetune = this.getParameter("randomDetune") || 0;
        let randomDetuneValue = (Math.random() * 2 - 1) * randomDetune;

        
        let playbackRate = typeof this._params.playbackRate == "undefined" ? 1 : this._params.playbackRate;
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
        this.fade1.gain.setTargetAtTime((this.cnt+1) % 2, this.nextTime, fadeTime / 3);
        // this.fade1.gain.linearRampToValueAtTime((this.cnt+1) % 2, this._ctx.currentTime + fadeTime / 2);
        // this.fade1.gain.exponentialRampToValueAtTime((this.cnt+1) % 2 + (10 ** -10), fadeTime);

        // let val1 = (this.cnt+1) % 2;
        // let val2 = this.cnt % 2;


        let nrOfValues = 50;
        let curve1Values = [];
        let curve2Values = [];

        // equal power curve
        for(let j=0; j<=nrOfValues; j++){
            let x = j/nrOfValues;
            let val1 = Math.cos(x * 0.5*Math.PI);
            let val2 = Math.cos((1.0 - x) * 0.5*Math.PI);
            curve1Values.push(val1);
            curve2Values.push(val2);
        }
        // this.fades[1].gain.cancelScheduledValues(this.nextTime);
        // this.fades[0].gain.cancelScheduledValues(this.nextTime);
        // this.fades[1].gain.setValueCurveAtTime(curve1Values, this.nextTime, fadeTime);
        // this.fades[0].gain.setValueCurveAtTime(curve2Values, this.nextTime, fadeTime);
        
        // fade in or out
        this.fade2.gain.setTargetAtTime(this.cnt % 2, this.nextTime, fadeTime / 3);
        // this.fade2.gain.linearRampToValueAtTime(this.cnt % 2, this._ctx.currentTime + fadeTime / 2);
        // this.fade2.gain.exponentialRampToValueAtTime(this.cnt % 2 + (10 ** -10), fadeTime);

        this.nextTime += delay;
        this.cnt++;
        this.fades.push(this.fades.shift()); // toggle order
        let timeToNextTrig = this.nextTime - this._ctx.currentTime - 0;
        setTimeout(e => this.trigSample(), timeToNextTrig * 1000);
    }
    
	    
}

module.exports = AmbientAudio;

},{"./BufferSourceObject.js":4,"./WebAudioUtils.js":39}],2:[function(require,module,exports){

const WebAudioUtils = require('./WebAudioUtils.js');
const Loader = require('./Loader.js');
const Watcher = require('./Watcher.js');
const VariableContainer = require('./VariableContainer.js');
const Variable = require('./Variable.js');
const Mapper = require('./Mapper.js');
const BufferSourceObject = require('./BufferSourceObject.js');
const ConvolverNodeObject = require('./ConvolverNodeObject.js');
const ObjectBasedAudio = require('./ObjectBasedAudio.js');
const AmbientAudio = require('./AmbientAudio.js');
const Noise = require('./Noise.js');




class AudioObject extends EventTarget{

  	constructor(xmlNode, waxml, localPath, params){
      super();
	  	this.waxml = waxml;
	  	let _ctx = this.waxml._ctx;
      let parentAudioObj = xmlNode.parentNode.audioObject;
      this._parentAudioObj = parentAudioObj;
      this.childIndex = [...xmlNode.parentNode.children].indexOf(xmlNode);

      if(parentAudioObj){
        // stupid!
        parentAudioObj.addChildObj(this);
      }
      

	  	this._params = params;
      this.variables = new VariableContainer();
	  	this._xml = xmlNode;
	  	let timeUnit = this.getParameter("timeUnit");


  		switch(timeUnit){
		  	case "ms":
		  	this._params.timescale = 1/1000;
		  	break;

		  	default:
		  	this._params.timescale = 1;
		  	break;
	  	}


	  	this._localPath = localPath;

      // i'm in a vary bad state with case insensitivity
      // While all parameters in Web Audio API of course
      // are case sensitive, the attribute names and nodeNames
      // in XML are not...
		  let nodeType = WebAudioUtils.caseFixParameter(xmlNode.nodeName.toLowerCase());

	  	this._ctx = _ctx;
	  	let fn, src;
	  	this._nodeType = nodeType;

      
      // make sure ALL audioObjects have their parent object set
      if(this._xml.parentNode.audioObject){
        this.parent = this._xml.parentNode.audioObject;
      }

      // currently only used for ChannelMergerNode
      this.childObjects = [];


	  	switch(nodeType){


		  	case "analysernode":
		  	this._node = this._ctx.createAnalyser();
		  	break;


		  	case "audiobuffersourcenode":
        this._node = new BufferSourceObject(this, params);
        // this.bufferSource = new BufferSourceObject(this._ctx, params);
        // creates a living connection with the current active buffernode
		  	// this._node = this.bufferSource._node;
		  	break;


		  	case "oscillatornode":
		  	this._node = this._ctx.createOscillator();
        this._params.type = this._params.type || "sine";
        if(!this._params.type.includes(".js")) {
          this._node.start();
        }
		  	break;

        case "mediastreamaudiosourcenode":
        // make sure both an input and an output is specified
        this._node = this._ctx.createGain();
        break;


		  	case "biquadfilternode":
		  	this._node = this._ctx.createBiquadFilter();
		  	break;

		  	case "convolvernode":
		  	src = this._params.src;

		  	if(src){
          src = Loader.getPath(src, this.getParameter("localpath") || "");
          this._node = new ConvolverNodeObject(this, src);
		  	}

		  	break;

		  	case "delaynode":
        let maxDelayTime = (this._params.maxDelayTime || this._params.delayTime);
        if(maxDelayTime){
          maxDelayTime = maxDelayTime.valueOf();
          maxDelayTime = Math.max(1, maxDelayTime * this._params.timescale);
        } else {
          maxDelayTime = 1;
        }
		  	
			  this._node = this._ctx.createDelay(maxDelayTime);
		  	break;

		  	case "dynamicscompressornode":
        this._node = this._ctx.createDynamicsCompressor();
		  	break;

		  	case "stereopannernode":
		  	if(this._ctx.createStereoPanner){
			  	this._node = this._ctx.createStereoPanner();
		  	} else {
			  	this.fakePanner = true;
			    this._node = this._ctx.createPanner();
			    this._node.panningModel = 'equalpower';
			  }
        this._output = new GainNode(this._ctx);
        this._node.connect(this._output);
        break;

        case "pannernode":
        this._node = new PannerNode(this._ctx, params);
        break;


/*
			  	this.input = this._ctx.createGain();
			  	this.channelSplitter = this._ctx.createChannelSplitter(2);
				this.channelSplitter.channelCountMode = "explicit";
				this.channelSplitter.channelInterpretation = "discrete";
			  	this.L = this._ctx.createGain();
			  	this.R = this._ctx.createGain();
			  	this._node = this._ctx.createChannelMerger(2);
				this._node.channelCountMode = "explicit";
				this._node.channelInterpretation = "discrete";


			  	this.input.connect(this.channelSplitter);
			  	this.channelSplitter.connect(this.L, 0, 0).connect(this._node, 0, 0);
			  	this.channelSplitter.connect(this.R, 1, 0).connect(this._node, 0, 1);
*/

		  	break;

		  	case "waveshapernode":
        this._node = this._ctx.createWaveShaper();
        this._node.oversample = this._params.oversample || 'none';
        this.amount = this._params.amount.valueOf();
		  	break;

		  	case "periodicwavenode":
		  	break;

		  	case "iirfilternode":
		  	break;

        case "audioworkletnode":
        let localPath = this.getParameter("localpath") || "";
        src = this._params.src;
        if(src){
          this._input = this._ctx.createGain();
          let processorName = src.split(".").shift().split("/").pop();
          if(this._ctx.audioWorklet){

            let setParams = () => {
              Object.entries(this._params).forEach(paramObj => {
                let val = paramObj[1].valueOf();
                let targetParam = this._node.parameters.get(paramObj[0]);
                if(typeof val != "undefined" && targetParam){
                  // if parameter is set
                  // and target parameter is found in audioworklet
                  targetParam.setValueAtTime(val, this._ctx.currentTime);
                }
              });
            }

            // use try/catch to avoid mutiple registration of processors
            // doesn't really seem to work, though...
            try {
              this._node = new AudioWorkletNode(this._ctx, processorName);
              setTimeout(e => {
                // this._node.connect(this._destination);
                this.connect(this._destination);
              }, 1000);
              setParams();
            } catch {
              console.log("addModule", localPath + src);
              this._ctx.audioWorklet.addModule(localPath + src)
              .then(e =>{
                this._node = new AudioWorkletNode(this._ctx, processorName);
                setTimeout(e => {
                  // this._node.connect(this._destination);
                  this._input.connect(this._node);
                  this.connect(this._destination);
                }, 1000);
                setParams();
              });
            }

            // console.log("addModule", localPath + src);
            // this._ctx.audioWorklet.addModule(localPath + src)
            // .then(e =>{
            //   this._node = new AudioWorkletNode(this._ctx, processorName);
            //   setTimeout(e => this._node.connect(this._destination), 1000);
            //   //this._node.connect(this.output);
            // });


          } else {
            console.error("WebAudioXML error. No support for AudioWorkletNode");
          }
          // temporary
          this._node = this._ctx.createGain();
          this.output = this._ctx.createGain();
        }
        break;

		  	case "xml":
		  	break;

        case "mixer":
        this._node = this._ctx.createGain();
        this.inputs = [];
        while(this.inputs.length < xmlNode.children.length){
          let input = this._ctx.createGain();
          input.connect(this._node);
          this.inputs.push(input);
        }
        break;

		  	case "audio":
        case "gainnode":
        case "mixer":
        case "voice":
        case "include":
        case "xi:include":
		  	this._node = this._ctx.createGain();
		  	break;


        case "objectbasedaudio":
        this._node = new ObjectBasedAudio(this, this._params, waxml);
        break;

        case "ambientaudio":
        this._node = new AmbientAudio(this, this._params, waxml);
        break;

        case "noise":
        this._node = new Noise(waxml._ctx);
        break;

        case "send":
		  	this._node = this._ctx.createGain();
        this._bus = this._ctx.createGain();
        this._node.connect(this._bus);
        break;

		  	case "chain":
		  	this.input = this._ctx.createGain();
		  	//console.log("chain input", this.input.__resource_id__);
		  	this._node = this._ctx.createGain();
		  	break;

        case "channelsplitternode":
        this.input = new ChannelSplitterNode(this._ctx, {
          numberOfOutputs: this._ctx.destination.maxChannelCount,
          channelCount: this._ctx.destination.maxChannelCount,
          channelCountMode: "explicit",
          channelInterpretation: "discrete"
        });
		  	this._node = this._ctx.createGain();
        break;

        case "channelmergernode":
        // this._node = new ChannelMergerNode(this._ctx, {
        //   numberOfInputs: this._ctx.destination.maxChannelCount,
        //   channelCount: 1,
        //   channelCountMode: "explicit",
        //   channelInterpretation: "discrete"
        // });
        this._node = new ChannelMergerNode(this._ctx, {
          numberOfInputs: this._ctx.destination.maxChannelCount,
          channelInterpretation: "discrete"
        });

        this.channels = [];
        while(this.channels.length < this._ctx.destination.maxChannelCount){
          let gainNode = new GainNode(this._ctx, {
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "discrete"
          });
          gainNode.connect(this._node, 0, this.channels.length);
          this.channels.push(gainNode);
        }

        this.inputs = [];
        while(this.inputs.length < xmlNode.childElementCount){
          let gainNode = new GainNode(this._ctx, {
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "discrete"
          });
          
          //gainNode.connect(this._node, 0, this.inputs.length);
          this.inputs.push(gainNode);
        }
        break;


		  	case "envelope":
        if(xmlNode.parentNode.audioObject){
          this._node = xmlNode.parentNode.audioObject._node;
        }
		  	
		  	this._params.max = this._params.max || 1;
		  	this._params.valuescale = this._params.max / 100;

        // check if ADSR has parameters that should follow
        // external variables (this should be more generic)
        // Array.from(xmlNode.children).forEach(paramElement => {
        //   let follow = paramElement.getAttribute("follow");
        //   if(follow){
        //     follow = WebAudioUtils.typeFixParam("follow", follow);
        //     let watcher = new Watcher(paramElement, follow, {
        //
        //       callBack: val => {
        //         this._params.adsr[paramElement.nodeName] = val;
        //       }
        //     });
        //   }
        // });


        // init envelope to be "closed" on startup
        if(this._node){
          this.setTargetAtTime(this._node, 0, 0, 0, true);
        }
		  	
		  	break;



		  	// audio parameters
        // these should really be separate classes or maybe be removed
        // completely as elements. It would be cleaner to stay with 
        // audioNodes as elements and properties as attributes
		  	default:
		  	this.mapper = new Mapper(this._params);

		  	nodeType = WebAudioUtils.caseFixParameter(nodeType);
		  	let parentAudioObj = xmlNode.parentNode.audioObject;
        this._parentAudioObj = parentAudioObj;

		  	if(parentAudioObj){

			  	this._node = parentAudioObj.getParameterNode(nodeType);
          let targetName;
          let target;
          if(this._node){
            target = this._node;
            targetName = this._nodeType;
          } else {

            targetName = nodeType;

            // check if this parameter is a paramater within a parameters
            // ie attack within "ADSR" inside "Envelope"
            target = parentAudioObj._targetObject;
            if(target){
              target = target[parentAudioObj._nodeType];
            } else {
              target = parentAudioObj._params;
            }
            this._targetObject = target;
          }

			  	if(this._params.value && this._node){
				  	this._params.value = WebAudioUtils.typeFixParam(nodeType, this._params.value);
				  	this._node.value = this._params.value;
            parentAudioObj._params[nodeType] = this._params.value.valueOf();
				  }
          if(this._params.follow && this._params.follow.length){ // && !isPartOfASynth){
            let isPartOfASynth = xmlNode.closest("Synth");

            // this needs to be reworked. It's now optimized to respond to MIDI key numbers
            // But not to MIDI control change values
            let controlledByMIDI = isPartOfASynth && this._params.follow.join("").includes("MIDI");
    				if(!controlledByMIDI){
              this.watcher = new Watcher(xmlNode, this._params.follow, {
                delay: this.getParameter("delay"),
                waxml: this.waxml,
                range: this._params.range,
                value: this._params.value,
                curve: this._params.curve,
                callBack: (val, time = 0) => {

      						val = this.mapper.getValue(val);

      						switch(targetName){
      							case "delayTime":
      							val *= this._params.timescale;
      							break;

                    case "frequency":
                    if(parentAudioObj){
                      if(parentAudioObj._nodeType.toLowerCase() == "oscillatornode"){
                        if(!time){
                          time = this.getParameter("portamento") || 0;
                          time = this.getParameter("transitionTime") || time;
                          time *= this._params.timescale;
                        }
                        
                      }
                    }
                    break;

                    case "playbackRate":
                    parentAudioObj.playbackRate = val;
                    break;

      							default:
      							break;
      						}

      						this.setTargetAtTime(targetName, val, 0, time, true);
      					 }
               });
              }
  				  }

  		  	} else {
  			  	console.error("WebAudioXML: Invalid element - '" + nodeType + "'");
  		    }
		  	  break;
	  	}

	  	//console.log(nodeType, this._node.__resource_id__);


	  	// set parameters
	  	if(this._params){
        //let envName;
        Object.entries(this._params).forEach(entry => {
          const [key, value] = entry;
          if(typeof this[key] !== "function"){
            // make sure we're not overwriting a function with a custom attribute...

            if(WebAudioUtils.nrOfVariableNames(value)){
              new Watcher(xmlNode, value, {
                waxml: this.waxml,
                containsVariableNames: true,
                callBack: (val, time=0) => {
                  switch(key){
                    case "delayTime":
                    val *= this._params.timescale;
                    break;

                    case "frequency":
                    if(this.parent){
                      if(this.parent._nodeType.toLowerCase() == "oscillatornode"){
                        if(!time){
                          time = this.getParameter("portamento") || 0;
                          time = this.getParameter("transitionTime") || time;
                          time *= this._params.timescale;
                        }
                        
                      }
                    }
                    break;

                    case "playbackRate":
                    parentAudioObj.playbackRate = val;
                    break;

                    default:
                    break;
                  }

                  this.setTargetAtTime(key, val, 0, time, true);
                 }
               });
            //} else if(envName && envName == WebAudioUtils.getEnvelopeName(value)){

              // old code
              // // make connection to controlling Envelope
              // let envNode = WebAudioUtils.findXMLnodes(xmlNode, "name", envName).pop();
              // if(envNode){
              //   envNode.obj.addListener(this._node[key], value);
              // } else {
              //   console.error(`No envelope matches the name '${envName}'`);
              // }
            } else {
              
              // make connection to controlling Envelope
              let envName = WebAudioUtils.getEnvelopeName(value);
              if(envName){
                let envNode = WebAudioUtils.findXMLnodes(xmlNode, "name", envName).pop();
                if(envNode){
                  envNode.obj.addListener(this._node[key], value);
                } else {
                  console.error(`No envelope matches the name '${envName}'`);
                }
              }
              

            }

            
            // varning!! Super dangerous feature. Must be changed
            // so that attributes don't overwrite any class functions
            // typeof this[key] !== "function" was added to save from
            // a disaster
   
            let v = this._params[key].valueOf();
            // if(typeof v !== "undefined")this[key] = v;
            if(typeof v == typeof this[key] || typeof this[key] == "undefined")this[key] = v;
          }

  			});
  		};

  	}

    follow(val){

      val = this.mapper.getValue(val);

      switch(this._nodeType){
        case "delayTime":
        val *= this._params.timescale;
        break;

        default:
        break;
      }
      let transitionTime = this.getParameter("transitionTime");

      this.setTargetAtTime(this._node, val, 0, 0, true);
    }

    getParameter(paramName){

      // stupid to separate parameters (from attributes) and variables (stored in var-elements)
      let storedParameter = this._params[paramName];
      let storedVariable = this.getVariable(paramName);

      let val = storedVariable || storedParameter;

      if(typeof val === "undefined"){
          
          if(this._parentAudioObj){
              return this._parentAudioObj.getParameter(paramName);
          } else {

              // return default values
              switch(paramName){
                case "transitionTime":
                  val = 0.001;
                break;

                case "frameRate":
                  val = 30;
                break;

                case "fallOffRatio":
                  val = 0.5;
                break;


                case "smoothDerivative":
                  val = 5;
                break;

                case "loopEnd":
                  // avoid setting loopEnd to 0
                  // ideally (maybe) setting it to duration
                  // of audio buffer
                break;

                default:
                  val = 0;
                break;
              }
              return val;
          }

      } else {
          val = val.valueOf();

          // adjust time
          switch(paramName){
              case "transitionTime":
              case "loopEnd":
              case "loopStart":
              case "delay":
              let timescale = this.getParameter("timescale") || 1;
              val *= timescale;
              break;

          }
          return val;
      }
    }


    getControllingVariableName(parameterName){

      // NOTE!
      // This assumes there is only one controlling variable
			let parameter = this.parameters[parameterName];
      if(parameter){
        return parameter.variableNames[0];
      }
			
    }


  	get connection(){
	  	return this._node;
  	}

  	get input(){

	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	case "audiobuffersourcenode":
		  	break;

        case "channelmergernode":
        // return this.childObjects.length ? this.childObjects : this.inputs;
		  	break;

        case "objectbasedaudio":         
        case "convolvernode":
        case "ambientaudio": 
        return this._node.input;
        break;

		  	default:
		  	return this._input || this._node;
		  	break;
		  }

  	}
    addChildObj(obj){
      this.childObjects.push(obj);
    }

  	set input(node){
	  	this._input = node;
  	}

    get output(){
      return this._output || this._node;
    }

    set output(destination){
      if(destination instanceof GainNode){
        this.output.connect(destination);
      }
      
    }


  	getParameterNode(param){
	  	if(!this._node){return}
      //if(param == "pan"){return this._node}
	  	return this._node[param];
  	}

  	disconnect(ch){
	  	if(!this._node || !this._node.disconnect){return}
	  	ch = ch || 0;
	  	this._node.disconnect(ch);
  	}

  	connect(destination){

      let source = this.output;
	  	if(source){
		  	if(source.connect){
			  	if(!destination){
            destination = this._ctx.destination;
          }
          if(!(destination instanceof Array)){
            destination = [destination];
          }
          destination.forEach(d => {
            d = d.input || d;
            source.connect(d);
          });
		  	}
	  	}
	  	this._destination = destination;;

  	}


  	inputFrom(sourceObject){
      // This function is used when the input from a chain element shall be
      // redirected to the first child
	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	case "audiobuffersourcenode":
        case "audioworkletnode":
		  	break;

        case "channelmergernode":
        this.childObjects.forEach(obj => sourceObject.connect(obj.input));
        break;

		  	default:
		  	sourceObject.connect(this.input);
		  	break;
		  }
  	}

    initStream(stream){
      let input = this._ctx.createMediaStreamSource(stream);
      input.connect(this._node);
    }

  	start(data = {}){
      this.dispatchEvent(new CustomEvent("start"));
      this._playing = true;
      let time = data.time || this._ctx.currentTime;
      //console.log(time - this._ctx.currentTime);
	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	/*
		  	if(this._params.followkeyboard){
			  	let x = WebAudioUtils.MIDInoteToFrequency(data.note);
			  	if(this._params.followkeyboard.includes("x")){
				  	// what is this for?
				  	x = eval(this._params.followkeyboard);
			  	}
			  	this.frequency = x;
		  	}
		  	*/
		  	break;


        // There is a problem for audio buffer based objects
        // that shall be triggered automatically. They might miss
        // the call if they are not loaded yet.
        case "ambientaudio":
        case "objectbasedaudio":
		  	this._node.start();
		  	break;



		  	case "audiobuffersourcenode":
        // this._node.start();

        // sort this out!!
        if(this._node._buffer){
          this._node.start(time);
        } else {
          let fn = () => this.start();
          this._node.addCallBack(fn);
        }
        break;


        case "audioworkletnode":
        // this._node = this._aw;
        // this._node.connect(this._destination);
        break;


		  	case "frequency":
		  	if(this._params.follow){
			  	if(this._params.follow.join("").includes("MIDI")){
            let offset = this._params.follow[1];
            offset = offset ?  parseFloat(offset) : 0;
				  	let MIDInote = data.note + offset;
			  		let hz = WebAudioUtils.MIDInoteToFrequency(MIDInote);
				  	this.value = hz;
			  	}
		  	}
		  	break;



		  	case "voice":
		  	this.gain = 1;
		  	break;


		  	case "envelope":
          console.log("ENV.start");
        let delay = this.getParameter("delay");
        let fn = () => {};
        let loopFn = () => {};
		  	if(this._params.adsr){
          fn = e => {
            this.setTargetAtTime(this._node, this._params.valuescale * 100, 0, this._params.adsr.attack * this._params.timescale, true);
  			  	this.setTargetAtTime(this._node, this._params.valuescale * this._params.adsr.sustain, this._params.adsr.attack * this._params.timescale, this._params.adsr.decay * this._params.timescale);
          }
		  	} else if(this._params.times && this._params.values) {
          fn = e => {
            let curTime = 0;
            let times = this._params.times.valueOf();
            this.setTargetAtTime(this._node, 0, curTime, 0.001, true);
          
            times.forEach((time, i) => {
              let val = this._params.values[i % this._params.values.length];
              this.setTargetAtTime(this._node, this._params.valuescale * val, curTime, time * this._params.timescale);
              curTime += (time * this._params.timescale);
            });

            if(this._params.loop){
              // let loopLength = times.reduce((a, b) => a + b, 0);
              setTimeout(fn, this._params.loopEnd.valueOf() * this._params.timescale * 1000);
            }
          }
        }

        let execFn = delay ? () => setTimeout(fn, delay * this._params.timescale * 1000) : fn;
        execFn();

		  	break;
	  	}
  	}

    continue(){
      if(this._node.continue){
        this._playing = true;
        this._node.continue();
      }
    }

    resume(){
      if(this._node.resume){
        this._playing = true;
        this._node.resume();
      }
    }

  	stop(data){

      this._playing = false;
	  	switch(this._nodeType){

		  	case "voice":
		  	this.gain = 0;
		  	break;

		  	case "envelope":
		  	if(this._params.adsr){
          let fn = e => {
			  	  this.setTargetAtTime(this._node, 0, 0, this._params.adsr.release * this._params.timescale, true);
          }
          let delay = this.getParameter("delay");
          if(delay){
            setTimeout(fn, delay * this._params.timescale * 1000);
          } else {
            fn();
          }

		  	}
		  	break;

        case "ambientaudio":
        case "audiobuffersourcenode":
        case "objectbasedaudio":
        //if(this._node.stop){this._node.stop()}
        this._node.stop();
        break;

	  	}
  	}




  	setTargetAtTime(param, value, delay, transitionTime, cancelPrevious, audioNode){

	  	let startTime = this._ctx.currentTime + (delay || 0);
      if(param == "delayTime"){
        value *= this._params.timescale;
      }
	  	//transitionTime = transitionTime || 0.001;
	  	//console.log(value, delay, transitionTime, cancelPrevious);

      // this is stupid. Send objects shall control their "_bus" node
      // which is dealt with in the set gain() method, but it wasn't taken care of 
      // here. Not good desig.
      audioNode = audioNode || this._bus ||  this._node;

      if(typeof value == "undefined"){
        console.warn("Cannot set " + param + " value to undefined");
        return;
      }


      // Hela den här if-satsen är en katastrof som MÅSTE göras om från grunden.
      // Kanske det bästa vore att ha en enda funktion för att sätta en parameter som tillåter
      // delay och fadeTime. Sedan får funktionen ta reda på vilka förutsättningar som finns för att
      // ändra med setTargetAtTime. Inte på det här tokiga sättet med undantag i det oändliga.
      
      let avoidList = ["channelmergernode"];

      if(audioNode && !avoidList.includes(this._nodeType)){

        //  web audio parameter
        if(typeof param == "string"){
          // stupid code because Classes are not structured into
          // AudioNode, AudioParameter and WebAudioXML objects
          if(this._nodeType == param){
            param = audioNode;
          } else {
            // some properties, like "coneInnerAngle" are not parameter objects but numbers
            if(typeof audioNode[param] == "object"){
              param = audioNode[param];
            } else {
              // Den här var bökig. Den skapar oändliga calls för 
              // t.ex. ObjectBasedAudio
              // Det ställer också till det för AudioWorklet nodes med custom
              // parameters. De sätts inte med setTargetAtTime() som de ska utan 
              // hamnar här...
              if(this._nodeType == "audioworkletnode" && audioNode.parameters){
                param = audioNode.parameters.get(param);
              } else {
                if(audioNode.hasOwnProperty(param) || !(audioNode instanceof AudioObject)){
                  audioNode[param] = value;
                } else {
                  this[param] = value;
                }
                return;
              }
              
            }

          }
          if(!param){return}
        }

        // checking that value is OK (i.e. not undefined)
        if(!isFinite(value)){
          console.warn("Cannot set " + param + " to a non-finite value.");
          return;
        }


        //if(typeof param == "string"){param = this._node}
        //if(param.value == value){return}

        // param.cancelScheduledValues kontrollerar att funktionen finns
  	  	if(cancelPrevious && param.cancelScheduledValues){
  		  	param.cancelScheduledValues(this._ctx.currentTime);
  	  	}
        transitionTime =  transitionTime || this.getParameter("transitionTime") || 0.001;
        
        if(typeof param.minValue != "undefined" && typeof param.maxValue != "undefined"){
          value = Math.min(value, param.maxValue);
          value = Math.max(value, param.minValue);
        }

  	  	if(transitionTime && param.setTargetAtTime){
  		  	param.setTargetAtTime(value, startTime, transitionTime / 2);
          // console.log(`transitionTime: ${transitionTime}`);
        } else if(param.setValueAtTime){
  		  	param.setValueAtTime(value, startTime);
  	  	}

      } else {

        // javascript object
        if(param == "pan"){
          if(this._nodeType == "channelmergernode"){
            this.pan = value;
          } else {
            this._parentAudioObj.pan = value;
          }
            
        } else {
          this._targetObject[param] = value;
        }


      }


  	}


    getWAXMLparameters(){
      let waxmlParams = [];
      let paramNames = [];
      switch (this._nodeType) {
        default:

      }
      paramNames.forEach((item, i) => {
        let obj = WebAudioUtils.paramNameToRange(item);
        obj.name = item;
        obj.target = this[item];
        obj.parent = this;
        obj.path = e => this.path;
        waxmlParams.push(obj);
      });
      return waxmlParams;
    }

    fadeIn(fadeTime = 0.001){
      this.fade(this.parameters.gain || 1, fadeTime);
    }

    fadeOut(fadeTime = 0.001){
      this.fade(0, fadeTime);
    }
    fade(val = 1, fadeTime = 0.001){
      this.setTargetAtTime("gain", val, 0, fadeTime, true);
    }

    // this utility converts amount of rotation around the Y axis
  // (i.e. rotation in the 'horizontal plane') to an orientation vector
  yRotationToVector(degrees) {
    // convert degrees to radians and offset the angle so 0 points towards the listener
    const radians = (degrees - 90) * (Math.PI / 180);
    // using cosine and sine here ensures the output values are always normalized
    // i.e. they range between -1 and 1
    const x = Math.cos(radians);
    const z = Math.sin(radians);

    // we hard-code the Y component to 0, as Y is the axis of rotation
    return [x, 0, z];
  }



  	set src(path){
	  	this._src = Loader.getPath(path, this._localPath);

	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	break;

		  	case "audiobuffersourcenode":
        case "objectbasedaudio":
        case "ambientaudio":
        this._node.src = this._src;
		  	break;

		  	default:
		  	break;

	  	}
  	}

  	get src(){

	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	return this.type;
		  	break;

		  	case "audiobuffersourcenode":
		  	case "convolvernode":
        case "objectbasedaudio":
        case "ambientaudio":
		  	return this._src;
		  	break;

		  	default:
		  	break;

	  	}
  	}


    get offset(){
      return 0 || this._node.offset || this._offset || 0;
    }

    set offset(val){
      if(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this._node), 'offset')){
        this._node.offset = val;
      }
    }

    get relOffset(){
      return this._node.relOffset;
    }

    set relOffset(val){
      if(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this._node), 'relOffset')){
        this._node.relOffset = val;
      }
    }

    set loop(val){
      this._node.loop = val == true;
    }

    get loop(){
      return this._node.loop;
    }

    set loopStart(val){
      if(val){
        this._node.loopStart = val * this._params.timescale;
      }
    }

    get loopStart(){
      return this._node.loopStart / this._params.timescale;
    }

    set loopEnd(val){
      if(val){
        this._node.loopEnd = val * this._params.timescale;
      } else {
        if(this._buffer){
          this._node.loopEnd = this._buffer.duration;
        }
      }
    }

    get loopEnd(){
      return this._node.loopEnd / this._params.timescale;
    }

    set playbackRate(val){
      if(typeof val != "undefined"){
        this._params.playbackRate = val;
        this._node.playbackRate = val;
        //this.setTargetAtTime("playbackRate", val);
      }
    }

    get playbackRate(){
      if(typeof this._params.playbackRate == "undefined"){
        this._params.playbackRate = this._node.playbackRate.value;
      }
      return this._params.playbackRate;
    }

    set playbackrate(val){
      this.playbackRate = val;
    }

    get playbackrate(){
      return this.playbackRate;
    }


  	set gain(val){
      let audioNode = this._nodeType == "send" ? this._bus : this._node;
	  	this.setTargetAtTime("gain", val, 0, 0.001, true, audioNode);
      //console.log(this._nodeType + ".gain = " + val);
  	}

  	get gain(){
      // det här är scary. För att setTargetAtTime ska funka måste
      // get gain returnera ett objekt, men jag har ingen aning om var det kan gå fel...
      // Jag vågar nog ändå inte...
      // return this._node.gain;
      if(this._node){
        this._node.gain.value;
      } else {
        return 0;
      }
	  	 
  	}

  	set frequency(val){
  		this.setTargetAtTime("frequency", val);
  	}

  	get frequency(){
      if(this._node && this._node.frequency){
        return this._node.frequency.value;
      }
	  	
  	}

  	set detune(val){
	  	this.setTargetAtTime("detune", val);
  	}

  	get detune(){
	  	return this._node.detune.value;
  	}

  	set q(val){
	  	this.setTargetAtTime("Q", val);
  	}

  	get q(){
	  	return this._node.Q.value;
  	}

    set Q(val){
      this.q = val;
    }
    get Q(){
      return this.q;
    }

    get path(){
      return this.parent ? this.parent.path + (this._xml.className || this._xml.id || this._xml.nodeName) + "." : "";
    }

  	set type(val){

	  	switch(val){

		  	case "sine":
		  	case "sawtooth":
		  	case "square":
		  	case "triangle":

        case "lowpass":
        case "highpass":
        case "bandpass":
        case "lowshelf":
        case "highshelf":
        case "peaking":
        case "notch":
        case "allpass":
		  	this._node.type = val;
		  	break;


		  	default:
        let real, imag, wave;

		  	if(val.includes(".js") || val.includes(".json")){
				// load PeriodicWave data
			  	let src = Loader.getPath(val, this._localPath);


			  	fetch(src)
					.then(response => response.json())
					.then(jsonData => {
						if(jsonData.real && jsonData.imag){
                real = new Float32Array(jsonData.real);
                imag = new Float32Array(jsonData.imag);
					  		wave = this._ctx.createPeriodicWave(real, imag);
					  		this._node.setPeriodicWave(wave);
                this._node.start();
						}
					});

		  	} else {
			  	let el = document.querySelector(val);
			  	if(el){
				  	let jsonData = JSON.parse(el.innerHTML);
				  	wave = this._ctx.createPeriodicWave(real, imag);
				  	this._node.setPeriodicWave(wave);
            this._node.start();
				   }
		  	}

		  	break;
	  	}



  	}

  	get type(){
	  	return this._node.type;
  	}

    update(){
      // update some settings. Typically executed to set init parameters after the whole
      // audio graph is initialized
      this.mix = this.mix.valueOf();

    }

  	get delayTime(){
	  	return this._node.delayTime.value / this._params.timescale;
  	}

  	set delayTime(val){
	  	this.setTargetAtTime("delayTime", val);
  	}

  	set value(val){
	  	this.setTargetAtTime(this._node, val);
  	}

  	get value(){
	  	return this._node.value;
  	}

    get playing(){
      return this._node.playing;
    }

    // get selectindex(){
    //   return this.mix * (this.childObjects.length - 1);
    // }

    set selectindex(val){
      console.log(`selectIndex(${val})`);
      val = val / (this.childObjects.length - 1);
      this.mix = val;
    }

    set mix(val){

      val = Math.max(0, Math.min(val, 1));
      this._params.mix = val;
      let targets = this.childObjects; //.length ? this.childObjects : this.inputs;
        
      val *= (targets.length-1); // 0 - nr of children or channelCount

      let crossFadeRange = this._params.crossfaderange;
      if(typeof crossFadeRange != "undefined"){
        crossFadeRange = crossFadeRange.valueOf();
      } else {
        crossFadeRange = 1;
      }
      crossFadeRange = crossFadeRange || 0.000001;
      let frameWidth = 1 - crossFadeRange;

      targets.forEach((target, i) => {
        let input = this.inputs[i]; // target.output ? target.output : target;
        let fw;
        let peak = target.getParameter("peak");
        let peakRange = false;
        if(peak){
          peakRange = peak.length > 1;
          let min = Math.min(...peak) * targets.length;
          let max = Math.max(...peak) * targets.length;
          fw = max-min;
          peak = (min + max) / 2;
        } else {
          peak = i; // + 0.5;
          fw = frameWidth;
        }
        let dist;
        let reduction;

        // no reduction far left or far right
        // if not specified with peak range
        let toTheLeft = i == 0 && val <= peak;
        let toTheRight = i == (targets.length-1) && val >= peak;
        if((toTheLeft || toTheRight) && !peakRange){
          reduction = 0;
        } else {

          // calculate distance to peak of this node
          if(val < peak){
            // if val is to the left of node
            dist = (peak - fw/2) - val;
          } else {
            // if val is to the right of node
            dist = val - (peak + fw/2);
          }
          dist /= crossFadeRange;
          dist = Math.max(0, Math.min(dist, 1));


          reduction = Math.min(dist, 1);
          reduction = Math.pow(reduction, 2); // +3dB for equal power
        }

        let gain = 1 - reduction;
        if(isNaN(gain)){
          console.log(gain);
        }
        let time = this.getParameter("transitionTime");
        input.gain.setTargetAtTime(gain, input.context.currentTime, time);
        target.dispatchEvent(new CustomEvent("change", {detail: {time: time, value: gain}}));
      });
    }

    get mix(){
      return this._params.mix || 0;
    }

  	set pan(val){
      val = Math.max(-1, Math.min(val, 1));
      this._params.pan = val;
	  	if(this.parent.fakePanner){
			     this._parentAudioObj._node.setPosition(val, 0, -1);
	  	} else if(this._nodeType == "channelmergernode") {
        // Tänk igenom strukturen om children inte används. Går det att få till en auto-connect
        // till alla inputs och sedan kunna göra en multi-pan mellan dem utan att
        // det stör multi-pan mellan children?
        // Ändra också till att använda attributet "fade" eller "crossfade"

        let targets = this.childObjects; //.length ? this.childObjects : this.inputs;
        
        val = ((val + 1) / 2) * (targets.length - 1); // 0 - nr of children or channelCount

        // Det vore kanske bättre att lägga ut detta i Mapper-objektet
        // Och att ha en extra GainNode mellan child-objekt och input
        // let panValues = [];
        targets.forEach((target, i) => {
          let input = target.output ? target.output : target;
          let dist = Math.abs(i - val);
          let reduction = Math.min(dist, 1);
          reduction = Math.pow(reduction, 2); // +3dB for equal power
          let gain = 1 - reduction;
          // panValues.push(Math.floor(gain * 100) / 100);
          if(isNaN(gain)){
            console.log("gain is NaN");
          }
          input.gain.setTargetAtTime(gain, input.context.currentTime, 0.001);
        });

        // if(this._xml.parentElement.getAttribute("id") == "hf-chain"){
        //   console.log(panValues);
        // }
        

      } else {
		  	this.setTargetAtTime("pan", val);
	  	}

  	}

  	get pan(){
	  	return this._params.pan || 0;
  	}



    set attack(val){
      this.setTargetAtTime("attack", val);
    }

    get attack(){
      this._params.attack;
    }



    set knee(val){
      this.setTargetAtTime("knee", val);
    }

    get knee(){
      this._params.knee;
    }

    set ratio(val){
      this.setTargetAtTime("ratio", val);
    }

    get ratio(){
      this._params.ratio;
    }



    set release(val){
      this.setTargetAtTime("release", val);
    }

    get release(){
      this._params.release;
    }



    set threshold(val){
      this.setTargetAtTime("threshold", val);
    }

    get threshold(){
      this._params.threshold;
    }


    set amount(val){

      var k = typeof val == "number" ? val : 200;
      let n_samples = 44100;
      let curve = new Float32Array(n_samples);
      let deg = Math.PI / 180;
      let i = 0;
      let x;
      for ( ; i < n_samples; ++i ) {
        x = i * 2 / n_samples - 1;
        curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
      }
      this._node.curve = curve;
    }

    get coneInnerAngle(){
      if(typeof this._params.coneInnerAngle == "undefined"){
        this._params.coneInnerAngle = this._node.coneInnerAngle;
      }
      return this._params.coneInnerAngle;
    }
    set coneInnerAngle(val){
      this._params.coneInnerAngle = val;
      this._node.coneInnerAngle = val;
      this.setTargetAtTime("coneInnerAngle", val);
    }

    get coneOuterAngle(){
      if(typeof this._params.coneOuterAngle == "undefined"){
        this._params.coneOuterAngle = this._node.coneOuterAngle;
      }
      return this._params.coneOuterAngle;
    }
    set coneOuterAngle(val){
      this._params.coneOuterAngle = val;
      this._node.coneOuterAngle = val;
      // this.setTargetAtTime("coneOuterAngle", val);
    }

    get coneOuterGain(){
      if(typeof this._params.coneOuterGain == "undefined"){
        this._params.coneOuterGain = this._node.coneOuterGain;
      }
      return this._params.coneOuterGain;
    }
    set coneOuterGain(val){
      this._params.coneOuterGain = val;
      this.setTargetAtTime("coneOuterGain", val);
    }

    get distanceModel(){
      // string
      if(typeof this._params.distanceModel == "undefined"){
        this._params.distanceModel = this._node.distanceModel;
      }
      return this._params.distanceModel;
    }
    set distanceModel(val){
      this._params.distanceModel = val;
      this._node.distanceModel = val;
    }

    get maxDistance(){
      if(typeof this._params.maxDistance == "undefined"){
        this._params.maxDistance = this._node.maxDistance;
      }
      return this._params.maxDistance;
    }
    set maxDistance(val){
      this._params.maxDistance = val;
      this.setTargetAtTime("maxDistance", val);
    }

    get orientationX(){
      if(typeof this._params.orientationX == "undefined"){
        this._params.orientationX = this._node.orientationX;
      }
      return this._params.orientationX;
    }
    set orientationX(val){
      this._params.orientationX = val;
      this.setTargetAtTime("orientationX", val);
    }

    get orientationY(){
      if(typeof this._params.orientationY == "undefined"){
        this._params.orientationY = this._node.orientationY;
      }
      return this._params.orientationY;
    }
    set orientationY(val){
      this._params.orientationY = val;
      this.setTargetAtTime("orientationY", val);
    }

    get orientationZ(){
      if(typeof this._params.orientationZ == "undefined"){
        this._params.orientationZ = this._node.orientationZ;
      }
      return this._params.orientationZ;
    }
    set orientationZ(val){
      this._params.orientationZ = val;
      this.setTargetAtTime("orientationZ", val);
    }

    set rotationY(deg){
      let [x,y,z] = this.yRotationToVector(deg);
      this.setTargetAtTime("orientationY", x);
      this.setTargetAtTime("orientationY", y);
      this.setTargetAtTime("orientationZ", z);
    }


    get panningModel(){
      // string
      if(typeof this._params.panningModel == "undefined"){
        this._params.panningModel = this._node.panningModel;
      }
      return this._params.panningModel;
    }
    set panningModel(val){
      this._params.panningModel = val;
      this._node.panningModel = val;
    }

    get positionX(){
      if(typeof this._params.positionX == "undefined"){
        this._params.positionX = this._node.positionX;
      }
      return this._params.positionX.valueOf() || 0;
    }
    set positionX(val){
      this._params.positionX = val;
      if(this.setTargetAtTime){
        this.setTargetAtTime("positionX", val);
      } else if(this._node.positionX.automationRate){
        this._node.positionX.value = val;
      } else {
        this._node.positionX = val;
      }
    }

    get positionY(){
      if(typeof this._params.positionY == "undefined"){
        this._params.positionY = this._node.positionY;
      }
      return this._params.positionY.valueOf() || 0;
    }
    set positionY(val){
      this._params.positionY = val;
      if(this.setTargetAtTime){
        this.setTargetAtTime("positionY", val);
      } else if(this._node.positionY.automationRate){
        this._node.positionY.value = val;
      } else {
        this._node.positionY = val;
      }
    }

    get positionZ(){
      if(typeof this._params.positionZ == "undefined"){
        this._params.positionZ = this._node.positionZ;
      }
      return this._params.positionZ.valueOf() || 0;
    }
    set positionZ(val){
      this._params.positionZ = val;
      if(this.setTargetAtTime){
        this.setTargetAtTime("positionZ", val);
      } else if(this._node.positionZ.automationRate){
        this._node.positionZ.value = val;
      } else {
        this._node.positionZ = val;
      }
    }

    get refDistance(){
      if(typeof this._params.refDistance == "undefined"){
        this._params.refDistance = this._node.refDistance;
      }
      return this._params.refDistance.valueOf() || 0;
    }
    set refDistance(val){
      this._params.refDistance = val;
      this._node.refDistance = val;
      // this.setTargetAtTime("refDistance", val);
    }

    get rolloffFactor(){
      if(typeof this._params.rolloffFactor == "undefined"){
        this._params.rolloffFactor = this._node.rolloffFactor;
      }
      return this._params.rolloffFactor.valueOf() || 0;
    }
    set rolloffFactor(val){
      this._params.rolloffFactor = val;
      this._node.rolloffFactor = val;
    }

    set convolutionGain(val){
      this._node.convolutionGain = val;
    }













    get parent(){
      return this._parentAudioObj;
    }

    set parent(audioObj){
      this._parentAudioObj = audioObj;
    }




  	set(key, value){
	  	if(typeof this._node[key] !== "undefined"){
		  	this[key] = value;
	  	}
  	}

    get parameters(){
      return this._params;
    }


  	get variables(){
  		return this._variables;
  	}

    set variables(val){
      this._variables = val;
    }

  	setVariable(key, val){
  		this._variables[key] = val;
  	}

    getVariable(key){
  		return this._variables[key];
  	}

    // for dynamic mixer
    addEventsFromChildren(){
      let variableName = this.getControllingVariableName("selectindex");
      if(variableName){
        this.childObjects.forEach(obj => {

          obj.addEventListener("start", e => {
            this.waxml.setVariable(variableName, e.target.childIndex);
          });
        });
      }
      
    }


}


module.exports = AudioObject;

},{"./AmbientAudio.js":1,"./BufferSourceObject.js":4,"./ConvolverNodeObject.js":7,"./Loader.js":20,"./Mapper.js":22,"./Noise.js":25,"./ObjectBasedAudio.js":26,"./Variable.js":32,"./VariableContainer.js":33,"./Watcher.js":37,"./WebAudioUtils.js":39}],3:[function(require,module,exports){
const Loader = require('./Loader.js');
const WebAudioUtils = require('./WebAudioUtils.js');
const VariableContainer = require('./VariableContainer.js');



class BaseAudioObject extends EventTarget {

	constructor(xmlNode, waxml, params){
		super();

		this.waxml = waxml;
		this._ctx = this.waxml._ctx;
		this._xml = xmlNode;

		xmlNode.obj = this;

		this.childIndex = [...xmlNode.parentNode.children].indexOf(xmlNode);
		this._node = new GainNode(this._ctx);

		this._params = params;

		let parentAudioObj = xmlNode.parentNode.obj;
		this._parentAudioObj = parentAudioObj;

		this.utils = WebAudioUtils;


		this.variables = new VariableContainer();

	}

	get name(){
		return this._xml.localName.toLowerCase();
	}

	get selector(){
		let id = this._xml.id;
		let classList = this._xml.classList;
		let str = this.name;
		if(id)str += `#${id}`;
		if(classList.length)str += `.${[...classList].join(".")}`;
		return str;
	}

	get params(){
		return this._params;
	}

	set params(params){
		this._params = params;
	}


    get parent(){
		return this._parentAudioObj;
	}

	set parent(audioObj){
		this._parentAudioObj = audioObj;
	}

	get children(){
		return [...this._xml.children].map(el => el.obj);
	}
	
	
	get connection(){
		return this._node;
	}

	get input(){
		return this._input || this._node;
	}
	
	set input(node){
		this._input = node;
	}

	get output(){
		return this._output || this._node;
	}

	set output(destination){
		this.output.connect(destination);
	}


	connect(destination){

		let source = this.output;
		if(source){
			if(source.connect){
				if(!destination){
					destination = this._ctx.destination;
				}
				if(!(destination instanceof Array)){
					destination = [destination];
				}
				destination.forEach(d => {
					d = d.input || d;
					source.connect(d);
				});
			}
		}
		this._destination = destination;;

	}


	disconnect(ch){
		if(!this._node || !this._node.disconnect){return}
		ch = ch || 0;
		this._node.disconnect(ch);
	}

	setParameter(paramName, value){
		this._params[paramName] = value;
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
				let timescale = this.getParameter("timescale") || 1;
				val *= timescale;
				break;

			}
			return val;
		}
	}



	get variables(){
		return this._variables;
	}

	set variables(val){
		this._variables = val;
	}

	setVariable(key, val){
		this._variables[key] = val;
	}

 	getVariable(key){
		return this._variables[key];
	}

	querySelector(selector){
		let target = this._xml.querySelector(selector);
		if(target){
			return target.obj;
		}
		
	}

	querySelectorAll(selector){
		return [...this._xml.querySelectorAll(selector)].map(xml => xml.obj);
	}

}

module.exports = BaseAudioObject;

},{"./Loader.js":20,"./VariableContainer.js":33,"./WebAudioUtils.js":39}],4:[function(require,module,exports){
var Loader = require('./Loader.js');
var WebAudioUtils = require('./WebAudioUtils.js');


class BufferSourceObject {

	constructor(obj, params){
		this._ctx = obj._ctx;
		this._node = new AudioBufferSourceNode(this._ctx);
		this._params = {...params};
		this._parentAudioObj = obj;
		this.callBackList = [];
		this.playingNodes = [];
	}

	connect(destination){
		this.destination = destination;
		this._node.connect(destination);
		return destination;
	}
	
	start(time = this._ctx.currentTime, offset = 0, duration){
		if(this._playing) {
			//return;
		}
		// if(this.autoStopTimer){
		// 	clearTimeout(this.autoStopTimer);
		// 	this.autoStopTimer = 0;
		// }
		let params = {}
		if(typeof this._params.offset != "undefined"){params.offset = this._params.offset}
		if(typeof this._params.loop != "undefined"){params.loop = this._params.loop}
		if(typeof this._params.loopStart != "undefined"){params.loopStart = this._params.loopStart * this._params.timescale}
		if(typeof this._params.loopEnd != "undefined"){params.loopEnd = this._params.loopEnd * this._params.timescale}
		if(typeof this._params.playbackRate != "undefined"){
			params.playbackRate = this._params.playbackRate;
		} else {
			params.playbackRate = 1;
		}
		if(typeof this._params.randomDetune != "undefined"){params.playbackRate *= WebAudioUtils.centToPlaybackRate(this._params.randomDetune)}

		if(this.currentNode && this._params.mono == true){
			let oldNode = this.currentNode;
			setTimeout(() => oldNode.disconnect(), 10);
		}
		
		let node = new AudioBufferSourceNode(this._ctx, params);
		this.currentNode = node;
		this.playingNodes.push(node);

		node.buffer = this._buffer;
		node.loopEnd = this._buffer.duration;

		offset = offset || this._params.offset * this._params.timescale || 0;

		if(offset >= this._buffer.duration){
			offset = 0;
		}

		let factor = Math.abs(this._params.playbackRate || 1);
		duration = duration || this._buffer.duration;

		node.connect(this.destination);
		this.lastStarted = time;
		this.offset = offset;
		// important to set this._playing to true AFTER setting this.offset (otherwise it will make an endless call stack via resume)
		this._playing = true;

		if(params.loop){
			node.start(time, offset * factor);
		} else {
			node.start(time, offset * factor, duration * factor);

			factor = factor || 0.0001;

			this.autoStopTimer = setTimeout(() => {
				let lastNode = this.playingNodes.shift();
				if(lastNode){lastNode.disconnect(0)}

				if(!this.playingNodes.length){
					// reset when all samples are quiet
					this._offset = 0;
					this._relOffset = 0;
					this._playing = false;
				}
				
			}, (duration - offset) / Math.abs(factor) * 1000);
		}
		this._node = node;
		
	}

	resume(){
		this.start(this._ctx.currentTime, this._offset);
	}


	continue(){
		this.resume();
	}

	stop(params = {}){
		clearTimeout(this.autoStopTimer);
		this.autoStopTimer = 0;
		if(this._playing){
			if(!params.dontDisconnect){
				// this._node.disconnect();
				this._node.stop();
			}
			this._playing = false;
			this.updateOffset();
		}
	}

	disconnect(){
		this._node.disconnect();
	}

	updateOffset(val=this.lastStarted ? (this._ctx.currentTime - this.lastStarted + this._offset) /  this._buffer.duration: 0){
		this._relOffset = val;
		let duration = this._buffer ? this._buffer.duration : 0;
		this._offset = val * duration;
	}

	get playing(){
		return this._playing;
	}
	set playing(state){
		this._playing = state;
	}

	get relOffset(){
		return this._playing ? (this._ctx.currentTime - this.lastStarted + this._offset) / this._buffer.duration : (this._relOffset || 0);
	}

	set relOffset(val){
		this._relOffset = val;
		let duration = this._buffer ? this._buffer.duration : 0;
		this._offset = val * duration;

		if(this._playing){
			this._node.disconnect();
			this._playing = false;
			this.resume();
		}

	}

	get offset(){
		return this._playing ? this._ctx.currentTime - this.lastStarted + this._offset : (this._offset || 0);
	}

	set offset(val){
		this._offset = val;
		let duration = this._buffer ? this._buffer.duration : 1;
		this._relOffset = val / duration;
		
		if(this._playing){
			this._node.disconnect();
			this._playing = false;
			this.resume();
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
				let timescale = this.getParameter("timescale") || 1;
				val *= timescale;
				break;

			}
			return val;
		}
	}

	addCallBack(fn){
		this.callBackList = [];
		this.callBackList.push(fn);
	}

	doCallBacks(){
		while(this.callBackList.length){
			let fn = this.callBackList.pop();
			fn();
		}
	}

	get buffer(){
		return this._node.buffer;
	}

	get output(){
		return this._node;
	}

	get _node(){
		return this.node;
	}

	set _node(obj){
		this.node = obj;
	}

	set src(src){
		let localPath = this.getParameter("localpath") || "";
		Loader.loadAudio(localPath + src, this._ctx).then(audioBuffer => {
			this._buffer = audioBuffer;
			this.doCallBacks();
		});
	}

	get loop(){
		return this._params.loop;
	}

	get loopEnd(){
		return this._params.loopEnd;
	}

	set loopEnd(val){
		this._params.loopEnd = val;
		this._node.loopEnd = val;
	}

	get loopStart(){
		return this._params.loopStart;
	}

	set loopStart(val){
		this._params.loopStart = val;
		this._node.loopStart = val;
	}

	set playbackRate(val){
		if(!isFinite(val)){
			console.log("non-finite");
			return;
		  }
		this._params.playbackRate = val;
		
		this.playingNodes.forEach(node => {
			node.playbackRate.setTargetAtTime(val, 0, this.getParameter("transitionTime"));

		});
	}

	set randomDetune(val){
        val = Math.max(0, Math.min(val, 1));
        this._params.randomDetune = val;
    }

	// funkar inte på loop
	set onended(fn){
		this._node.buffer.onended = fn;
	}

	    
}

module.exports = BufferSourceObject;

},{"./Loader.js":20,"./WebAudioUtils.js":39}],5:[function(require,module,exports){
var WebAudioUtils = require('./WebAudioUtils.js');


class Command extends EventTarget {

	constructor(params, waxml){
		super();
		this.waxml = waxml;
		this._params = params;
		this.timeouts = [];
	}

	get pos(){
		return this._params.pos;
	}

	set pos(val){
		this._params.pos = val;
	}

	get type(){
		return this._params.type;
	}

	get selector(){
		return this._params.selector;
	}

	get variable(){
		return this._params.key;
	}

	get value(){
		return this._params.value;
	}

	set offset(val){
		this._params.offset = val;
	}


	get offset(){
		return this._params.offset || 0;
	}


	trig(time = this.waxml._ctx.currentTime){

		switch(this.type){
			case "trig":
				this.waxml.trig(this.selector, {time:time});
				// console.log(this.selector);
			break;

			case "set":
				// delay += this.offset; // check this!!
				let delay = time - this.waxml._ctx.currentTime;
				this.timeouts.push({
					id: setTimeout(() => {
						this.waxml.setVariable(this.variable, this.value);
					}, delay*1000-1), // to rather prepare variable than do it too late 
					time: time
				});
			break;
		}
		

		// this.timeouts.push(setTimeout(() => {

		// 	switch(this.type){
		// 		case "trig":
		// 			this.waxml.trig(this.selector, {time:time});
		// 		break;
		// 		case "set":
		// 			this.waxml.setVariable(this.variable, this.value);
		// 		break;
		// 	}

		// }, delay*1000));
	}

	clear(time){
		// clear timeout 
		let currentTime = this.waxml._ctx.currentTime;
		time = time || currentTime;
		this.timeouts.filter(timeout => timeout.time >= currentTime).forEach(timeout => {
			clearTimeout(timeout.id);
		});
		this.timeouts = this.timeouts.filter(timeout => timeout.time <  currentTime);
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
				val *= this.timeScale;
				break;
  
			}
			return val;
		}
	}

	get parameters(){
		return this._params;
	}

}

module.exports = Command;

},{"./WebAudioUtils.js":39}],6:[function(require,module,exports){


class Connector {

	constructor(xml, _ctx){

		this._xml = xml;
		this._ctx = _ctx;


		// terrible...
		// very terrible...
		if(xml.obj && xml.obj._node){
			xml.obj._node.gain.value = 0;
			this.connect(xml);
			setTimeout(() => xml.obj.fade(xml.obj._params.gain, 0.5), 1000);
		}
		
	}



	connect(xmlNode){


		let nodeName = xmlNode.nodeName.toLowerCase();
		let targetElements;

		// connect AudioParameters if specified. I.e. for FM synthesis

		if(xmlNode.obj && xmlNode.obj.parameters){
			if(xmlNode.obj._node){
				// to avoid trying to connect variables, envelopes etc.
				Object.entries(xmlNode.obj.parameters).forEach(([key, value]) => {
					if(typeof value == "string"){
						if(xmlNode.obj._node[key] instanceof AudioParam){
							let modulators = this.getTargetElements(xmlNode, value);
							if(modulators){
								modulators.forEach(modulatorNode => {
									modulatorNode.obj.output.connect(xmlNode.obj._node[key]);
								});
							}
						}
					}
				});
			}
			
			
		}
		

		switch(nodeName){
			case "chain":
			// connect chain input to first element in chain
			let done = false;
			let targetNode;
			while(!done){
				if(!targetNode){
					targetNode = xmlNode.firstChild;
				} else {
					targetNode = targetNode.nextElementSibling;
				}


				if(!targetNode){
					// no children - connect to chain's output
					done = true;
					xmlNode.audioObject.input.connect(xmlNode.audioObject._node);
				} else {
					switch (targetNode.nodeName.toLowerCase()) {
						case "#text":
						case "parsererror":
						case "var":
							continue;
							break;
						default:
					}


					switch(targetNode.nodeName.toLowerCase()){
						case "oscillatornode":
						case "audiobuffernode":
						case "synth":
						case "mixer":
						break;

						case "channelmergernode":
						// it causes connection bugs to connect incoming signals to ChannelMergers
						// children as I would like to do
						targetNode.audioObject.inputFrom(xmlNode.audioObject.input);
						break;

						case "send":
						// is this really correct? Why should "done" not be set to true?
						targetNode.audioObject.inputFrom(xmlNode.audioObject.input);
						break;

						default:
						done = true;
						targetNode.audioObject.inputFrom(xmlNode.audioObject.input);
						break;
					}
					// 2022-08-30 I try to set done=true always which means that
					// chain element input are only connected to the first audio child element
					// and only if they allow audio input.
					done = true;

				}


			}
			break;

			case "channelsplitternode":
			// connect each channel to separate child nodes
			let srcCh = 0;
			[...xmlNode.children].forEach(node => {
				xmlNode.obj.input.connect(node.obj.input, srcCh, 0);
				srcCh++;
			});
			break;

			case "parsererror":
			case "style":
			case "link":
			return;
			break;

			case "send":
			let selector = xmlNode.obj.getParameter("outputbus") || xmlNode.obj.getParameter("bus") || xmlNode.obj.getParameter("output");
			targetElements = this.getTargetElements(xmlNode, selector);
			targetElements.forEach(target => {
				xmlNode.obj._bus.connect(target.obj.input);
			});
			break;
		}


		let output = xmlNode.getAttribute("output");
		let done = false;

		if(output){

			// connect to specified node within the scope of this (external) document
			// let topElement = xmlNode.closest("[href$='.xml]") || this._xml;
			let curNode = xmlNode;
			let targetElements = [];
			switch(output){
				case "audioContext.destination":
					xmlNode.obj.connect(this._ctx.destination);
				break;

				case "none":
					console.log(xmlNode);
				break;

				case "next":
					let nextElement = xmlNode.nextElementSibling;
					if(nextElement){
						let obj = nextElement.obj;
						if(obj){
							if(obj.input){
								xmlNode.obj.connect(obj.input);
							}
						}
					} 
				break;


				case "parent":
					let parentNode = xmlNode.parentNode;
					if(parentNode){
						let obj = parentNode.obj;
						if(obj){
							if(obj.input){
								xmlNode.obj.connect(obj.input);
							}
						}
					} 
				break;

				default:
					// while(!targetElements.length && curNode != this._xml.parentNode){
					// 	targetElements = curNode.querySelectorAll(output);
					// 	curNode = curNode.parentNode;
					// }

					targetElements = this.getTargetElements(curNode, output);
		
					targetElements.forEach(target => {
						xmlNode.obj.connect(target.obj.input);
					});
				break;
			}

			

		} else {

			// connect in chain or mix

			let target;
			let parentNodeType = xmlNode.parentNode.nodeName.toLowerCase();

			switch (xmlNode.nodeName.toLowerCase()) {
				case "var":
				case "envelope":
				case "command":
				case "snapshot":
					// don't connect
					break;
				default:
				// connect


				switch(parentNodeType){

					case "mixer":
					let i = [...xmlNode.parentNode.children].indexOf(xmlNode);
					//console.log(xmlNode, "connect to mixer", i);
					xmlNode.obj.connect(xmlNode.parentNode.obj.inputs[i]);
					break;

					case "audio":
					case "voice":
					case "synth":
					case "xi:include":
					case "include":
					case "channelsplitternode":
					xmlNode.obj.connect(xmlNode.parentNode.obj._node);
					break;


					// I implement "input" for all new objects
					// that inherits from the BaseAudioObject class
					case "select":
					case "sequence":
					case "wave":
					xmlNode.obj.connect(xmlNode.obj.parent.input);
					break;
					

					case "channelmergernode":
					let trgCh = xmlNode.obj.getParameter("channel") || [[...xmlNode.parentNode.children].indexOf(xmlNode)];
					let nodeIndex = [...xmlNode.parentNode.children].indexOf(xmlNode);
					let targetInput = xmlNode.parentNode.obj.inputs[nodeIndex];
					xmlNode.obj.connect(targetInput);

					let channelCount = this._ctx.destination.channelCount; //xmlNode.parentNode.obj.inputs.length;
					
					trgCh.forEach((outputCh, i) => {
						let inputCh = i % xmlNode.obj._node.channelCount;
						outputCh = outputCh % channelCount;
						//xmlNode.obj.connect(xmlNode.parentNode.obj.inputs[outputCh % channelCount], inputCh, 0);
						//xmlNode.obj.connect(xmlNode.parentNode.obj.inputs[targetInput], inputCh, outputCh);
						let targetChannel = xmlNode.parentNode.obj.channels[outputCh];
						targetInput.connect(targetChannel, inputCh, 0);

						console.log(`childIndex: ${targetInput}, inputCh: ${inputCh}, output: ${outputCh}`);
					});
					break;

					case "chain":

					// run through following nodes to connect all
					// sends
					let targetNode = xmlNode;
					done = false;


					while(!done){

						targetNode = targetNode.nextElementSibling;

						if(!targetNode){
							// connect last object to chain output
							xmlNode.audioObject.connect(xmlNode.parentNode.audioObject._node);
							done = true;
						} else {

							switch(targetNode.nodeName.toLowerCase()){

								case "var":
								case "#text":
								// stupid way of dealing with non-audio elements. But for now...
								break;
									
								default:
								xmlNode.audioObject.connect(targetNode.audioObject.input);
								done = true;
								break;
							}
						}
					}



					// while(!done){

					// 	targetNode = targetNode.nextElementSibling;
					// 	if(!targetNode){

					// 		// connect last object to chain output
					// 		done = true;
					// 		targetNode = xmlNode.parentNode;
					// 		xmlNode.audioObject.connect(targetNode.audioObject._node);
					// 	} else {
					// 		// stupid way of dealing with non-audio elements. But for now...
					// 		if(targetNode.nodeName == "#text"){continue}
					// 		if(targetNode.nodeName.toLowerCase() == "var"){continue}

					// 		done = targetNode.nodeName.toLowerCase() != "send";
					// 		xmlNode.audioObject.connect(targetNode.audioObject.input);
					// 	}
					// }

					target = this.getNextInput(xmlNode);
					break;


					// connect to parameter input. Envelopes inside gainnode
					// case "gain":
					case "gainnode":
					xmlNode.audioObject.connect(xmlNode.parentNode.audioObject._node);
					break;

					case "#document":
					xmlNode.audioObject.connect(this._ctx.destination);
					break;

					default:
					// do not connect
					break;
				}
			}
		}
		Array.from(xmlNode.children).forEach(childNode => this.connect(childNode));

	}

	getNextInput(xmlNode){
		let nextSibling = xmlNode.nextElementSibling;
		if(nextSibling){
			if(nextSibling.obj && nextSibling.obj.input){
				return nextSibling.audioObject.input;
			} else {
				return this.getNextInput(nextSibling);
			}
		} else {
			return xmlNode.parentNode.audioObject._node;
		}

	}

	getTargetElements(curNode, selector){
		let targetElements = [];
		while(!targetElements.length && curNode != this._xml.parentNode){
			try{
				targetElements = curNode.querySelectorAll(selector);
			} catch {

			}
			
			curNode = curNode.parentNode;
		}
		return targetElements;
	}
}




module.exports = Connector;

},{}],7:[function(require,module,exports){
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

},{"./Loader.js":20}],8:[function(require,module,exports){
var WebAudioUtils = require('./WebAudioUtils.js');


class Envelope {

	constructor(xmlNode, waxml, params){

		this.waxml = waxml;
		this._ctx = this.waxml._ctx;
		this._xml = xmlNode;

		params.max = typeof params.max == "undefined" ? 1 : params.max;
		params.dynamictimes = typeof params.dynamictimes == "undefined" ? [1] : params.dynamictimes;
		params.dynamicvalues = typeof params.dynamicvalues == "undefined" ? [0] : params.dynamicvalues;

		this._params = params;
		let parentAudioObj
		if(xmlNode.parentNode.obj){
			parentAudioObj = xmlNode.parentNode.obj;
		} else {
			// to let external objects like iMusic host envelopes
			parentAudioObj = waxml.master;
		}
		
		this._parentAudioObj = parentAudioObj;
		this.timeScale = this.getParameter("timescale") || 1;
		this.mono = this.getParameter("legato") == "true";


		// convert ADSR attribute to times and values
		if(this._params.adsr){
			this._params.times = [this._params.adsr.attack, this._params.adsr.decay, this._params.adsr.release];
			this._params.values = [params.max, params.max*this._params.adsr.sustain/100, 0];
		}
		if(!this._params.times){
			console.error(`No times specified for ${this._xml}`);
			this._params.times = [0,100];
		}
		this._params.times = this._params.times.valueOf().map(time => time * this.timeScale);

		if(!this._params.values){
			console.error(`No values specified for ${this._xml}`);
			this._params.values = [1,0];
		}

		this.timeModVal = this._params.times.valueOf().length;
		this._listeners = [];

		this._params.targetvariables = this._params.targetvariables  || [];

		if(this._params.target){
			let targetParam; // = "frequency"; // default
			let selector = this._params.target.split("_").map(str => {
				str = str.trim();
				if(str.includes(".")){
					let ta = str.split(".");
					str = ta[0];
					targetParam = ta[1];
				}
				return `.${str.trim()}`;
			}).join(" ");

			let convertStr = this._params.convert ? this._params.convert[0] : "x";
			waxml.querySelectorAll(selector).forEach(targetObject => {
				let audioNode = targetObject._node;
				targetParam = targetParam || (audioNode.detune ? "detune" : "gain");
				if(audioNode[targetParam]){
					this.addListener(targetObject._node[targetParam], convertStr);
				}
			});
			
		}

		this.trig = this.start;
	}

	addListener(param, expression = "x"){

		if(expression.includes("€")){
			// kolla på det här! Jag behöver styra upp hela kopplingen med ENV
			expression = WebAudioUtils.replaceEnvelopeName(expression);
		}
		
		let values = this._params.values.map(x => {
			let val;
			switch(expression){
				case "MIDI->frequency":
				val = WebAudioUtils.MIDInoteToFrequency(x);
				break;

				case "dB->power":
				val = WebAudioUtils.dbToPower(x);
				break;

				default:
				val = this.mapValue(x, expression);
				break;
			}
			return val;
		});

		if(typeof this._params.default != "undefined"){
			let def;
			switch(expression){
				case "MIDI->frequency":
				def = WebAudioUtils.MIDInoteToFrequency(this._params.default);
				break;

				case "dB->power":
				def = WebAudioUtils.dbToPower(this._params.default);
				break;

				default:
				def = this.mapValue(this._params.default, expression);
				break;
			}
			param.setTargetAtTime(def, this._ctx.currentTime, 0.001);
		}
		
		this._listeners.push(
			{
				obj: param,
				values: values
			}
		);
	}

	mapValue(x, expression = "x"){
		x /= this._params.max;
		return eval(expression);
	}

	setTimes(times){

		let curOffset = times[0];
		times = times.map(t => {
			let relTime = t - curOffset;
			curOffset = relTime + 0.01;
			return relTime;
		});
		
		this._params.times = times;
	}

	start(data = {}){

		// args = [...args];
		let factor = 1; //typeof args[0] == "undefined" ? 1 : args[0];

		// moved to variable object allowing for a trig attribute
		// make it possible to update variables with data from event (like velocity or key)
		// this._params.targetvariables.forEach((varName, index) => {
		// 	this.waxml.setVariable(varName, args[index % args.length]);
		// });

		this.running = true;



		let delay = this.getParameter("delay");
        let startTime = delay * this.timeScale + this._ctx.currentTime + 0.001;

		// map values and times to (possibly be modified by dynamic values * factor (like velocity)
		let times = this._params.times.valueOf().map((val, index) => {
			return this.mapDynamicValue(val, factor, this._params.dynamictimes, index);
		});
		
		if(this.mono && data.legato){
			// don't retrigger if legato
		} else {

			this._listeners.forEach(target => {
				target.obj.cancelScheduledValues(startTime);
				let timeOffset = 0;
				//let values = target.values.map((val, index) => this.mapDynamicValue(val, factor, this._params.dynamicvalues, index));
				let values = target.values.map(val => val * this.parameters.max);

				// remove release value seemed good when doing ADSR but not in general
				if(this.parameters.adsr){
					values.pop();
				}

				console.log("Env startTime: ", startTime);
				values.forEach((value, index) => {
					let time = times[index % this.timeModVal];
					// See info about timeConstant and reaching the target value:
					// https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
					// let timeFactor = target.obj.value < value ? 1 : 0.2;
					target.obj.setTargetAtTime(value, startTime + timeOffset, time);
					console.log(value, startTime + timeOffset, time)
					timeOffset += time;
				});
			});
		}
		

		if(this._params.loop){
			// let loopLength = times.reduce((a, b) => a + b, 0);
			let loopLength = this._params.loopEnd.valueOf() * this.timeScale
			this.nextStartTime = startTime + loopLength;
			let timeToNextLoop = this.nextStartTime - this._ctx.currentTime;
			setTimeout(() => {
				this.start(args);
			}, timeToNextLoop * 1000-20);
		}

	}


	mapDynamicValue(val, factor, arr, index){
		let f;
		let fVal = arr[index % arr.length];
		if(fVal == 0){
			f = 1;
		} else if(fVal < 0){
			f = 1 - fVal * factor;
		} else {
			f = fVal * factor;
		}
		return f * val;
	}

	stop(data = {}){

		// args = [...args];
		let factor = 1; // typeof args[0] == "undefined" ? 1 : args[0];

		this.running = false;
		this.nextStartTime = 0;

		let delay = this.getParameter("delay");
		let releaseTime = this._ctx.currentTime + delay * this.timeScale;

		let vIndex = this._params.values.length-1;
		

		let tIndex = this.timeModVal-1;
		let t = this._params.times.valueOf()[tIndex];
		let time = this.mapDynamicValue(t, factor, this._params.dynamicvalues, tIndex)
		
		if(this.mono && data.legato){
			// Don't release if mono mode and still keys down
		} else {
			this._listeners.forEach(target => {

				let v = target.values[vIndex];
				let value = this.mapDynamicValue(v, factor, this._params.dynamicvalues, vIndex)
			
				// See info about timeConstant and reaching the target value:
				// https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
				
				target.obj.setTargetAtTime(value, releaseTime, time/3);
			});
		}
		
	}

	
	setTargetAtTime(val){
		// at the moment this play a risk of overwriting a Watcher. Think this trough thouroughly!
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
				val *= this.timeScale;
				break;
  
			}
			return val;
		}
	}


	// is this method in use or is it obsolete?
	getWAXMLparameters(){
		let waxmlParams = [];
		let paramNames = [];
		switch (this._nodeType) {
		  default:
  
		}
		paramNames.forEach((item, i) => {
		  let obj = WebAudioUtils.paramNameToRange(item);
		  obj.name = item;
		  obj.target = this[item];
		  obj.parent = this;
		  obj.path = e => this.path;
		  waxmlParams.push(obj);
		});
		return waxmlParams;
	}

	get parameters(){
		return this._params;
	}

}

module.exports = Envelope;

},{"./WebAudioUtils.js":39}],9:[function(require,module,exports){



class EventSequence {

	constructor(eventTracker, name, events = []){
		this._eventTracker = eventTracker;
		this._name = name;
		this._eventTypes = [];
		this._events = events;
		this._timeouts = [];
	}

	allEvents(filter = []){
		return this.filterEvents(0, this._events.length, filter);
	}

	get events(){
		return this.allEvents();
	}

	getData(options = {}){
		let data = {};
		let timeOffset = options.timeOffset || (this._events.length ? this._events[0].time : 0);
		let precision = typeof options.precision == "undefined" ? 100 : options.precision;
		let precisionFactor = Math.pow(10, precision);

		let frameRate = options.frameRate || 1000;
		data.name = this._name;

		let lastEvents = {};
		let eventList = [];

		this._events.forEach(evt => {
			let time = evt.time - timeOffset;
			let value = Math.round(evt.value * precisionFactor) / precisionFactor;
			let name = evt.name;
			if(!lastEvents[name] || time - lastEvents[name] > (1000 / frameRate)){
				// add one event per 100ms
				lastEvents[name] = time;
				eventList.push([time, evt.name, value]);
			}
			
		});
		data.events = eventList;
		return data;
	}

	filterEvents(start = 0, end, filter = [], variableFilter = []){

		let startIndex, endIndex, i, ev;
		if(typeof start == "string"){
			// last
			for(i=this._events.length-1; i>=0; i--){
				ev = this._events[i];
				if(ev.name == start){
					startIndex = i;
					break;
				}
			}

		} else if(typeof start == "number"){
			startIndex = start;
		}
		if(typeof startIndex == "undefined"){
			startIndex = 0;
		}

		if(typeof end == "string"){
			// last
			for(i=this._events.length-1; i>startIndex; i--){
				ev = this._events[i];
				if(ev.name == end){
					endIndex = i;
					break;
				}
			}
		} else if(typeof end == "number"){
			endIndex = end;
		}
		endIndex = Math.min(endIndex, this._events.length - 1);

		let newEventList = [];
		if(this._events.length){
			let offset = this._events[startIndex].time;
			for(i = startIndex; i <= endIndex; i++){
				ev = this._events[i];
				if(!filter.length || filter.includes(ev.name)){
					let newEv = {}
					newEv.time = ev.time - offset;
					newEv.name = ev.name;
					newEv.value = {}
					Object.keys(ev.value).forEach(key => {
						if(!variableFilter.length || variableFilter.includes(key)){
							newEv.value[key] = ev.value[key];
						}
					});
					newEventList.push(newEv);
				}
			}
		}
		
		return newEventList;
	}


	store(name, value){
		if(typeof name == "undefined"){return}
		if(typeof value == "undefined"){return}

		let ev = {
			time: new Date().getTime(),
			name: name,
			value: value
		};

		this._events.push(ev);
	}

	clear(){
		this._events = [];
	}

	update(events){
		this._events = events;
	}

	play(){
		if(!this._events.length){
			console.log("EventTracker error: Sequence is empty");
			return;
		}

		let now = new Date().getTime();
		let offset = this._events[0].time;
		let length = this._events[this._events.length-1].time - offset;

		this._events.forEach(ev => {
			let t = setTimeout(e => this._eventTracker.trigEvent(ev.name, ev.value), ev.time - offset + 1);
			this._timeouts.push(t);
		});
		this._eventTracker.playing = true;
		this._timeouts.push(setTimeout(e => this._eventTracker.playing = false, length));

	}

	stop(){
		while(this._timeouts.length){
			clearTimeout(this._timeouts.pop());
		}
	}

	get name(){
		return this._name;
	}

}


module.exports = EventSequence;

},{}],10:[function(require,module,exports){

var EventSequence = require('./EventSequence.js');


class EventTracker {

	constructor(waxml){
		this.waxml = waxml;

		this._sequences = [];
		this._registeredEvents = [];

		this._curSeqName = "default";
		this.addSequence();
	}

	getSequence(name = "_storedGesture"){
		return this._sequences.find(seq => seq.name == name);
	}

	addSequence(name = this._curSeqName, events = []){
		let seq = this.getSequence(name);
		if(seq){
			seq.update(events);
		} else {
			seq = new EventSequence(this, name, events);
			this._sequences.push(seq);
		}
		return seq;
	}

	addSequenceFromLastGesture(name){
		let events = this.lastGesture;
		let seq = new EventSequence(this, name, events);
		return seq;
	}

	deleteSequence(name){
		let i = this._sequences.findIndex(seq => seq.name == name);
		if(i){
			this._sequences.splice(i, 1);
		}
	}

	registerEvent(name, execute){
		return this.getEventObject(name, execute);
	}



	registerEventListener(name, target = document, eventName, execute, process){

		if(typeof target == "string"){
			target = document.querySelector(target);
		}

		let ev = this.getEventObject(name, execute, process, target);
		if(target && target.addEventListener){
			target.addEventListener(eventName, (e => ev.send(e)));
		} else {
			console.error("EventTracker error: " +  target + " does not support addEventListener()");
		}
		return ev;
	}

	getEventObject(name, execute, process, target){
		let ev = this._registeredEvents.find(ev => ev.name == name);
		if(!ev){ev = this.createEvent(name, execute, process, target)}
		return ev;
	}

	createEvent(name, execute, process, target){

		let ev = {
			name: name,
			target: target,
			process: process,
			execute: execute,
			send: (event => {

				if(!this.playing){
					// if process is set, then run it
					let data = ev.process ? ev.process(event, target) : event;

					// store data in sequencer
					this.currentSequence.store(name, data);

					// execute function
					if(ev.execute){ev.execute(data)}
				}
			})
		}
		this._registeredEvents.push(ev);

		return ev;
	}

	// added 2022-05-11 as a simpler way of recording variable changes
	store(key, value){
		this.currentSequence.store(key, value);
	}

	trigEvent(name, value){
		// Kolla vad de här två raderna gjorde i gamla tider
		// let ev = this._registeredEvents.find(ev => ev.name == name);
		// if(ev.execute){ev.execute(value)}

		// Till Ficson har jag fixat denna istället:
		this.waxml.setVariable(name, value, 0, true);
		this.waxml.plugins.forEach(plugin => {
			if(plugin.setVariable){
				plugin.setVariable(name, value);
			}
		});

	}

	clear(name = this._curSeqName){
		let seq = this.getSequence(name);
		if(seq){
			seq.clear();
		}
		
	}

	allEvents(name = this._curSeqName, filter = []){
		return this.getSequence().allEvents(filter);
	}

	get currentSequence(){
		return this.getSequence(this._curSeqName);
	}

	get lastTouchGesture(){
		let seq = this.getSequence("default");
		let name = seq.name;
		let events = seq.filterEvents("touchstart", "touchend", ["touchstart", "touchmove", "touchend"], ["relX", "relY"]);
		return new EventSequence(this, name, events);
	}

	get lastGesture(){
		let seq = this.getSequence("default");
		let name = seq.name;
		let events = seq.filterEvents("pointerdown", "pointerup", ["pointerdown", "pointermove", "pointerup"], ["relX", "relY"]);
		return new EventSequence(this, name, events);
	}

	set playing(state){
		this._playing = state;
	}
	get playing(){
		return this._playing;
	}
}


module.exports = EventTracker;

},{"./EventSequence.js":9}],11:[function(require,module,exports){

var Mapper = require('./Mapper.js');
var WebAudioUtils = require('./WebAudioUtils.js');
const XY_area = require('./XY_area.js');
//var Finder = require('../finderjs/index.js');
var VariableMatrix = require('./VariableMatrix');
var DynamicMixer = require('./dynamic-mixer/Mixer.js');
var SnapshotController = require('./variable-matrix/SnapshotController.js');
const OutputMonitor = require('./GUI/OutputMonitor.js');
const LinearArranger = require('./GUI/LinearArranger.js');




class GUI {

	constructor(xmlNode, waxml){

		this.waxml = waxml;
		this.elementCounter = 0;
		
		let style = document.createElement("style");
		style.innerHTML = `

			* {
				font-family: sans-serif;
			}

			.waxml-GUI-container {

				display: none;
				overflow: hidden;
				position: absolute;
				top: 10px;
				left: 10px;
				z-index: 1000;
				resize: both;

				width: 1300px;
				height: 800px;
				display: block;

				font-size: 80%;
				background-color: #6c6262;
				color: white;
				border: 1px solid #333;
				border-radius: 10px;
				
			}

			.hide {
				display: none !important;
			}

			#waxml-GUI, #iMusic-GUI {
				margin: 1em;
				overflow: scroll;
			}
			#iMusic-GUI {
				margin-top: 3em;
			}
			#waxml-GUI {
				width: 100%;
				height: 100%;
				box-sizing: border-box;
			}

			#waxml-GUI .container {
				border-top: 1px solid grey;
				margin-top: 1em;
				padding: 1em;

			}

			#waxml-GUI .triggers {
				margin-top: 2em;
			}
			#waxml-GUI button,
			#iMusic-GUI button {
				border-radius: 5px;
				padding: 0.2em 0.5em;
				min-width: 5em;
				margin-right: 0.5em;
			}

			.waxml-open-button {
				position: absolute;
				right: 5px;
				top: 5px;
			}


			#waxml-GUI button.active,
			#iMusic-GUI button.active {
				background-color: #6f6;
			} 
			#waxml-GUI button.pending,
			#iMusic-GUI button.pending {
				animation: blinking 500ms infinite;
			}

			@keyframes blinking {
				0% {
				  background-color: #fff;
				  border: 0px;
				}
				100% {
				  background-color: #ff3;
				}
			  }

			.waxml-button.close {
				display: inline-block;
				position: relative;
				background-color: red;
				margin-right: 1em;
				top: 5px;
				left: 5px;
				width: 15px;
				height: 15px;
				border: 1px solid black;
				border-radius: 7.5px;
			}

			#waxml-GUI .waxml-object {
				margin: 6px 2px;
				border: 1px solid #333;
				border-radius: 5px;
				background-color: rgba(0,0,0,0.05);
				box-sizing: content-box;
				width: fit-content;
			}
			#waxml-GUI .waxml-object.noID {
				margin: 0px;
				border: none;
			}
			#waxml-GUI .waxml-object header {
				margin: 5px 8px;
				font-weight: bold;
			}
			#waxml-GUI .audio > * {
				display: inline-block;
			}
			#waxml-GUI .mixer > *,
			#waxml-GUI .include > * {
				display: block;
			}
			#waxml-GUI .chain > * {
				display: block;
			}
			#waxml-GUI .audio,
			#waxml-GUI .include {
				background-color: rgba(255,255,255,0.8);
			}
			#waxml-GUI .waxml-object.chain {
				background-color: rgba(50,100,0,0.25);
			}
			#waxml-GUI .waxml-object.mixer {
				background-color: rgba(100,50,0,0.25);
			}

			.waxml-top-bar {
				display: block;
				position: absolute;
				top: 0px;
				left: 0px;
				height: 26px;
				width: 100%;
				background-color: #ccc;
				border-bottom: 1px solid #333;
			}
			.waxml-top-bar  * {
				color: black;
				font-weight: bold;
			}

			#waxml-GUI .sliderContainer {
				display: block;
				padding: 0.3em;
    			border-top: 1px solid grey;
			}

			#waxml-GUI .sliderContainer.unspecified label{
				width: 20em;
			}

			#waxml-GUI .sliderContainer.variable label {
				display: block;
				width: auto;
			}
			#waxml-GUI .sliderContainer label {
				display: inline-block;
				margin: 0px 5px;
				width: 5em;
			}

			#waxml-GUI .sliderContainer .numOutput {
				display: inline-block;
				text-align: right;
				padding: 2px;
				margin: 0px 5px;
				border: 1px solid grey;
				border-radius: 5px;
				width: 3.5em;
				height: 1.6em;
				background-color: white;
				box-sizing: border-box;
			}

			#waxml-GUI .sliderContainer input[type='range'] {
				display: inline-block;
				width: 10em;
				margin: 0px;
				vertical-align: middle;
			}
			#waxml-GUI .sliderContainer.variable input[type='range'] {
				width: 15.6em;
			}

			#waxml-GUI select,
			#iMusic-GUI select {
				margin: 1em;
				padding: 0.5em;
				min-width: 10em;
			}			

			#waxml-GUI .errorBox,
			#iMusic-GUI .errorBox {
				color: #900;
				background-color: white;
				border: 1px solid black;
				margin-top: 1em;
				padding: 1em;
				width: 80%;
			}

			waxml-variable-matrix {
				display: block;
				border: 1px solid #333;
				border-radius: 0.5em;
				background-color: #999;
				overflow: hidden;
			}
			waxml-variable-matrix table {
				border-collapse: collapse; 
				width: 100%;
			}
			waxml-variable-matrix th {
				text-align: left;
				padding-left: 1em;
			}
			waxml-variable-matrix tr {
				border-bottom: 1px solid #333;
			}
			waxml-variable-matrix thead {
				background-color: #444;
				color: #fff;
			}

			waxml-variable-matrix td,
			waxml-variable-matrix th {
				color: #fff;
				border-left: 1px solid #aaa;
				padding-left: 1em;
			}
			waxml-variable-matrix .selected,
			waxml-dynamic-mixer .selected {
				background-color: #bfbfe3;
			}
			waxml-variable-controller {
				display: inline-block;
				padding: 0.5em 1em;
			}
			waxml-variable-controller.selected {
				
			}
			waxml-variable-controller input[type="range"]{
				vertical-align: middle;
				border-radius: 0.5em;
				background-color: #333;
				-webkit-appearance: none;
				appearance: none;
				cursor: pointer;
				transition: 0.5s;
			}

			waxml-variable-controller input[type="range"]::-webkit-slider-runnable-track,
			waxml-variable-controller input[type="range"]::-moz-range-track  {
				background-color: #444;
				height: 1.5em;
				border-radius: 0.75em;
			}


			waxml-variable-controller input[type="range"]::-webkit-slider-thumb {
				-webkit-appearance: none; /* Override default look */
				appearance: none;
				background-color: #aaa;
				border: 1px solid #000;
				border-radius: 0.6em;
				height: 1.2em;
				width: 1.2em;    
			}


			waxml-variable-controller input[type="text"]{
				vertical-align: middle;
				text-align: right;
				border: 0px;
				background-color: rgba(255,255,255,0);
				color: #fff;
			}

			waxml-meter {
				width: 80%;
				height: 1em;
				background-color: black;
			}

			waxml-snapshot-controller {
				position: relative;
				display: block;
				border: 1px solid #333;
				border-radius: 0.5em;
				background-color: #999;
				padding: 10px;
			}
			waxml-snapshot-controller > * {
				background-color: #ccc;
				border: 1px solid #333;
    			border-radius: 10px;
				width: 47.9%;
				margin: 1em;
				height: 300px;
				overflow: auto;
				display: inline-block;
				box-sizing: border-box;
			}
			.waxml-snapshot-button-container {
			}
			waxml-snapshot-controller textarea {
			}
			.waxml-snapshot-button-container > div {

			}

			
			waxml-snapshot-component {
				
				border: 1px solid #333;
				border-radius: 0.5em;
				background-color: #999;
				margin: 1em;
				margin-right: 0em;
				padding: 0.7em;
				display: inline-grid !important;
			}
			waxml-snapshot-component button.delete {
				width: 1.5em;
				height: 1.5em;
				padding: 0em !important;
				min-width: auto !important;
				min-height: auto !important;
			}
			waxml-snapshot-controller button.add {
				width: 1.5em;
				height: 1.5em;
				padding: 0em !important;
				margin: 1em;
				min-width: auto !important;
				min-height: auto !important;
			}
			waxml-dynamic-mixer {
				display: inline-block;
				position: relative;
				color: #fff;
				border-radius: 0.5em;
				border: 1px solid #333;
				width: 45%;
				background-color: #999;
				overflow: hidden;
			}
			waxml-dynamic-mixer table {
				width: 100%;
				border-collapse: collapse;
			}

			waxml-dynamic-mixer thead {
				background-color: #333;
			}
			waxml-dynamic-mixer th {
				text-align: left;
				padding-left: 1em;
			}
			waxml-dynamic-mixer tr {
				border-bottom: 1px solid #333;
			}

			waxml-dynamic-mixer td {
				border-left: 1px solid #aaa;
				padding-left: 1em;
			}

			waxml-dynamic-mixer meter {
				width: 100px;
				height: 30px;
				vertical-align: middle;
			}

			waxml-dynamic-mixer meter::-webkit-meter-bar {
				background-color: black;
			}
			waxml-dynamic-mixer meter::-webkit-meter-optimum-value,
			waxml-dynamic-mixer meter:-moz-meter-optimum::-moz-meter-bar {
				#555;
			}

			waxml-output-monitor {
				display: block;
				width: 97%;
				height: 300px;
				border: 1px solid #333;
				background-color: #bbb;
				overflow-y: scroll;

				color: #000;
				font-size: 120%;
				font-family: Monospace;
				padding: 0.5em;
				border-radius: 0.5em;
				margin: 1em 0;
			}
			
			waxml-output-monitor table {
				width: 100%;
			}

			waxml-output-monitor tr.error {
				color: #c90202;
			}

			waxml-output-monitor table td {
				padding: 2px;
			}

			waxml-output-monitor table td.number {
				text-align: right;
			}

			waxml-linear-arranger {
				display: block;
				width: 100%;
				height: 50%;
				background: #777;
				margin-left: 1em;
				border-radius: 0.5em;
				border: 1px solid #333;
				margin: 1em auto;
			}

			waxml-linear-arranger > * {
				height: 100%;
				display: inline-block;
				position: relative;
				vertical-align: top;
			}

			waxml-linear-arranger > .list {
				width: 19%;
				background-color: #555;
				border-right: 1px solid black;
			}

			waxml-linear-arranger > .list > * {
				border-bottom: 1px solid black;
				box-sizing: border-box;
				margin-left: 1em;
				line-height: 2em;
			}
			

			waxml-linear-arranger > .main {
				width: 80%;
				overflow-y: hidden;
				overflow-x: scroll;
			}

			waxml-linear-arranger button.zoom {
				float: right;
				width: 1em;
				height: 1.7em;
				margin-right: 0 !important;
				background-color: #ccc;
				
			}

			waxml-linear-arranger .content {
				width: 100%;
				height: 100%;
				left: 0%;
				position: absolute;
			}


			waxml-linear-arranger .content > * {
				position: relative;
				width: 100%;
				border-bottom: 1px solid #777;
				box-sizing: border-box;
			}

			waxml-linear-arranger .position-pointer {
				height: 100%;
				left: 0%;
				position: absolute;
				z-index: 1;
				border-left: 3px solid #006;
			}

			waxml-linear-arranger .grid {
				width: 100%;
				height: 100%;
				position: absolute;
			}
			waxml-linear-arranger .grid > * {
				position: absolute;
				border-left: 1px solid black;
			}

			waxml-linear-arranger .grid .barline {
				height: 100%;
			}

			waxml-linear-arranger .grid .beatline {
				height: 100%;
				border-left: 1px dashed #333;
			}

			waxml-linear-arranger .object {
				height: 100%;
				position: absolute;
				border: 1px solid #333;
				border-radius: 5px;
				color: #333;
				padding-left: 0.5em;
			}



			waxml-linear-arranger .voice .object {
				background-color: rgba(185,108,106,0.8);
			}
			
			waxml-linear-arranger .class .object {
				background-color: rgba(119,140,196,0.8);
			}
			
			waxml-linear-arranger .other:nth-child(4n) .object {
				background-color: rgba(129,186,201,0.8);
			}
			
			waxml-linear-arranger .other:nth-child(4n+1) .object {
				background-color: rgba(158,198,118,0.8);
			}
			
			waxml-linear-arranger .other:nth-child(4n+2) .object {
				background-color: rgba(202,192,130,0.8);
			}
			
			waxml-linear-arranger .other:nth-child(4n+3) .object {
				background-color: rgba(198,160,119,0.8);
			}
			

			
		
		`;

		let container = document.createElement("div");
		container.id = "waxml-GUI";
		container.classList.add("WebAudioXML");

		let allNodes = xmlNode.querySelectorAll("*[controls='true'], *[controls='show']");
		let shadowContainer;

		// It might be better to separate
		document.head.appendChild(style);
		let shadowStyle = style.cloneNode(true);

		// GUI in shadow HTML
		shadowContainer = document.createElement("div");
		shadowContainer.classList.add("waxml-GUI-container");

		document.body.prepend(shadowContainer);


		let shadowElement = shadowContainer.attachShadow({mode: 'open'});
		shadowElement.appendChild(shadowStyle);

		shadowElement.appendChild(container);


		this.HTML = shadowElement;

		
		let openbtn = document.createElement("button");
		openbtn.innerHTML = "WAXML";
		openbtn.classList.add("waxml-open-button");
		openbtn.classList.add("button");
		
		document.body.appendChild(openbtn);
		openbtn.addEventListener("click", e => {
			e.target.classList.add("hide");
			shadowContainer.classList.remove("hide");

			container.querySelectorAll("waxml-xy-handle").forEach(el => {
				el.initRects();
				el.move();
			});
		});
		// openbtn.style.display = allNodes.length ? "block": "none";


		let controlSetting = xmlNode.firstChild.getAttribute("controls");
		
		if(controlSetting == "show" || controlSetting == "false"){
			openbtn.classList.add("hide");
		} 
		if(controlSetting != "show") {
			shadowContainer.classList.add("hide");
		}


		let topBar = document.createElement("div");
		topBar.classList.add("waxml-top-bar");
		shadowElement.appendChild(topBar);

		this.dragElement(shadowContainer, topBar);

		let btn = document.createElement("div");
		// btn.innerHTML = "X";
		btn.classList.add("waxml-button");
		btn.classList.add("close");
		btn.classList.add("btn");
		topBar.appendChild(btn);
		btn.addEventListener("click", e => {
			shadowContainer.classList.add("hide");
			openbtn.classList.remove("hide");
		});

		topBar.insertAdjacentHTML("beforeend", "<span>WAXML - inspector</span>");
		
		
		// Generate triggers
		this.XMLtoTriggerButtons(xmlNode, container);

		this.linearArranger = new LinearArranger(this.waxml);
		container.appendChild(this.linearArranger);

		this.addDynamicMixers(waxml.querySelectorAll(`*[controls*="waxml-dynamic-mixer"]`), container);

		let matrixes = this.addVariableMatrixes(waxml.querySelectorAll(`*[controls*="waxml-variable-matrix"]`), container);
		
		if(matrixes) {
			this.addSnapshotController(container);
		}


		// ObjectBasedAudio
		this.XY_areaFromAudioObjects(waxml.querySelectorAll("ObjectBasedAudio"), container);


		// WAXML Console
		this.outputMonitor = new OutputMonitor();
		container.appendChild(this.outputMonitor);



		// Find variables in use without <var> elements
		let usedVariables = [];
		xmlNode.querySelectorAll("*").forEach(node => {
			[...node.attributes].forEach(attr => {
				WebAudioUtils.getVariableNames(attr.nodeValue).forEach(name => {
					usedVariables.push(name);
				});
			});
		});
		// remove duplicates
		this.usedVariables = [...new Set(usedVariables)];



		// Create container for unspecified variable sliders
		let unspecVarsContainer = document.createElement("div");
		container.appendChild(unspecVarsContainer);

		// Generate sliders for <var> elememts and audio parameters
		let specifiedContainer = document.createElement("div");
		//specifiedContainer.innerHTML = "<h2>&lt;var&gt; elements and Audio Parameters</h2>";
		specifiedContainer.classList.add("container");
		container.appendChild(specifiedContainer);



		allNodes.forEach(xmlNode => {
			//this.XMLtoSliders(xmlNode, specifiedContainer, true);
		});

		//this.addUnspecifiedVariableSliders(this.usedVariables, unspecVarsContainer);
		
		// let columnView = document.createElement("div");
		// columnView.classList.add("columnView");
		// document.body.appendChild(columnView);
		// this.XMLtoColumnView([this.waxml.structure.XMLtree], columnView);
	}


	remove(){
		// not implementet yet
	}

	addDynamicMixers(objects, container){

		if(!objects.length){
			return;
		}
		let header = document.createElement("h1");
		header.innerHTML = "Dynamic Mixers";
		container.appendChild(header);


		objects.forEach(obj => {
			// add a matrix for each object with controls="waxml-variable-matrix"
			let el = new DynamicMixer(obj);
			el.setAttribute("class", "waxml-dynamic-mixer");
			container.appendChild(el);
		});
	}

	addVariableMatrixes(objects, container){

		if(!objects.length){
			return;
		}
		let header = document.createElement("h1");
		header.innerHTML = "Mixer";
		container.appendChild(header);
		returnArray = [];

		objects.forEach(obj => {
			// add a matrix for each object with controls="waxml-variable-matrix"
			let matrix = new VariableMatrix(obj);
			matrix.setAttribute("class", "waxml-snapshot waxml-gui-matrix");
			container.appendChild(matrix);
			returnArray.push(matrix);
		});
		return returnArray;
	}

	addSnapshotController(container, group="waxml-gui"){
		let header = document.createElement("h1");
		header.innerHTML = "Snapshots";
		container.appendChild(header);
		let snapshotController = new SnapshotController({
			class: "waxml-snapshot waxml-gui-matrix"
		}, this.waxml);
		container.appendChild(snapshotController);
	}

	addUnspecifiedVariableSliders(names, container){
		container.innerHTML = "<h2>Unspecified variables</h2>";
		container.classList.add("container", "sliders", "variables", "unspecified");
		names.forEach(name => {
			this.addSlider(
				`$${name}`, 
				container,
				0,
				1,
				1/1000, 
				1, 
				"unspecified",
				e => {
					this.waxml.setVariable(name, e.target.value);
				}
			);
		});
	}

	XMLtoColumnView(structure, el){

		// let f = new Finder(el, structure, {});
		// f.on('leaf-selected', function(item) {
		// 	console.log('Leaf selected', item);
		//   });

	}

	XMLtoTriggerButtons(xmlNode, el){

		let IDs = [];
		let classNames = [];
		let container = document.createElement("div");
		container.classList.add("triggers");
		el.appendChild(container);


		let header = document.createElement("h3");
		header.innerHTML = "Triggers";
		container.appendChild(header);

		let idSelector = "Envelope[id], ObjectBasedAudio[id], AmbientAudio[id], AudioBufferSourceNode[id]";

		xmlNode.querySelectorAll(idSelector).forEach(xmlNode => {
			IDs.push(xmlNode.id);
		});
		[...new Set(IDs)].forEach(id => this.addButton(id, container, e => this.waxml.start(`#${id}`)));

		let selector = "Envelope[class], ObjectBasedAudio[class], AmbientAudio[class], AudioBufferSourceNode[class]";

		xmlNode.querySelectorAll(selector).forEach(xmlNode => {
			xmlNode.classList.forEach(className => classNames.push(className));
		});
		[...new Set(classNames)].forEach(className => this.addButton(className, container, e => this.waxml.start(`.${className}`)));

		container.style.display = classNames.length + IDs.length ? "block" : "none";

		container.appendChild(document.createElement("hr"));
	}

	XY_areaFromAudioObjects(objects, targetElement){

		if(!objects || !objects.length){return}


		let header = document.createElement("h3");
		header.innerHTML = "3D Object Based Audio";
		targetElement.appendChild(header);

		let maxValues = objects.reduce((prevObject, curObject) => {
			return {
				positionX: Math.max(Math.abs(prevObject.positionX), Math.abs(curObject.positionX)),
				positionZ: Math.max(Math.abs(prevObject.positionZ), Math.abs(curObject.positionZ))
			}
		}, {positionX: 1, positionZ: 1});
		let maxVal = Math.max(maxValues.positionX, maxValues.positionZ)*2;

		let range = maxVal * 2;
		while(range > 60){
			range *= 0.1; // auto adjust grid to 10, 100, 1000 etc
		}
		let XY_area = document.createElement("waxml-xy-area");
		XY_area.setAttribute("width", "500px");
		XY_area.setAttribute("height", "500px");
		XY_area.setAttribute("columns", range);
		XY_area.setAttribute("rows", range);
		XY_area.setAttribute("border", "2px solid black");
		XY_area.setAttribute("background-color", "#696");
		XY_area.setAttribute("gridColor", "grey");
		targetElement.appendChild(XY_area);

		let title;
		title = document.createElement("div");
		title.innerHTML = "<strong>Object:</strong>";
		targetElement.appendChild(title);

		let XYoutput = document.createElement("div");
		XYoutput.innerHTML = " ";
		targetElement.appendChild(XYoutput);

		title = document.createElement("div");
		title.innerHTML = "<strong>Listener:</strong>"
		targetElement.appendChild(title);

		let headPositionOutput = document.createElement("div");
		targetElement.appendChild(headPositionOutput);

		let headForwardOutput = document.createElement("div");
		targetElement.appendChild(headForwardOutput);

		let sndCnt = 0;
		
		objects.forEach(object => {
			let tempName = object.src ? object.src.split("/").pop() : `Sound ${++sndCnt}`;
			let label = object.name || object.id || tempName;
			let handle = document.createElement("waxml-xy-handle");
			handle.innerHTML = label;

			handle.setAttribute("minX", -maxVal);
			handle.setAttribute("minY", -maxVal);
			handle.setAttribute("maxX", maxVal);
			handle.setAttribute("maxY", maxVal);

			handle.setAttribute("direction", "xy");
			handle.setAttribute("x", (object.positionX + maxVal) / (maxVal*2));
			handle.setAttribute("y", (object.positionZ + maxVal) / (maxVal*2));

			XY_area.appendChild(handle);

			handle.addEventListener("input", e => {
				let x = e.target.getProperty("x");
				let y = e.target.getProperty("y");
				object.positionX = x;
				object.positionZ = y;
				XYoutput.innerHTML = `positionX: ${x.toFixed(1)} | positionZ: ${y.toFixed(1)}`;
			});
		});

		XY_area.addEventListener("pointerdown", e => {
			// turn listener
			let point = XY_area.coordinateTovalue({x:e.clientX, y:e.clientY});
			let deltaX = (point.x - head.x) * maxVal;
			let deltaY = (point.y - head.y) * maxVal;
			headForwardOutput.innerHTML = `forwardX: ${deltaX.toFixed(1)} | forwardZ: ${deltaY.toFixed(1)}`;
			this.waxml.setVariable("forwardX", deltaX);
			this.waxml.setVariable("forwardZ", deltaY);

			let rad = head.pointToRelativeRadians(point);
			head.style.transform = `rotate(${rad}rad)`;
		});
		headForwardOutput.innerHTML = `forwardX: ${this.waxml.getVariable("forwardX").toFixed(1)} | forwardZ: ${this.waxml.getVariable("forwardZ").toFixed(1)}`


		// listening head
		let head = document.createElement("waxml-xy-handle");
		head.setAttribute("icon", "arrow-up-circle-fill");

		head.setAttribute("size", "40px");
		head.setAttribute("x", 0.5);
		head.setAttribute("y", 0.5);
		head.setAttribute("minX", -maxVal);
		head.setAttribute("minY", -maxVal);
		head.setAttribute("maxX", maxVal);
		head.setAttribute("maxY", maxVal);

		XY_area.appendChild(head);
		head.addEventListener("input", e => {
			let x = e.target.getProperty("x");
			let y = e.target.getProperty("y");
			this.waxml.setVariable("positionX", x);
			this.waxml.setVariable("positionZ", y);
			headPositionOutput.innerHTML = `positionX: ${x.toFixed(1)} | positionZ: ${y.toFixed(1)}`;
		});

		head.style.transform = `rotate(${-90}deg)`;
		headPositionOutput.innerHTML = `positionX: ${this.waxml.getVariable("positionX").toFixed(1)} | positionZ: ${this.waxml.getVariable("positionZ").toFixed(1)}`

		return XY_area;
	
	}

	XMLtoSliders(xmlNode, el, displayContainer){
		let nodeName = xmlNode.localName.toLowerCase()

		// let variableContainer = document.createElement("div");
		// variableContainer.classList.add("sliders", "variables");
		// // variableContainer.innerHTML = "<h3>&lt;var&gt; elements</h3>";
		// el.appendChild(variableContainer);

		// let parameterContainer = document.createElement("div");
		// parameterContainer.classList.add("sliders", "parameters");
		// // parameterContainer.innerHTML = "<h2>Audio Parameters</h2>";
		// el.appendChild(parameterContainer);
		let slidersAdded = false;

		if(xmlNode.children.length){
			let subEl = document.createElement("div");
			let id;
			if(xmlNode.id || xmlNode.classList.length){
				id = xmlNode.id ? `#${xmlNode.id}` : `.${[...xmlNode.classList].join(".")}`;
				subEl.innerHTML = `<header>${xmlNode.localName + id}</header>`;
			} else if(xmlNode.localName == "include"){
				subEl.innerHTML = `<header>${xmlNode.getAttribute("href")}</header>`;
			} else {
				id = "";
				if(!displayContainer)subEl.classList.add("noID");
			}
			subEl.classList.add(xmlNode.localName.toLowerCase());
			subEl.classList.add("waxml-object");
			
			// 2022-08-30 - reduced to only show top level variables
			if(xmlNode.parentNode.nodeName == "#document"){
				Array.from(xmlNode.children).forEach(childNode => {
					//slidersAdded = this.XMLtoSliders(childNode, subEl) || slidersAdded;
				});
			}
			
			if(slidersAdded)el.appendChild(subEl);

		} else {
			switch(nodeName){

				case "var":
				let obj = xmlNode.obj;
				//if(typeof obj._params.value == "undefined"){
					// remove variable from list so there will be no slider duplicates
					this.usedVariables = this.usedVariables.filter(name => name != obj.name);;

					this.addSlider(
						//`&lt;var name="${obj.name}"&gt;`, 
						obj.name,
						el,
						obj.minIn,
						obj.maxIn,
						(obj.maxIn-obj.minIn)/1000, 
						obj.default, 
						"variable",
						e => obj.value = e.target.value
					);
					slidersAdded = true;
				//}
				break;
	
				case "envelope":
				break;
	
				default:
				if(xmlNode.obj._node instanceof AudioParam && typeof xmlNode.obj._params.value == "undefined"){
					// avoid making sliders for parameters with predefined or variable controlled values
					let name = WebAudioUtils.caseFixParameter(nodeName);
					let range = WebAudioUtils.paramNameToRange(name);
					this.addSlider(
						xmlNode.localName,
						el,
						range.min,
						range.max,
						(range.max - range.min) / 1000, 
						range.default, 
						"audio-parameter",
						e => xmlNode.obj[name] = e.target.value
					);
					slidersAdded = true;
				} 
				break;
			}
		}
		return slidersAdded;
	}

	addButton(name, parent, fn){
		let btn = document.createElement("button");
		btn.innerHTML = name;
		btn.addEventListener("click", fn);
		parent.appendChild(btn);
	}


	addSlider(name, parent, min, max, step, val, className, fn){
		let sliderContainer = document.createElement("div");
		sliderContainer.classList.add("sliderContainer", className);
		parent.appendChild(sliderContainer);

		let sliderID = `slider-${this.elementCounter++}`;
		// if(name == "$multi_pan"){
		// 	console.log("$multi_pan");
		// }

		let label = document.createElement("label");
		label.innerHTML = name;
		label.setAttribute("for", sliderID);
		sliderContainer.appendChild(label);

		let slider = document.createElement("input");
		slider.setAttribute("type", "range");
		slider.setAttribute("min", min);
		slider.setAttribute("max", max);
		slider.setAttribute("step", step);
		slider.setAttribute("value", val);
		slider.setAttribute("id", sliderID);
		sliderContainer.appendChild(slider);

		let output = document.createElement("span");
		output.innerHTML = val;
		output.classList.add("numOutput");
		sliderContainer.appendChild(output);

		slider.addEventListener("input", e => {
			output.innerHTML = e.target.value;
			fn(e);
		});

		return sliderContainer;
	}

	log(message){
		this.outputMonitor.log(message);
	}

	initLinearArranger(structure){
		this.linearArranger.init(structure);
	}

	visualize(obj){
		return this.linearArranger.visualize(obj);
	}
	visualFadeOut(data){
		this.linearArranger.visualFadeOut(data);
	}

	scrollArrangeWindow(time){
		this.linearArranger.scrollTo(time);
	}

	// Make the GUI window draggable:

	dragElement(container, headerElement) {
		var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
		(headerElement || container).onmousedown = dragMouseDown;

		function dragMouseDown(e) {
			e = e || window.event;
			e.preventDefault();
			// get the mouse cursor position at startup:
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.addEventListener("pointerup", closeDragElement);
			// call a function whenever the cursor moves:
			document.addEventListener("pointermove", elementDrag);
		}

		function elementDrag(e) {
			e = e || window.event;
			e.preventDefault();
			// calculate the new cursor position:
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;
			// set the element's new position:
			container.style.top = (container.offsetTop - pos2) + "px";
			container.style.left = (container.offsetLeft - pos1) + "px";
		}

		function closeDragElement() {
			if(container.offsetTop < 0){
				container.style.top = "0px";
			}
			if(container.offsetLeft < 0){
				container.style.left = "0px";
			}
			document.removeEventListener("pointerup", closeDragElement);
			document.removeEventListener("pointermove", elementDrag);
		}
	}


}


module.exports = GUI;






},{"./GUI/LinearArranger.js":12,"./GUI/OutputMonitor.js":13,"./Mapper.js":22,"./VariableMatrix":35,"./WebAudioUtils.js":39,"./XY_area.js":40,"./dynamic-mixer/Mixer.js":43,"./variable-matrix/SnapshotController.js":50}],12:[function(require,module,exports){


class LinearArranger extends HTMLElement {

    constructor(waxml){
        super();
		this.inited = false;
        this.voiceTracks = {};
        this.classTracks = {};
        this.otherTracks = [];
        this.nrOfTracks = 0;
        this.waxml = waxml;
        this.timeFactor = 10;
        this.style.display = "none";
    }

    connectedCallback(){

    }

    init(structure){
        this.inited = true;
        this.style.display = "block";

        let trackList = document.createElement("div");
        trackList.classList.add("list");
        this.appendChild(trackList);

        let frame = document.createElement("div");
        this.frame = frame;
        frame.classList.add("main");
        
        frame.addEventListener("pointerenter", e => {
            this.scrolling = true;
        });
        frame.addEventListener("pointerleave", e => {
            this.scrolling = false;
        });

        let content = document.createElement("div");
        this.content = content;
        content.classList.add("content");
        content.dataset.width = 100;
        frame.appendChild(content);

        // zoom buttons
        let btn = document.createElement("button");
        btn.classList.add("zoom");
        btn.innerHTML = "+";
        btn.addEventListener("click", e => {
            this.zoomFactor(1.25);
        });
        this.appendChild(btn);

        btn = document.createElement("button");
        btn.classList.add("zoom");
        btn.innerHTML = "-";
        btn.addEventListener("click", e => {
            this.zoomFactor(0.8);
        });
        this.appendChild(btn);


        let positionPointer = document.createElement("div");
        positionPointer.classList.add("position-pointer");
        this.positionPointer = positionPointer;
        content.appendChild(positionPointer);

        this.grid = document.createElement("div");
        this.grid.classList.add("grid");
        content.appendChild(this.grid);

        structure.sections.forEach(section => {
            let otherTrackCounter = 0;
            section.tracks.forEach((track, i) => {

                let graphicalTrack;
                let tag;
                tag = track.tags.length ? track.tags[0] : 0;
                if(track.parameters.voice){
                    graphicalTrack = this.addVoice(track.parameters.voice);
                // }
                // else if(tag){
                //     graphicalTrack = this.addClass(tag);
                } else {
                    graphicalTrack = this.addOtherTrack(otherTrackCounter++);
                } 

                if(graphicalTrack){
                    track.graphicalTrack = graphicalTrack;
                } else {
                    console.log(track);
                }
                

            });


            section.leadIns.forEach(leadin => {
                let tag = leadin.tags.length ? leadin.tags[0] : 0;
                let graphicalTrack;
                if(leadin.parameters.voice){
                    graphicalTrack = this.addVoice(leadin.parameters.voice);
                } else if(tag){
                    graphicalTrack = this.addClass(tag);
                }      
                if(graphicalTrack){
                    leadin.graphicalTrack = graphicalTrack;
                } else {
                    console.log(leadin);
                }
            });
        });


        structure.motifs.forEach(motif => {

            let tag = motif.tags.length ? motif.tags[0] : 0;
            let graphicalTrack;
            if(motif.parameters.voice){
                graphicalTrack = this.addVoice(motif.parameters.voice);
            } else if(tag){
                graphicalTrack = this.addClass(tag);
            }
        
            if(graphicalTrack){
                motif.graphicalTrack = graphicalTrack;
            } else {
                console.log(motif);
            }
        });

        Object.entries(this.voiceTracks).forEach(([label, div]) => {
            let el = this.createTrackLabel(label)
            trackList.appendChild(el);
            content.appendChild(div)
        });
        Object.entries(this.classTracks).forEach(([label, div]) => {
            let el = this.createTrackLabel(label)
            trackList.appendChild(el);
            content.appendChild(div)
        });
        
        this.otherTracks.forEach((div, i) => {
            let el = this.createTrackLabel(`Track ${i+1}`)
            trackList.appendChild(el);
            content.appendChild(div)
        });

        this.querySelectorAll(".track").forEach(obj => {
            obj.style.height = `${100/this.nrOfTracks}%`;
        });

        // only append if music is used
        if(content.children){
            this.appendChild(frame);
        }

    }

    addVoice(name){
        if(!this.voiceTracks[name]){
            this.voiceTracks[name] = this.createTrack("voice");
        }
        return this.voiceTracks[name];
    }
    addClass(name){
        if(!this.classTracks[name]){
            this.classTracks[name] = this.createTrack("class");
        }
        return this.classTracks[name];
    }
    addOtherTrack(i){
        if(!this.otherTracks[i]){
            this.otherTracks[i] = this.createTrack("other");
        }
        return this.otherTracks[i];
    }

    createTrack(className){
        this.nrOfTracks++;
        let el = document.createElement("div");
        el.classList.add(className);
        el.classList.add("track");
        return el;
    }

    createTrackLabel(label){
        let el = document.createElement("div");
        el.classList.add("track");
        el.innerHTML = label;
        return el;
    }
        

    visualize(obj){

        let el = document.createElement("div");
        let container = obj.graphicalTrack || this.grid;
        el.innerHTML = obj.label || "";
        el.style.left = `${obj.pos*this.timeFactor}%`;
        if(obj.length){
            el.style.width = `${obj.length*this.timeFactor}%`;
        }
        el.classList.add(obj.class || "object");
        container.appendChild(el);
        return el;
    }
    
    visualFadeOut(data){
        let percent = this.timeToPercent(data.time);
        let left = parseFloat(data.element.style.left);
        let width = parseFloat(data.element.style.width);
        let newWidth = percent - left;
        if(newWidth < width){
            // console.log(`Change width: ${width} -> ${newWidth}`);
            data.element.style.width = `${newWidth}%`;
        }

    }

    scrollTo(time=this.waxml._ctx.currentTime){
        // this.content.style.left = `${80-(time*this.timeFactor)}%`;
        // let pix = this.timeToPix(time);
        this.positionPointer.style.left = `${this.timeToPercent(time)}%`;
        if(!this.scrolling){
            this.frame.scrollLeft = this.timeToPix(time) - this.content.clientWidth * 0.8;
        }
    }

    timeToPercent(time){
        return time*this.timeFactor;
    }

    timeToPix(time){
        return time*this.timeFactor * this.content.clientWidth * 0.01;
    }

    clear(){
        // remove all segments
    }

    zoomFactor(factor){
        let w = parseFloat(this.content.dataset.width) * factor;
        this.content.dataset.width = w;
        this.content.style.width = `${w}%`;
    }
}

module.exports = LinearArranger;
},{}],13:[function(require,module,exports){


class OutputMonitor extends HTMLElement {

    constructor(){
        super();
        this.classList.add("waxml-output-monitor");

        this.table = document.createElement("table");
        this.appendChild(this.table);
    }

    log(m){
        let type = "info";
        let message;
        if(typeof m === "string"){
            // comma separated string (else array)
            message = m.split(",");
        } else if(m instanceof Array){
            message = m;
        } else if(m instanceof Object){
            message = m.data;
            if(typeof message === "string"){
                message = message.split(",");
            }
            type = m.type || type;
        }

        let tr = document.createElement("tr");
        tr.classList.add(type);
        if(!message){
            return;
        }
        message.forEach(val => {
            let td = document.createElement("td");
            if(typeof val == "string"){
                val = val.trim();
            }
            let floatVal = parseFloat(val);
            if(floatVal == val){
		        let decimals = Math.ceil(Math.max(0, 2 - Math.log(floatVal || 1)/Math.log(10)));
                val = floatVal.toFixed(decimals);
                td.classList.add("number");
            }
            td.innerHTML = val;
            tr.appendChild(td);
        });
        this.table.appendChild(tr);

        // auto scroll
        this.scrollTop = this.scrollHeight;
    }

    clear(){
        this.table.innerHTML = "";
    }
}

module.exports = OutputMonitor;
},{}],14:[function(require,module,exports){



const HL1 = (bc) => class extends bc {

	constructor(ctx){
        super(ctx);
	}
	
    get type(){
        return super.type;
    }

    get style(){
        return "nice";
    }
	
	    
}

module.exports = HL1;

},{}],15:[function(require,module,exports){
const HL1 = require("./HL1.js");


class HL2 extends HL1(OscillatorNode) {

    constructor(ctx){
        super(ctx);
    }

    get type(){
        return super.type;
    }

    get style(){
        return "supernice";
    }

}

module.exports = HL2;
},{"./HL1.js":14}],16:[function(require,module,exports){
class InputBusses {

    constructor(ctx){
        this._ctx = ctx;
        this.busses = [];
    }

    addBus(selector, destinations){
        let bus = {selector: selector, input: new GainNode(this._ctx)};
        destinations.forEach(dest => bus.input.connect(dest));
        this.busses.push(bus);
        return bus;
    }

    getBus(selector, destinations){
        let bus = this.busses.filter(bus => selector == bus.selector).pop()
        if(bus){
            return bus;
        } else {
            return this.addBus(selector, destinations);
        }
    }

    disconnectAll(){
        this.busses.forEach(bus => bus.input.disconnect());
    }

    get all(){
        return this.busses;
    }
}

module.exports = InputBusses;
},{}],17:[function(require,module,exports){


class Inspector extends HTMLElement {

	constructor(){
		super();
		this.variables = [];
		this.inspectedValues = [];
		this.nrOfValues = 200;
	}

	connectedCallback(){

		let w = parseFloat(this.getAttribute("width")) || 400;
		let h = parseFloat(this.getAttribute("height")) || 200;
		this.style.position = `relative`;

		let mappingDisplay = document.createElement("div");
		mappingDisplay.style.width = w * 0.5;
		mappingDisplay.style.height = h * 0.5;
		mappingDisplay.style.left = `${w * 0.52}px`;
		mappingDisplay.style.position = `absolute`;
		this.appendChild(mappingDisplay);

		this.mappingCanvas = document.createElement("canvas");
		this.mappingCanvas.width = w * 0.5;
		this.mappingCanvas.height = h * 0.5;
		mappingDisplay.appendChild(this.mappingCanvas);

		this.mappingCanvasCtx = this.mappingCanvas.getContext("2d");
		this.mappingCanvasCtx.lineWidth = 2;
		this.mappingCanvasCtx.strokeStyle = "#EEE";


		// create dancing dot
		let dot = document.createElement("div");
		let dotSize = Math.min(w,h) / 35;
		dot.style.width = `${dotSize}px`;
		dot.style.height = `${dotSize}px`;
		dot.style.borderRadius = `${dotSize/2}px`;
		dot.style.backgroundColor = `white`;
		dot.style.border = `1px solid grey`;
		dot.style.position = "absolute";
		mappingDisplay.appendChild(dot)
		this.dot = dot;
		this.dotSize = dotSize;



		this.inputCanvas = document.createElement("canvas");
		this.appendChild(this.inputCanvas);
		this.inputCanvas.width = w * 0.5;
		this.inputCanvas.height = h * 0.5;
		this.inputCanvas.style.top = `${h * 0.55}px`;
		this.inputCanvas.style.left = `${w * 0.52}px`;
		this.inputCanvas.style.position = `absolute`;

		this.inputCanvasCtx = this.inputCanvas.getContext("2d");
		this.inputCanvasCtx.lineWidth = 2;
		this.inputCanvasCtx.strokeStyle = "orange";

		let label = document.createElement("span");
		label.style.position = "absolute";
		label.style.top = `${h * 0.55}px`;
		label.style.left = `${w * 0.53}px`;
		label.style.backgroundColor = "black";
		label.style.color = "orange";
		label.style.fontFamily = "sans-serif";
		this.appendChild(label);
		this.minInputHTML = label;
		
		label = document.createElement("span");
		label.style.position = "absolute";
		label.style.top = `${h * 0.55}px`;
		label.style.right = `-15px`;
		label.style.textAlign = `right`;
		label.style.backgroundColor = "black";
		label.style.color = "orange";
		label.style.fontFamily = "sans-serif";
		this.appendChild(label);
		this.maxInputHTML = label;



		this.outputCanvas = document.createElement("canvas");
		this.appendChild(this.outputCanvas);
		this.outputCanvas.width = w * 0.5;
		this.outputCanvas.height = h * 0.5;
		this.outputCanvas.style.position = `absolute`;

		this.outputCanvasCtx = this.outputCanvas.getContext("2d");
		this.outputCanvasCtx.lineWidth = 2;
		this.outputCanvasCtx.strokeStyle = "green";

		label = document.createElement("span");
		label.style.position = "absolute";
		label.style.top = `${h * 0.44}px`;
		label.style.right = `${w * 0.5}px`;
		label.style.textAlign = `right`;
		label.style.backgroundColor = "black";
		label.style.color = "green";
		label.style.fontFamily = "sans-serif";
		this.appendChild(label);
		this.minOutputHTML = label;
		
		label = document.createElement("span");
		label.style.position = "absolute";
		label.style.top = `0px`;
		label.style.right = `${w * 0.5}px`;
		label.style.textAlign = `right`;
		label.style.backgroundColor = "black";
		label.style.color = "green";
		label.style.fontFamily = "sans-serif";
		this.appendChild(label);
		this.maxOutputHTML = label;


		this.width = w;
		this.height = h;

		this.style.display = "block";
		this.style.width =  `${w}px`;
		this.style.height =  `${h}px`;

		this.inputSelector = this.getAttribute("target");

		this.draw = this.drawRealTimeData;


		// create selector
		this.selector = document.createElement("select");
		this.selector.style.position = `absolute`;
		this.selector.style.top = `${h * 0.65}px`;
		this.selector.addEventListener("change", e => {
			if(e.target.selectedIndex > 0){
				this.selectVariable(parseInt(e.target.selectedIndex-1));
			}
		});
		this.appendChild(this.selector);


	}


	init(waxml){
		this.waxml = waxml;

		if(this.variables.length == 1){
			this.selectVariable(0);
			this.selector.style.display = "none";
		} else {
			let option = document.createElement("option");
			option.innerHTML = "Select variable";
			option.setAttribute("selected", "true")
			this.selector.prepend(option);
		}
		this.update();
	}

	selectVariable(index){
		this.inspectedValues = [];
		delete(this.minInput);
		this.targetVariable = this.variables[index];
		this.drawMappingCurve(this.targetVariable);
	}

	addVariable(variable){
		this.variables.push(variable);

		let option = document.createElement("option");
		option.innerHTML = variable.name;

		this.selector.appendChild(option);
	}

	update(){
		requestAnimationFrame(e => this.update());
		if(!this.targetVariable){return}

		let curValuePair = this.targetVariable.valuePairs;
		this.inspectedValues.unshift(curValuePair);
		while(this.inspectedValues.length > this.nrOfValues){
			this.inspectedValues.pop();
		}
		this.moveDot(curValuePair);
		this.setMinAndMaxValues(curValuePair);
		this.draw();
	}

	moveDot(curValuePair){
		let x = (curValuePair.input - this.mappingValues.minX) / this.mappingValues.rangeX * this.mappingCanvas.width;
		let y = this.mappingCanvas.height - (curValuePair.output - this.mappingValues.minY) / this.mappingValues.rangeY * this.mappingCanvas.height;
		this.dot.style.top = `${y}px`;
		this.dot.style.left = `${x-this.dotSize/2}px`;
	}

	setMinAndMaxValues(curValuePair){
		if(typeof this.minInput == "undefined" || typeof curValuePair.input == "undefined"){
			this.minInput = curValuePair.input;
			this.maxInput = curValuePair.input;
			this.minOutput = curValuePair.output;
			this.maxOutput = curValuePair.output;
		} else {
			this.minInput = Math.min(this.minInput, curValuePair.input);
			this.maxInput = Math.max(this.maxInput, curValuePair.input);
			this.minOutput = Math.min(this.minOutput, curValuePair.output);
			this.maxOutput = Math.max(this.maxOutput, curValuePair.output);
		}
		this.inputRange = this.maxInput - this.minInput;
		this.outputRange = this.maxOutput - this.minOutput;

		this.minInputHTML.innerHTML = this.minInput.toPrecision(3);
		this.maxInputHTML.innerHTML = this.maxInput.toPrecision(3);
		this.minOutputHTML.innerHTML = this.minOutput.toPrecision(3);
		this.maxOutputHTML.innerHTML = this.maxOutput.toPrecision(3);
	}

	drawMappingCurve(targetVariable){
		this.mappingCanvasCtx.clearRect(0, 0, this.mappingCanvas.width, this.mappingCanvas.height);
		this.mappingCanvasCtx.beginPath();

		let points = targetVariable.getMappingPoints();
		let minX = points.reduce((point1, point2) => point2.x > point1.x ? point1 : point2).x;
		let maxX = points.reduce((point1, point2) => point2.x < point1.x ? point1 : point2).x;
		let minY = points.reduce((point1, point2) => point2.y > point1.y ? point1 : point2).y;
		let maxY = points.reduce((point1, point2) => point2.y < point1.y ? point1 : point2).y;
		let rangeX = maxX - minX;
		let rangeY = maxY - minY;

		this.mappingValues = {
			minX: minX,
			maxX: maxX,
			minY: minY,
			maxY: maxY,
			rangeX: rangeX,
			rangeY: rangeY
		}

		let w = this.mappingCanvas.width;
		let h = this.mappingCanvas.height;

		points.forEach((point, i) => {
			let x = (point.x-minX)/rangeX * w;
			let y = h - ((point.y-minY)/rangeY * h);
			if (!i) {
				this.mappingCanvasCtx.moveTo(x, y);
			} else {
				this.mappingCanvasCtx.lineTo(x, y);
			}
		});
		this.mappingCanvasCtx.lineTo(this.mappingCanvas.width, 0);
		this.mappingCanvasCtx.stroke();

	}

	drawRealTimeData() {

		if(!this.targetVariable){return}

		this.inputCanvasCtx.clearRect(0, 0, this.inputCanvas.width, this.inputCanvas.height);
		this.outputCanvasCtx.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);

		this.inputCanvasCtx.beginPath();
		this.outputCanvasCtx.beginPath();

		this.inspectedValues.forEach((valuePair, i) => {
			if(this.inputRange == 0 || this.outputRange == 0){return} // avoid dividing by zero
			let inputX = (valuePair.input - this.minInput) / this.inputRange * this.inputCanvas.width;
			let inputY = i / this.nrOfValues * this.outputCanvas.height;
			let outputX = (1 - i / this.nrOfValues) * this.outputCanvas.width;
			let outputY = (1 - (valuePair.output - this.minOutput) / this.outputRange) * this.outputCanvas.height;
			if (!i) {
				this.inputCanvasCtx.moveTo(inputX, inputY);
				this.outputCanvasCtx.moveTo(outputX, outputY);
			} else {
				this.inputCanvasCtx.lineTo(inputX, inputY);
				this.outputCanvasCtx.lineTo(outputX, outputY);
			}
		});

		this.inputCanvasCtx.stroke();
		this.outputCanvasCtx.stroke();
	}



}

module.exports = Inspector;

},{}],18:[function(require,module,exports){

var EventTracker = require('./EventTracker.js');
var VariableContainer = require('./VariableContainer.js');
var Watcher = require('./Watcher.js');
var WebAudioUtils = require('./WebAudioUtils.js');
var Variable = require("./Variable.js");
var KeyboardManager = require("./KeyboardManager.js");
var MidiManager = require("./MidiManager.js");


class InteractionManager {

	constructor(waxml){

		
		// Super interesting:
		// On MAC iOS, it doesn't work if I attach a stored function to the event
		// I Have to make the call directly. ?!?!
		// Unfortunately, this makes it tricky to remove the event listener
		// after it has been used.

		// let initCall = e => {
			// this.waxml.init();
			// window.removeEventListener("pointerdown", initCall);
		// }
		// window.addEventListener("pointerdown", initCall);

		window.addEventListener("pointerdown", () => this.waxml.init());

		this.eventTracker = new EventTracker(waxml);
		this.waxml = waxml;
		this.inited = false;
		this.variables = new VariableContainer();
		this.watchers = [];

		this._variablesToStore = [];

		// variables
		// create a way of keeping track of each touch
		// during a multi touch
		let touches = [];
		while(touches.length < (navigator.maxTouchPoints || 1)){
			touches.push({});
		}
		this._variables.touch = touches;
		this.touchIDs = [];
		this._variables.pointerdown = 0;

		this._variables.client = [];

		while(this._variables.client.length < 10){
			let c = {};
			c.touchIDs = [];

			c.touch = [];
			while(c.touch.length < 5){
				c.touch.push({});
			}

			c.acceleration = {};
			c.accelerationIncludingGravity = {};
			c.rotationRate = {};

			c.deviceOrientation = {};

			this._variables.client.push(c);
		}

		this.waxml.addEventListener("inited", e => {
			this.keyboardManager = new KeyboardManager(this.waxml);
			this.midiManager = new MidiManager(this.waxml);
			this.connectToHTMLelements();
		});

	}

	set variablesToStore(varNames){
		this._variablesToStore = varNames;
	}

	get variablesToStore(){
		return this._variablesToStore;
	}


	init(){
		this.inited = true;
		this.waxml.init();
	}

	initSensors(){

		if (window.DeviceMotionEvent) {


			if(typeof DeviceMotionEvent.requestPermission === 'function'){
				// iOS 13+
				DeviceMotionEvent.requestPermission()
				.then(response => {
					if (response == 'granted') {
						window.addEventListener('devicemotion', e => {this.setDeviceMotion(e)});
					}
				})
				.catch(console.error);
			} else {
				// non iOS 13+
				window.addEventListener('devicemotion', e => {this.setDeviceMotion(e)});
			}


		} else {

			console.log("this device does not support DeviceMotionEvent");
		}


		if (window.DeviceOrientationEvent) {

			if(typeof DeviceOrientationEvent.requestPermission === 'function'){
				DeviceOrientationEvent.requestPermission()
				.then(response => {
					if (response == 'granted') {
						window.addEventListener('deviceorientation', e => {this.setDeviceOrientation(e)});
					}
				})
				.catch(console.error);
			} else {
				// non iOS 13+
				window.addEventListener('deviceorientation', e => {this.setDeviceOrientation(e)});
			}
		} else {
			console.log("this device does not support DeviceOrientationEvent");
		}
	}


	connectToHTMLelements(){

		// init meter elements
		let documentMeters = document.querySelectorAll("waxml-meter");
		let GUImeters = this.waxml.GUI.HTML.querySelectorAll("waxml-meter");
		[...documentMeters, ...GUImeters].forEach( el => {
			let inputSelector = el.inputSelector || "master";
			if(inputSelector){
				el.init(this.waxml._ctx);
				this.waxml.querySelectorAll(inputSelector).forEach(obj => {
					el.inputFrom(obj.output);
				});
			}
		});

		// init inspector elements
		document.querySelectorAll("waxml-inspector").forEach( el => {
			let selectors;

			if(el.inputSelector){
				selectors = el.inputSelector.split(",").map(sel => sel.trim()).map(sel => {
					if(!sel.includes("[name=")){
						return `Audio > var[name='${sel}']`;
					} else {
						return sel;
					}
				});
			} else {
				selectors = ["Audio > var"];
			}

			selectors.forEach(sel => {
				this.waxml.querySelectorAll(sel).forEach(variable => {
					el.addVariable(variable);
				});
			});
			
			el.init(this.waxml);
		});

		document.querySelectorAll("waxml-midi-controller").forEach( el => {
			el.addEventListener("keydown", e => {
				this.midiManager.noteOn(e.detail.channel, e.detail.keyNum, e.detail.velocity);
			});
			el.addEventListener("keyup", e => {
				this.midiManager.noteOff(e.detail.channel, e.detail.keyNum, e.detail.velocity);
			});
			if(el.midiIn){
				this.midiManager.addEventListener("MIDI:NoteOn", e => el.indicateKey(e.detail.keyNum, true));
				this.midiManager.addEventListener("MIDI:NoteOff", e => el.indicateKey(e.detail.keyNum, false));
			}
		});
		


		// add waxml commands to HTML elements
		[...document.querySelectorAll("*")].forEach( el => {

			[...el.attributes].forEach( attr => {

				if(attr.localName.startsWith("data-waxml-")){
					let val = attr.nodeValue;
					let attrNameArr = attr.localName.split("-");
					let fn, commandName;
					let eventName = attrNameArr[2];

					if(eventName == "midi"){
						// remote control HTML elements with MIDI
						val.split(";").map(str => str.trim()).forEach(filter => {
							this.midiManager.addListener({
								element: el,
								task: attrNameArr[3],
								target: attrNameArr[4],
								filter: filter,
								min: parseFloat(el.getAttribute("min") ||0),
								max: parseFloat(el.getAttribute("max") || 100),
								step: parseFloat(el.getAttribute("step") || 1)
							});

						});
					} else {
	
						commandName = attrNameArr[3];
	
						switch(eventName){
	
							case "style":
								let CSSprop = val.split("=").shift().trim();
								val = val.split("=").pop().trim();
								let watcher = new Watcher(this.waxml._xml, val, {
									waxml: this.waxml,
									callBack: (val, time) => {
										el.style[CSSprop] = val;
									}
								});
	
								this.watchers.push(watcher);
							break;
	
	
							default:
	
								// Create empty link for <a> elements
								if(el.localName == "a"){
									var deadLink = "javascript:void(0)";
									if(!el.attributes.href){
										el.setAttribute("href", deadLink);
									} else if(el.attributes.href.nodeValue == "#"){
										el.attributes.href.nodeValue = deadLink;
									}
								}
								
								switch(commandName){
									case "start":
									case "play":
									case "trig":
										fn = e => {
											this.waxml.trig(val);

											// do we need this line?
											// would it be better to build proper and transparant
											// solutions for mapping events to variables
											// and vice versa.
											// this.waxml.setVariable(val, 1);
										}
										break;
			
									case "stop":
										fn = e => {
											this.waxml.stop(val);
	
											// trix för att sätta resp keydown variable rätt
											val = val.replace("keyup:", "keydown:");
											this.waxml.setVariable(val, 0);
										}
										break;
	
									case "continue":
										fn = e => {
											this.waxml.continue(val);
											this.waxml.setVariable(val, 1);
										}
										break;
	
	
									case "set":
										if(val.includes("=")){
											let values = [];
											// allow for multiple values
											let rules = val.split(";").forEach(expression => {
												let arr = expression.split("=").map(v => v.trim());
												let key = arr[0];
												let value = arr[1];
												if(key){
	
													if(value.includes("this.")){
														// allow for dynamic values from slider, switches etc.
														let targetProperty = value.replace("this", "el");
														value = {
															valueOf: () => {
																return eval(targetProperty);
															}
														}
													} 
													values.push({key: key, value: value});
												}
											});
											fn = e => {
												values.forEach(entry => {
													this.waxml.setVariable(entry.key, entry.value.valueOf());
												});
											}
											
										} 
	
										break;

									case "wait":
										val.split(";").forEach(binding => {
											let tag, cmd;
											[tag, cmd] = binding.split("->").map(str => str.trim());
											let fn = () => {
												eval(cmd);
												this.waxml.removeEventListener(tag, fn);
											}
											el.addEventListener(eventName, () => {
												this.waxml.addEventListener(tag, fn);
											});
											
										});
										break;	


									default:
										fn = e => {
											this.waxml.setVariable(commandName, val.valueOf());
										}
										break;
								}
								let frFn;
								if(eventName == "timeupdate" && el.requestVideoFrameCallback){
									// allow for frame synced updates
									frFn = (now, metaData) => {
										fn();
										el.requestVideoFrameCallback(frFn);
									}
									el.requestVideoFrameCallback(frFn);
								} else {
									el.addEventListener(eventName, fn);
								}
			
								if(eventName == "play" && el.autoplay && el.currentTime){
									// trig function manually if video has already begun playback
									(frFn || fn)();
								}
							break;
	
	
						}
	
	
						
					}

				}

			});

		});


		// add waxml commands HTML input and waxml-xy-handle elements
		// I earlier supported to HTML input elements with this syntax but it's now 
		// included in the generic listener using data-waxml-input syntax
		//let filter = "[data-waxml-target]:not([data-waxml-target=''])";
		[...document.querySelectorAll(`waxml-xy-handle[targets]`)].forEach( el => {
			
			
			el.addEventListener("input", e => {
				let values = e.target.value;
				values = values instanceof Array ? values : [values];
				el.targets.forEach((target, i) => {
					this.waxml.setVariable(target, values[i % values.length], 0.001);
				});
				
			});

			if(el.dataset.waxmlAutomation){
				let data = el.dataset.waxmlAutomation.split(",");
				let waveForm = data[0] ? data[0].trim() : "sine";
				let frequency = eval(data[1] ? data[1].trim() : 1);
				let min = parseFloat(el.getAttribute("min") || 0);
				let max = parseFloat(el.getAttribute("max") || 0);
				let range = max - min;
				let updateFrequency = 100;
				
				let x = 0;

				setInterval(() => {
					let factor;
					switch(waveForm){
						case "sine":
						factor = (Math.sin(Math.PI * x * frequency / updateFrequency)+1)/2;
						break;

						case "sawtooth":
						factor = (x * frequency / updateFrequency) % 1;
						break;

						case "square":
						factor = (x * frequency) % updateFrequency < updateFrequency / 2;
						break;
					}
					
					let val = min + factor * range;
					el.value = val;

					var event = new CustomEvent("input");
					el.dispatchEvent(event);

					x++;
				}, 1000 / updateFrequency);
			}
		});

	}

	get variables(){
		return this._variables;
	}

	registerEvents(target = document){

		// default value  does not seam to work if target is null
		if(!target){target = document}

		this.eventTracker.registerEventListener("touchstart", target, "touchstart",
			data => {

			}, event => {
				return event;

			}
		);

		this.eventTracker.registerEventListener("touchmove", target, "touchmove",
			data => {

			}, event => {
				return event;
			}
		);
		this.eventTracker.registerEventListener("touchend", target, "touchend",
			data => {

			}, event => {
				return event;
			}
		);
		this.eventTracker.registerEventListener("touchcancel", target, "touchcancel",
			data => {

			}, event => {
				return event;
			}
		);


		let pointerDownEvent = window.PointerEvent ? "pointerdown" : "mousedown";
		let pointerMoveEvent = window.PointerEvent ? "pointermove" : "mousemove";
		let pointerUpEvent = window.PointerEvent ? "pointerup" : "mouseup";

		this.eventTracker.registerEventListener("pointerdown", target, pointerDownEvent,
			(e => {return this.pointerDownExecute(e)}), (e => {return this.pointerDownProcess(e)})
		);
		this.eventTracker.registerEventListener("pointermove", target, pointerMoveEvent,
			(e => {return this.pointerMoveExecute(e)}), (e => {return this.pointerMoveProcess(e)})
		);
		this.eventTracker.registerEventListener("pointerup", target, pointerUpEvent,
			(e => {return this.pointerUpExecute(e)}), (e => {return this.pointerUpProcess(e)})
		);


	}

	setDeviceMotion(e){
		this.setVariable("deviceMotionAccelerationX", e.acceleration.x);
		this.setVariable("deviceMotionAccelerationY", e.acceleration.y);
		this.setVariable("deviceMotionAccelerationZ", e.acceleration.z);
		this.setVariable("deviceMotionRotationRateAlpha", e.rotationRate.alpha);
		this.setVariable("deviceMotionRotationRateBeta", e.rotationRate.beta);
		this.setVariable("deviceMotionRotationRateGamma", e.rotationRate.gamma);
	}

	setDeviceOrientation(e){
		this.setVariable("deviceOrientationAlpha", e.alpha);
		this.setVariable("deviceOrientationBeta", e.beta);
		this.setVariable("deviceOrientationGamma", e.gamma);
	}

	copyTouchProperties(source, target){

		target.identifier  = source.identifier;
		target.screenX = source.screenX;
		target.screenY = source.screenY;
		target.clientX = source.clientX;
		target.clientY = source.clientY;
		target.pageX = source.pageX;
		target.pageY = source.pageY;
		target.radiusX = source.radiusX;
		target.radiusY = source.radiusY;
		target.rotationAngle = source.rotationAngle;
		target.force = source.force;
		target.target = source.target;
	}

	setRelativePos(obj, event){
		if(event.target){
			let newX = (event.clientX-event.target.offsetLeft) / event.target.offsetWidth * 100;
			let newY = (event.clientY-event.target.offsetTop) / event.target.offsetHeight * 100;
			obj.relX = newX;
			obj.relY = newY;
		}
	}

	setMovePos(obj, x, y){
		if(typeof x === "undefined"){
			// reset
			obj.initX = obj.clientX;
			obj.initY = obj.clientY;
			obj.moveX = 0;
			obj.moveY = 0;
			obj.relMoveX = 0;
			obj.relMoveY = 0;
		} else {
			// update

			obj.initX = typeof obj.initX === "undefined" ? obj.clientX : obj.initX;
			obj.initY = typeof obj.initY === "undefined" ? obj.clientY : obj.initY;
			obj.moveX = x - obj.initX;
			obj.moveY = y - obj.initY;
			obj.relMoveX = obj.moveX / window.innerWidth * 100;
			obj.relMoveY = obj.moveY / window.innerHeight * 100;
		}
	}


	touchStart(){

		//e.preventDefault();
		Array.prototype.forEach.call(e.changedTouches, touch => {
			let identifier = this.touchIDs.find((el, id) => this._variables.touch[id].down != 1);
			let i;

			if(identifier){
				i = this.touchIDs.indexOf(identifier);
				this.touchIDs[i] = touch.identifier;
			} else {
				i = this.touchIDs.length;
				this.touchIDs.push(touch.identifier);
			}

			let touchObj = this._variables.touch[i];
			this.copyTouchProperties(touch, touchObj);
			this.setRelativePos(touchObj, touch);
			this.setMovePos(touchObj);
			touchObj.down = 1;

			this.waxml.start("*[trig='touch[" + i + "]']");
		});

	}

	touchMove(){

		//e.preventDefault();
		Array.prototype.forEach.call(e.changedTouches, touch => {
			let touchObj = this._variables.touch[touchIDs.indexOf(touch.identifier)];

			if(touchObj){
				this.copyTouchProperties(touch, touchObj);
				this.setRelativePos(touchObj, touch);
				this.setMovePos(touchObj, touch.clientX, touch.clientY);
			}
		});
	}

	touchEnd(e){

		//e.preventDefault();
		Array.prototype.forEach.call(e.changedTouches, touch => {
			let i = touchIDs.indexOf(touch.identifier);


			let touchObj = this._variables.touch[i];
			if(touchObj){
				touchObj.down = 0;
				touchObj.force = 0;
				setMovePos(touchObj);
				this.waxml.stop("*[trig='touch[" + i + "]']");

			}

			// reset touch list if last touch
			let stillDown = 0;
			this._variables.touch.forEach(touch => {
				stillDown = stillDown || touch.down;
			});
			if(!stillDown){
				while(touchIDs.length){
					touchIDs.pop();
				}
			}

		});
	}

	pointerDownProcess(e) {

		if(!this.inited){
			this.init();
		}

		// simulate touch behaviour if needed

		if(!navigator.maxTouchPoints){

			let touchObj = this._variables.touch[0];
			this.copyTouchProperties(e, touchObj);
			this.setRelativePos(touchObj, e);
			this.setMovePos(touchObj);

			this.waxml.start("*[trig='touch[0]']");
			this.waxml.start("*[trig='client[0].touch[0]']");
		}


		let data = {};
		data.clientX = e.clientX;
		data.clientY = e.clientY;
		data.target = e.target;
		this.setRelativePos(data, e);
		this.setMovePos(data);
		return data;
	}

	pointerDownExecute(e) {

		// simulate touch behaviour if needed
		if(!navigator.maxTouchPoints){

			let touchObj = this._variables.touch[0];
			this.copyTouchProperties(e, touchObj);
			this.setRelativePos(touchObj, e);
			this.setMovePos(touchObj);

			this.waxml.start("*[trig='touch[0]']");
			this.waxml.start("*[trig='client[0].touch[0]']");
		}

		this._variables.mouseX = e.clientX;
		this._variables.mouseY = e.clientY;

		this._variables.pointerX = e.clientX;
		this._variables.pointerY = e.clientY;

		this._variables.relX = e.relX;
		this._variables.relY = e.relY;

		this._variables.moveX = e.moveX;
		this._variables.moveY = e.moveY;
		this._variables.relMoveX = e.relMoveX;
		this._variables.relMoveY = e.relMoveY;

		this._variables.mousedown = 1;
		this._variables.pointerdown = 1;
		this._variables.touchdown = 1;
		this.waxml.start("*[trig='mousedown']");
		this.waxml.start("*[trig='pointerdown']");
		this.waxml.start("*[trig='mouse']");
		this.waxml.start("*[trig='pointer']");
	}

	pointerMoveProcess(e){
		let data = {};

		if(!e){
			console.error(e);
		} else {
			data.clientX = e.clientX;
			data.clientY = e.clientY;
			data.target = e.target;
			this.setRelativePos(data, e);
			this.setMovePos(data);
		}

		return data;
	}

	pointerMoveExecute(e){
		this._variables.mouseX = e.clientX;
		this._variables.mouseY = e.clientY;

		this._variables.pointerX = e.clientX;
		this._variables.pointerY = e.clientY;

		let oldX = this._variables.relX || e.relX;
		let oldY = this._variables.relY || e.relY;
		let diffX = e.relX - oldX;
		let diffY = e.relY - oldY;

		let dirX = diffX ? (diffX > 0 ? 1 : -1) : 0;
		let dirY = diffY ? (diffY > 0 ? 1 : -1) : 0;

		this._variables.dirX = dirX;
		this._variables.dirY = dirY;

		if(diffX && diffY){

			let dir = (Math.atan2(diffY,diffX) / Math.PI * 180 + 360 + 90) % 360;
			this._variables.dir = dir;
		}

		this._variables.relX = e.relX;
		this._variables.relY = e.relY;

		this._variables.moveX = e.moveX;
		this._variables.moveY = e.moveY;
		this._variables.relMoveX = e.relMoveX;
		this._variables.relMoveY = e.relMoveY;

		// simulate touch behaviour if needed
		if(!navigator.maxTouchPoints){

			let touchObj = this._variables.touch[0];
			this.copyTouchProperties(e, touchObj);
			this.setRelativePos(touchObj, e);
			this.setMovePos(touchObj);

			//this.setRelativePos(touchObj);
			//this.setMovePos(touchObj, e.clientX, e.clientY);

			touchObj = this._variables.client[0].touch[0];
			this.copyTouchProperties(e, touchObj);
			this.setRelativePos(touchObj, e);
			this.setMovePos(touchObj);
		}
	}


	pointerUpProcess(e){
			let data = {};
			data.clientX = e.clientX;
			data.clientY = e.clientY;
			data.target = e.target;
			this.setRelativePos(data, e);
			this.setMovePos(data);
			return data;
	}
	pointerUpExecute(e){
		this._variables.mousedown = 0;
		this._variables.pointerdown = 0;
		this._variables.touchdown = 0;

		this.waxml.stop("*[trig='mouseup']");
		this.waxml.stop("*[trig='pointerup']");

		this.waxml.stop("*[trig='mouse']");
		this.waxml.stop("*[trig='pointer']");

		// simulate touch behaviour if needed
		if(!navigator.maxTouchPoints){

			let touchObj = this._variables.touch[0];
			this.copyTouchProperties(e, touchObj);
			this.setRelativePos(touchObj, e);
			this.setMovePos(touchObj, e.clientX, e.clientY);

			this.waxml.stop("*[trig='touch[0]']");
			this.waxml.stop("*[trig='client[0].touch[0]']");
		}
	}


	copy(spec = "pointer"){
		let seq;

		switch (spec) {
			case "pointer":
				seq = this.eventTracker.lastGesture;
				break;
			case "touch":
				seq = this.eventTracker.lastTouchGesture;
				break;
			default:
				seq = this.eventTracker.events;
				break;
		}

		let JSONdata = JSON.stringify(seq._events);
		let str = "webAudioXML.addSequence('_storedGesture', " + JSONdata + ");";

	  const el = document.createElement('textarea');
	  el.value = str;
	  el.setAttribute('readonly', '');
	  el.style.position = 'absolute';
	  el.style.left = '-9999px';
	  document.body.appendChild(el);
	  el.select();
	  document.execCommand('copy');
	  document.body.removeChild(el);
	}

	playLastGesture(){
		let seq = this.eventTracker.addSequence("_lastGesture", this.eventTracker.lastGesture._events);
		seq.play();
	}

	get lastGesture(){
		return this.eventTracker.lastGesture;
	}

	addSequence(name="_storedGesture", events){
		this.eventTracker.addSequence(name, events);
	}

	clearSequence(name){
		this.eventTracker.clear(name);
	}

	getSequence(name = "_storedGesture"){
		return this.eventTracker.getSequence(name);
	}


	get variables(){
		return this._variables;
	}
	set variables(val){
		this._variables = this._variables || val;
	}

	setVariable(key, val, transistionTime, fromSequencer){
		// 2022-03-23
		// This is really bad design. There is a global layer of "invisible"
		// variable objects stored in this._variables and there are global
		// variable objects created by XML stored in this.waxml.master.variables
		// These really ought to be the same container, but for now, they aren't...
		
		let container;

		// remove initial dollar sign
		if(key.substr(0,1) == "$"){
			key = key.substr(1);
		}
		if(this.waxml.master && this.waxml.master.variables[key] instanceof Variable){
			container = this.waxml.master.variables;
		} else if(this._variables[key] instanceof Variable){
			container = this._variables;
		}
		let updated = false;
		if(container){
			updated = container[key].valueOf() != val;
			if(transistionTime){
				// override transitionTime if specified
				container[key].setValue(val, transistionTime);
			} else {
				container[key].value = val;
			}
			
		} else {
			updated = this._variables[key] != val;
			this._variables[key] = val;
		}

		// store in sequencer if specified
		if(!fromSequencer && updated && this.variablesToStore.includes(key)){
			this.eventTracker.store(key, val);
		}
		
	}
	getVariable(key, val){
		return this._variables[key];
	}

	play(name="_storedGesture"){
		if(!this.inited){
			this.init();
		}
		let seq = this.getSequence(name);
		if(seq){
			seq.play();
		} else {
			console.error("WebAudioXML error: No such sequence - " + name);
		}
	}

}






module.exports = InteractionManager;
},{"./EventTracker.js":10,"./KeyboardManager.js":19,"./MidiManager.js":24,"./Variable.js":32,"./VariableContainer.js":33,"./Watcher.js":37,"./WebAudioUtils.js":39}],19:[function(require,module,exports){


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

},{}],20:[function(require,module,exports){
const InteractionManager = require("./InteractionManager");

var audioBufferList = {};

	
class Loader {
	init(src){
		// console.log(src);
		return new Promise((resolve, reject) => {
			if(src){
				this.complete = false;
				this.href = src;
				Loader.addLoader(this);
				fetch(src)
				.then(response => resolve(response), err => {
					reject(err);
				});
				Loader.loadComplete(this);
	
			} else {
				console.error("XML load error: No source specified.");
				reject("XML load error: No source specified.");
			}
	
		});
	}
}




Loader.getPath = (url, localPath) => {
	
	let slash = "/";
	if(localPath){
		if(!localPath.endsWith(slash)){
			localPath += slash;
		}
	} else {
		localPath = "";
	}
	
	if(!url.includes(slash + slash)){
		// add local path (relative to linking document
		// to URL so relative links are relative to the current XML scope and 
		// not to the main HTML-file
		url = localPath + url; 
	}
	
	return url;
}


Loader.getFolder = path => {

	let slash = "/";
	let i = path.lastIndexOf(slash);
	return path.substring(0, i+1);
	
}


Loader.loadAudio = (src, ctx) => {
	return new Promise((resolve, reject) => {
		// Var ska uppdelningen i localPath och fileName ske?
		// Här verkar det som att loadAudio förväntar sig relativa 
		// URLs i förhållande till server root istället för XML den lokala
		// document root vilket borde gå fel.

		if(audioBufferList[src]){
			resolve(audioBufferList[src]);
		} else {
			new Loader().init(src)
			.then(response => response.arrayBuffer())
			.then(arrayBuffer => ctx.decodeAudioData(arrayBuffer,
				audioBuffer => {
					audioBufferList[src] = audioBuffer;
					resolve(audioBuffer);
				},
				e => {
					let errMess = "WebAudioXML error. File not found: " + src;
					console.error(errMess);
					reject(errMess);
				}
			));
		}
		
	});
}


Loader.loadXML = (url) => {

	return new Promise((resolve, reject) => {
		new Loader().init(url)
			.then(response => response.text())
			.then(xml => {
				let parser = new DOMParser();
				let xmlDoc = parser.parseFromString(xml,"text/xml");
				resolve(xmlDoc.firstElementChild);
			},
			e => {
					let errMess = "WebAudioXML error. File not found: " + src;
					console.error(errMess);
					reject(errMess);
				}
			);
	});
}


Loader.loadText = (url) => {

	return new Promise((resolve, reject) => {
		new Loader().init(url)
			.then(response => response.text())
			.then(txt => resolve(txt));
	});
}



Loader.loadComplete = loader => {
	if(loader){
		loader.complete = true;
	}
	Loader.checkLoadComplete();
}


Loader.checkLoadComplete = () => {
	let stillLoading = Loader.filesLoading.filter(file => file.complete == false);
		
	if(!stillLoading.length){
		document.body.classList.remove("waxml-loading");
		return true;
	}
}

Loader.addLoader = obj => {
	document.body.classList.add("waxml-loading");
	Loader.filesLoading.push(obj);
}

Loader.filesLoading = [];


module.exports = Loader;

},{"./InteractionManager":18}],21:[function(require,module,exports){

const noteNames = "c,c#,d,d#,e,f,f#,g,g#,a,a#,b".split(",");

class MIDIController extends HTMLElement {


	constructor(){
		super();

		document.addEventListener("keydown", e => this.keyCommandDown(e));
		document.addEventListener("keyup", e => this.keyCommandUp(e));
	}

	keyCommandDown(e){

		let el = this.elements.find(el => el.keyCommand == e.key);
		if(el){
			el.dispatchEvent(new CustomEvent("pointerdown"))
		}
	}
	keyCommandUp(e){
		let el = this.elements.find(el => el.keyCommand == e.key);
		if(el){
			el.dispatchEvent(new CustomEvent("pointerup"))
		}
	}

	connectedCallback(){
		
		let shadowElement = this.attachShadow({mode: 'open'});

		let hoverColor = this.getAttribute("hoverColor") || this.getAttribute("hovercolor") || "#ccc";
		let activeColor = this.getAttribute("activeColor") || this.getAttribute("activecolor") || "#66f";
		let selectedColor = this.getAttribute("selectedColor") || this.getAttribute("selectedcolor") || "red";
		let rootColor = this.getAttribute("rootColor") || this.getAttribute("rootcolor") || "#ccf";
		this.type = (this.getAttribute("type") || "keyboard").toLowerCase();
		this.rows = parseInt(this.getAttribute("rows") || 8);
		this.cols = parseInt(this.getAttribute("cols") || 8);
		this.scaleType = (this.getAttribute("scale") || "major").toLowerCase();
		this.midiIn = (this.getAttribute("midiIn") || this.getAttribute("midiin")) == "true";
		
		let keyCommands = this.getAttribute("keyCommands") || this.getAttribute("keycommands") || "";
		let delimiter = keyCommands.includes(",") ? "," : "";
		this.keyCommands = keyCommands.split(delimiter);
		
		let labels = this.getAttribute("labels") || "";
		delimiter = labels.includes(",") ? "," : "";
		this.labels = labels.split(delimiter);

		
		this.overlap = parseInt(this.getAttribute("overlap") || 0);

		

		this.padMargin = parseInt(this.getAttribute("padMargin") || this.getAttribute("padmargin") || 5)
		
		switch(this.scaleType){
			case "major":
			this.scale = [0,2,4,5,7,9,11,12];
			break;

			case "minor":
			this.scale = [0,2,3,5,7,8,10,12];
			break;
			
			case "chromatic":
			this.scale = [0,1,2,3,4,5,6,7,8,9,10,11,12];
			break;
			
			case "pentatonic":
			this.scale = [0,2,4,7,9,12];
			break;
			
			case "blues":
			this.scale = [0,3,5,6,7,10,12];
			break;

			default:
			// defined with numbers
			let scale;
			let useLetters = false;
			let delimiter = this.scaleType.includes(",") ? "," : "";
			scale = this.scaleType.split(delimiter).map(str => {			
				let keyNum = parseInt(str);
				if(isNaN(keyNum)){
					// map letters to numbers
					keyNum = Math.max(0,noteNames.indexOf(str));
					useLetters = true;
				}
				return keyNum;
			});
			if(useLetters){
				// add octave
				scale.push(12);
			}
			this.scale = scale.length ? scale : [0,2,4,5,7,9,11,12];
			break;
		}
		this.scaleMod = this.scale.pop();


		let style = document.createElement("style");
		style.innerHTML = `
			.controller {
				display: block;
				position: absolute;
			}

			.pad {
				display: flex;
				position: absolute;
				border: 1px solid black;
				border-radius: 5px;
				box-sizing: border-box;
				background-color: white;
				justify-content: center;
				align-items: center;
				font-size: 120%;
				user-select: none;
			}
			.pad.root {
				background-color: ${rootColor};
			}
			.key {
				display: flex;
				position: absolute;
				border: 1px solid black;
				user-select: none;
				font-size: 100%;
				justify-content: center;
				align-items: end;
			}
			.key.white {
				height: 100%;
				background-color: white;
				z-index: 0;
				color: black;
				padding-bottom: 0.2em;
			}
			.key.black {
				height: 100%;
				background-color: black;
				z-index: 1;
				color: white;
				font-size: 70%;
				padding-bottom: 0.3em;
				box-sizing: border-box;
			}
			.key:hover, .pad:hover {
				background-color: ${hoverColor};
			}
			.key.active, .pad.active  {
				background-color: ${activeColor};
			}
			.key.selected, .pad.selected {
				background-color: ${selectedColor};
			}
			.key.selected:hover, .pad.selected:hover {
				background-color: ${hoverColor};
			}
			.key.selected.active, .pad.selected.active {
				background-color: ${activeColor};
			}
		`;


		let w = parseFloat(this.getAttribute("width"));
		let h = parseFloat(this.getAttribute("height"));

		let channel = this.getAttribute("channel");
		this.channel = channel ? parseInt(channel) : 1;
		
		let velocity = this.getAttribute("velocity");
		this.velocity = velocity ? parseInt(velocity) : 127;


		let min = this.getAttribute("min");
		min = min ? nearestWhiteKey(parseInt(min), -1) : 36;
		let max = this.getAttribute("max");
		max = max ? nearestWhiteKey(parseInt(max), 1) : 84;
		this.min = min;
		this.max = max;

		this.width = w;
		this.height = h;

		this.minIndex = whiteKeyIndex(this.min);
		this.maxIndex = whiteKeyIndex(this.max);
		this.range = this.maxIndex - this.minIndex + 1;
		this.whiteKeyWidth = this.width / this.range;

		this.style.display = "block";
		this.style.width =  `${w}px`;
		this.style.height =  `${h}px`;
		//this.style.backgroundColor = "red";

		shadowElement.appendChild(style);

		let controllerElement =	this.generateController(min, max);
		shadowElement.appendChild(controllerElement);

		this.keys = [];

		this.addEventListener("down", e => {
			let keyNum = e.detail.key.value;
			this.keys[keyNum] = true;
			this.value = keyNum;

			let data = {channel: this.channel, keyNum: keyNum, velocity: this.velocity};
			this.dispatchEvent(new CustomEvent("keydown", {detail:data}));
			this.indicateKey(keyNum, true);
		});
		this.addEventListener("up", e => {
			let keyNum = e.detail.key.value;
			this.keys[keyNum] = false;
			this.value = keyNum;

			let data = {channel: this.channel, keyNum: keyNum, velocity: this.velocity};
			this.dispatchEvent(new CustomEvent("keyup", {detail:data}));
			this.indicateKey(keyNum, false);
		});
		this.addEventListener("pointerleave", e => {
			if(this.pointerDown){
				this.pointerDown = false;
				this.releaseAllKeys();
			}
		});
		this.addEventListener("pointerup", e => {
			if(this.pointerDown){
				this.pointerDown = false;
				this.releaseAllKeys();
			}
		});
		
	}

	indicateKey(keyNum, state = false){
		this.elements.forEach(el => {
			if(el.keyNum == keyNum){
				if(state){
					el.classList.add("active");
				} else {
					el.classList.remove("active");
				}
				
			}
		});
	}

	generateController(min, max){
		let el = document.createElement("div");
		el.classList.add("controller");
		this.elements = [];
		
		let child;
		switch(this.type){
			case "launchpad":
			for(let row = 0; row<this.rows; row++){
				for(let col = 0; col<this.cols; col++){
					child = this.generatePad(row,col);
					el.appendChild(child);
					this.elements.push(child);
				}
			}
			
			break;

			default:
			for(let keyNum = min; keyNum<=max; keyNum++){
				child = this.generateKey(keyNum);
				el.appendChild(child);
				this.elements.push(child);
			}
			break;

		}
			
		
		return el;
	}

	generatePad(row,col){
		let el = document.createElement("div");
		el.classList.add("pad");
		let rect = this.rowAndColToRect(row,col);
		setElementRect(el, rect);
		

		let index = row * this.cols + col - (row * this.overlap);
		let octave = Math.floor(index / this.scale.length);
		let relIndex = index % this.scale.length;
		let keyNum = this.min + octave * this.scaleMod + this.scale[relIndex];
		

		if(!relIndex){
			el.classList.add("root");
		}
		el.keyDown = false;
		el.keyNum = keyNum;
		el.value = keyNum;
		this.addLabel(el, index);
		this.addKeyCommand(el, index)

		this.addEventListeners(el);
		return el;
	}

	rowAndColToRect(row,col){
		let rect = {};
		rect.x = col / this.cols * (this.width + this.padMargin);
		rect.y = (1 - (row+1) / this.rows) * (this.height + this.padMargin);
		rect.width = (this.width - this.padMargin * (this.cols-1)) / this.cols;
		rect.height = (this.height - this.padMargin * (this.rows -1)) / this.rows;
		return rect;
	}

	generateKey(keyNum){

		let el = document.createElement("div");
		el.classList.add("key");
		el.classList.add(isBlackKey(keyNum) ? "black" : "white");

		let rect = this.keyNumToRect(keyNum);
		setElementRect(el, rect);

		el.keyDown = false;
		el.keyNum = keyNum;
		el.value = keyNum;

		let index = keyNum-this.min;
		this.addLabel(el, index);
		this.addKeyCommand(el, index)
		this.addEventListeners(el);
		return el;
	}

	addEventListeners(el){

		this.pointerDown = false;

		el.addEventListener("pointerenter", e => {
			if(this.pointerDown && !el.keyDown){
				el.keyDown = true;
				this.dispatchEvent(new CustomEvent("down", {detail:{key: el}}));
				this.releaseAllKeys([el]);	
			}
		});
		el.addEventListener("pointerdown", e => {
			e.preventDefault();
			this.pointerDown = true;
			el.keyDown = true;
			// el.classList.add("active");
			this.dispatchEvent(new CustomEvent("down", {detail:{key: el}}));
		});
		el.addEventListener("pointerup", e => {
			el.keyDown = false;
			this.pointerDown = false;
			// el.classList.remove("active");
			this.dispatchEvent(new CustomEvent("up", {detail:{key: el}}));
		});
	}



	

	releaseAllKeys(omit = []){
		this.elements.forEach(el => {
			if(el.keyDown && !omit.includes(el)){
				el.keyDown = false;
				el.classList.remove("active");
				this.dispatchEvent(new CustomEvent("up", {detail:{key: el}}));
			}
		});
	}
	
	
	keyNumToRect(keyNum){
		let rect = {};
		rect.x = this.whiteKeyNumToX(keyNum);
		rect.y = 0;

		if(isBlackKey(keyNum)){
			let blackKeyWidth = this.whiteKeyWidth * 0.7;
			let blackKeyHeight = this.height * 0.6;
			rect.x += this.whiteKeyWidth - blackKeyWidth / 2;
			rect.width = blackKeyWidth;
			rect.height = blackKeyHeight;
		} else {
			rect.width = this.whiteKeyWidth;
			rect.height = this.height;
		}
		return rect;
	}
	

	whiteKeyNumToX(keyNum){
		let keyIndex = whiteKeyIndex(keyNum);
		return (keyIndex - this.minIndex) / this.range * this.width;
	}
	addLabel(el, index){
		if(this.labels.length){
			el.innerHTML = this.labels[index % this.labels.length];
		}
	}

	addKeyCommand(el, index){
		if(index<this.keyCommands.length){
			el.keyCommand = this.keyCommands[index];
		}
	}

}

function isBlackKey(keyNum){
	return [1,3,6,8,10].includes(keyNum % 12);
}
function nearestWhiteKey(keyNum, dir = -1){
	return isBlackKey(keyNum) ? keyNum + dir : keyNum;
}

function whiteKeyIndex(keyNum){
	let wk = nearestWhiteKey(keyNum);
	let octave = Math.floor(wk / 12);
	let relKey = wk % 12;
	return [0,2,4,5,7,9,11].indexOf(relKey) + octave * 7;
}

function setElementRect(el, rect){
	el.style.left = `${rect.x}px`;
	el.style.top = `${rect.y}px`;
	el.style.width = `${rect.width}px`;
	el.style.height = `${rect.height}px`;
}





module.exports = MIDIController;

},{}],22:[function(require,module,exports){
var WebAudioUtils = require('./WebAudioUtils.js');
var Range = require('./Range.js');

var EaseIn  = power => t => Math.pow(t, power);
var EaseOut = power => t => 1 - Math.abs(Math.pow(t-1, power));
var EaseInOut = power => t => t<.5 ? EaseIn(power)(t*2)/2 : EaseOut(power)(t*2 - 1)/2+0.5;
var EaseInSin = t => 1 + Math.sin(Math.PI / 2 * t - Math.PI / 2);
var EaseOutSin = t => Math.sin(Math.PI / 2 * t);
var EaseInOutSin = t => (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2;
var EaseInElastic = t => (.04 - .04 / t) * Math.sin(25 * t) + 1;
var EaseOutElastic = t => .04 * t / (--t) * Math.sin(25 * t);
var EaseInOutElastic = t => (t -= .5) < 0 ? (.02 + .01 / t) * Math.sin(50 * t) : (.02 - .01 / t) * Math.sin(50 * t) + 1;



class Mapper{


	constructor(params){

		if(params.name){
			// this.printInfo(params);
		}

		this.params = params;
		this.sourceValues = [];


		let steps = params.steps;
		// wrap single step array in container if needed
		if(steps instanceof Array){
			if(!steps.find(el => el instanceof Array)){
				steps = [steps];
			}
		}
		this.steps = steps;

		this.curve = params.curve;
		this.value = params.value;
		this.conv = params.convert;

		// like a gain control for the variable
		// do I still need it?
		this.level = params.level;

		if(params.range){
			this.range = new Range(params.range);
		}

		if(params.mapin){

			// complex style

			// remove duplicates
			this.mapin = params.mapin.filter((a, index) => params.mapin.indexOf(a) === index);
			// sort
			this.mapin = this.mapin.sort((a,b) => a-b);
			// init mapout
			this.mapout = params.mapout || this.mapin;

		} else if(params.map){

			// simplified (old) style
			this.mapin = [params.map.minIn, params.map.maxIn];
			this.mapout = [params.map.minOut, params.map.maxOut];

			switch (typeof params.map.conv) {
				case "number":
				this.curve = this.curve || [params.map.conv];
				break;

				case "string":
				if(params.map.conv.includes("MIDI")){
					this.steps = this.steps || [[0,1]];
					this.conv = this.conv || ["MIDI->frequency"];
				} else {
					// conv is a math function
					if(params.map.conv.includes("x")){
						this.curve = this.curve || [params.map.conv];
					}
				}
				break;

			}

		}

		this.isNumeric = this.mapout ? this.mapout.valueOf().every(element => typeof element.valueOf() === 'number') : true;
	}

	printInfo(params){
		if(params.mapin && params.mapout){
			let mapin = `${Math.min(...params.mapin)}...${Math.max(...params.mapin)}`;
			let mapout = `${Math.min(...params.mapout)}...${Math.max(...params.mapout)}`;
			console.log(`${params.name} -> mapin: ${mapin}, mapout: ${mapout}`);
		}
	}

	getUnMappedValue(x){

	}

	getValue(x){

		let mapin;
		if(this.mapin){
			mapin = this.mapin.valueOf();
		}

		let mapout;
		if(this.mapout){
			mapout = this.mapout.valueOf();
		}
		
		
		// truncate x if needed
		if(typeof x == "undefined")return x;

		switch(typeof x){
			case "undefined":
			return x;
			break;

			case "string":
			if(mapin){
				let i = mapin.indexOf(x);
				if(i == -1){
					return 0;
				} else {
					x = mapout[i];
					x = this.convert(x, i);
					return x;
				}
			} else {
				return 0;
			}
			
			break;

			default:
			x = x.valueOf();
			x = mapin ? Math.max(x, Math.min(...mapin)) : x;
			x = mapin ? Math.min(x, Math.max(...mapin)) : x;
			return this.mapValue(x);
			break;

		}
		
	}


	mapValue(x){

		// This method supports a more flexible mapping than the "simple"
		// Given that the attributes "mapin" and "mapout" are specified
		// it will use those two (comma- or space separated) vectors to
		// map the incoming value (the variable this object is following)
		// to an "outgoing" value before it stored it in its property "value".

		// There are also posibilities to use different curves between different
		// mapping values to control how values in between the specifed ones
		// are interpolated.

		// The output can be rounded to specific steps using the "steps"
		// attribute. This is useful for mapping values to non-linear output
		// values, like a musical scale. Steps could be one or multiple arrays with values
		// If multiple values are used, then a JSON-formated hierarchical array should be
		// specified with the "steps" attribute. E.g.
		// steps="[[0,2,4,5,7,9,11,12], [0,2,3,5,7,8,10,12]]" for a major + minor scale

		// Finally a "convert" algorithm can be specified for
		// each region between the mapout values. It can be a javascript expression
		// using "x" as the processed value or a preset (like "midi->frequency")

		let i = 0, i1 = 0;
		if(this.mapin){
			i1 = this.inToMapInIndex(x);
			// i = this.inToMapOutIndex(x);
			x = this.in2Rel(x, i1);

			let obj = this.inToMapOutIndex(x, i1);
			i = obj.i;
			x = obj.x;

			x = this.applyCurve(x, i);
			x = this.rel2Out(x, i);
			x = this.offset(x, i);
		}

		x = this.convert(x, i);

		if(!isNaN(x)){
			return x;
		}
  	}

	inToMapInIndex(x){

		let e = this.mapin.filter(entry => entry <= x).pop();
		let i = this.mapin.indexOf(e);
		return i;
	}

	inToMapOutIndex(x, i){
		// let e = this.mapin.filter(entry => entry <= x).pop();
		// let i = this.mapin.indexOf(e);
		let mapin;
		if(this.mapin){
			mapin = this.mapin.valueOf();
		}

		let mapout;
		if(this.mapout){
			mapout = this.mapout.valueOf();
		}

		if(mapout.valueOf().length > mapin.valueOf().length && i+2 == mapin.length){
			// more out-values than in-values and this is the next to last in-value
		
			// pick an out-value from the range between next to last and last in value
			let outValues = mapout.filter((val, index) => index >= i);
			let len = outValues.length-1;
			let x2 = x * len; // / Math.max(...this.mapin);
			i += Math.floor(x2);
			x = x == 1 ? x : x2 % 1;
		} else if(mapout.length >= mapin.length && i+1 == mapin.length){
			// last mapin-value is mapped to last mapout-value
			i = mapout.length-1;
			x = 0;
		} else {
			// if(i+2 >= this.mapout.length){
			// match in to out values
			i = i % mapout.length;
		}
		return {i:i,x:x};
	}

	in2Rel(x, i){
		let mapin;
		if(this.mapin){
			mapin = this.mapin.valueOf();
		}

		let mapout;
		if(this.mapout){
			mapout = this.mapout.valueOf();
		}
		let in1 = mapin[i % this.mapin.length];
		let in2 = mapin[(i+1) % this.mapin.length];
		return (x-in1)/(in2-in1);
	}

	rel2Out(x, i){
		let mapin;
		if(this.mapin){
			mapin = this.mapin.valueOf();
		}

		let mapout;
		if(this.mapout){
			mapout = this.mapout.valueOf();
		}

		if(this.isNumeric){
			// interpolate between two in-values

			if(this.steps){
				let curSteps = this.steps[i % this.steps.length];
				if(curSteps instanceof Array){
					return this.applySteps(x, i, curSteps);
				}
			}

			let out1 = mapout[i % mapout.length];
			let out2 = mapout[(i+1) % mapout.length];

			// if(i+2 >= this.mapout.length){
			// 	// match in to out values
			// 	out2 = this.mapout[(i+1) % this.mapout.length];
			// } else {
			// 	// pick an out-value from the range between next to last and last in value
			// 	let outValues = this.mapout.filter((val, index) => index >= i);
			// 	let len = outValues.length-1;
			// 	x = x * len;
			// 	let o1 = Math.floor(x); 
			// 	let o2 = Math.min(o1+1, len);
			// 	out1 = outValues[o1];
			// 	out2 = outValues[o2];
			// 	x = x % 1;
			// }
			
			let range = out2 - out1;
			return x * range;

		} else {

			// pick a string value from mapout
			return mapout[i % mapout.length];
		}
	}


	applySteps(x, i, steps){
			//let cycle = Math.floor(noteOffs / obj.stepsCycle);
			//let noteInCycle = noteOffs % obj.stepsCycle;

			let mapin;
			if(this.mapin){
				mapin = this.mapin.valueOf();
			}
	
			let mapout;
			if(this.mapout){
				mapout = this.mapout.valueOf();
			}

		if(steps instanceof Array){
			let out1 = mapout[i % mapout.length];
			let out2 = mapout[(i+1) % mapout.length];
			let range = Math.abs(out2 - out1);

			// create a pattern for range
			let values = [];
			let c, n = 0, v = 0;
			let patternCnt = steps.length-1;
			let patternWidth = steps[patternCnt];
			while(v < range){
				c = Math.floor(n / patternCnt);
				v = c * patternWidth + steps[n % patternCnt].valueOf();
				values.push(v.valueOf());
				n++;
			}
			if(out2 >= out1){
				return values[Math.floor(x * values.length)];
			} else {
				// invert
				values.reverse();
				return values[Math.floor(x * values.length)] - range;
			}
		} else {
			return x;
		}
		return

	}

	offset(x, i){

		let mapin;
		if(this.mapin){
			mapin = this.mapin.valueOf();
		}

		let mapout;
		if(this.mapout){
			mapout = this.mapout.valueOf();
		}

		if(this.isNumeric){
			return x + mapout[i % mapout.length];
		} else {
			return x;
		}
	}


	convert(x, i){
		if(this.conv){
			let convert = this.conv[i % this.conv.length];
			switch (convert) {

				case "MIDI->frequency":
				return WebAudioUtils.MIDInoteToFrequency(x);
				break;

				case "db->power":
				case "dB->power":
				return WebAudioUtils.dbToPower(x);
				break;	


				default:
				if(typeof convert == "string" && convert.includes("x"));
				try {
					return eval(convert);
				} catch {
					return x;
				}
				break;


			}
		} else {
			return x;
		}
	}




	mapToBell(x, stdD = 1/4, mean = 0.5, skew = 0){
		//let v = 1;
		//x = Math.sqrt( -2.0 * Math.log( x ) ) * Math.cos( 2.0 * Math.PI * v );

	  //This is the real workhorse of this algorithm. It returns values along a bell curve from 0 - 1 - 0 with an input of 0 - 1.
		// I found the example here: https://codepen.io/zapplebee/pen/ByvmMo

		//https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve

		let max = this.bellFn(0, stdD, mean, skew);
		let min = this.bellFn(mean, stdD, mean, skew);
		x = this.bellFn(x, stdD, mean, skew);
		return (max - x) / (max-min);
	}

	bellFn(x, stdD, mean, skew){
		return  1 / (( 1/( stdD * Math.sqrt(2 * Math.PI) ) ) * Math.pow(Math.E , -1 * Math.pow(x - mean, 2) / (2 * Math.pow(stdD,2))));
	}

	applyCurve(x, i){
		if(this.curve){
			let curve = this.curve[i % this.curve.length];

			switch (curve) {

				case "step":
				case "steps":
				return 0;
				break;

				case "lin":
				case "linear":
				return x;
				break;

				case "easeInQuad":
				case "easeIn":
				return EaseIn(2)(x);
				break;

				case "easeOutQuad":
				case "easeOut":
				return EaseOut(2)(x);
				break;

				case "easeInOutQuad":
				case "easeInOut":
				return EaseInOut(2)(x);
				break;

				case "easeInCubic":
				return EaseIn(3)(x);
				break;

				case "easeOutCubic":
				return EaseOut(3)(x);
				break;

				case "easeInOutCubic":
				return EaseInOut(3)(x);
				break;

				case "easeInQuart":
				return EaseIn(4)(x);
				break;

				case "easeOutQuart":
				return EaseOut(4)(x);
				break;

				case "easeInOutQuart":
				return EaseInOut(4)(x);
				break;

				case "easeInQuint":
				return EaseIn(5)(x);
				break;

				case "easeOutQuint":
				return EaseOut(5)(x);
				break;

				case "easeInOutQuint":
				return EaseInOut(5)(x);
				break;

				case "easeInSin":
				case "easeInSine":
				return EaseInSin(x);
				break;

				case "easeOutSin":
				case "easeOutSine":
				return EaseOutSin(x);
				break;

				case "easeInOutSin":
				case "easeInOutSine":
				return EaseInOutSin(x);
				break;

				case "easeInElastic":
				return EaseInElastic(x);
				break;

				case "easeOutElastic":
				return EaseOutElastic(x);
				break;

				case "easeInOutElastic":
				return EaseInOutElastic(x);
				break;

				case "bell":
				return this.mapToBell(x);
				break;

				case "sine":
				return Math.sin(2 * x * Math.PI) / 2 + 0.5;
				break;

				case "half-sine":
				return Math.sin(x * Math.PI);
				break;

				default:
				if(typeof curve == "number"){
					return Math.pow(x, curve);
				} else {
					return x;
				}
				break;

			}
		} else {
			return x;
		}

	}

}

module.exports = Mapper;

},{"./Range.js":28,"./WebAudioUtils.js":39}],23:[function(require,module,exports){


class Meter extends HTMLElement {

	constructor(){
		super();
		this.sources = [];
	}

	connectedCallback(){
		this.type = this.getAttribute("type") ||"loudness";
		this.type = this.type.toLowerCase();

		let w = parseFloat(this.getAttribute("width"));
		let h = parseFloat(this.getAttribute("height"));

		this.inputSelector = this.getAttribute("input");

		switch(this.type){
			case "loudness":
			this.draw = this.drawLoudness;
			w = w ||200;
			h = h ||20;
			break;

			case "fft":
			this.draw = this.drawFFT;
			w = w ||200;
			h = h ||100;
			break;

			case "oscilloscope":
			this.draw = this.drawOscilloscope;
			w = w ||200;
			h = h ||100;
			break;

			default:
			this.draw = () => {};
			break;

		}
		this.canvas = document.createElement("canvas");
		this.appendChild(this.canvas);
		this.canvasCtx = this.canvas.getContext("2d");
		
		this.canvasCtx.lineWidth = 2;
		this.canvasCtx.strokeStyle = "rgb(0, 0, 0)";

		this.width = w;
		this.height = h;

		this.canvas.width = w;
		this.canvas.height = h;

		this.style.display = "block";
		this.style.width =  `${w}px`;
		this.style.height =  `${h}px`;
	}


	init(audioContext){
		this.inited = true;
		this.analyser = audioContext.createAnalyser();
		let fftSize = this.getAttribute("fftSize") || this.getAttribute("fftsize");
		let colors = this.getAttribute("colors") || "";
		this.colors = colors.split(",");
		
		switch(this.type){
			case "loudness":
			fftSize = fftSize || 2048;
			this.colors = this.colors.length ? this.colors : ["green", "yellow", "red"]

			this.input = new BiquadFilterNode(audioContext, {type: "highpass", frequency: 200});
			this.input.connect(this.analyser);
			let timeFrame = this.getAttribute("timeFrame") || this.getAttribute("timeframe") || "";
			switch(timeFrame){
					
				case "short":
				timeFrame = 2;
				break;

				case "true":
				timeFrame = 0;
				break;

				case "momentary":
				default:
				let timeScale = timeFrame.includes("ms") ? 0.001 : 1;
				timeFrame = parseFloat(timeFrame || 0.4) * timeScale;
				break;

			}
			this.timeFrame = timeFrame;
			this.peakArray = [];
			break;

			case "fft":
			fftSize = fftSize || 2048;
			this.input = this.analyser;
			this.colors = this.colors.length ? this.colors : ["green", "yellow", "red"]
			break;

			case "oscilloscope":
			fftSize = fftSize || 4096;
			this.input = this.analyser;
			this.colors = this.colors = this.colors.length ? this.colors :  ["#ccc", "yellow"];
			break;
		}
		if(fftSize){
			fftSize = parseInt(fftSize);
			let pow = Math.log2(fftSize)
			pow = Math.round(pow);
			this.analyser.fftSize = 2 ** pow;
		}
		this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

		let maxDecibels = this.getAttribute("maxDecibels") || this.getAttribute("maxdecibels");
		if(maxDecibels){this.analyser.maxDecibels = parseFloat(maxDecibels)}

		let minDecibels = this.getAttribute("minDecibels") || this.getAttribute("mindecibels");
		if(minDecibels){this.analyser.minDecibels = parseFloat(minDecibels)}
		this.relPeak = minDecibels;
		
		let halfSampleRate = audioContext.sampleRate / 2;
		let minFrequency = this.getAttribute("minFrequency") || this.getAttribute("minfrequency");
		minFrequency = minFrequency ? parseFloat(minFrequency) : 0;
		this.firstIndex = Math.floor(minFrequency / halfSampleRate * this.analyser.frequencyBinCount);

		let maxFrequency = this.getAttribute("maxFrequency") || this.getAttribute("maxfrequency");
		maxFrequency = maxFrequency ? parseFloat(maxFrequency) : halfSampleRate;
		this.lastIndex = Math.floor(maxFrequency / halfSampleRate * this.analyser.frequencyBinCount);

		
		let colorRegions = this.getAttribute("segments") || this.getAttribute("colorregions");
		if(colorRegions){
			this.colorRanges = JSON.parse(`[${colorRegions}]`);
			let sum = this.colorRanges.reduce((a,b) => a + b);
			this.colorRanges = this.colorRanges.map(el => el / sum).map((el, i, arr) => {
				if(i){
					return el + arr[i-1];
				} else {
					return el;
				}
			});
			this.colorRanges.unshift(0);
			this.colorRanges.pop();

		} else {
			this.colorRanges = [0,0.6,0.8];
		}
		this.colorBackwardsRanges = this.colorRanges.sort((a,b) => a > b)
		

		this.update();
	}

	inputFrom(source){
		if(!source){return -1;}
		if(!this.inited){
			this.init(source.context);
		}
		this.sources.push(source);
		source.connect(this.input);
	}

	connect(target){
		this.analyser.connect(target);
	}

	disconnect(source){
		if(source){
			source.disconnect(0);
			this.sources = this.sources.filter(src => src != source);
		} else {
			while(this.sources.length){
				let src = this.sources.pop();
				src.disconnect(0);
			}
		}
	}

	update(){
		this.canvasCtx.clearRect(0, 0, this.width, this.height);
		this.draw();
		requestAnimationFrame(e => this.update());
	}

	drawLoudness(){
		this.analyser.getByteTimeDomainData(this.dataArray);

		let curTime = this.analyser.context.currentTime;

		// remove old peaks
		let startTime = Math.max(curTime, curTime - this.timeFrame);
		this.peakArray = this.peakArray.filter(peak => peak.time > startTime);

		// add new peak
		let peakPower = 0;
		for (let i = 0; i < this.dataArray.length; i++) {
		  let power = ((this.dataArray[i]-128)/128) ** 2;
		  peakPower = Math.max(power, peakPower);
		}
		let peakDecibels = 10 * Math.log10(peakPower);
		peakDecibels = Math.max(peakDecibels, this.analyser.minDecibels);
		this.peakArray.push({amplitude: peakDecibels, time: curTime});

		// calculate average
		let avg = this.peakArray.reduce((a,b) => {
			return {amplitude: a.amplitude + b.amplitude};
		}).amplitude / this.peakArray.length;

		let range = this.analyser.maxDecibels - this.analyser.minDecibels;
		// let relPeak = 1 + peakDecibels / range;
		avg = Math.min(avg, this.analyser.maxDecibels);
		avg = Math.max(avg, this.analyser.minDecibels);
		avg -= this.analyser.minDecibels;
		let relPeak = avg / range;
		
		if(relPeak > this.relPeak){ //relPeak > this.relPeak){
			// quick raise to new peak
			this.relPeak = relPeak;
		} else {
			// slow fall-off to lower value
			let diff = relPeak - this.relPeak;
			this.relPeak += diff / 10;
		}

	
		this.colorRanges.forEach((range, i, arr) => {
			if(this.relPeak > range){
				let y = 0;
				let x1 = range * this.width;
				let x2 = Math.min(this.relPeak, arr[i+1] || 1) * this.width;
				let w = x2 - x1;
				this.canvasCtx.fillStyle = this.colors[i];
				this.canvasCtx.fillRect(x1, y, w, this.height);
			}
		});

		
		
	}

	

	drawFFT(){
		this.analyser.getByteFrequencyData(this.dataArray);

		const barWidth = (this.width / (this.lastIndex-this.firstIndex));
		let barHeight;
		this.canvasCtx.fillStyle = "red";
	  
		for (let i = this.firstIndex; i < this.lastIndex; i++) {
			let relVal = this.dataArray[i] / 255;
			barHeight = relVal * this.height;
		//   this.canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
			let colorIndex = this.colorRanges.reverse().findIndex(range => {
				return relVal > range;
			});

			let color = this.colors.reverse()[colorIndex];
			this.canvasCtx.fillStyle = color;
			this.canvasCtx.fillRect(i * barWidth, this.height - barHeight, barWidth, barHeight);
		}

	}

	drawOscilloscope() {
		this.analyser.getByteTimeDomainData(this.dataArray);
		let maxVal = 256;
		let sampleCnt = this.dataArray.length / 2;
		let sliceWidth = this.width / sampleCnt;

		
		let lastVal = this.dataArray[0];
		let increasing = false;
		let belowZero = false;
		let firstCycle = true;
		let offset = 0;

		// zero crossing line
		this.canvasCtx.beginPath();
		this.canvasCtx.strokeStyle = "#ccc";
		this.canvasCtx.lineWidth = 0.5;
		this.canvasCtx.setLineDash([5,2]);
		this.canvasCtx.moveTo(0, this.height / 2);
		this.canvasCtx.lineTo(this.width, this.height / 2);
		this.canvasCtx.stroke();



		this.canvasCtx.beginPath();
		this.canvasCtx.strokeStyle = "yellow";
		this.canvasCtx.lineWidth = 1;
		this.canvasCtx.setLineDash([]);


		// find lowest val
		let minVal = Math.min(...this.dataArray);
		let minIndex = this.dataArray.indexOf(minVal);

		for (let i = minIndex; i < (sampleCnt+offset); i++) {
			let curVal = this.dataArray[i];


			if(!offset){
				belowZero = curVal < maxVal / 2;
				if(!belowZero){
					// found zero crossing
					offset = i;
				} else {
					continue;
				}

				// increasing = curVal > lastVal;
				// if(increasing && firstCycle){
				// 	belowZero = curVal < maxVal / 2;
				// }
			}

			let x = (i - offset) * sliceWidth;
			let y = (curVal / maxVal) * this.height;

			if (!i) {
				this.canvasCtx.moveTo(x, y);
			} else {
				this.canvasCtx.lineTo(x, y);
			}
		}
		//canvasCtx.lineTo(canvas.width, canvas.height / 2);
		this.canvasCtx.stroke();
	}



}

module.exports = Meter;

},{}],24:[function(require,module,exports){
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
},{}],25:[function(require,module,exports){

var processorName = 'white-noise-processor';
var _noise;
var _delayNodes = [];


class Noise {

  constructor(ctx){
    return this.getOutput(ctx);
  }


  getOutput(ctx){

    let delayNode = new DelayNode(ctx, {
      maxDelayTime: 100,
      delayTime: _delayNodes.length
    });
    _delayNodes.push(delayNode);

    this.getNoise(ctx)
    .then(noise => {
      noise.connect(delayNode);
    });
    
    return delayNode;
  }

  getNoise(ctx){
    return new Promise((resolve, reject) => {
      if(_noise){
        resolve(_noise);
      } else {
        ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([`

        class WhiteNoiseProcessor extends AudioWorkletProcessor {
          process (inputs, outputs, parameters) {
            const output = outputs[0]
            output.forEach(channel => {
              for (let i = 0; i < channel.length; i++) {
                channel[i] = Math.random() * 2 - 1
              }
            })
            return true
          }
        }
        registerProcessor('${processorName}', WhiteNoiseProcessor);

      `], {type: "application/javascript"})))
        .then(e => {
          resolve(new AudioWorkletNode(ctx, processorName));
        });
        
      }
    });
  }
}

module.exports = Noise;


},{}],26:[function(require,module,exports){
var BufferSourceObject = require('./BufferSourceObject.js');
var ConvolverNodeObject = require('./ConvolverNodeObject.js');
var Watcher = require('./Watcher.js');


class ObjectBasedAudio {

	constructor(obj, params, waxml){
        params.panningModel = params.panningModel || "HRTF";
        this._params = params;
        this._ctx = obj._ctx;
		this._parentAudioObj = obj;

        this.input = new GainNode(this._ctx);


        // make sure all attributes have OK values
        // We have a problem here when attributes are set to 
        // follow a variable. The watcher object is not ready to return an evaluated value yet.

        let checkedParams = {}
        Object.entries(params).forEach(([key, value]) => {
            if(value instanceof Watcher && typeof value.valueOf() == "undefined"){
                value = 0;
            }
            checkedParams[key] = value;
        });

        this.pannerNode = new PannerNode(this._ctx, checkedParams);
        this.gainNode = new GainNode(this._ctx);
        this.send = new GainNode(this._ctx);
        this.output = new GainNode(this._ctx);
 
        this.input.connect(this.pannerNode);  
        this.pannerNode.connect(this.gainNode);  
        this.gainNode.connect(this.send)
        this.gainNode.connect(this.output);

        this.bufferSource = new BufferSourceObject(this, params);
        this.bufferSource.connect(this.pannerNode);

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
                let timescale = this.getParameter("timescale") || 1;
                val *= timescale;
                break;

            }
            return val;
        }
    }

    fadeIn(time){
        this.fade(1, time);
    }

    fadeOut(time){
        this.fade(0, time);
    }

    fade(val = 1, time = 0){
        this.output.gain.cancelScheduledValues(this._ctx.currentTime);
        this.output.gain.setTargetAtTime(val, this._ctx.currentTime, time);
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
        this.bufferSource.src = val;
    }

    get src(){
        return this._params.src;
    }

    set playbackRate(val){
        this._params.playbackRate = val;
        this.bufferSource.playbackRate = val;
    }

    get playbackRate(){
        return this.bufferSource.playbackRate;
    }

    
    


 
    get coneInnerAngle(){
        if(typeof this._params.coneInnerAngle == "undefined"){
            this._params.coneInnerAngle = this.pannerNode.coneInnerAngle;
        }
        return this.pannerNode.coneInnerAngle;
    }
    set coneInnerAngle(val){
        this._params.coneInnerAngle = val;
        this.pannerNode.coneInnerAngle = val;
        // this.pannerNode.coneInnerAngle.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    get coneOuterAngle(){
        if(typeof this._params.coneOuterAngle == "undefined"){
            this._params.coneOuterAngle = pannerNode.coneOuterAngle;
        }
        return pannerNode.coneOuterAngle;
    }
    set coneOuterAngle(val){
        this._params.coneOuterAngle = val;
        this.pannerNode.coneOuterAngle = val;
        // this.pannerNode.coneOuterAngle.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    get coneOuterGain(){
        if(typeof this._params.coneOuterGain == "undefined"){
            this._params.coneOuterGain = this.pannerNode.coneOuterGain;
        }
        return this.pannerNode.coneOuterGain;
    }
    set coneOuterGain(val){
        this._params.coneOuterGain = val;
        // this.pannerNode.coneOuterGain.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    get distanceModel(){
        // string
        if(typeof this._params.distanceModel == "undefined"){
            this._params.distanceModel = this.pannerNode.distanceModel;
        }
        return this.pannerNode.distanceModel;
    }
    set distanceModel(val){
        this._params.distanceModel = val;
        this.pannerNode.distanceModel = val;
    }

    get maxDistance(){
        if(typeof this._params.maxDistance == "undefined"){
            this._params.maxDistance = this.pannerNode.maxDistance;
        }
        return this.pannerNode.maxDistance;
    }
    set maxDistance(val){
        this._params.maxDistance = val;
        this.pannerNode.maxDistance = val;
        // this.pannerNode.maxDistance.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    get orientationX(){
        if(typeof this._params.orientationX == "undefined"){
            this._params.orientationX = this.pannerNode.orientationX;
        }
        return this.pannerNode.orientationX;
    }
    set orientationX(val){
        this._params.orientationX = val;
        this.pannerNode.orientationX.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    get orientationY(){
        if(typeof this._params.orientationY == "undefined"){
            this._params.orientationY = this.pannerNode.orientationY;
        }
        return this.pannerNode.orientationY;
    }
    set orientationY(val){
        this._params.orientationY = val;
        this.pannerNode.orientationY.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }


    get orientationZ(){
        if(typeof this._params.orientationZ == "undefined"){
            this._params.orientationZ = this.pannerNode.orientationZ;
        }
        return this.pannerNode.orientationZ;
    }
    set orientationZ(val){
        this._params.orientationZ = val;
        this.pannerNode.orientationZ.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    set rotationY(deg){
        let [x,y,z] = this.yRotationToVector(deg);
        this.pannerNode.orientationX.setTargetAtTime(x, this._ctx.currentTime, this.getParameter("transitionTime"));
        this.pannerNode.orientationY.setTargetAtTime(y, this._ctx.currentTime, this.getParameter("transitionTime"));
        this.pannerNode.orientationZ.setTargetAtTime(z, this._ctx.currentTime, this.getParameter("transitionTime"));
    }


    get panningModel(){
        // string
        if(typeof this._params.panningModel == "undefined"){
            this._params.panningModel = this.pannerNode.panningModel;
        }
        return this.pannerNode.panningModel;
    }
    set panningModel(val){
        this._params.panningModel = val;
        this.pannerNode.panningModel = val;
    }

    get positionX(){
        if(typeof this._params.positionX == "undefined"){
            this._params.positionX = this.pannerNode.positionX;
        }
        return this.pannerNode.positionX.value;
    }
    set positionX(val){
        this._params.positionX = val;
        this.pannerNode.positionX.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    get positionY(){
        if(typeof this._params.positionY == "undefined"){
            this._params.positionY = this.pannerNode.positionY;
        }
        return this.pannerNode.positionY.value;
    }
    set positionY(val){
        this._params.positionY = val;
        this.pannerNode.positionY.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    get positionZ(){
        if(typeof this._params.positionZ == "undefined"){
            this._params.positionZ = this.pannerNode.positionZ;
        }
        return this.pannerNode.positionZ.value;
    }
    set positionZ(val){
        this._params.positionZ = val;
        this.pannerNode.positionZ.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    get refDistance(){
        if(typeof this._params.refDistance == "undefined"){
            this._params.refDistance = this.pannerNode.refDistance;
        }
        return this.pannerNode.refDistance;
    }
    set refDistance(val){
        this._params.refDistance = val;
        this.pannerNode.refDistance = val;
        // this.pannerNode.refDistance.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    get rolloffFactor(){
        if(typeof this._params.rolloffFactor == "undefined"){
            this._params.rolloffFactor = this.pannerNode.rolloffFactor;
        }
        return this.pannerNode.rolloffFactor;
    }
    set rolloffFactor(val){
        this._params.rolloffFactor = val;
        this.pannerNode.rolloffFactor = val;
    }

    set convolutionGain(val){
        this.send.gain.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    set gain(val){
        this._params.gain = val;
        this.output.gain.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }
  
    get gain(){
        // return this.output.gain.value;
        return this.gainNode.gain;
    }
     
    connect(destination){
        this.output.connect(destination);
        return destination;
    }
	
    start(){
        if(this.stopTimeout){
            clearTimeout(this.stopTimeout);
        }

        let transitionTime = this.getParameter("transitionTime");
        this.fadeIn(transitionTime/3);

        if(this.bufferSource._buffer){
            this.bufferSource.start();
        } else {
            let fn = () => this.start();
            this.bufferSource.addCallBack(fn);
        }
    }

    resume(){
        let transitionTime = this.getParameter("transitionTime");
        this.fadeIn(transitionTime/3);
		if(this.bufferSource._buffer){
            this.bufferSource.resume();
        } else {
            let fn = () => this.bufferSource.resume();
            this.bufferSource.addCallBack(fn);
        }
	}

    get playing(){
        return this.bufferSource ? this.bufferSource.playing : false;
    }

    set playing(state){
        if(this.bufferSource){
            this.bufferSource.playing = state;
        }
       
    }


	continue(){
		this.resume();
	}

    stop(){

        // fadeout first
        let transitionTime = this.getParameter("transitionTime");
        this.fadeOut(transitionTime/5);
        this.playing = false;

        if(this.bufferSource){
            this.bufferSource.stop({dontDisconnect: true})
            // avoid cutting audio before fade is done
            this.stopTimeout = setTimeout(e => {
                this.bufferSource.disconnect();
            }, transitionTime * 1000 * 1.5);
        }
        
    }


    // this utility converts amount of rotation around the Y axis
    // (i.e. rotation in the 'horizontal plane') to an orientation vector
    yRotationToVector(degrees) {
        // convert degrees to radians and offset the angle so 0 points towards the listener
        const radians = (degrees - 90) * (Math.PI / 180);
        // using cosine and sine here ensures the output values are always normalized
        // i.e. they range between -1 and 1
        const x = Math.cos(radians);
        const z = Math.sin(radians);

        // we hard-code the Y component to 0, as Y is the axis of rotation
        return [x, 0, z];
    }



    get offset(){
        return this.bufferSource ? this.bufferSource.offset :  0;
    }

    set offset(val){
        if(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this.bufferSource), 'offset')){
            this.bufferSource.offset = val;
        }
    }

    get relOffset(){
        return this.bufferSource ? this.bufferSource.relOffset : 0;
    }

    set relOffset(val){
        if(this.bufferSource){
            if(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this.bufferSource), 'relOffset')){
                this.bufferSource.relOffset = val;
            }
        }
    }
}

module.exports = ObjectBasedAudio;

},{"./BufferSourceObject.js":4,"./ConvolverNodeObject.js":7,"./Watcher.js":37}],27:[function(require,module,exports){

var WebAudioUtils = require('./WebAudioUtils.js');
var Loader = require('./Loader.js');
var AudioObject = require('./AudioObject.js');
var Variable = require('./Variable.js');
var Envelope = require('./Envelope.js');
var Command = require('./Command.js');
var Watcher = require('./Watcher.js');
var Synth = require('./Synth.js');
const SnapshotComponent = require('./variable-matrix/SnapshotComponent.js');

const Select = require('./Select.js');
const Sequence = require('./musical-structure/Sequence.js');
const Wave = require('./musical-structure/Wave.js');
const Slice = require('./musical-structure/Slice.js');



class Parser {

	constructor(waxml){

		this.elementCount = {};
		this.followCount = {};
		this.allElements = {};

		this.waxml = waxml;
		this._ctx = this.waxml._ctx;

		// Loader.callBack = () => {
		// 	// snyggare att lyfta ut till en egen class 
		// 	if(this.allElements.mediastreamaudiosourcenode){
		// 		navigator.getUserMedia({audio: true}, stream => this.onStream(stream), error => this.onStreamError(error));
		// 	}
		// 	//callBack(this._xml);
		// }
		
	}

	init(source){
		return new Promise((resolve, reject) => {
			this.loadXML(source)
			.then(xmlNode => {
				console.log(`Parser.init done - ${xmlNode.localName}`);
				return resolve(this.parseXML(xmlNode));
			});
		});

	}

	initFromString(str){
		return new Promise((resolve, reject) => {
			this.XMLstring = str;
			let parser = new DOMParser();
			let xml = parser.parseFromString(str,"text/xml");
			this._xml = xml.firstElementChild;
			if(this._xml.firstElementChild.tagName == "parsererror"){
				alert(this._xml.firstElementChild.textContent);
				reject(this._xml);
			} else {
				this.parseXML(this._xml);
				resolve(this._xml);
			}
			
		});
	}


	loadXML(source){

		return new Promise((resolve, reject) => {
		

			if(source){
				if(document.querySelector("xml")){
					if((source.includes(".") || source.includes("#") || source == "xml") && !(source.includes("/"))){
						// if check if XML is embedded in HTML
						this._xml = document.querySelector(source);
					}
				}
				


				if(this._xml){
					// embedded <XML> element inside HTML or already initialized
					this.parseXML(this._xml.firstElementChild);
					if(this._xml.style){
						this._xml.style.display = "none";
					}
					//Loader.checkLoadComplete();
				} else {
					// external file(s)
					// let localPath = Loader.getFolder(source) || location.href.substr(0,location.href.lastIndexOf("/")+1);
					
					let path = source.split("/");
					source = path.pop();
					let localPath = path.join("/");
					localPath = localPath ? `${localPath}/` : "";
					
					this._xml = document.implementation.createDocument(null, null);
					this.linkExternalXMLFile(this._xml, source, localPath)
					.then((xmlNode) => {
						// return root <Audio> element
						return resolve(this._xml.firstElementChild);
					});
				}
			} else {
				console.error("No WebAudioXML source specified");
			}

		});

	}

	
	linkExternalXMLFile(parentXML, src, localPath){
		// console.log("linkExternalXMLFile", parentXML.localName, src, localPath);

		return new Promise((resolve, reject) => {

			let url = localPath + src;
			localPath = Loader.getFolder(url);
			Loader.loadXML(url)
			.then((externalXML) => {
				
				externalXML.setAttribute("localpath", localPath);
				return resolve(this.appendXMLnode(parentXML, externalXML, localPath));
			});
			
		});

	}


	linkExternalAttributes(parentNode, curNode, localPath){

		return new Promise((resolve, reject) => {


			let linkedAttributes = [];
			switch(curNode.localName.toLowerCase()){
				case "audioworkletnode":
				// let the AudioObject handle linking
				break;

				default:
				linkedAttributes = [...curNode.attributes]
				.filter(attr => attr.value.includes(".txt") 
					|| attr.value.includes(".csv")
					|| attr.value.includes(".js"));

				
				break;
			}
			let cnt = linkedAttributes.length;
			if(cnt){
				linkedAttributes.forEach(attr => {
					let fileName, args;
					let fnCallIncluded =  attr.value.substr(-1) == ")";
					if(fnCallIncluded){	
						let matches = [...attr.value.matchAll(/\(([^\)]+)\)/g)];
						fileName = matches[0][1];
						args = matches[1][1];
						let argsValue = eval(args);
						if(typeof argsValue != "undefined"){
							args = argsValue;
						}
					} else {
						fileName = attr.value;
					}
					Loader.loadText(localPath + fileName)
					.then(txt => {
						if(attr.value.includes(".js")){
							if(fnCallIncluded){
								// execution of external function is included in the 
								// attribute (including (optional) arguments)
								attr.value = eval(txt)(args);
							} else {
								let fn = eval(txt);
								attr.value = fn instanceof Function ? fn() : "";
							}
						} else {
							attr.value = txt;
						}
						
						if(!--cnt){
							// count down to see if all linked attributes are 
							// loaded
							return resolve(curNode);
						}
						
					});
				});
			} else {
				return resolve(curNode);
			}

		});
	}



	appendXMLnode(parentNode, curNode, localPath){

		parentNode = parentNode.appendChild(curNode);

		return new Promise((resolve, reject) => {



			// FIRST LINK ATTRIBUTES (if external)
			this.linkExternalAttributes(parentNode, curNode, localPath)
			
			.then(xmlNode => {
			
				// THEN LINK THE WHOLE NODE (if external)

				if(curNode.localName == "include"){
					let href = curNode.getAttribute("href");
					this.linkExternalXMLFile(curNode, href, localPath)
					.then(xmlNode => {
						return resolve(xmlNode);
					});
				} else if(curNode.children.length){

					// APPEND CHILDREN (if any)
					let cnt = curNode.children.length;
					Array.from(curNode.children).forEach(childNode => {

						if(childNode.nodeName.toLowerCase() != "parsererror"){
							this.appendXMLnode(parentNode, childNode, localPath)
							.then(xmlNode => {
								// countdown to see if all children are linked before 
								// resolving promise
								if(!--cnt){return resolve(xmlNode);}
							});
						}
					});
				} else {

					// IF NO CHILDREN -> resolve
					return resolve(xmlNode);
				}

			});

		});
	}



	appendXMLnode_Backup(parentNode, curNode, localPath){

		parentNode = parentNode.appendChild(curNode);

		return new Promise((resolve, reject) => {
			
			let cnt = curNode.children.length;

			if(curNode.localName == "include"){
				let href = curNode.getAttribute("href");
				this.linkExternalXMLFile(curNode, href, localPath)
				.then(xmlNode => {
					return resolve(xmlNode);
				});
			} else if(curNode.children.length){

				
				Array.from(curNode.children).forEach(childNode => {

					if(childNode.nodeName.toLowerCase() != "parsererror"){
						this.appendXMLnode(parentNode, childNode, localPath)
						.then(xmlNode => {
							// countdown to see if all children are linked before 
							// resolving promise
							if(!--cnt){return resolve(xmlNode);}
						});
					}
				});
			} else {
				// link external attribute files if needed
				let linkedAttributes = [];
				switch(curNode.localName.toLowerCase()){
					case "audioworkletnode":
					// let the AudioObject handle linking
					break;

					default:
					linkedAttributes = [...curNode.attributes]
					.filter(attr => attr.value.includes(".txt") 
						|| attr.value.includes(".csv")
						|| attr.value.includes(".js"));
	
					
					break;
				}
				cnt = linkedAttributes.length;
				if(cnt){
					linkedAttributes.forEach(attr => {
						let fileName, args;
						let fnCallIncluded =  attr.value.substr(-1) == ")";
						if(fnCallIncluded){	
							let matches = [...attr.value.matchAll(/\(([^\)]+)\)/g)];
							fileName = matches[0][1];
							args = matches[1][1];
							let argsValue = eval(args);
							if(typeof argsValue != "undefined"){
								args = argsValue;
							}
						} else {
							fileName = attr.value;
						}
						Loader.loadText(localPath + fileName)
						.then(txt => {
							if(attr.value.includes(".js")){
								if(fnCallIncluded){
									// execution of external function is included in the 
									// attribute (including (optional) arguments)
									attr.value = eval(txt)(args);
								} else {
									let fn = eval(txt);
									attr.value = fn instanceof Function ? fn() : "";
								}
							} else {
								attr.value = txt;
							}
							
							if(!--cnt){
								// count down to see if all linked attributes are 
								// loaded
								return resolve(curNode);
							}
							
						});
					});
				} else {
					return resolve(curNode);
				}
				
			}

		});
		// console.log(`curNode: ${curNode.localName}, waitForExternalFile = ${waitForExternalFile}`);
	}












	parseXML(xmlNode, localPath){

		// OBS!! Jag tror att localPath kan OCH BÖR tas bort ur parseXML(). Det är ett arv från tiden
		// innan all länkning av externa filer gjordes först, men det kräver en noggrann kontroll
		// av anropen nedan som f.n. använder localPath. Det bästa vore nog att spara localPath som 
		// ett attribute på varje XML-node eller audio object så att parsern hittar rätt ljudfil.

		// Run through the entire XML structure, build AudioObjects for all elements and
		// connect them with the XML nodes. This is inventive but maybe not the best 
		// way to do it. It would be better to leave the XML object when storing the structure
		// internally.

		// console.log("parserXML", xmlNode, localPath);
		// let href = xmlNode.getAttribute("href");
		let nodeName = xmlNode.nodeName.toLowerCase();

		this.elementCount[nodeName] = this.elementCount[nodeName] ? this.elementCount[nodeName] + 1 : 1;
		this.allElements[nodeName] = this.allElements[nodeName] || [];
		this.allElements[nodeName].push(xmlNode);
	

		// if this node is internal
		let parentNode = xmlNode.parentNode;
		let params = WebAudioUtils.attributesToObject(xmlNode.attributes);

		// check if any parameter needs to be replaced with a Variable object

		let variableObj;

		Object.keys(params).forEach(key => {
			let param = params[key];
			if(typeof param == "string"){
				if(WebAudioUtils.nrOfVariableNames(param)){
					//variableObj = new Variable(xmlNode, {waxml: this.waxml});
					
					params[key] = new Watcher(xmlNode, param, {
						waxml: this.waxml,
						callBack: (val, time) => {
							if(xmlNode.obj){
								switch(xmlNode.obj._nodeType){

									case "envelope":
									// envelopes shall not be updated directly
									// from watcher, but get their values upon
									// triggering
									break;

									default:
									// Det är dumt att den här kopplingen 
									// är skriven i parsern
									// Det borde ligga i object-klassen

									// Sort out the differences between setting an audio parameter directly
									// or silently referring to a javascript value stored in the Watcher
									// The current system (per 2024-04-17) is really a mixture of various 
									// tryouts.
									if(typeof time == "undefined"){
										time = xmlNode.obj.getParameter("transitionTime");
									}
									switch(key){
										case "mix":
										case "selectindex":
										xmlNode.obj[key] = val;
										break;

										default:
										// double check that the target can be set using setTargetAtTime()
										if(xmlNode.obj.setTargetAtTime){
											xmlNode.obj.setTargetAtTime(key, val, 0, time);
										}
										break;
									}
									
									break;
								}
								
								//xmlNode.obj[key] = val;
							}
						}
					});
					//params[key] = variableObj;
				}
			} else if(param instanceof Array){
				// clumpsy structure to support multi-dimensional arrays, I know...
				param.forEach((value, i) => {
					if(typeof value == "string"){
						if(WebAudioUtils.nrOfVariableNames(value)){
							//variableObj = new Variable(xmlNode, {waxml: this.waxml});
							params[key][i] = new Watcher(xmlNode, value, {
								waxml: this.waxml,
								callBack: (val, time) => {
									if(xmlNode.obj){
										xmlNode.obj.setTargetAtTime(key, val, 0, time);
										//xmlNode.obj[key] = val;
									}
								}
							});
							//params[key][i] = variableObj;
						}
					} else if(value instanceof Array){
						value.forEach((item, j) => {
							if(typeof item == "string"){
								if(WebAudioUtils.nrOfVariableNames(item)){
									//variableObj = new Variable(xmlNode, {waxml: this.waxml});
									params[key][i][j] = new Watcher(xmlNode, item, {
										waxml: this.waxml,
										callBack: (val, time) => {
											if(xmlNode.obj){
												xmlNode.obj.setTargetAtTime(key, val, 0, time);
												//xmlNode.obj[key] = val;
											}
										}
									});
									//params[key][i][j] = variableObj;
								}
							}
						});
					}
				});
			}
		});


		params.waxml = this.waxml;

		switch(nodeName){

			case "parsererror":
			break;

			case "link":
			// import style if specified
			href = Loader.getPath(href, localPath);
			let linkElement = document.createElement("link");
			linkElement.setAttribute("href", href);
			linkElement.setAttribute("rel", "stylesheet");
			document.head.appendChild(linkElement);
			break;

			case "style":
			// import style if specified
			document.head.appendChild(xmlNode);
			break;

			case "synth":
			let synth = new Synth(xmlNode, this.waxml, localPath, params);
			xmlNode.audioObject = synth;
			xmlNode.obj = xmlNode.audioObject;
			xmlNode.querySelectorAll("voice, Voice").forEach(node => this.parseXML(node, localPath));
			break;

			case "var":
			variableObj = new Variable(xmlNode, params);
			if(params.follow){

				this.watcher = new Watcher(xmlNode, params.follow, {
					waxml: this.waxml,
					callBack: (val, time) => {
						variableObj.setValue(val, time);
					}
				});
			} else if (WebAudioUtils.nrOfVariableNames(params.value)) {
				this.watcher = new Watcher(xmlNode, params.value, {
					waxml: this.waxml,
					variableObj: variableObj,
					containsVariableNames: true,
					callBack: (val, time) => {
						variableObj.setValue(val, time);
					}
				});
			}
			xmlNode.obj = variableObj;
			let target;
			// if(parentNode.nodeName.toLowerCase() == "audio"){
			// 	// top level - should be properly merged with this.waxml
			// 	target = this.waxml;
			// } else {
			// 	target = parentNode.obj;
			// }
			target = parentNode.obj;
			target.setVariable(params.name, variableObj);
			break;

			case "snapshot":
			xmlNode.obj = new SnapshotComponent(xmlNode);
			this.waxml.addSnapshot(xmlNode.obj);
			break;

			case "envelope":
			xmlNode.obj = new Envelope(xmlNode, this.waxml, params);
			break;

			case "select":
			xmlNode.obj = new Select(xmlNode, this.waxml, params);
			Array.from(xmlNode.children).forEach(node => this.parseXML(node, localPath));
			break;

			case "sequence":
			xmlNode.obj = new Sequence(xmlNode, this.waxml, params);
			Array.from(xmlNode.children).forEach(node => this.parseXML(node, localPath));
			break;

			case "wave":
			xmlNode.obj = new Wave(xmlNode, this.waxml, params);
			Array.from(xmlNode.children).forEach(node => this.parseXML(node, localPath));
			break;

			case "slice":
			xmlNode.obj = new Slice(xmlNode, this.waxml, params);
			break;

			default:
			xmlNode.audioObject = new AudioObject(xmlNode, this.waxml, localPath, params);
			xmlNode.obj = xmlNode.audioObject;
			Array.from(xmlNode.children).forEach(node => this.parseXML(node, localPath));
			break;
		}

		// statistics
		let follow = xmlNode.getAttribute("follow");
		if(follow){
				this.followCount[follow] = this.followCount[follow] ? this.followCount[follow] + 1 : 1;
		}

		return this._xml.firstElementChild;

	}

	set XMLstring(str){
		if(str){
			this._XMLstring = str;
		}		
	}

	get XMLstring(){
		return this._XMLstring;
	}


	createObject(xmlNode){
		let params = WebAudioUtils.attributesToObject(xmlNode.attributes);
		let obj;
		switch(xmlNode.nodeName.toLowerCase()){
			case "envelope":
			obj = new Envelope(xmlNode, this.waxml, params);
			break;

			case "command":
			obj = new Command(params, this.waxml);
			break;

			default:
			obj = new AudioObject(xmlNode, this.waxml, "", params);
			break;
		}
		return obj;
	}


}



module.exports = Parser;

},{"./AudioObject.js":2,"./Command.js":5,"./Envelope.js":8,"./Loader.js":20,"./Select.js":29,"./Synth.js":30,"./Variable.js":32,"./Watcher.js":37,"./WebAudioUtils.js":39,"./musical-structure/Sequence.js":46,"./musical-structure/Slice.js":47,"./musical-structure/Wave.js":48,"./variable-matrix/SnapshotComponent.js":49}],28:[function(require,module,exports){
var WebAudioUtils = require('./WebAudioUtils.js');


class Range {

	constructor(arr){
		this._valueType = "number";
		this.values = [];

			arr.forEach(val => {

				if(val.includes("...")){
					var minMaxStrings = val.split("...");
					var numValMin = parseFloat(minMaxStrings[0]);
					var numValMax = parseFloat(minMaxStrings[1]);

					this.values.push(new MinMax(numValMin, numValMax));
				} else {
					// These lines are used in iMusic. Should it maybe be used here as well?

					// let v = Number(val);
					// if(isNaN(v)){
					// 	this._valueType = "string";
					// } else {
					// 	val = v;
					// }
					// this.values.push(val);
				}
				//this.values.sort();
			});

	}

	getRange(x){
		let i = this.values.findIndex(item => x >= item.min && x <= item.max);
		return {values: this.values[i], index: i}
	}

	get value(){

		return Range.getRandomVal(this.values);

	}

	getRandomVal(dec, fn){
		return Range.getRandomVal(this.values, dec, fn);
	}


	get min() {
		return this.values[0];
	}

	get max(){
		return this.values[this.values.length-1];
	}

	get type(){
		return this._valueType;
	}

	get isNumber(){
		return this._valueType == "number";
	}


}

Range.getRandomVal = function(arr, dec, fn){

	if(!arr){return 0}
	if(!arr.length){return 0}


	var ln = fn == "other" ? arr.length - 1 : arr.length;
	var rnd = Math.floor(Math.random()*ln);
	var val;
	dec = dec || 0;

	// pick from array
	switch(fn){
		case "remove":
		val = arr.splice(rnd, 1).pop();
		break;

		case "other":
		val = arr.splice(rnd, 1).pop();
		arr.push(val);
		break;

		case "sequence":
		val = arr.shift();
		arr.push(val);
		break;

		case "shuffle":
		default:
		val = arr[rnd];
		break;
	}

	if(val instanceof MinMax){

		// random between two values

		var range = val.max-val.min+1;
		var num = val.min + Math.random()*range;

		var factor = Math.pow(10, dec);
		num*=factor;
		num = Math.floor(num);
		num/=factor;
		val = num;

	}
	return val;

}

class MinMax {

	constructor(min, max){
		this.min = Math.min(min, max);
		this.max = Math.max(min, max);
	}

}




module.exports = Range;

},{"./WebAudioUtils.js":39}],29:[function(require,module,exports){
const BaseAudioObject = require('./BaseAudioObject.js');


class Select extends BaseAudioObject{

	constructor(xmlNode, waxml, params){
		super(xmlNode, waxml, params);
		
		this.waxml = waxml;
		this._ctx = this.waxml._ctx;

		this._params["selected-index"] = params["selected-index"] || 0;
	
	}
	
	set selectedIndex(val){
		if(this.params["selected-index"] == val){
			this.children[val].start();
		} else {
			switch(this.getParameter("strategy")){

				case "sync-points":
	
				// Find next sync point //
	
				let i = this.params["selected-index"];
				let currentSequence = this.children[i];
				this.params["selected-index"] = val;
				let nextSequence = this.children[val];
	
				// This is looking for currently playing slices and gets the 
				// next syncPoint following that slice
				let targetSyncPoint = currentSequence.getNextSyncPoint(); // {index, time, pos}
	
				nextSequence.start(targetSyncPoint);
	
				// Look for potential slices or fade-offsets controlling the crossfade times
				// differenly for different voices. Forward those time positions to
				// the old sequence to (possibly) adjust the fadeout times for matching 
				// voices. 
				let pendingTimes = nextSequence.voiceGroupPendingTimes;
				// console.log("nextSequence.voiceGroupPendingTimes", pendingTimes, targetSyncPoint.time);
				targetSyncPoint.pendingTimes = pendingTimes;
	
				// forward theses
				currentSequence.stop(targetSyncPoint);
				break;
			}
		}

	}

	start(){
		// only  built for one selected index at the moment
		let i = this.getParameter("selected-index");
		let targetObj = this.children[i];
		if(targetObj){

			// call if object has the function
			targetObj.start?.();
		}
	}

	stop(){
		// call if objects has the function
		this.children.forEach(obj => obj.stop?.());
	}
	    
}

module.exports = Select;


/*
Bugs:
- Rapid change between sequences causes a mess with several sequences playing at the same time. Make sure they are cancelled if PENDING
*/
},{"./BaseAudioObject.js":3}],30:[function(require,module,exports){

var WebAudioUtils = require('./WebAudioUtils.js');
var Watcher = require('./Watcher.js');
var Trigger = require('./Trigger.js');

class Synth{


	constructor(xmlNode, waxml, localPath, params){

  	this.waxml = waxml;
  	let _ctx = this.waxml._ctx;

		this._xml = xmlNode;
		this._ctx = _ctx;
		this._localPath = localPath;

		this._params = params;
		this._voices = this._params.voices || 1;
		this._voiceID = 0;

		this.variables = {};
		this.childObjects = [];

		this._node = this._ctx.createGain();
		this._node.gain.value = 1/this._voices;

		if(this._xml.parentNode.audioObject){
			this.parent = this._xml.parentNode.audioObject;
		}

	  	// console.log(xmlNode.nodeName, this._node.__resource_id__);

		// duplicate XML nodes until there are correct number of voices
		this.voiceNodes = this._xml.children;
		let voiceNodeCount = xmlNode.querySelectorAll("voice, Voice").length;

		this.hasEnvelope = xmlNode.querySelectorAll("envelope, Envelope").length > 0;

		if(voiceNodeCount){
			let curID = 0;
			while(this._xml.children.length < this._voices){
				let targetNode = this._xml.children[curID];
				if(targetNode.nodeName.toLowerCase() != "voice"){continue}

				let newNode = targetNode.cloneNode(true);
				this._xml.appendChild(newNode);
				curID++;
			}
			this.voiceNodes = xmlNode.querySelectorAll("voice, Voice");
		} else {
			console.error("Web Audio XML error. Voice node(s) are missing in Synth node.");
		}

		if(this._params.follow && this._params.follow.length){
			this.watcher = new Watcher(xmlNode, this._params.follow, {
				delay: this.getParameter("delay"),
				waxml: this.waxml,
				callBack: note => {
					if(note[0]){
						this.noteOn(note[1], note[2]);
					} else {
						this.noteOff(note[1]);
					}
				}
			});
		}


		this.trigger = new Trigger(this, this._params.trigger, waxml);

	}


	disconnect(ch){
		if(!this._node){return}
		ch = ch || 0;
		this._node.disconnect(ch);
	}

	connect(destination){

		if(!this._node){return}

		if(this._node.connect){
			destination = destination || this._ctx.destination;
			this._node.connect(destination);
			this.destination = destination;
		}

  	}
	

	addChildObj(obj){
	this.childObjects.push(obj);
	}

	noteOn(note, vel=1){

		let voiceNode = this.nextVoice;
		voiceNode.MIDInote = note;

		let data = {note:note, vel:vel, portamento: this.portamento};
		voiceNode.audioObject.start(data);
		voiceNode.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.start(data));

	}

	trig(note, vel){
		this.noteOn(note, vel);
	}

	start(note, vel){
		this.trigger.start();
	}

	stop(note, vel){
		this.trigger.stop();
	}

	noteOff(note, vel=1){
		let voiceNode = this.noteToVoice(note);
		if(!voiceNode){return}

		let data = {note:note, vel:vel};
		if(!this.hasEnvelope){voiceNode.audioObject.stop(data)};
		voiceNode.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.stop(data));
		voiceNode.MIDInote = 0;

		this.trigger.stop();
	}


	get nextVoice(){
		let voice;
		switch (this._params.voiceselect) {

			case "random":
				let rnd = Math.floor(Math.random() * this.voiceNodes.length);
				voice = this.voiceNodes[rnd];
			break;

			case "next":
			default:
				voice = this.voiceNodes[this._voiceID++ % this._voices];
			break;

		}
		return voice;

	}

	// set trigger(val){
	// 	this._trigger.frequency = val;
	// }
	//
	// get trigger(){
	// 	return this._trigger.frequency;
	// }

	set gain(val){
  	this.setTargetAtTime("gain", val);
	}

	get gain(){
  	return this._node.gain.value;
	}


	noteToVoice(note){
		return Array.from(this.voiceNodes).find(voiceNode => voiceNode.MIDInote == note);
	}

	getParameter(paramName){
		if(typeof this._params[paramName] === "undefined"){
			if(this._xml.parentNode){
				return this._xml.parentNode.audioObject.getParameter(paramName);
			} else {
				return 0;
			}

		} else {
			return this._params[paramName];
		}
	}


	setTargetAtTime(param, value, delay, transitionTime, cancelPrevious){

		let startTime = this._ctx.currentTime + (delay || 0);
		//transitionTime = transitionTime || 0.001;
		//console.log(value, delay, transitionTime, cancelPrevious);

		if(!this._node){
			console.error("Node error:", this);
		}
		if(typeof param == "string"){
				let targetParam = this._node[param];
				if(!targetParam){targetParam = this[param]}
				param = targetParam;
			}

		if(cancelPrevious && param.cancelScheduledValues){
			param.cancelScheduledValues(this._ctx.currentTime);
		}

		value = Math.min(value, param.maxValue);
		value = Math.max(value, param.minValue);

		transitionTime =  transitionTime || this.getParameter("transitionTime") || 0.001;

		if(transitionTime){
			param.setTargetAtTime(value, startTime, transitionTime);
		} else {
			param.setValueAtTime(value, startTime);
		}

	}

	getWAXMLparameters(){
		let waxmlParams = [];
		let paramNames = ["trigger"];

		paramNames.forEach((item, i) => {
			let obj = WebAudioUtils.paramNameToRange(item);
			obj.name = item;
			obj.target = this[item];
			obj.parent = this;
			waxmlParams.push(obj);
		});
		return waxmlParams;
	}


	get variables(){
		return this._variables;
	}

  set variables(val){
    this._variables = val;
  }

	setVariable(key, val){
		this._variables[key] = val;
	}

  getVariable(key){
		return this._variables[key];
	}
	get path(){
		return this.parent ? this.parent.path + (this._xml.className || this._xml.id || this._xml.nodeName) + "." : "";
	}

}

module.exports = Synth;

},{"./Trigger.js":31,"./Watcher.js":37,"./WebAudioUtils.js":39}],31:[function(require,module,exports){



class Trigger {

	constructor(parent, frequency = 1 / 1000, waxml){
		this.waxml = waxml;
  	this._ctx = this.waxml._ctx;

		this.state = true;
		this._parent = parent;
		this._timeouts = [];
		this.frequency = frequency;
		this._scheduledValues = [];
		this._interval = 20;
		this._triggerID = 0;
		this._lastTrig = 0;

		this._intervalID = setInterval(() => {
			this.checkQueue();
		}, this._interval);
	}

	start(){
		this.state = true;
	}

	replay(){
		// this.stop();
		// this.trig();
	}

	trig(){
		this._parent.trig();
		this._lastTrig = this._ctx.currentTime;
	}

	stop(){
		this.state = false;
		while(this._timeouts.length){
			let id = this._timeouts.pop();
			clearTimeout(id);
		};
		this.cancelScheduledValues();
	}

	checkQueue(){
		if(this.state){
			if(this._ctx.currentTime - this._lastTrig > 1 / this.frequency){
				this.trig();
			}
		}
	}


	set state(newState){
		this._state = newState;
	}

	get state(){
		return this._state;
	}

	get frequency(){
		return this._frequency.valueOf();
	}

	get minValue(){
		return 0.001;
	}

	get maxValue(){
		return 100;
	}

	set frequency(f){
		//console.log(`f = ${f}`);
		f = Math.max(f.valueOf(), 1 / 1000);
		let oldFrequency = this._frequency ? this._frequency.valueOf() : 0;
		this._frequency = f;
		if(this.state && this._frequency > oldFrequency){
			this.replay();
		}
	}

	setTargetAtTime(val, time = 0){
		time -= this._ctx.currentTime;
		time = Math.max(0, time);
		//console.log(`setTargetAtTime(${val}, ${time}`);
		this._scheduledValues.push(setTimeout(() => {
			this.frequency = val;
		}, time * 1000));
	}

	setValueAtTime(val, time){
		this.setTargetAtTime(val, time);
	}

	cancelScheduledValues(){
		while(this._scheduledValues.length){
			clearTimeout(this._scheduledValues.pop());
		}
	}

}

module.exports = Trigger;

},{}],32:[function(require,module,exports){
// var Watcher = require('./Watcher.js');
var Mapper = require('./Mapper.js');
// var WebAudioUtils = require('./WebAudioUtils.js');


class Variable {

	constructor(xmlNode, params){

		if(xmlNode){
			this._parentAudioObj = xmlNode.parentNode.audioObject;
		}
		

		this._params = params;
		this._callBackList = [];
		this.waxml = params.waxml;
		this.lastUpdate = 0;
		this._polarity = 0;
		this._derivative = 0;
		this._derivative2 = 0;
		this._derivative3 = 0;
		this._xml = xmlNode;
		this.name = params.name;

		this.derivativeValues = [0];
		// this.derivative2Values = [0];
		// this.smoothDerivative = 3;
		this.registeredTimes = [];


		this._mapper = new Mapper(params);
		this.scheduledEvents = [];

		this.autoTriggerTimeout = 0;
		this.lastBroadCastedValues = {};

		// if(this.name == "pan"){
		// 	console.log("hej");
		// }


		// it seems hard to add a watcher from here
		// when Watcher is calling this contructor

		// if(params.follow){
		// 	this.watcher = new Watcher(xmlNode, params.follow, {
		//
		// 		callBack: val => {
		// 			this.set(val);
		// 		}
		// 	});
		// }

		if(params.trig){
			//this.argumentIndex = parseInt((params.value || "").split("[").pop()) || 0;
			this.targetParameter = params.value;
		}	
		if(typeof params.default != "undefined"){
			this.value = params.default;
		} else if(!params.trig && typeof params.value != "undefined"){
			this.value = params.value.valueOf();
		}

		// setInterval(e => {
		// 	console.log(this.name, this.mappedValue, this.derivative, this.derivative2);
		// }, 500);

		this.trig;
		
	}

	addCallBack(callBack, prop){
		this._callBackList.push({callBack: callBack, prop: prop});
		if(typeof this.value != "undefined"){
			callBack(this[prop]);
		}
	}

	trig(){
		// this feature lets the variable update to one argument 
		// passed to the function. I.e. MIDI:NoteOn, {channel: ch, keyNum: nr, velocity: vel}
		this.setValue(arguments[0][this.targetParameter]);
	}

	getMappingPoints(steps = 1000){

		let points = [];
		let minIn = typeof this.minIn == "undefined" ? 0 : this.minIn;
		let maxIn = typeof this.maxIn == "undefined" ? 1 : this.maxIn;

		let inputRange = maxIn - minIn;

		for(let i = 0; i <= steps; i++){
			let x = minIn + i / steps * inputRange;
			let y = this._mapper.getValue(x);
			points.push({x: x, y: y});
		}
		return points;
	}

	valueOf(){
		return this.value;
	}

	setValue(val = this._value, transistionTime = 0, autoTrigger = false){

		this.lastInputValue = val;
		
		if(this.autoInputRange){
			this.autoAdjustInputRange(val);
		}

		// clear autoTrigger (no matter if the function is triggered manually or automatically)
		// the autoTrigger makes sure derivatas are reset even if no data is updated
		if(this.autoTriggerTimeout){
			clearTimeout(this.autoTriggerTimeout);
			this.autoTriggerTimeout = 0;
		}

		if(typeof val == "boolean"){
			// pick minin if false, maxin if true
			val = val ? this.maxIn : this.minIn;
		}

		let oldValue = this._value;
		let newValue = val;

		let curFrame = this.curFrame;

		if(val == parseFloat(val))val = parseFloat(val);
		this._value = val;

		this.mappedValue = this._mapper.getValue(this._value);
		
		if(typeof this.mappedValue != "undefined"){

			// successful mapping
			let frames = 1;

			if(typeof this.lastMappedValue != "undefined"){
				// don't run on first data value

				let diff = this.mappedValue - this.lastMappedValue;
				this.lastMappedValue = this.mappedValue;
				frames = curFrame - this.lastUpdate;
			
				if(frames){
					if(diff >= 0 && this._polarity <= 0){
						this._polarity = 1;
						this.broadCastEvent("trough");
						this.polarityChange();
					} else if(diff <= 0 && this._polarity >= 0){
						this._polarity = -1;
						this.broadCastEvent("crest");
						this.polarityChange();
					}

					let newDerivative1;
					if(diff){
						newDerivative1 = diff / frames;
					} else {
						// let the derivative fall towards zero if set
						newDerivative1 = this._derivative ? this._derivative * this.fallOffRatio : 0;
					}

					newDerivative1 = this.getDerivativeAVG(newDerivative1);
					
					let newDerivative2 = newDerivative1 - this._derivative;
					let newDerivative3 = newDerivative2 - this._derivative2;

					// let lastAVG = this._derivative;
					// let newAVG = this.setDerivative(newDerivative);

					this._derivative = newDerivative1;
					this._derivative2 = newDerivative2;
					this._derivative3 = newDerivative3;

					// this._derivative2 = newDerivative - this._derivative;
					// this._derivative = newDerivative;
				}
				
				// this._derivative = newDerivative;
				
			}
			this.doCallBacks(transistionTime);
			this.lastUpdate = curFrame;
			this.lastMappedValue = this.mappedValue;

			let delay;
			if(autoTrigger){
				delay = 1 / this.frameRate;
			} else {
				delay = this.AVGtime(frames / this.frameRate);
			}
			
			if(this._params.stream){
				this.autoTriggerTimeout = setTimeout(e => this.setValue(val, transistionTime, true), delay * 2000);
			}

		}
		
	}

	autoAdjustInputRange(val){
		this.minIn = Math.min(this.minIn, val);
		this.maxIn = Math.max(this.maxIn, val);
	}

	get value() {
		//return this._value;
		// if(typeof this._value == "undefined" && this.default != "undefined"){
		// 	this._value = this.default;
		// }
		// return this._mapper.getValue(this._value);
		return this.mappedValue;

	}

	set value(val) {
		this.setValue(val);
	}

	get valuePairs(){
		return {input: this.lastInputValue, output: this.lastMappedValue};
	}

	setTargetAtTime(param, val=0, delay=0, time=0){
		this.scheduledEvents.push(setTimeout(() => this.value = val, (delay+time)*1000));
			
		// switch(param){
		// 	case "value":
		// 	// transition time is not implemented
		// 	// value is set after defined delay + time
		// 	this.scheduledEvents.push(setTimeout(() => this.value = val, (delay+time)*1000));
		// 	break;
		// }
	}

	setValueAtTime(val, delay){
		this.setTargetAtTime("value", val, delay);
	}

	cancelScheduledValues(){
		this.scheduledEvents.forEach(id => clearTimeout(id));
	}

	average(arr){
		return arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
	}

	getDerivativeAVG(val){
		// feature used to smooth the derivative, but it also slows down the responsitivity
		if(isNaN(val)){
			console.log(`setDerivative(${val})`);
		}
		this.derivativeValues.push(val);
		if(this.derivativeValues.length > this.smoothDerivative){
			this.derivativeValues.shift();
		}
		return this.average(this.derivativeValues);
	}

	get smoothDerivative(){
		if(!this._smoothDerivative){
			this._smoothDerivative = this.getParameter("smoothDerivative");
		}
		return this._smoothDerivative;
	}

	get frameRate(){
		if(!this._frameRate){
			this._frameRate = this.getParameter("frameRate");
		}
		return this._frameRate;
	}

	get fallOffRatio(){
		if(!this._fallOffRatio){
			this._fallOffRatio = this.getParameter("fallOffRatio");
		}
		return this._fallOffRatio;
	}

	get derivative(){
		return this._derivative || 0;
	}

	get derivative2(){
		return this._derivative2 || 0;
	}

	get derivative3(){
		return this._derivative3 || 0;
	}

	get acceleration(){
		return this.derivative;
	}

	get speed(){
		return Math.abs(this.derivative);
	}

	get time(){
		if(this.waxml){
			return this.waxml._ctx.currentTime;
		} else {
			return Date.now() / 1000;
		}
	}

	get curFrame(){
		return this.time * this.frameRate;
	}

	broadCastEvent(eventName){
		if(this._xml){
			let selector = `[start="${this.name}.${eventName}"]`;
			this._xml.parentElement.querySelectorAll(selector).forEach(xmlNode => {
				xmlNode.obj.start();
			});
		}
		
	}

	polarityChange(){
		this.derivativeValues = [];
		this.broadCastEvent("polarityChange");
	}

	// setDerivative(newVal){
	// 	let diff = newVal - (this._value || newVal);
	// 	let now = Date.now();
	// 	let time = now - this.lastUpdate;
		
	// 	if(time){
	// 		this.lastUpdate = now;
	// 		let newDerivative = diff / time;

	// 		// this.calibrationValues.push(newDerivative);
	// 		// this.calibrationValues.sort((a,b) => a-b);
	// 		// this.derivataFactor = 1 / this.calibrationValues[Math.floor(0.95*this.calibrationValues.length)];

	// 		// if(this.calibrationValues.length < 100){
	// 		// 	// store values for calibration
	// 		// 	this.calibrationValues.push(newDerivative);
	// 		// } else if(this.calibrationValues.length == 100 && !this.derivataFactor){
	// 		// 	this.calibrationValues.sort((a,b) => a-b);
	// 		// 	this.derivataFactor = 1 / this.calibrationValues[95];
	// 		// } else {
	// 		// 	// this.derivataFactor = Math.min(1/Math.abs(newDerivative), this.derivataFactor);
	// 		// 	newDerivative *= this.derivataFactor;
	// 		// 	this.setDerivative2(newDerivative);
	// 		// 	this._derivative = newDerivative;
	// 		// 	// console.log(this._derivative, this.derivataFactor);
	// 		// }

	// 		// if(this.calibrationValues.length > 100){
	// 		// 	if(Math.abs(newDerivative * this.derivataFactor) > 1){
	// 		// 		this.derivataFactor = 1 / newDerivative;
	// 		// 	}
	// 		// 	newDerivative *= this.derivataFactor;
	// 		// 	this.setDerivative2(newDerivative);
	// 		// 	this._derivative = newDerivative;
	// 		// 	console.log(this._derivative, this.derivataFactor, this.calibrationValues.length)
			
	// 		// }
	// 		this.setDerivative2(newDerivative);
	// 		this._derivative = newDerivative;

	// 		this.minDerivative = Math.min(this.minDerivative, newDerivative);
	// 		this.maxDerivative = Math.max(this.maxDerivative, newDerivative);
	// 		this.minVal = Math.min(this.minVal, newVal);
	// 		this.maxVal = Math.max(this.maxVal, newVal);

	// 		this.derivativeCounter++;
	// 		if(this.derivativeCounter == 200){
	// 			console.log(this.name, this.minVal, this.maxVal, this.minDerivative, this.maxDerivative);
	// 		}
			
	// 	}
		
	// }

	// setDerivative2(newDerivative){
	// 	this._derivative2 = newDerivative - this._derivative;
	// }


	get getterNsetter(){
		return {
			get: this.get,
			set: this.set
		}
	}

	get minIn(){
		return this._params.mapin ? Math.min(...this._params.mapin) : 0;
	}

	get maxIn(){
		return this._params.mapin ? Math.max(...this._params.mapin) : 1;
	}

	get default(){
		return typeof this._params.default == "undefined" ? 1 : this._params.default;
	}

	get defaultValue(){
		return this.default;
	}

	AVGtime(time = 0){
		// I decided to use frameRate instead of this auto-detect update rate for incoming data
		// It defaults to 30 but can be set for any element

		// But then I changed my mind. I think it will too much effort to specify all values manually.
		// Better if the system can handle quite a lot automatically
		let nrOfTimeValues = 10;
		if(this._AVGtime) {
			return this._AVGtime;
		} else {
			if(time){
				this.registeredTimes.push(time);
				if(this.registeredTimes.length > 10){
					this.registeredTimes.shift();
				}
				return this.registeredTimes.reduce((a,b) => a + b) / nrOfTimeValues;

				// time = this.registeredTimes.sort((a,b) => a < b);
			} else {
				return 0.1;
			}
			
			// if(this.registeredTimes.length > 10){
			// 	// calculate average time. Exclude outliers
			// 	let sortedArr = this.registeredTimes.sort((a,b) => a < b);
			// 	let filteredArr = sortedArr.filter((el, i) => i > 20 && i < 80);
			// 	this._AVGtime = filteredArr.reduce((a,b) => a + b) / filteredArr.length;
			// } else {
			// 	return time || 0.1;
			// }
		}
	}

	doCallBacks(transistionTime){
		let lastBroadCastedValues;
		this._callBackList.forEach(obj => {
			// if(this.lastBroadCastedValues != this[obj.prop]){ // Det här ställde till det!!! Loopen kördes bara
			// för det första objektet
				obj.callBack(this[obj.prop], transistionTime);
				// this.lastBroadCastedValues = this[obj.prop];
				// lastBroadCastedValues = this.lastBroadCastedValues;
			// }
			
		});
	}

	getVariable(key){
		return this[key];
	}

	get watchedVariableNames(){
		if(typeof this._params.value == "object" && this._params.value.type == "watcher"){
			return Object.entries(this._params.value._variables).map(([key]) => key);
		} else {
			return [];
		}
	}

	get unMappedValue(){
		return this._mapper.unMappedValue;
	}

	getWAXMLparameters(){
		// this is not really used anymore
		// Becaues 'value' is the only parameter. The var element is rather the 
		// parameter itself in the Sonification Toolkits perspective (where it's currently used)
		// let obj = WebAudioUtils.paramNameToRange("var");
		let obj = {};
		obj.name = "value";
		obj.label = this.name;
		obj.target = this;
		obj.path = e => this.path;

		obj.min = this.minIn;
		obj.max = this.maxIn;
		obj.default = this.default || this.value;
		obj.conv = 1;
		
		return [obj];
	}

	update(){
		this.doCallBacks(0.001);
	}

	
    getParameter(paramName){
		let val;
  
		if(typeof this._params[paramName] === "undefined"){
			
			if(this._parentAudioObj){
				return this._parentAudioObj.getParameter(paramName);
			} else {
  
				// return default values
				switch(paramName){
				  case "transitionTime":
					val = 0.001;
				  break;
  
				  case "frameRate":
					val = 30;
				  break;
  
				  case "fallOffRatio":
					val = 0.5;
				  break;

				  case "smoothDerivative":
					val = 5;
				  break;
  
				  case "loopEnd":
					// avoid setting loopEnd to 0
					// ideally (maybe) setting it to duration
					// of audio buffer
				  break;
  
				  default:
					val = 0;
				  break;
				}
				return val;
			}
  
		} else {
			val = this._params[paramName];
  
			// adjust time
			switch(paramName){
				case "transitionTime":
				case "loopEnd":
				case "loopStart":
				case "delay":
				let timescale = this.getParameter("timescale") || 1;
				val *= timescale;
				break;
  
			}
			return val;
		}
	}

}

module.exports = Variable;

},{"./Mapper.js":22}],33:[function(require,module,exports){



class VariableContainer {

	constructor(){
		this._props = {};
		this._listeners = {}
	}

	setVariable(key, val){
		this[key] = val;
		if(this._listeners[key]){
			this._listeners[key].array.forEach(element => {
				element.update(key, val);
			});
		}
	}
	getVariable(key){
		return this[key];
	}

	getVariableObject(key){
		return this._props[key];
	}

	addListener(key, listener){
		if(!this._listeners[key]) this._listeners[key] = [];
		this._listeners[key].push(listener);
	}
}


module.exports = VariableContainer;

},{}],34:[function(require,module,exports){


class VariableController extends HTMLElement {

	constructor(){
		super();
		this.inited = false;
	}

	connectedCallback(){
		if(!this.inited){
			this.init({
				type: this.getAttribute("type") || "slider",
				label: this.getAttribute("name"),
				targetVariable: this.getAttribute("targetVariable"),
				min: parseFloat(this.getAttribute("min") || 0),
				max: parseFloat(this.getAttribute("max") || 1)
			});
		}

		this.parentElement.addEventListener("click", e => {
			this.selected = !this.selected;
		});
		
	}


	init(data={}, waxml=window.waxml){

		this.inited = true;
		this.type = data.type ||"slider";

		data.step = data.steps ||0.01;
		let range = data.max - data.min;
		this.decimals = Math.ceil(Math.max(0, 2 - Math.log(range || 1)/Math.log(10)));

		this.waxml = waxml;
		this.targetVariable = data.targetVariable;
		this.watchedVariable = data.watchedVariable;
		let interactionElement;
		let textElement;
		switch(this.type){
			case "knob":
			data.type = "range";
			break;

			default:
			data.type = "range";
			interactionElement = document.createElement("input");
			break;
		}

		this.setAttributes(this, {
			watchedVariable: data.watchedVariable
		});
		data["data-default"] = data.value;
		this.setAttributes(interactionElement, data);
		// interactionElement.style.position = "absolute";
		// interactionElement.style.width = "100%";
		
		interactionElement.addEventListener("input", e => {
			let val = parseFloat(e.target.value);
			this.targetVariable.value = val;
			this.textElement.value = val.toFixed(this.decimals);
		});
		interactionElement.addEventListener("click", e => {
			e.stopPropagation();
		});
		interactionElement.addEventListener("dblclick", e => {
			e.stopPropagation();
			let val = parseFloat(e.target.dataset.default);
			this.value = val;
			this.targetVariable.value = val;
			this.textElement.value = val.toFixed(this.decimals);
		});

		let meter = document.createElement("meter");
		this.setAttributes(meter, data);
		// meter.style.position = "absolute";
		// meter.style.width = "100%";

		textElement = document.createElement("input");
		textElement.setAttribute("type", "text");
		textElement.setAttribute("size", "4");
		textElement.value = data.value;
		textElement.addEventListener("click", e => {
			e.stopPropagation();
		});

		this.interactionElement = interactionElement;
		this.textElement = textElement;

		this.appendChild(interactionElement);
		// this.appendChild(meter);
		this.appendChild(textElement);

		this.selected = false;
		
		return this;
	}

	set selected(state){
		this._selected = state;
		if(state){
			this.classList.add("selected");
			if(this.parentElement)this.parentElement.classList.add("selected");
		} else {
			this.classList.remove("selected");
			if(this.parentElement)this.parentElement.classList.remove("selected");
		}
	}
	get selected(){
		return this._selected;
	}

	get value(){
		return this.interactionElement.value;
	}

	set value(targetValue){

		let time = this.targetVariable.getParameter("transitionTime") * 1000;
		let steps = Math.ceil(Math.min(time / 10, 100));
		steps = Math.max(1, steps);
		let curVal = parseFloat(this.interactionElement.value);
		let diff = targetValue - curVal;
		let step = 0;
		let fn = () => {
			let val = curVal + diff * (++step / steps);
			this.textElement.value = val.toFixed(this.decimals);
			this.interactionElement.value = val;
			if(step < steps){
				setTimeout(fn, time / steps);
			}
		}
		fn();
	}



	setAttributes(el = this, data){
		Object.entries(data).forEach(([key, value]) => {
			if(typeof value == "string" || typeof value == "number"){
				el.setAttribute(key, value);
			}
		});
	}
}

module.exports = VariableController;

},{}],35:[function(require,module,exports){
const Variable = require('./Variable.js');
const VariableMatrixRow = require('./VariableMatrixRow.js');
const Watcher = require('./Watcher.js');


class VariableMatrix extends HTMLElement {

	constructor(variableContainer=[]){
		super();
		this.inited = false;
		this.variableContainer = variableContainer;
	}

	connectedCallback(){
		if(!this.inited){
			// collect data from attributes first (if added from HTML)
			this.init();
		}
	}

	init(variableContainer=this.variableContainer){
		this.inited = true;
		this.waxml = variableContainer.waxml;
		this.variableContainer = variableContainer;
		this.rows = [];

		let table = document.createElement("table");
		this.appendChild(table);


		// count total variables
		this.columLabels = [];
		this.variableContainer.childObjects.forEach(row => {
			Object.entries(row.variables).forEach(([name, obj]) => {
				if(obj instanceof Variable){
					if(!this.columLabels.includes(name)){
						this.columLabels.push(name);
					}
				}
			});
		});


		let thead = document.createElement("thead");
		table.appendChild(thead);
		let tr = document.createElement("tr");
		thead.appendChild(tr);
		let th = document.createElement("th");
		th.addEventListener("click", e => {
			let index = [...tr.children].indexOf(th);
			let VCs = this.getVariables(`:nth-child(${index+1})`);
			let unselectedVC = VCs.find(vc => vc.selected == false);
			let state = unselectedVC ? true : false;
			VCs.forEach(vc => vc.selected = state);
		});
		tr.appendChild(th);

		this.columLabels.forEach(colName => {
			th = document.createElement("th");
			th.innerHTML = colName;
			tr.appendChild(th);
		});
		
		
		this.variableContainer.childObjects.forEach(row => {
			let variables = Array(this.columLabels.length).fill(0);

			Object.entries(row.variables).forEach(([name, obj]) => {
				if(obj instanceof Variable){

					let colIndex = this.columLabels.indexOf(name);
					let watchedVariable = obj.watchedVariableNames[0]; // it assumes only one source variable
					if(watchedVariable){
						variables[colIndex] = {
							label: name,
							targetVariable: obj,
							watchedVariable: watchedVariable,
							min: obj.minIn,
							max: obj.maxIn,
							value: obj.default
						}
					}
				}
			});
			table.appendChild(new VariableMatrixRow(row.id, variables, this.waxml).element);
		});

		return this;
	}

	getVariables(selector = ""){
		return this.querySelectorAll(`waxml-variable-controller${selector}`);
	}

	get selectedVariables(){
		return this.getVariables(".selected");
	}
}
module.exports = VariableMatrix;

},{"./Variable.js":32,"./VariableMatrixRow.js":36,"./Watcher.js":37}],36:[function(require,module,exports){
const VariableController = require('./VariableController.js');


class VariableMatrixRow{

	constructor(id, variables, waxml){
		this.variables = variables;
		this.waxml = waxml;
		this.cols = [];
		let tr = document.createElement("tr");
		this._element = tr;

		// is this a valid selector (=audio source)
		let td = document.createElement("td");
		td.innerHTML = id;

		if(waxml.querySelector(`#${id}`)){
			let meter = document.createElement("waxml-meter");
			meter.setAttribute("type", "loudness");
			meter.setAttribute("width", "100px");
			meter.setAttribute("height", "10px");
			meter.setAttribute("timeframe", "2s");
			meter.setAttribute("maxDecibels", "0");
			meter.setAttribute("minDecibels", "-40");
	
			meter.setAttribute("colors", "green, yellow, red");
			meter.setAttribute("segments", "60,20,20");
			
			meter.setAttribute("input", `#${id}`);
			
			td.appendChild(meter);
		}
		
		// meter.init(this.waxml._ctx);

		tr.appendChild(td);
		td.addEventListener("click", e => {
			let unselected = this.variables.find(variable => variable ? variable.controller.selected == false : false);
			let state = unselected ? true : false;
			this.variables.forEach(variable => {
				if(variable.controller){
					variable.controller.selected = state;
				}
				
			});
		});

		variables.forEach((variable, i) => {
			td = document.createElement("td");
			
			tr.appendChild(td);
			if(variable){
				let vc = new VariableController().init(variable, waxml);
				variable.controller = vc;
				td.appendChild(vc);
			} else {
				td.innerHTML = "&nbsp;";
			}
		});

	}

	connectedCallback(){

	}

	get element(){
		return this._element;
	}

}

module.exports = VariableMatrixRow;

},{"./VariableController.js":34}],37:[function(require,module,exports){
var WebAudioUtils = require('./WebAudioUtils.js');
var Variable = require('./Variable.js');


class Watcher {

	constructor(xmlNode, arr, params){

		// allow for different ways of specifying target, event, variable and delay
		// possible structures:
		// variable
		// variable.property
		// XMLelement
		// XMLelement, variable
		// XMLelement, variable.property
		// HTMLelement
		// HTMLelement, variable
		// HTMLelement, event, variable

		this.type = "watcher";

		
		this._variables = this.strToVariables(arr, xmlNode, Variable, params);
		if(Object.keys(this._variables).length > 0){
			this.callBack = params.callBack;
			arr = WebAudioUtils.replaceVectorDistMethod(arr);
			this.value = WebAudioUtils.replaceVariableNames(arr);
			this.update(this.value, 0.001);
			return;
		}


		let target, variable, targetStr, event;
		if(arr.length){
			variable = arr.pop().trim();
		} else {
			console.log("WebAudioXML error: 'follow' attribute requires at least one parameter.")
			return false;
		}

		if(arr.length){
			// variable is a property of WebAudioXML.
			// Check if this is really used!
			targetStr = arr.shift().trim();
			target = xmlNode.closest(targetStr);
			if(target && target.obj){target = target.obj.variables}
		}

		if(!target) {

			target = WebAudioUtils.getVariableContainer(variable, xmlNode, Variable);
			// let curNode = xmlNode;
			// let rootNode = curNode.getRootNode();
			// while(!target && curNode != rootNode){
			// 	if(curNode.obj && curNode.obj.getVariable(variable) instanceof Variable){
			// 		// if target is the name of a variable that is specified
			// 		// for a parent object (at any distans from xmlNode)
			// 		// as a dynamic variable object using the "var" element
			// 		target = curNode.obj;
			// 	}
			// 	curNode = curNode.parentNode;
			// }

			let curNode = xmlNode;
			let rootNode = curNode.getRootNode();
			while(!target && curNode.parentNode != rootNode){
				try {
					target = curNode.querySelector(variable);
				} catch(e){
					//console.log(e);
				}
				if(target && target.obj){
						// if target is any element near xmlNode
						// (at any distanse from xmlNode, but the closest will be selected)
						// Is this really a good idea?? There ought to be a strict hierarchical
						// rule for variable referencing. Or?
						target = target.obj;
						variable = "value";
				}
				curNode = curNode.parentNode;
			}

		}

		if(!target) { 
			// connect to an HTML element
			target = document.querySelector(targetStr);
		}

		if(!target){
			try{
				target = eval(targetStr);
			}
			catch(error){
				console.error("WebAudioXML error: No valid target specified - " + targetStr);
			}
		}


		if(arr.length){
			// target object is a DOM element
			// event to use with addEventListener
			// variable expected to be a property of the event object in the callback of addEventListener
			event = arr.shift().trim();
		} else {
			// target object is top XML node of this document
			// variable is a property of the audioObject connected to that XML node
			// or a DOM object with a variable to watch
			// xmlNode.getRootNode().querySelector("audio");
			target = target || params.waxml.variables;
			this.addVariableWatcher(target, variable, params);
			return;
		}


		if(target){
			if(target.addEventListener){

				// make sure variable starts with e.
				if(variable.substr(0, 2) != "e."){
					if(variable.substr(0, 6) == "event."){
						variable = variable.substr(6);
					}
					if(variable.substr(0, 7) != "target."){
						variable = "target." + variable;
					}
					variable = "e." + variable;
				}

				target.addEventListener(event, e => {
					let val = eval(variable);
					if(typeof val !== "undefined"){
						params.callBack(val);
					} else {
						console.error("Web Audio XML Parameter follow error. Target object event does not contain variable.", variable);
					}
				});

			} else {
				console.error("Web Audio XML Parameter follow error. Target object does not support addEventListener.", targetStr);
			}
		} else {
			console.error("Web Audio XML Parameter follow error. Target not found: ", targetStr);
		}

	}

	addVariableWatcher(obj, variable, params = {}){

		let oNv = this.varablePathToObject(obj, variable);
		if(!oNv){return}
		obj = oNv.object || obj;

		// allow for simple variable names or variables inside an Object
		// i.e. "relX" or "client[0].touch[0].relX"
		variable = oNv.variable || variable;

		// prepare the container to add a dynamic variable
		// Note: This should be a part of the Base Class!!
		obj._props = obj._props || {};

		// add variable if this is the first call to that variable name
		let variableObj = obj._props[variable];
		if(!variableObj) {
			variableObj = obj.getVariable ? obj.getVariable(variable) : obj[variable];
		}

		if(!(variableObj instanceof Variable)){
			variableObj = new Variable(undefined, params);
			//variableObj = params.variableObj || new Variable(undefined, params);


			Object.defineProperty(obj, variable, {
				get() {
					if(typeof variableObj.value != "undefined"){
						return variableObj.value;
					} else {
						return this._props[variable].value;
					}
					
				},
				set(val) {
					variableObj.value = val;
					// this has been moved to the Variable object
					// return;
					// if(this._props[variable].value != val){
					// 	this._props[variable].value = val;
					// 	this._props[variable].callBackList.forEach(callBack => callBack(val));
					// }
				}
			});
		}
		obj._props[variable] = variableObj;

		if(params.callBack){
			let callBack = params.callBack;
			if(params.delay){
				// wrap callBack in a timeout if delay is specified
				var origCallBack = callBack;
				callBack = val => {
					return setTimeout(e => {
						origCallBack(val);
					}, params.delay);
				};
			}
			variableObj.addCallBack(callBack, oNv.prop);
		}

		//obj._props[variable].callBackList.push(callBack);

	}

	variablePathToProp(str){
		let prop = str.split(".").pop();

		switch (prop) {
			case "derivative":
			case "derivative2":
			case "acceleration":
				break;
			default:
				prop = "value";
		}
		return prop;
	}

	variablePathToName(str){
		return str.split(".").shift();
	}

	varablePathToObject(obj = window, variable = ""){

		let varArray = variable.split(".");
		let prop = varArray.pop();
		let v;

		switch (prop) {
			case "derivative":
			case "derivative2":
			case "acceleration":
				v = varArray.pop();
				break;
			default:
				v = prop;
				prop = "value";
		}

		// this supports hierarchical objects in the target object
		// e.g. client[0].touch[0] It's probably not a good idea
		// I'd rather prefer a flat naming structure where the dot
		// syntax is used to separate the variable from "derivative"
		// or similar.
		let varPath = varArray.length ? "." + varArray.join(".") : "";
		let o;

		try {
		    o = eval("obj" + varPath);
		} catch (e) {
		    //console.warn(e.message);
				return;
		}


		/*
		varArray.forEach(v => {
			let o = obj[v];
			if(typeof o == "object"){
				obj = o;
			}
		});
		*/
		return {object: o, variable: v, prop: prop};
	}


	// consider if this is the correct place for this conversion
	// of stored _variables
	// It's ment as a short for e.g. frequency="relX*100" like formulas
	// in a spread sheet
	getVariable(varName){

		// To support derivate, I think this function needs to return the object
		// rather than the value
		return this._variables[varName];
		// return this._variables[varName].valueOf();

	}

	getVectorDist(v1, v2){

		// fill with zeros to match length (and make the vectors a minimum two dimentional)
		v1 = [...v1];
		v2 = [...v2];
		let l = Math.max(v1.length, v2.length, 2);
		while(v1.length < l)v1.push(0);
		while(v2.length < l)v2.push(0);

		// calculate hypothenuses
		let d2s = v1.map((el, i) => (v2[i] - el) ** 2);
		return d2s.reduce((a,b) => a + b) ** 0.5;
	}

	get variableNames(){
		return Object.entries(this._variables).map(([key]) => key);
	}

	replaceVariableNames(str) {
		// regExp
		// ${x} || var(x) -> this.getVariable(x)
		if(typeof str != "string"){return 0};

		let rxp = WebAudioUtils.rxp;
		return str.replaceAll(rxp, (a, b, c) => b ? `this.getVariable('${b}')` : `this.getVariable('${c}')`);

	}

	// Den här funktionen borde delas. Den gör för mycket. Den inte bara
	// regExpar strängen, den letar också efter Variable-object
	// och skapar nya med relationer till dem.
	strToVariables(str = "", xmlNode, variableType, params){
		// regExp
		if(typeof str != "string"){return 0};
		// ${x} || var(x) -> this.getVariable(x)
		let rxp = WebAudioUtils.rxp;
		let variables = {};

		[...str.matchAll(rxp)].forEach(match => {
			let arr = (match[1] || match[2] || match[3]).split(".");
			let varName = arr[0];
			let prop = arr[1] || "value";
			let parentObj = WebAudioUtils.getVariableContainer(varName, xmlNode, variableType);
			// let prop = this.variablePathToProp(str);

			let props;
			if(parentObj){
				props = parentObj.variables;
			} else {
				props = params.waxml.variables._props;
				this.addVariableWatcher(params.waxml.variables, varName);
			}
			let varObj = props[varName];
			varObj.addCallBack((v,t) => this.update(v,t), prop);
			variables[varName] = varObj;

		});

		return variables;
	}

	update(val, time){

		if(this.callBack){
			val = this.valueOf(val);
			if(typeof val !== "undefined")this.callBack(val, time);
		}

	}

	valueOf(val){
		if(typeof val == "number" && false){
			// det här verkar knasigt. Det är väl bara watchern som kan räkna 
			// ut sitt värde som ska retureras.
		} else {

			if(typeof this.value == "string"){
				let values = [];
				try {
	
					let me = this; // this is undefined inside forEach:eval

					
					if(this.value.includes(",") && !this.value.includes("[")){
						// support comma separated values
						this.value.split(",").forEach(v => {
							// if(v.includes("getVariable")){
							// 	// add the default property "value"
							// 	// if not specified (like "derivative")
							
							// 	if(v.substr(-1) == ")"){
							// 		v += ".value";
							// 	}
							// }
							let v1 = eval(v);
							v1 = (Number.isNaN(v1) ? val : v1) || 0;
							values.push(v1);
						});
					} else {
						// multiple arrays like dist([$x1,$y1], [$x2,$y2])

						let v1 = eval(this.value);
						v1 = Number.isNaN(v1) ? 0 : v1;
						values.push(v1);
					}
					
	
				} catch {
	
				}
				val = values.length == 1 ? values.pop() : values;
			}
			
		}
		
		// single value or array

		// Fundera på denna. Farligt att returnera 0! Men om det är undefined 
		// behöver detta också stoppas från att försöka sätta parameter till 
		// undefined.
		return val; // || 0;
	}

}

module.exports = Watcher;

},{"./Variable.js":32,"./WebAudioUtils.js":39}],38:[function(require,module,exports){
/*
MIT License

Copyright (c) 2020 hanslindetorp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var version = "1.5";


var WebAudioUtils = require('./WebAudioUtils.js');
var Parser = require('./Parser.js');
var Connector = require('./Connector.js');
var GUI = require('./GUI.js');
var InteractionManager = require('./InteractionManager.js');
var ConvolverNodeObject = require('./ConvolverNodeObject.js');
var Variable = require('./Variable.js');
var InputBusses = require('./InputBusses.js');

var XY_area = require('./XY_area.js');
var XY_handle = require('./XY_handle.js');
var Meter = require('./Meter.js');
var MIDIController = require('./MIDIController.js');
var Inspector = require('./Inspector.js');


const VariableMatrix = require('./VariableMatrix.js');
const VariableController = require('./VariableController.js');
const SnapshotController = require('./variable-matrix/SnapshotController.js');
const SnapshotComponent = require('./variable-matrix/SnapshotComponent.js');

const DynamicMixer = require('./dynamic-mixer/Mixer.js');
const Channel = require('./dynamic-mixer/Channel.js');
const OutputMonitor = require('./GUI/OutputMonitor.js');
const LinearArranger = require('./GUI/LinearArranger.js');


const MusicalStructure = require('./musical-structure/Music.js');





var HL2 = require("./HL2.js");




var source = document.currentScript.dataset.src || document.currentScript.dataset.source;

navigator.getUserMedia = (
	navigator.getUserMedia ||
	navigator.webkitGetUserMedia ||
	navigator.mozGetUserMedia ||
	navigator.msGetUserMedia
);



class WebAudio {

	constructor(_ctx, src){
		

		if(!_ctx){

			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			if (AudioContext) {
					// Web Audio API is available.
					_ctx = new AudioContext();
					_ctx.destination.channelCount = _ctx.destination.maxChannelCount || 2;

					console.log("WAXML is installed. Version " + version + " - Made by Hans Lindetorp - waxml.org");
			} else {
				console.error("This browser does not support Web Audio API");
			}

		}

		// this.HL = new HL2(_ctx);

		this.fps = 60; // used to update variable "currentTime"
		this._ctx = _ctx;
		this._listeners = [];
		this.plugins = [];
		this.reset();
		this._muteState = false;

		this.audioInited = false;
		this.parser = new Parser(this);

		this.inputBusses = new InputBusses(_ctx);
		this.snapShots = [];

		source = source || src;

		if(source){
			window.addEventListener("load", () => {

				
				this.parser.init(source)
				.then(xmlDoc => {
					this._xml = xmlDoc;

					// skriv om hela denna del så att kopplingen sker från HTML istället
					let interactionArea = this._xml.getAttribute("interactionArea");
					if(interactionArea){
						let el = document.querySelector(interactionArea);
						if(el){
							this.ui.registerEvents(interactionArea);
						}
						
					} else {
						document.querySelectorAll("*[data-waxml-pointer]").forEach(el => {
							if(el.dataset.waxmlPointer == "true"){
								this.ui.registerEvents(el);
							}
						});
					}

					this.initGUI(this._xml);
					this.initAudio(this._xml);
					this.initEvents();


					this.dispatchEvent(new CustomEvent("inited"));
					this.dispatchEvent(new CustomEvent("init"));

					// ugly workaround to make it make sure the variables are initing depending audio parameters
					this.setVariable("pointerdown", 0);
					this.setVariable("mousedown", 0);
					this.setVariable("touchdown", 0);


					this.init();

				});
			});
		} else {
			console.warn("No WebAudioXML source specified")
		}

		
		this.defineCustomElements();

		this.ui = new InteractionManager(this);

		this.addEventListener("init", e => {
			this.stop("Envelope");
		});

	}

	/*
	// Maybe to be implemented when moved from AudioObject
	addVariableWatcher(variable, callBack){
		this.variableRouter.addVariableWatcher(variable, callBack);
	}
	*/
	// init(){
	// 	if(!this.audioInited){
	// 		this._ctx.resume().then(() => {
	// 			this.audioInited = true;
	// 			this.start("*[trig='auto'], *[start='auto']");
	
	// 			setInterval(e => {
	// 				//this.setVariable("currentTime", this._ctx.currentTime/this._xml.obj.parameters.timescale);
	// 			}, 1000/this.fps);
	// 		}, () => console.log("Web Audio API cannot be initialized"));
			
	// 	}
	// }

	

	defineCustomElements(){
		customElements.define('waxml-xy-area', XY_area);
		customElements.define('waxml-xy-handle', XY_handle);
		customElements.define('waxml-meter', Meter);
		customElements.define('waxml-midi-controller', MIDIController);	
		customElements.define('waxml-inspector', Inspector);	

		customElements.define('waxml-variable-matrix', VariableMatrix);	
		customElements.define('waxml-variable-controller', VariableController);	
		customElements.define('waxml-snapshot-controller', SnapshotController);	
		customElements.define('waxml-snapshot-component', SnapshotComponent);	
		
		customElements.define('waxml-dynamic-mixer', DynamicMixer);	
		customElements.define('waxml-output-monitor', OutputMonitor);	
		customElements.define('waxml-linear-arranger', LinearArranger);
	}

	init(){
		if(!this.audioInited){
			this._ctx.resume().then(result => {
				this.audioInited = true;
				this.start("*[trig='auto'], *[start='auto']");
				
				setInterval(e => {
				//this.setVariable("currentTime", this._ctx.currentTime/this._xml.obj.parameters.timescale);
				}, 1000/this.fps);
			}, result => {
				// failure
				console.log("Web Audio API cannot be inited");
			});
		
		}
	}

	mute(){
		this._muteState = true;
		this.master.fadeOut(0.1);
	}

	unmute(){
		this._muteState = false;
		this.master.fadeIn(0.1);
	}

	get muted(){
		return this._muteState;
	}

	get XMLstring(){
		return this.parser.XMLstring;
	}

	toString(){
		return new XMLSerializer().serializeToString(this._xml);
	}


	updateFromString(str){
		return new Promise((resolve, reject) => {
			this.reset();
			let xml = this.parser.initFromString(str)
			.then(xml => {
				this._xml = xml;
				this.initGUI(xml);
				this.initAudio(xml);

				this.dispatchEvent(new CustomEvent("inited"));
				this.dispatchEvent(new CustomEvent("init"));
				resolve(xml);
			});
		});
	}

	updateFromFile(url){
		this.reset();

		return new Promise((resolve, reject) => {

			this.parser.init(url).then(xml => {
				this._xml = xml;
				this.initGUI(xml);
				this.initAudio(xml);

				this.dispatchEvent(new CustomEvent("inited"));
				this.dispatchEvent(new CustomEvent("init"));
				resolve(xml);
			});

		});
	}

	reset(){

		// this.plugins = [];
		this.convolvers = [];

		if(this._xml){
			if(this.GUI) this.GUI.remove(); // inte fixad än
			this._xml = this.removeObjects(this._xml);
		}
		
	}

	removeObjects(xml){
		if(xml.obj){
			if(xml.obj.disconnect){
				xml.obj.disconnect();
			}
			xml.obj = null;
			xml.audioObject = null;
		}
		[...xml.children].forEach(childNode => this.removeObjects(childNode));

		this.inputBusses.disconnectAll();
		return null;
	}

	initGUI(xmlDoc){
		this.GUI = new GUI(xmlDoc.parentNode, this);
	}

	initAudio(xmlDoc){

		this.master = this._xml.audioObject;

		//webAudioXML = xmlDoc.audioObject;
		//webAudioXML.touch = touches;

		// Det skulle vara snyggare att lyfta ut audio-in till en egen class 
		if(this.parser.allElements.mediastreamaudiosourcenode){
			navigator.getUserMedia({audio: true}, stream => this.onStream(stream), error => this.onStreamError(error));
		}


		new Connector(xmlDoc, this._ctx);
		this.plugins.forEach(plugin => {
			plugin.init();
			if(plugin.connect){
				let destination = this.getInputBus("#music").input;
				if(destination){
					plugin.connect(destination);
				}
				
			}
		});

		// make all variable elements broadcast their init values
		this.querySelectorAll("var").forEach(obj => {
			obj.update();
		});

		// set mix attributes (needs all children to be inited before execution)
		this.querySelectorAll("*[mix]").forEach(obj => {
			obj.update();
		});

		this.convolvers.forEach(entry => {
			entry.obj.connect(this.master.output);
		});

		this.inputBusses.all.forEach(bus => {
			this.querySelectorAll(bus.selector).forEach(obj => {
				bus.input.connect(obj.input);
			});
		});


	}

	initEvents(){

		// activate child-nodes to pass trig-events to parent
		this.querySelectorAll("Mixer").forEach(mixer => mixer.addEventsFromChildren());
	}


	onStream(stream){
		this.parser.allElements.mediastreamaudiosourcenode.forEach(inputNode => inputNode.obj.initStream(stream));
	}

	onStreamError(){
		console.warn("Audio input error");
	}

	getInputBus(selector){
		let destinations = [];
		this.querySelectorAll(selector).forEach(obj => {
			destinations.push(obj.input);
		});
		return this.inputBusses.getBus(selector, destinations);
	}

	start(selector="", options={}){
		
		if(!this._xml){return}

		let selectStr;
		if(!selector){
			selectStr = "*";
		} else if(selector.includes("[") || selector.includes("#") || selector.includes(".") ){
			// complex and correct selector expected
			selectStr = selector;
		} else if(selector.includes(":")){
			// special case for keydown:x and keyup:x
			selectStr = selector.split(",").map(sel => `*[noteon='${sel.trim()}'], *[start='${sel.trim()}']`).join(",");
		} else {
			// select both elements with attribute "start="selector" and class="selector"
			selectStr = selector.split(",").map(sel => `*[noteon='${sel.trim()}'], *[start='${sel.trim()}'], .${sel.trim()}`).join(",");
		}
		if(this._ctx.state != "running"){
			this.init();
		}
		this._xml.querySelectorAll(selectStr).forEach(XMLnode => {
			if(XMLnode.obj.start){
				XMLnode.obj.start(options);
			} else if(XMLnode.obj.noteOn){
				XMLnode.obj.noteOn(options);
			}
		});

		return this.callPlugins("start", selector, options);
		
		
	}

	trig(selector="", options={}){
		
		
		if(!this._xml){return}

		let selectStr;
		if(!selector){
			selectStr = "*";
		} else if(selector.includes("[") || selector.includes("#") || selector.includes(".") ){
			// complex and correct selector expected
			selectStr = selector;
		} else if(selector.includes(":")){
			// special case for keydown:x and keyup:x
			selectStr = selector.split(",").map(sel => `*[noteon='${sel.trim()}'], *[start='${sel.trim()}'], *[trig='${sel.trim()}']`).join(",");
		} else {
			// select both elements with attribute "start="selector", "trig="selector" and class="selector" and id="selector"
			selectStr = selector.split(",").map(sel => `*[noteon='${sel.trim()}'], *[start='${sel.trim()}'], *[trig='${sel.trim()}'], .${sel.trim()}, #${sel.trim()}`).join(",");
		}
		if(this._ctx.state != "running"){
			this.init();
		}
		
		this._xml.querySelectorAll(selectStr).forEach(XMLnode => {
			if(XMLnode.obj.start){
				XMLnode.obj.start(options);
			} else if(XMLnode.obj.noteOn){
				XMLnode.obj.noteOn(options);
			} else if(XMLnode.obj.trig){
				XMLnode.obj.trig(options);
			}
		});
		return this.callPlugins("trig", selector, options);
	}

	continue(selector="", options={}){
		if(!this._xml){return}

		if(selector){
			let selectStr = `*[start='${selector}']`;
			if(!selector){
				selectStr = "*";
			} else if(!(selector.includes("#") || selector.includes(".") || selector.includes("[") || selector.includes(":"))){
				// select both elements with attribute "start="selector" and class="selector"
				selectStr = selector.split(",").map(sel => `*[start='${sel.trim()}'], .${sel.trim()}`).join(",");
			}
			if(this._ctx.state != "running"){
				this.init();
			}
			this._xml.querySelectorAll(selectStr).forEach(XMLnode => {
				if(XMLnode.obj.continue){
					XMLnode.obj.continue();
				} 
			});
		}
		this.callPlugins("continue", selector, options);

	}

	resume(selector="", options={}){
		if(!this._xml){return}

		if(selector){
			let selectStr = `*[start='${selector}']`;
			if(!selector){
				selectStr = "*";
			} else if(!(selector.includes("#") || selector.includes(".") || selector.includes("[") || selector.includes(":"))){
				// select both elements with attribute "start="selector" and class="selector"
				selectStr = selector.split(",").map(sel => `*[start='${sel.trim()}'], .${sel.trim()}`).join(",");
			}
			if(this._ctx.state != "running"){
				this.init();
			}
			this._xml.querySelectorAll(selectStr).forEach(XMLnode => {
				if(XMLnode.obj.resume){
					XMLnode.obj.resume();
				} 
			});
		}
		this.callPlugins("resume", selector, options);
	}
	
	// check if "release" is used anywhere. Otherwise - remove it completely
	release(selector="", options={}){
		if(!this._xml){return}
		if(selector){
			let selectStr = `*[noteoff='${selector}'], *[stop='${selector}']`;
			if(!(selector.includes("#") || selector.includes(".") || selector.includes("[") || selector.includes(":"))){
				// select both elements with attribute "stop="selector" and class="selector"
				selectStr += ", " + selector.split(",").map(sel => `*[stop='${sel.trim()}'], .${sel.trim()}`).join(",");
			}
			this._xml.querySelectorAll(selectStr).forEach(XMLnode => {
				if(XMLnode.obj.stop){
					XMLnode.obj.stop(options);
				} else if(XMLnode.obj.noteOff){
					XMLnode.obj.noteOff(options);
				}
			});
		}
		this.callPlugins("release", selector, options);
	}



	stop(selector="", options={}){
		

		if(!this._xml){return}

		let selectStr;
		if(!selector){
			selectStr = "*";
		} else if(selector.includes("[") || selector.includes("#") || selector.includes(".") ){
			// complex and correct selector expected
			selectStr = selector;
		} else if(selector.includes(":")){
			// special case for keydown:x and keyup:x
			selectStr = selector.split(",").map(sel => `*[noteoff='${sel.trim()}'], *[stop='${sel.trim()}']`).join(",");
		} else {
			// select both elements with attribute "start="selector" and class="selector"
			selectStr = selector.split(",").map(sel => `*[noteoff='${sel.trim()}'], *[stop='${sel.trim()}'], .${sel.trim()}`).join(",");
		}

		this._xml.querySelectorAll(selectStr).forEach(XMLnode => {
			if(XMLnode.obj.stop){
				XMLnode.obj.stop(options);
			} else if(XMLnode.obj.noteOff){
				XMLnode.obj.noteOff(options);
			}
		});


		this.callPlugins("stop", selector, options);
	}
	

	// stop(selector = "*"){
	// 	this._xml.querySelectorAll(selector).forEach(XMLnode => {
	// 		if(XMLnode.obj && XMLnode.obj.stop){
	// 			XMLnode.obj.stop();
	// 		}
	// 	});
	// }

	registerPlugin(plugin){

		this.plugins.push(plugin);
		// consider returning an interface to
		// variables here
	}

	callPlugins(fn, arg1, arg2, arg3){
		let returnVal;
		this.plugins.forEach(plugin => {
			// console.log("callPlugins", fn, arg1, arg2, arg3)
			if(plugin.call){
				let v = plugin.call(fn, arg1, arg2, arg3);
				returnVal = returnVal || v;
			}
		});
		return returnVal;
	}

	addEventListener(name, fn){
		if(typeof name !== "string"){return}
		if(typeof fn !== "function"){return}
		this._listeners[name] = this._listeners[name] || [];
		this._listeners[name].push(fn);
	}
	removeEventListener(name, fn){
		if(this._listeners[name]){
			this._listeners[name] = this._listeners[name].filter(item => item != fn);
		}
	}

	dispatchEvent(e){
		this._listeners[e.type] = this._listeners[e.type] || [];
		this._listeners[e.type].forEach(fn => fn(e));
	}

	get statistics(){
		return {
			elementCount: this.parser.elementCount,
			followCount: this.parser.followCount
		}
	}

	get structure(){
		// returns the whole configuration in the following format:
		// [{name: name, children: children}]
		// children are either child nodes or parameters

		if(!this._xml){return}

		let counter = 0;
		let parameters = [];
		let level = 0;
		let audioObjects = [];

		var retrieveObjects = (el, parentObj = {}, params = {}) => {
			let obj = {};

			if(el.obj){
				obj.name = el.id || [...el.classList].join(".") || el.nodeName;
				obj.label = el.getAttribute("name") || obj.name;
				obj.children = [];
				obj.type = el.nodeName;
				obj.level = (parentObj.level || 0) + 1;
				obj.id = counter++;
				obj.target = el.obj;
				obj.parent = parentObj;
				obj.path = el.obj.path;

				audioObjects.push(obj);

				if(obj.type == "var"){
					// only one parameter - 'value' - for var-elements
					// assign propertieas directly to obj
					// let param = el.obj.getWAXMLparameters().pop();
					obj.min = el.obj.minIn;
					obj.max = el.obj.maxIn;
					obj.default = el.obj.default || el.obj.value;
					obj.conv = 1;
					parameters.push(obj);

				} else {
					// add webAudioXML parameters
					el.obj.getWAXMLparameters().forEach(paramObj => {
						paramObj.id = counter++;
						// add to tree
						obj.children.push(paramObj);
						paramObj.parent = obj;
						paramObj.target = obj.target;
						paramObj.path = obj.path + "." + paramObj.name;
						paramObj.label = paramObj.label || paramObj.name;

						// add to linear list with parameter objects
						parameters.push(paramObj);
					});
				}
				
				


				// add parameters for audioNode
				if(el.obj._node && !params.onlyXML){
					for(let key in el.obj._node){
						let param = el.obj._node[key];
						if(param instanceof AudioParam){
							let range = WebAudioUtils.paramNameToRange(key);
							let paramObj = {
								id: counter++,
								name: key,
								label: key,
								target: param,
								min: range.min,
								max: range.max,
								conv: range.conv,
								level: obj.level + 1,
								default: range.default,
								path: obj.path + "." + key,
								parent: obj
							}
							// add to tree
							obj.children.push(paramObj);
							// add to linear list with parameter objects
							parameters.push(paramObj);
						}
					}
				}


				// add children to containers
				Array.from(el.children).forEach(childNode => {
					let childObj = retrieveObjects(childNode, obj, params);
					if(childObj){obj.children.push(childObj)}
				});
			}
			return obj;
		}
		let struct = {
			parameters: parameters,
			audioObjects: audioObjects,
			tree: retrieveObjects(this._xml),
			XMLtree: retrieveObjects(this._xml, {}, {onlyXML:true}),
			xml: this._xml.outerHTML
		}
		return struct;
	}

	get _variables(){
		return this.ui.variables;
	}

	set _variables(val){
		this.ui.variables = val;
	}

	get variables(){
		return this.ui.variables;
	}

	set variables(val){
		this.ui.variables = val;
	}

	addSnapshot(snapshot){
		this.snapShots.push(snapshot);
	}

	recallSnapshot(selector){
		this.GUI.HTML.querySelectorAll(`waxml-snapshot${selector}`).forEach(snapshotComponent => {
			snapshotComponent.sendData();
			snapshotComponent.parentElement.selectComponent(snapshotComponent);
		});
		this.snapShots.filter(snapShot => snapShot.id == selector).forEach(snapShot => {

		});
	}

	setVariable(key, val, transitionTime, fromSequencer){

		// move to a separate object
		// read transitionTime
		let xTime = transitionTime
		if(this._xml){
			if(typeof xTime == "undefined"){
				xTime = this.master.getParameter("transitionTime");
			} 
		}
		xTime = xTime || 0.01;

		let floatVal = parseFloat(val);
		if(typeof floatVal == "number"){
			let listener = this._ctx.listener;
			switch(key){
				case "positionx":
				case "positionX":
				listener.positionX.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
				case "positiony":
				case "positionY":
				listener.positionY.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
				case "positionz":
				case "positionZ":
				listener.positionZ.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
	
				case "forwardx":
				case "forwardX":
				listener.forwardX.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
				case "forwardy":
				case "forwardY":
				listener.forwardY.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
				case "forwardz":
				case "forwardZ":
				listener.forwardZ.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
	
				case "upx":
				case "upX":
				listener.upX.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
				case "upy":
				case "upY":
				listener.upY.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
				case "upz":
				case "upZ":
				listener.upZ.setTargetAtTime(floatVal, this._ctx.currentTime, xTime);
				break;
			}
			if(val == floatVal){val = floatVal}
		}
		
		
		this.ui.setVariable(key, val, transitionTime, fromSequencer);

		this.plugins.forEach(plugin => {
			if(plugin.setVariable){
				plugin.setVariable(key, val);
			}
		});


		// Update
		if(this.GUI){
			let vcsSelector = `waxml-variable-controller[watchedvariable="${key}"]`;
			[...this.GUI.HTML.querySelectorAll(vcsSelector),
			...document.querySelectorAll(vcsSelector)].forEach(vc => vc.value = val);
	
		}
		

	}

	set variablesToStore(varNames){
		this.ui.variablesToStore = varNames;
	}

	get variablesToStore(){
		return this.ui.variablesToStore;
	}
	
	getVariable(key){
		switch(key){

			case "positionX":
			return this._ctx.listener.positionX.value;
			break;
			case "positionY":
			return this._ctx.listener.positionY.value;
			break;
			case "positionZ":
			return this._ctx.listener.positionZ.value;
			break;

			case "forwardX":
			return this._ctx.listener.forwardX.value;
			break;
			case "forwardY":
			return this._ctx.listener.forwardY.value;
			break;
			case "forwardZ":
			return this._ctx.listener.forwardZ.value;
			break;

			default:
			return this.ui.getVariable(key);
			break;

		}
		
	}

	// InteractionManager
	get lastGesture(){
		return this.ui.lastGesture;
	}

	initSensors(){
		this.ui.initSensors();
	}

	addSequence(name = "default", events){
		this.ui.addSequence(name, events);
	}

	clearSequence(name = "default"){
		this.ui.clearSequence(name);
	}

	getSequence(name = "default"){
		return this.ui.getSequence(name);
	}

	getSequenceData(options = {}){
		let name = options.name || "default";
		let seq = this.ui.getSequence(name);
		return seq.getData(options);
	}

	copyLastGestureToClipboard(){
		this.ui.copy();
	}

	playLastGesture(){
		this.ui.playLastGesture();
	}

	playSequence(name){
		this.ui.play(name);
	}

	querySelectorAll(selector){
		let arr = [];
		switch(selector){
			case "master":
			arr.push(this.master);
			break;

			default:
			this._xml.querySelectorAll(selector).forEach(xml => {
				arr.push(xml.obj);
			});
			break;
		}

		
		return arr;
	}
	querySelector(selector){

		switch(selector){
			case "master":
			this.master;
			break;

			default:
			let xml = this._xml.querySelector(selector);
			if(xml){
				return xml.obj;
			}
			break;
		}
		return undefined;
	}

	getConvolver(path){
		let targetEntry = this.convolvers.find(entry => entry.path == path);
		let convolverNodeObject;
		if(!targetEntry){
			convolverNodeObject = new ConvolverNodeObject(this, path);
			this.convolvers.push({path: path, obj: convolverNodeObject});
		} else {
			convolverNodeObject = targetEntry.obj;
		}
		return convolverNodeObject;
	}

	// a way to create WAXML objects from iMusicXML
	createObject(xmlNode){
		return this.parser.createObject(xmlNode);
	}


	// returns the current value for an (imagined) oscillator with 
	// the frequency of 1 starting at audioContext init
	OSC(freq = 1){
		return Math.sin(this._ctx.currentTime / 2 * freq * Math.PI);
	}

	initLinearArranger(structure){
		this.GUI.initLinearArranger(structure);
	}

	log(message){
		this.GUI.log(message);
	}

	toSignificant(floatVal){
		return WebAudioUtils.toSignificant(floatVal);
	}

	pathToFileName(path){
		return WebAudioUtils.pathToFileName(path);
	}

	visualize(obj){
		return this.GUI.visualize(obj);
	}
	visualFadeOut(data){
		this.GUI.visualFadeOut(data);
	}

	scrollArrangeWindow(time){
		this.GUI.scrollArrangeWindow(time);
	}

}

WebAudio.prototype.noteOn = WebAudio.prototype.trig;
WebAudio.prototype.noteOff = WebAudio.prototype.release;



let webAudioXML = new WebAudio();

window.webAudioXML = webAudioXML;
window.waxml = webAudioXML;
module.exports = WebAudio;



/*

	Test:
	Files on remote servers. Cross-domain issues
	PeriodicWave data. Problem: Uncaught (in promise) SyntaxError: Unexpected token ' in JSON at position 2

	Important:
	* Triggering of envelopes from external calls
	* check ADSR case insensitivity
	* Check envelope separation by comma and space
	Make a working MIDI example with or without webaudio-controls.
	* Make "follow"-attributes work with commas and spaces
	* Implement CSS-selector for Audio elements - !remember case insensitivity!
	Add "Channel" as an element that is a blueprint for a Chain element inside a Mixer element. The Mixer then, needs a "channels"-attribute
	and a routing syntax to allow for multiple channels. (possibly nth-child)
	Make sure external documents does not inherit variables like timeUnit

	Change "max" to "level" (supporting multiple values)?? Maybe not. Does this only apply to envelopes?

	* Synth does not react on gain-attribute

	Add map="MIDI" for frequency for initial values.
	Implement webAudioXML.setVariable(variableName, value);

	* se till att delay ärvs till childNodes

	* Lägg till ränder för clienten


	Arpeggio

	DeviceMotion (to documentation and implementation)

	Advanced circular mapping (alpha, beta, gamma) inkl offset
	Map Regions



	Implement:
	Simple GUI
  * AudioBufferSourceNode

	Wish:
	Advanced envelope with multiple times, levels and curves plus gate and release - imitate supercollider

	Bypass nodes
	Debug
	Controls = debug


	Not working:
	* https://codepen.io/hanslindetorp/pen/yLywNaW
	* init sensors


	* Add easy javascript access to nodes

	* Send can't be first in a chain
	* Check delay!

	* Do I need to floor steps in midi-conversion?

	* Flytta inläsningen av stored events
	* Kolla så att play gesture resumer ctx


	Rensa timeouts i sequence
	* Lägg till PADs på touchArea
	* portamento på synth

	Kolla dynamisk pan

	uppdatera lastGesture!

	Bugs and ideas from DT2213 at KTH 2020-06-04
	* Offset problem for interactionArea when window is scrolled
	* init() needs to be called. Doesn't alway happen from touching touchArea
	* comma separation on "map" breaks Math.pow(x,y)
	* sequencer interfers with live events
	* performance is sometimes low. I.e. slow  update for touchMove events


	Wishes:
	* Use internal variables and properties in "follow" (inkl relative links -> i.e. this.parent.frequency)
	* Better documentation on nmp installation and init()
	* Better documentation on javascript hijacking graph
	* Better structured code for contributions from the community
	* Ta bort


*/

},{"./Connector.js":6,"./ConvolverNodeObject.js":7,"./GUI.js":11,"./GUI/LinearArranger.js":12,"./GUI/OutputMonitor.js":13,"./HL2.js":15,"./InputBusses.js":16,"./Inspector.js":17,"./InteractionManager.js":18,"./MIDIController.js":21,"./Meter.js":23,"./Parser.js":27,"./Variable.js":32,"./VariableController.js":34,"./VariableMatrix.js":35,"./WebAudioUtils.js":39,"./XY_area.js":40,"./XY_handle.js":41,"./dynamic-mixer/Channel.js":42,"./dynamic-mixer/Mixer.js":43,"./musical-structure/Music.js":45,"./variable-matrix/SnapshotComponent.js":49,"./variable-matrix/SnapshotController.js":50}],39:[function(require,module,exports){

class WebAudioUtils {



}

var rxp = /[$][{]([a-z0-9:_]+)[}]|[$]([a-z0-9:_.]*)|var[(]([a-z0-9:_]+)[)]/gi;
var rxpVal = /([a-z0-9:_\+\-\$\*\/\ \.]+)/gi;
var ENVrxp = /[€]([a-z0-9:_.]*)/gi;


WebAudioUtils.rxp = rxp;
WebAudioUtils.rxpVal = rxpVal;
WebAudioUtils.timeWindow = 10;

WebAudioUtils.typeFixParam = (param, value) => {

	//param = param.toLowerCase();
	let arr;
	let floatVal;

	// Irriterande koll för att se om value redan är konverterad till en 
	// Watcher. Det går inte att skriva if(value instanceof Watcher)
	// för det blir en rundgång i dependencies om jag importerar klassen
	// Watcher här. Tänk istället igenom ordningen för hur hela XML-trädet
	// ska parsas så att allt sker i rätt ordning.
	if(typeof value == "object" && value.type == "watcher"){
		return value;
	}
	if(WebAudioUtils.getEnvelopeName(value)){
		return value;
	}
	if(WebAudioUtils.nrOfVariableNames(value)){
		let firstChar = value.charAt(0);
		if(firstChar == "[" || firstChar == "{"){
			// JSON array or object
			//value = WebAudioUtils.replaceVariableNames(value, '"');
			value = WebAudioUtils.wrapExpression(value);
			try {
				// multi dimensional array
				value = JSON.parse(value);
			} catch {

			}
		}
		return value;
	}

	switch(param){

		case "volume":
		case "gain":
		case "convolutionGain":
		if(typeof value == "string"){
			if(value.includes("dB") || value.includes("db")){
				value = WebAudioUtils.dbToPower(value);
			} else {
				value = parseFloat(value);
			}
		}
		break;

		case "normalize":
		case "loop":
		value = value == "true";
		break;

		// iMusic objects
		case "pan":
		case "tempo":
		case "fadeTime":
		case "loopActive":
		case "blockRetrig":
		case "repeat":
		case "xrelease": // detta krockar med relase i WebAudioXML
		case "active":

		// WebAudioXML _objects
		case "transitionTime":
		case "transitiontime":

		// Web Audio Synth
		case "voices":
		case "portamento":
		case "max":
		case "delay":

		// AudioNodes

		//filter
		case "frequency":
		case "detune":
		case "Q":

		// delay
		case "delayTime":

		// compressor
		case "threshold":
		case "knee":
		case "ratio":
		case "reduction":
		case "attack":
		case "release":

		// AudioBufferSourceNode
		case "playbackRate":
		case "loopStart":
		case "loopEnd":


		// waxml
		case "transitionTime":
		v = parseFloat(value);
		if(!isNaN(v)){value = v};
		break;


		case "maxDelayTime":
		v = parseFloat(value);
		if(!isNaN(v)){value = v};
		value = value || 1;
		break;

		case "adsr":
		arr = WebAudioUtils.split(value);
		value = {
			attack: parseFloat(arr[0]),
			decay: parseFloat(arr[1]),
			sustain: parseFloat(arr[2]),
			release: parseFloat(arr[3])
		};
		break;

		case "map":
		// str is a comma separated string with at least four values
		// minIn, maxIn, minOut, mixOut
		// potentially also a fifth value indicating Math.power
		arr = WebAudioUtils.split(value);
		value = {};
		value.minIn = parseFloat(arr.shift());
		value.maxIn = parseFloat(arr.shift());
		value.minOut = parseFloat(arr.shift());
		value.maxOut = parseFloat(arr.shift());

		value.minIn = typeof value.minIn == "number" ? value.minIn : 0;
		value.maxIn = typeof value.maxIn == "number" ? value.maxIn : 1;
		value.minOut = typeof value.minOut == "number" ? value.minOut : 0;
		value.maxOut = typeof value.maxOut == "number" ? value.maxOut : 1;

		let conv = 1;
		if(arr.length){
			conv = arr.shift();
			let float = parseFloat(conv)
			conv = float == conv ? float : conv;
		}
		// allow for multiple values
		value.conv = conv;
		break;

		case "level":
		case "range":
		case "curve":
		case "follow":
		case "mapin":
		case "mapout":
		case "times":
		case "values":
		case "channel":
		case "dynamictimes":
		case "dynamicvalues":
		case "targetvariables":
		case "peak":
		value = WebAudioUtils.split(value);
		break;

		case "convert":
		value = WebAudioUtils.split(value, ";");
		break;


		case "steps":
		try {
			// multi dimensional array
			value = JSON.parse(value);
		} catch {
			// single array
			value = [WebAudioUtils.split(value)];
		}
		break;

		case "value":
		// try to convert to Number if possible
		floatVal = parseFloat(value);
		if(!Number.isNaN(floatVal)){
			value = floatVal;
		}
		break;


		// iMusic
		case "pos":
		break;

		default:
		floatVal = parseFloat(value);
		// if(!Number.isNaN(floatVal)){
		// 	value = floatVal;
		// }
		if(floatVal == value){
			value = floatVal;
		}
		break;

	}
	return value;

}

WebAudioUtils.convert = (x=1, conv) => {
	switch (typeof conv) {
		case "number":
			return Math.pow(x, conv);
		break;
		case "string":
			return eval(str);
		break;
		default:
			return x;
	}
}

WebAudioUtils.attributesToObject = attributes => {

	var obj = {};

	if(!attributes){return obj}
	// if(!attributes.length){return obj}


	[...attributes].forEach(attribute => {
		param = WebAudioUtils.caseFixParameter(attribute.name);
		
		if(param == "sync-points"){
			console.log(param);
		}
		let value = WebAudioUtils.typeFixParam(param, attribute.value);
		obj[param] = value;
	});

	// for (let i in attributes){
	// 	if(attributes.hasOwnProperty(i)){

	// 		// XML parser is inconsistent with the document
	// 		// When the XML DOM is embeded inside HTML some
	// 		// browsers interpret all attributes as written
	// 		// with capital letters
	// 		let param = attributes[i].name.toLowerCase();

	// 	  	param = WebAudioUtils.caseFixParameter(param);

	// 		let value = WebAudioUtils.typeFixParam(param, attributes[i].value);
	// 		obj[param] = value;
	// 	}

	// }
	return obj;
}



WebAudioUtils.caseFixParameter = param => {

	param = param.toLowerCase();

	switch(param){
		case "q":
		param = "Q";
		break;

		case "delaytime":
		param = "delayTime";
		break;

		case "fadetime":
		param = "fadeTime";
		break;

		case "loopend":
		param = "loopEnd";
		break;

		case "loopstart":
		param = "loopStart";
		break;

		case "looplength":
		param = "loopLength";
		break;

		case "playbackrate":
		param = "playbackRate";
		break;

		case "maxdelaytime":
		param = "maxDelayTime";
		break;

		case "coneinnerangle":
		param = "coneInnerAngle";
		break;

		case "coneouterangle":
		param = "coneOuterAngle";
		break;

		case "coneoutergain":
		param = "coneOuterGain";
		break;

		case "distancemodel":
		param = "distanceModel";
		break;

		case "maxdistance":
		param = "maxDistance";
		break;

		case "orientationx":
		param = "orientationX";
		break;

		case "orientationy":
		param = "orientationY";
		break;

		case "orientationz":
		param = "orientationZ";
		break;

		case "panningmodel":
		param = "panningModel";
		break;

		case "positionx":
		param = "positionX";
		break;

		case "positiony":
		param = "positionY";
		break;

		case "positionz":
		param = "positionZ";
		break;

		case "refdistance":
		param = "refDistance";
		break;

		case "rollofffactor":
		param = "rolloffFactor";
		break;

		case "convolutiongain":
		param = "convolutionGain";
		break;

		case "transitiontime":
		param = "transitionTime";
		break;

		case "timeunit":
		param = "timeUnit";
		break;

		case "crossfade":
		param = "crossFade";
		break;

		// Ambient Audio / Granular
		case "randomposition":
		param = "randomPosition";
		break;

		case "randomduration":
		param = "randomDuration";
		break;

		case "randomdetune":
		param = "randomDetune";
		break;

		case "framerate":
		param = "frameRate";
		break;

		case "falloffratio":
		param = "fallOffRatio";
		break;

		case "smoothderivative":
		param = "smoothDerivative";
		break;

		case "reloffset":
		param = "relOffset";
		break;

  	}


  	return param;
}

WebAudioUtils.addAudioPath = (path, fileName) => {
	if(fileName.includes("//")){
		return fileName;
	}
	var pathLength = path.length;
	path = path == fileName.substr(0, pathLength) ? "" : WebAudioUtils.widthEndingSlash(path);
	return path + fileName;
}

WebAudioUtils.widthEndingSlash = (str) => {
	return str.substring(str.length-1) == "/" ? str : str + "/";
}

WebAudioUtils.MIDInoteToFrequency = note => {
	return 440 * Math.pow(2, (note - 69) / 12);
}
WebAudioUtils.centToPlaybackRate = val => {
	return Math.pow(2, val / 1200);
}

WebAudioUtils.playbackRateToCent = val => {
	return Math.log2(val) * 1200;
}

WebAudioUtils.dbToPower = value => {
	return Math.pow(2, parseFloat(value) / 3);
}

WebAudioUtils.powerTodB = (power=Number.MIN_VALUE, referencePower=1) => {
	return 10 * Math.log10(power / referencePower);
}


WebAudioUtils.split = (str, separator) => {
	if(typeof str != "string"){
		console.log(str);
	}
	separator = separator || str.includes(";") ? ";" : str.includes(",") ? "," : str.includes("...") ? "..." : " ";
	let arr = str.split(separator).map(item => {
		item = item.trim();
		let i = parseFloat(item);
		return i == item ? i : item;
	});
	arr = arr.filter(item => item !== "");
	return arr;
}



WebAudioUtils.getParameters = node => {

	let params = [];


	Object.keys(node.__proto__).forEach(key => {

		let param = node[key];
		if(param instanceof AudioParam){

			let obj = {};
			obj.audioParam = param;
			obj.label = key;
			let attr = {};
			obj.attributes = attr;
			params.push(obj);

			obj.nodeName = "input";
			attr.type = "range";
			attr.value = param.value;

			let range = WebAudioUtils.paramNameToRange(key);
			attr.min = range.min;
			attr.max = range.max;
			attr.conv = range.conv;

			attr.step = (attr.max - attr.min) / 100;

		} else if(param instanceof String){
			console.log(key, node[key]);
		}

	});

	return params;
}


WebAudioUtils.paramNameToRange = (name) => {
	range = {};

	switch(name){


		case "frequency":
			range.default = 440;
			range.min = 0;
			range.max = 20000; //22050;
			range.conv = 2; //"Math.pow(10, x*3)/1000";
			break;

		case "detune":
			range.default = 0;
	  	range.min = -4800;
	  	range.max = 4800;
	  	range.conv = 1;
	  	break;

		case "Q":
		case "q":
			range.default = 0;
	  	range.min = 0;
	  	range.max = 100;
	  	range.conv = 1;
	  	break;

		case "playbackRate":
		case "playbackrate":
			range.default = 1;
	  	range.min = 0;
	  	range.max = 5;
	  	range.conv = 2;
	  	break;

		case "pan":
			range.default = 0;
	  	range.min = -1;
	  	range.max = 1;
	  	range.conv = 1;
	  	break;

		case "trigger":
			range.default = 0;
	  	range.min = 0;
	  	range.max = 30;
	  	range.conv = 1;
	  	break;

		case "gain":
		range.default = 1;
	  	range.min = 0;
	  	range.max = 4;
	  	range.conv = 2;
		break;

		case "positionX":
		case "positionY":
		case "positionZ":
		range.default = 0;
		range.min = -10;
		range.max = 10;
		range.conv = 1;
		break;

		case "coneInnerAngle":
		case "coneOuterAngle":
		case "orientationX":
		case "orientationY":
		case "orientationZ":
		range.default = 360;
		range.min = 0;
		range.max = 360;
		range.conv = 1;
		break;

		case "var":
		range.default = 50;
		range.min = 0;
		range.max = 100;
		range.conv = 1;
		break;
		


		default:
		range.default = 1;
	  	range.min = 0;
	  	range.max = 1;
	  	range.conv = 1;
	  	break;

	}

	return range;
}

WebAudioUtils.convertUsingMath = (x, conv) => {

}

WebAudioUtils.getEnvelopeName = (str = "") => {
	if(typeof str != "string"){
		return false;
	} else {
		return [...str.matchAll(ENVrxp)].map(match => match[1]).pop();
	}
}
WebAudioUtils.replaceEnvelopeName = (str = "") => {
	return str.replaceAll(ENVrxp, () => "x");
}

WebAudioUtils.getVariableNames = (str = "") => {
	if(typeof str != "string"){
		return [];
	} else {
		return [...str.matchAll(rxp)].map(match => match[1] || match[2] || match[3]);
	}
}

WebAudioUtils.nrOfVariableNames = (str = "") => {
	// regExp
	if(typeof str != "string"){return 0};

	// ${x} || $x || var(x) -> this.getVariable(x)
	return [...str.matchAll(rxp)].length;
}

WebAudioUtils.replaceVariableNames = (str = "", q = "") => {
	if(typeof str != "string"){return 0};
	// regExp
	return str.replaceAll(rxp, (a, b, c, d, e, f) => {
		let arr = (b || c || d).split(".");
		let varName = arr[0];
		let prop = arr[1] || "value";
		return `${q}me.getVariable('${varName}').${prop}${q}`;
	});
}

WebAudioUtils.replaceVectorDistMethod = (str = "") => {
	if(typeof str != "string"){return 0};

	return str.replaceAll("dist(", "me.getVectorDist(");
}

WebAudioUtils.wrapExpression = (str = "", q = '"') => {
	if(typeof str != "string"){return 0};	

	return str.replaceAll(rxpVal, a => parseFloat(a) == a ? a : a == " " ? "" : q + a + q);
}

WebAudioUtils.strToVariables = (str = "", callerNode, variableType) => {
	// regExp
	// ${x} || var(x) -> this.getVariable(x)
	// This is not the right place for this function. It should rather be an inherited function fraom 
	// a base class.
	if(typeof str != "string"){return {}};
	let variables = {};

	[...str.matchAll(rxp)].forEach(match => {
		let variable = match[1] || match[2] || match[3];
		let parentObj = WebAudioUtils.getVariableContainer(variable, callerNode, variableType);
		variables[variable] = parentObj[variable];
	});

	return variables;
}



WebAudioUtils.getVariableContainer = (variable, callerNode, variableType) => {
	let target;
	let curNode = callerNode;
	let rootNode = curNode.getRootNode();
	variable = variable.split(".").shift();
	while(!target && curNode != rootNode){
		if(curNode.obj && curNode.obj.getVariable(variable) instanceof variableType){
			// if target is the name of a variable that is specified
			// for a parent object (at any distans from xmlNode)
			// as a dynamic variable object using the "var" element
			target = curNode.obj;
		}
		curNode = curNode.parentNode;
	}
	return target;
}


WebAudioUtils.findXMLnodes = (callerNode, attrName, str) => {
	let targets = [];
	let curNode = callerNode.parentNode;
	let rootNode = curNode.getRootNode();
	while(!targets.length && curNode != rootNode){
		targets = curNode.querySelectorAll(`:scope > Envelope[${attrName}='${str}']`);
		curNode = curNode.parentNode;
	}
	return [...targets];
}

WebAudioUtils.toSignificant = (floatVal, nrOfSignificantFigures = 2) => {
	let decimals = Math.ceil(Math.max(0, nrOfSignificantFigures - Math.log(floatVal || 1)/Math.log(10)));
	return floatVal.toFixed(decimals);
}

WebAudioUtils.pathToFileName = (path) => {
	let fileName = path.split("/").pop().split(".")[0];
	return fileName;
}


// Function to calculate the distance from point C to the line formed by points A and B
// Made by ChatGPT. But is it correct?
WebAudioUtils.distanceFromPointToLine = (pointA, pointB, pointC) => {
  const numerator = Math.abs(
    (pointB.y - pointA.y) * pointC.x - (pointB.x - pointA.x) * pointC.y + pointB.x * pointA.y - pointB.y * pointA.x
  );
  const denominator = Math.sqrt(Math.pow(pointB.y - pointA.y, 2) + Math.pow(pointB.x - pointA.x, 2));

  return numerator / denominator;
}

WebAudioUtils.crossFadeIn = (length = 10) => {
	let float32 = new Float32Array(length+1);
	for(let i = 0; i<=length; i++){
		float32[i] = Math.cos((1.0 - i / length) * 0.5*Math.PI);
	}
	return float32; 
}

WebAudioUtils.crossFadeOut = (length = 10) => {
	let float32 = new Float32Array(length+1);
	for(let i = 0; i<=length; i++){
		float32[i] = Math.cos(i / length * 0.5*Math.PI);
	}
	return float32;
}






module.exports = WebAudioUtils;

},{}],40:[function(require,module,exports){


class XY_area extends HTMLElement {

	constructor(){
		super();
	}


	connectedCallback(){
		// grid

		let columns = parseInt(this.getAttribute("columns") || 1);
		let rows = parseInt(this.getAttribute("rows") || 1);

		if(columns * rows > 1){
			let gridColor = this.getAttribute("grid-color") || "black";

			let colWidth = 100 / columns;
			let rowHeight = 100 / rows;
	
			this.style.backgroundImage = `linear-gradient(${gridColor} 1px, transparent 0),
			linear-gradient(90deg, ${gridColor} 1px, transparent 0)`;
			this.style.backgroundSize = `${colWidth}% ${rowHeight}%`;

		}


		let extCtrl = this.getAttribute("external-control");
		if(extCtrl){
			extCtrl = extCtrl.split(",");
			extCtrl.forEach((str, i) => extCtrl[i] = str.trim());
			this.externalControl = extCtrl;
		}



		this.style.touchAction = "none";
		this.style.display = "inline-block"; // not good

		let w = parseFloat(this.getAttribute("width")) || 200;
		let h = parseFloat(this.getAttribute("height")) || 200;
		this.style.width =  `${w}px`;
		this.style.height =  `${h}px`;
		this.style.boxSizing = "border-box";
		this.style.backgroundColor = this.getAttribute("background-color") || "#CCC";
		this.style.border = this.getAttribute("border") || "1px solid black";

		this.style["-webkit-touch-callout"] = "none"; /* iOS Safari */
    	this.style["-webkit-user-select"] = "none"; /* Safari */
    	this.style["-khtml-user-select"] = "none"; /* Konqueror HTML */
		this.style["-moz-user-select"] = "none"; /* Old versions of Firefox */
        this.style["-ms-user-select"] = "none"; /* Internet Explorer/Edge */
        this.style["user-select"] = "none"; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */


		this.colWidth = w / columns;
		this.rowHeight = h / rows;
		
		this.type = this.getAttribute("type") || "square";
		switch(this.type){
			case "square":
			break;

			case "circle":
			this.style.borderRadius = `${parseFloat(this.style.width) / 2}px`;
			break;
		}


		this.initialRect = this.getBoundingClientRect();

		let catchHandles = this.querySelectorAll("waxml-xy-handle[catch]");
		if(catchHandles.length){
			this.style.cursor = "pointer";
			let eventName = catchHandles[0].getAttribute("catch");
			if(eventName == "true"){eventName = "pointerdown"}
			this.addEventListener(eventName, e => {
				let data = {
					clientX: e.clientX,
					clientY: e.clientY,
					pointerId: e.pointerId,
					preventDefault: () => {}
				}
				catchHandles.forEach(handle => {
					let br = handle.getBoundingClientRect();
					data.offsetX = -br.width / 2;
					data.offsetY = -br.height / 2;
					
					handle.pointerDown(data);
					handle.pointerMove(data);
				});
			});
		} 
		
	}



	rectOffset(rect, pix = 0){
		return new DOMRectReadOnly(rect.x-pix, rect.y-pix, rect.width+pix*2, rect.height+pix*2);
	}

	insideRect(point, rect){
		return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
	}

	pointsWithMatchingID(points){

		let arr = [];

		if(points instanceof Array){
			points.forEach(point => {
				if(point instanceof Object){
					if(this.externalControl.filter(id => point.id == id || id == "true").length > 0){
						arr.push(point);
					}
				}
			});
		} else if(points instanceof Object){
			Object.entries(points).forEach(([pointID, point]) => {
				if(point instanceof Object){
					if(this.externalControl.filter(id => pointID == id || id == "true").length > 0){
						point.id = pointID;
						arr.push(point);
					}
				}
			});
		}
		
		return arr;
	}

	pointsOver(points){
		points = this.pointsWithMatchingID(points);

		this.querySelectorAll("waxml-xy-handle").forEach(handle => {
			let br = handle.getBoundingClientRect();
			br = this.rectOffset(br, 25);
			let inside = false;
			points.forEach(point => inside = this.insideRect(point, br) || inside);

			if(inside) handle.classList.add("remoteOver");
			else handle.classList.remove("remoteOver");	

			// extra safety to stop handles from beeing controlled
			handle.remoteID = 0;
			handle.classList.remove("remoteControl");
		});	
		
	}

	remoteControl(points){
		points = this.pointsWithMatchingID(points);

		let handles = [...this.querySelectorAll("waxml-xy-handle")];
		handles.forEach(handle => {
			let br, point;

			if(handles.length > 1){
				// select corresponding handle
				if(handle.remoteID){
					br = this.getBoundingClientRect();
					point = points.filter(point => this.insideRect(point, br) && point.id == handle.remoteID).pop();
				} else {
					br = handle.getBoundingClientRect();
					br = this.rectOffset(br, 25);
					point = points.filter(point => {
						let pointIsInUse = handles.filter(h => h.remoteID == point.id).length > 0;
						let isInside = this.insideRect(point, br);
						// if(isInside && pointIsInUse > 0){
						// 	console.log("colliding");
						// }
						return isInside && pointIsInUse == 0;
					}).pop();
				}
			} else {
				// move the only one if inside XY-area
				br = this.getBoundingClientRect();
				point = points.filter(point => this.insideRect(point, br)).pop();
			}
			
			
			if(point){
				//points = points.filter(point => !this.insideRect(point, br));

				handle.remoteID = point.id;

				let val = this.coordinateTovalue(point);
				handle.value = val;

				if(handle.direction.x){
					handle.style.left = `${handle.x * handle.boundRect.width}px`;
				}
				if(handle.direction.y){
					handle.style.top = `${handle.y * handle.boundRect.height}px`;
				}
				handle.dispatchEvent(new CustomEvent("input"));

				handle.classList.add("remoteControl");
				
			} else {
				handle.remoteID = 0;
				handle.classList.remove("remoteControl");
			}	
		});	
		
	}

	coordinateTovalue(point){

		let br = this.getBoundingClientRect();
		let x = (point.x-br.left)/br.width;
		let y = (point.y-br.top)/br.height;
		x = Math.max(0, Math.min(1, x));
		y = Math.max(0, Math.min(1, y));
		return {x: x, y: y}
	}


}

module.exports = XY_area;

},{}],41:[function(require,module,exports){
var WebAudioUtils = require('./WebAudioUtils.js');

class XY_handle extends HTMLElement {

	constructor(){
		super();
	}


	connectedCallback() {

		this.style.position = "absolute";
		this.style.cursor = "pointer";

		// ensure that the XY_area has a specified position
		// It seems like this one is nessecary
		this.parentElement.style.position = this.parentElement.style.position || "relative";

		let w = this.getAttribute("width") || this.getAttribute("size")  || "20px";
		let h = this.getAttribute("height") || this.getAttribute("size") || "20px";

		if(w == "grid"){
			// set size to grid
			w = `${this.parentElement.colWidth || 20}px`;
			h = `${this.parentElement.rowHeight || 20}px`;
		}

		let icon = this.getIcon(this.getAttribute("icon"));
		if(icon){
			this.innerHTML = icon;
			this.style.width = w;
			this.style.height = h;
			this.style.padding = "0px";
		} else {
			this.style.boxSizing = "border-box";
			this.style.minWidth = w;
			this.style.minHeight = h;
			this.style.backgroundColor = this.getAttribute("background-color") || "#555";
			this.style.color = this.getAttribute("color") || "#fff";
			this.style.borderRadius = parseFloat(this.style.minWidth) / 2 + "px";
			this.style.fontFamily = "sans-serif";
			this.style.fontSize = this.getAttribute("font-size") || "10px";
			this.style.textAlign = "center";
			this.style.verticalAlign = "middle";
			this.style.lineHeight = "1.3em";
			this.style.padding = "3px";
			this.style.border = "2px solid black";
		}
		this.initialRect = this.getBoundingClientRect();
		let parentRect = this.parentNode.initialRect;
		this.initRects();
		this.effectiveArea = {
			left: this.initialRect.width / 2,
			top: this.initialRect.height / 2,
			width: parentRect.width - (this.initialRect.width * 1),
			height: parentRect.height - this.initialRect.height
		}

		let dir = this.getAttribute("direction") || "xy";
		this.direction = {
			x: dir.includes("x"),
			y: dir.includes("y")
		}


		let sources = this.getAttribute("sources") || "x, y, angle, radius, dragged";
		this.sources = WebAudioUtils.split(sources).map(item => item.trim());

		let targets = this.getAttribute("targets") || this.dataset.waxmlTargets || "x, y, angle, radius, dragged";
		this.targets = WebAudioUtils.split(targets).map(item => {
			return item.split("$").join("").trim();
		});

		let type = this.parentElement.getAttribute("type") || "square";
		let x =  this.getAttribute("x") || (type == "circle" ? 0.5 : 0);
		let y = this.getAttribute("y") || (type == "circle" ? 0.5 : 0);

		this.x = parseFloat(x);
		this.y = parseFloat(y);
		this._angle = this.XYtoAngle();
		this._radius = this.XYtoRadius();

		this._angleOffset = this.getAttribute("angleoffset");


		this._minX = parseFloat(this.getAttribute("minx") || 0);
		this._minY = parseFloat(this.getAttribute("miny") || 0);
		this._maxX = parseFloat(this.getAttribute("maxx") || 1);
		this._maxY = parseFloat(this.getAttribute("maxy") || 1);

		this.move(this.x, this.y);



		this.addEventListener("pointerdown", e => this.pointerDown(e), false);

		this.addEventListener("pointerup", e => {
			e.preventDefault();
			this.dragged = false;
			this.dispatchEvent(new CustomEvent("input"));
			this.classList.remove("dragged");
		}, false);

		this.addEventListener("pointermove", e => this.pointerMove(e), false);

		this.style.touchAction = "none";

	}

	pointerDown(e){
		e.preventDefault();
		e.cancelBubble = true;
		this.initRects();
		this.dragged = true;
		this.clickOffset = {x: e.offsetX, y:e.offsetY};
		if(e.pointerId){this.setPointerCapture(e.pointerId)};
		this.pointerMove(e);
	}

	pointerMove(e){
		e.preventDefault();
		if(this.dragged){

			if(this.direction.x){
				let x = e.clientX-this.boundRect.left;
				x = Math.max(0, Math.min(x, this.boundRect.width));
				this.x = x / this.boundRect.width;
				this.style.left = `${this.x * this.effectiveArea.width}px`;
			}

			if(this.direction.y){
				let y = e.clientY-this.boundRect.top;
				y = Math.max(0, Math.min(y, this.boundRect.height));
				this.y = y / this.boundRect.height;
				this.style.top = `${this.y * this.effectiveArea.height}px`;
			}

			if(this.parentElement.type == "circle"){
				// make sure handle is inside circle boundaries
				let radius = this.getProperty("radius");
				if(radius > 1){
					radius = 1;
					let angle = (this.XYtoAngle() + 0.5) % 1;
					let XY = this.angleRadiusToXY(angle, 1);
					this.x = XY.x;
					this.y = XY.y;
					this.move(XY.x, XY.y);
					// this.style.left = `${this.x * this.boundRect.width}px`;
					// this.style.top = `${this.y * this.boundRect.height}px`;
				}
				this._radius = radius;
				this._angle = this.XYtoAngle();

			}
			this.dispatchEvent(new CustomEvent("input"));
		}
	}

	rectOffset(rect, pix = 0){
		return new DOMRectReadOnly(rect.x-pix, rect.y-pix, rect.width+pix*2, rect.height+pix*2);
	}

	insideRect(point, rect){
		return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
	}

	pointsOver(points){
		let br = this.getBoundingClientRect();
		br = this.rectOffset(br, 30);
		let inside = false;
		points.forEach(point => inside = this.insideRect(point, br) || inside);

		if(inside) this.classList.add("remoteOver");
		else this.classList.remove("remoteOver");		
	}

	remoteControl(points){
		
		let br;

		if(this.isRemoteControlled){
			br = this.parentElement.getBoundingClientRect();
		} else {
			br = this.getBoundingClientRect();
			br = this.rectOffset(br, 25);
		}

		let point = points.filter(point => this.insideRect(point, br)).pop();
		
		if(point){
			// inside area
			let val = this.coordinateTovalue(point);
			this.value = val;
			this.isRemoteControlled = true;

			if(this.direction.x){
				this.style.left = `${this.x * this.boundRect.width}px`;
			}
			if(this.direction.y){
				this.style.top = `${this.y * this.boundRect.height}px`;
			}
			this.dispatchEvent(new CustomEvent("input"));

			this.classList.add("remoteControl");
		} else {
			this.classList.remove("remoteControl");
			this.isRemoteControlled = false;
		}
		
	}

	coordinateTovalue(point){

		let br = this.parentElement.getBoundingClientRect();
		let x = (point.x-br.left)/br.width;
		let y = (point.y-br.top)/br.height;
		return {x: x, y: y}
	}

	update(key, val){
		
		if(key == "x" && this.direction.x){
			this.x = x;
			this.style.left = `${x * this.boundRect.width}px`;
		}
		if(key == "y" && this.direction.y){
			this.y = y;
			this.style.top = `${y * this.boundRect.height}px`;
		}
		this.dispatchEvent(new CustomEvent("input"));

	}

	get dragged(){
		return this._dragged;
	}

	set dragged(state){
		this._dragged = state;
		if(state){
			this.classList.add("changed");
			this.classList.add("dragged");
		} else {
			this.classList.remove("dragged");
		}
	}

	get value(){
		// if(this.direction.x && this.direction.y){
		// 	return [this.x, this.y];
		// } else if(this.direction.x){
		// 	return this.x;
		// } else if(this.direction.y){
		// 	return this.y;
		// }
		
		let values = this.sources.map(source => {
			return this.getProperty(source);
		});
		return values;
		
	}

	getProperty(prop, x = this.x, y = this.y){
		let deltaX, deltaY, rad, angle;
		switch(prop){
			case "x":
			return this._minX + x * (this._maxX-this._minX);
			break;

			case "y":
			return this._minY + y * (this._maxY-this._minY); 
			break;

			case "angle":
			// offset with stored value
			let angle = this.XYtoAngle(x, y);
			angle = (angle + this._angleOffset) % 1;
			return angle;
			break;
			

			case "radius":
			deltaX = (x * 2)-1;
			deltaY = (y * 2)-1;
			return this.XYtoRadius(x, y);
			break;

			case "dragged":
			return this.dragged ? 1 : 0;
			break;

		}
	}	


	angleRadiusToXY(angle = this._angle, radius = this._radius){
		let obj = {};
		obj.x = (radius - Math.cos(Math.PI * 2 * angle)) / 2;
		obj.y = (radius - Math.sin(Math.PI * 2 * angle)) / 2;
		return obj;
	}

	XYtoRadius(x = this.x, y = this.y){
		let deltaX = (x * 2)-1;
		let deltaY = (y * 2)-1;
		return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
	}

	XYtoAngle(x = this.x, y = this.y){
		let deltaX = (x * 2) - 1;
		let deltaY = (y * 2) - 1;
		let rad = Math.atan2(deltaY, deltaX);
		// convert to 0-1 with 0 being x=1, y=0
		return (0.5 + (rad / Math.PI + 1) / 2) % 1;
	}

	pointToRelativeRadians(point){
		let rad = Math.atan2(point.y - this.y, point.x - this.x);
		return rad;
	}


	pointToRelativeCoordinate(point){
		return {x: point.x - this.x, y: point.y - this.y};
	}

	set value(point){
		this.x = Math.max(0, Math.min(1, point.x));
		this.y = Math.max(0, Math.min(1, point.y));
	}

	set angle(val){
		this._angle = val;
		let XY = this.angleRadiusToXY(val);
		this.move(XY.x, XY.y);
	}

	set radius(val){
		this._radius = val;
		let XY = this.angleRadiusToXY();
		this.move(XY.x, XY.y);
	}

	set angleOffset(val = 0){
		val = parseFloat(val);
		val = Math.max(0, Math.min(val, 1));
		this._angleOffset = val;
	}

	get angleOffset(){
		return this._angleOffset || 0;
	}

	initRects(){

		this.rect = this.getBoundingClientRect();
		let br = this.parentNode.getBoundingClientRect();
		this.boundRect = {
			left: br.left + this.rect.width / 2,
			top: br.top + this.rect.height / 2,
			width: br.width - this.rect.width,
			height: br.height - this.rect.height
		};
	}

	move(x = this.x, y = this.y){
		if(this.direction.x)this.style.left = x * this.boundRect.width + "px";
		if(this.direction.y)this.style.top = y * this.boundRect.height + "px";
	}

	getIcon(id){
		switch(id){
			case "arrow-up-circle-fill":
			return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="white"  viewBox="0 0 16 16">
				<path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/>
			</svg>`;
		}
	}
}

module.exports = XY_handle;

},{"./WebAudioUtils.js":39}],42:[function(require,module,exports){
var WebAudioUtils = require('./../WebAudioUtils.js');


class Channel extends EventTarget {

	constructor(index, channelObject, waxml=window.waxml){
		super();
		this.waxml = waxml;

		this.min = -30;
		this.max = 0;
		this.high = 0;
		this.init(index, channelObject);
		
	}

	connectedCallback(){
		if(!this.inited){
			// this.init();
		}
		
	}


	init(index, channelObject){

		let tr, td;
		tr = document.createElement("tr");

		td = document.createElement("td");
		td.innerHTML = channelObject.id;

		let UVmeter = document.createElement("waxml-meter");
		UVmeter.setAttribute("type", "loudness");
		UVmeter.setAttribute("width", "100px");
		UVmeter.setAttribute("height", "10px");
		UVmeter.setAttribute("timeframe", "2s");
		UVmeter.setAttribute("maxDecibels", "0");
		UVmeter.setAttribute("minDecibels", "-40");

		UVmeter.setAttribute("colors", "green, yellow, red");
		UVmeter.setAttribute("segments", "60,20,20");
		
		UVmeter.setAttribute("input", `#${channelObject.id}`);
		td.appendChild(UVmeter);
		tr.appendChild(td);


		td = document.createElement("td");
		let meter = document.createElement("meter");
		this.setAttributes(meter, {
			min: this.min,
			max: this.max,
			high: this.high,
			value: 0
		})
		td.appendChild(meter);
		tr.appendChild(td);
		this.meter = meter;


		td = document.createElement("td");
		let btn = document.createElement("button");
		btn.innerHTML = index;
		btn.addEventListener("click", e => {
			this.dispatchEvent(new CustomEvent("change", {detail: {index: index}}));
		});
		td.appendChild(btn);
		tr.appendChild(td);

		this.el = tr;

		channelObject.addEventListener("change", e => {
			// console.log(e.detail);
			this.animateTo(e.detail.value, e.detail.time * 1000);
		});
		return this;
	}
	animateTo(targetValue, time){

		if(this.timeOut){
			clearTimeout(this.timeOut);
		}
		targetValue = WebAudioUtils.powerTodB(targetValue, 1);
		targetValue = Math.max(this.min, Math.min(targetValue, this.max));

		let steps = Math.ceil(Math.min(time / 10, 100));
		steps = Math.max(1, steps);
		let curVal = parseFloat(this.meter.value);
		let diff = targetValue - curVal;
		let step = 0;

		let fn = () => {
			this.meter.value = curVal + diff * (++step / steps);
			// this.meter.value = Math.max(this.min, Math.min(val, this.max));
			if(step < steps){
				this.timeOut = setTimeout(fn, time / steps);
			}
		}
		fn();
	}

	setAttributes(el = this, data){
		Object.entries(data).forEach(([key, value]) => {
			if(typeof value == "string" || typeof value == "number"){
				el.setAttribute(key, value);
			}
		});
	}
}

module.exports = Channel;

},{"./../WebAudioUtils.js":39}],43:[function(require,module,exports){
var Channel = require('./Channel.js');
var VariableMatrixRow = require('./../VariableMatrixRow.js');

class DynamicMixer extends HTMLElement {

	constructor(mixerObject, waxml=window.waxml){
		super();
		this.inited = false;
		this.waxml = waxml;
		this.mixerObject = mixerObject;
		if(mixerObject){
			this.init(mixerObject);
		}
	}

	connectedCallback(){
		if(!this.inited){
			// get target WAXML dynamic mixer by target
			let id = this.getAttribute("target");
			this.mixerObject = this.waxml.querySelector(id);
			this.init(this.mixerObject);
		}
	}


	init(){

		let table, thead, tr, th, td, name, variables, watchedVariable;
		this.inited = true;
		this.channelCount = this.mixerObject.childObjects.length;

		
		table = document.createElement("table");this.appendChild(table);
		thead = document.createElement("thead");
		tr = document.createElement("tr");

		th = document.createElement("th");
		th.innerHTML = "&nbsp;";
		tr.appendChild(th);

		th = document.createElement("th");
		th.innerHTML = "Transition Time";
		tr.appendChild(th);

		th = document.createElement("th");
		th.innerHTML = "Blend";
		tr.appendChild(th);

		th = document.createElement("th");
		th.innerHTML = "Mix";
		tr.appendChild(th);


		thead.appendChild(tr);
		table.appendChild(thead);
		
		// settings for component
		variables = [];
		
		let attributeData = [];
		attributeData.push({name: "transitionTime", max: 2000, value: 500});
		attributeData.push({name: "crossfaderange", max: 1, value: 0});
		attributeData.push({name: "selectindex", max: this.channelCount-1, value: 0});

		this.variables = {};

		attributeData.forEach(attribute => {
			let parameter = this.mixerObject.parameters[attribute.name];
			name = parameter.variableNames[0];
			watchedVariable = parameter._variables[name];
			this.variables[attribute.name] = name;

			variables.push({
				label: name,
				targetVariable: watchedVariable,
				watchedVariable: name,
				min: 0,
				max: attribute.max,
				value: attribute.value
			});
		});

		table.appendChild(new VariableMatrixRow("Settings", variables, this.waxml).element);


		table = document.createElement("table");
		this.appendChild(table);
		thead = document.createElement("thead");
		tr = document.createElement("tr");

		th = document.createElement("th");
		th.innerHTML = this.mixerObject.id;
		tr.appendChild(th);

		th = document.createElement("th");
		th.innerHTML = "Level";
		tr.appendChild(th);

		th = document.createElement("th");
		th.innerHTML = "Trigger";
		tr.appendChild(th);


		thead.appendChild(tr);
		table.appendChild(thead);


		this.mixerObject.childObjects.forEach((subChannel, i) => {
			let channel = new Channel(i, subChannel);
			table.appendChild(channel.el);

			channel.addEventListener("change", e => {
				// let value = e.detail.index / (this.channelCount - 1)
				// this.waxml.setVariable(this.variables.mix, value);
				this.waxml.setVariable(this.variables.selectindex, e.detail.index);
			});
		});
		
		return this;
	}

	setAttributes(el = this, data){
		Object.entries(data).forEach(([key, value]) => {
			if(typeof value == "string" || typeof value == "number"){
				el.setAttribute(key, value);
			}
		});
	}
}

module.exports = DynamicMixer;

},{"./../VariableMatrixRow.js":36,"./Channel.js":42}],44:[function(require,module,exports){
const BaseAudioObject = require('../BaseAudioObject.js');


class BaseTimedAudioObject extends BaseAudioObject {

	static get STOPPED(){return 0};
	static get PENDING(){return 1};
	static get PLAYING(){return 2};
	static get STOPPING(){return 3};

	constructor(xmlNode, waxml, params){
		super(xmlNode, waxml, params);

		let r = this.params.repeat;
		this.params.repeat = r ? r == "true" ? -1 : r : 0; // true = -1 // default = 0 
		this.repeatCount = 0;
		this.state = BaseTimedAudioObject.STOPPED;
		this.timeStamp = 0;
		this._localTime = 0;

		// only support for seconds at the moment. Add milliseconds and musical meter.
		if(this.params["repeat-length"]){
			this.params["repeat-length"] = parseFloat(params["repeat-length"] || 1);
		}	
		this.params["pos"] = parseFloat(params["pos"] || 0);

		if(this.params.fadein || this.params.fadeout || this.params.fadetime){
			// All parameters need to be retrieved dynamically to use Watchers
			// this.params.fadein = parseFloat(params.fadein || this.params.fade || 0);
			// this.params.fadeout = parseFloat(params.fadeout || this.params.fade || 0);
			// this.params["fade-offset"] = parseFloat(params["fade-offset"] || 0);
			this.params.fade = true;
		}

		// add support for musical values
		this.params.pos = this.params.pos || 0; 
	}

	start(params = {}){
		// return if pending, playing or stopping (if it's not a retrig-call)
		if(this.state != BaseTimedAudioObject.STOPPED && !params.retrig){return}

		let currentTime = this.currentTime;

		// merge and overwrite values from different objects
		let defaultValues = {time: currentTime, offset: 0, minPos: 0};
		params = {...this.params, ...defaultValues, ...params};


		// adjust time for position
		if(!params.offset){
			params.time += this.params.pos; // correct if upbeat - wrong if in the middle!!
		} else {
			params.offset -= this.params.pos;
		}

		// adjust time for fade-offset
		let fadeOffset = this.params["fade-offset"];
		if(params.time + fadeOffset > this.currentTime){
			params.time += fadeOffset;
			params.offset += fadeOffset;
			// console.log(this.name, "fadeout, offset: ", this.params["fade-offset"], this.params.fadeout);
		}

		// console.log(this.name, params.time);
		this.timeStamp = params.time - params.offset; // store objects start position (even if triggered in the middle)
		// params.offset -= this.params.pos;
		// console.log(this.name, (this.timeStamp).toFixed(2), params.offset);

		let delay = this.timeStamp + params.offset - currentTime;
		if(!params.retrig){
			this.state = BaseTimedAudioObject.PENDING;
			clearTimeout(this.stateTimeout);
			this.stateTimeout = setTimeout(() => {
				this.state = BaseTimedAudioObject.PLAYING;
			}, delay * 1000);
		}


		// repeat
		if(this.params.repeat){
			if(this.params.repeat == -1 || ++this.repeatCount < this.params.repeat){
				// if infinite repeat or still repeats to do
				this.repeat(params);
			}
		}

		if(this.params.fade && !params.blockFade){
			this.crossFade(1, params.time);
		}
		

		this.children.forEach(obj => obj.start(params));
		return params;
	}

	repeat(params = {}){

		// params = {...params};
		clearTimeout(this.repeatTimeout);

		let repeatLength = this.getParameter("repeat-length");
		
		// if time is after repeat 
		if(params.time >= this.timeStamp + repeatLength){
			return;
		}

		let localTime = (this.currentTime - this.timeStamp);
		let timeToTriggerRepeat = repeatLength - localTime + params.minPos;
		// console.log(this.selector + ".repeat");

		

		this.repeatTimeout = setTimeout(() => {
			
			this.timeStamp += repeatLength;
			params.time = this.timeStamp;
			params.retrig = true;
			params.offset = 0;
			params.syncPointIndex = 0;

			// this.stop(repeatParams);
			this.start(params);
		}, timeToTriggerRepeat * 1000 - this.utils.timeWindow)

		// return params;
	}


	stop(params = {}){
		if(this.state == BaseTimedAudioObject.STOPPED){return}

		// params.time = Math.max(this.currentTime, params.time + this.params["fade-offset"]);

		// adjust time for fade-offset
		// (this might be override by slices)
		let fadeOffsetTime = params.time + this.params["fade-offset"];
		if(fadeOffsetTime > this.currentTime){
			params.time = fadeOffsetTime;
			// console.log("fadeout, offset: ", this.params["fade-offset"], this.params.fadeout);
		}


		let delay = params.time - this.currentTime;
		this.state = BaseTimedAudioObject.STOPPING;

		clearTimeout(this.repeatTimeout);
		this.repeatCount = 0;

		clearTimeout(this.stateTimeout);
		this.stateTimeout = setTimeout(() => {
			this._localTime = this.localTime; // stores current time
			// this.timeStamp = 0;
			this.state = BaseTimedAudioObject.STOPPED;
		}, delay * 1000);

		if(this.params.fade && !params.blockFade){
			this.crossFade(0, params.time);
		}

		this.children.forEach(obj => obj.stop(params));

		return params;
	}


	continue(params = {}){
		if(this.state != BaseTimedAudioObject.STOPPED){return}

		// let delay = params.time - this.currentTime;
		// this.state = BaseTimedAudioObject.PENDING;

		// clearTimeout(this.stateTimeout);
		// this.stateTimeout = setTimeout(() => {
		// 	this.state = BaseTimedAudioObject.PLAYING;
		// }, delay * 1000);
		// this.children.forEach(obj => obj.continue(params));

		return params;
	}

	crossFade(to, time = this.currentTime, fadeTime, fn = () => {}){

		if(isNaN(time)){
			console.error("crossfade time error", time);
			return;
		}
		let delay = time - this.currentTime;
		this.output.gain.cancelScheduledValues(time);
		let fadeCurve = to ? this.utils.crossFadeIn() : this.utils.crossFadeOut();

		fadeTime = fadeTime || (to ? this.params.fadein : this.params.fadeout) || this.params.fadeinout || 0.001;
		fadeTime = fadeTime.valueOf() || 0.001;

		this.output.gain.setValueCurveAtTime(fadeCurve, time, fadeTime);
		// this.output.gain.setTargetAtTime(to, time, fadeTime);
		console.log(`${this.params.src} fadetime: ${fadeTime}`);

		setTimeout(() => {
			fn();
			// we don't need to reset gain now. It happens on start()
			// this.output.gain.cancelScheduledValues(time);
			// this.output.gain.setValueAtTime(1, time);
		}, (delay + fadeTime) * 1000 + this.utils.timeWindow);
	}



	get minPos(){
		// returns a negative offset value for the earliest child object
		return this.params.pos + Math.min(0, ...this.children.map(obj => obj.minPos || 0));
	}
	    
	get relPos(){
		let relPos = this.localTime / this.params["repeat-length"];
		return relPos;
	}


	get localTime(){
		let time;
		if(this.state){
			if(this.params.repeat){
				let rl = this.params["repeat-length"];
				time = (this.currentTime + rl - this.timeStamp) % rl;
			} else {
				time = this.currentTime - this.timeStamp;
			}

		} else {
			time = this._localTime;
		}
		return time;
	}


	get currentTime(){
		return this._ctx.currentTime;
	}
	    
}

module.exports = BaseTimedAudioObject;

},{"../BaseAudioObject.js":3}],45:[function(require,module,exports){
(function ($) {


	var defaultSectionName = "default";

	var SECTION = "sc";
	var TRACK = "tr";
	var MOTIF = "mt";
	var LEADIN = "ld";
	var SOUND = "sn";
	var POSITION = "p";
	var VARIANT = "v";
	var UPBEAT = "up";
	var QUANTIZE = "q";
	var LENGTH = "l";

	var self;


	class Selection{
         
		constructor(selector, container){

            this.objects = [];
            this.sections = [];
            this.tracks = [];
            this.motifs = [];
			this.leadIns = [];
			this.string = "";

			if(selector){
				this.searchAll(selector, container);
			}
		}

		selectForPlayback(selector){
			// find motifs and leadins in current section
			selector = this.stringToArray(selector);
			defaultInstance.motifs.forEach(obj => {
				if(obj.section == defaultInstance.currentSection && inArray(selector, obj.parameters.classList)){
					this.motifs.push(obj);
					this.objects.push(obj);
				}
			});
			
			// find next section
			defaultInstance.sections.forEach(obj => {
				if(inArray(selector, obj.parameters.classList)){
					this.sections.push(obj);
					this.objects.push(obj);
					this.string = selector[0];
				}
			});
			return this;
		}

		stringToArray(str){
			let arr;
			switch(typeof str){

				case "string":
				arr = str.split(" ");
				break;

				case "object":
				arr = str;
				break;

			} 
			return arr;
		}


        searchAll(selector, container){


            var allObjects = [];

			// this is the old original selector

            switch(typeof selector){

                case "string":
                break;

                case "object":
                selector = selector.join(" ");
                break;

                default:
                return this;
                break;
            }

            if(!selector.length){return}

            var type;
            switch(typeof selector){

                case "string":
                this.selector = selector;
                selector = selector.split(" ").shift();
                var firstChar = selector.substr(0, 1);

                switch(firstChar){

                    case "#":
                    type = "id";
                    selector = selector.substr(1);
                    break;

                    case ".":
                    type = "class";
                    selector = selector.substr(1);
                    break;

                    default:
                    type = "class";
                    selector = this.selector;
                    break;

                }

                break;

                default:
                return;
                break;

            }


            this.string = selector;
            this.type = type;

            // limit search range to container
            var targetInstances;
            if(container instanceof iMus) {

                targetInstances = [container];

            } else {
                targetInstances = iMus.instances;
            }



            if(container instanceof Selection){

                // sub selection of selection
                allObjects = container.objects;

            } else if(container instanceof Array){

                // sub selection of tracks in a section
                allObjects = container;

            } else {


                // selection in all or one instance

                targetInstances.forEach(function(instance){


                    instance.motifs.forEach(function(motif){

                        allObjects.push(motif);
                    });

                    instance.sections.forEach(function(section){

                        allObjects.push(section);
                        section.tracks.forEach(function(track){

                            allObjects.push(track);
                        });
                    });

                    instance.actions.forEach(function(action){

                        allObjects.push(action);
                    });

                });

            }




            var objects = [];
            var targetSection;


            allObjects.some(obj => {

                switch(type){

                    case "id":
                    if(obj.idName == selector){
                        objects.push(obj);
                    }

                    break;

                    case "class":
                    var matchedClass = inArray(selector, obj.tags);

                    // check if this is a section. If so just add this section to objects
                    // Why? I think it is better to also select motifs, leadins and tracks
                    // if matching
                    if(matchedClass){

                        switch(obj.type){
                            case "section":
                            objects = [obj];
                            this.sections = [obj];
                            targetSection = obj;
                            break;

                            case "track":
                            objects.push(obj);
                            this.motifs.push(obj);
                            break;

                            case "motif":
                            objects.push(obj);
                            this.motifs.push(obj);
                            break;

                            case "leadIn":
                            objects.push(obj);
                            this.leadIns.push(obj);
                            break;

                        }
                    }
                    break;

                    case "objectType":
                    //change to make it possible to select different types of objects !!!
                    switch(selector){

                        case "track":
                        case "stem":
                        if(obj instanceof Track){objects.push(obj)}
                        break;

                        case "motif":
                        if(obj instanceof Motif){objects.push(obj)}
                        break;
                    }


                    break;

                }


            });


            this.objects = objects;
		}


        createDefaultSectionIfNeeded(){

            // generate section if no matches
            if(!this.objects.length){
                var newSection = defaultInstance.addSection({tags: this.selector});
                if(!defaultInstance.currentSection){
                    defaultInstance.currentSection = newSection;
                }
                this.objects.push(newSection);    
            }
        }

        addLoopTrack(urls){

            var newObj;
            this.createDefaultSectionIfNeeded();
            if(!urls){urls = [];}
            this.objects.forEach(obj => {
                if(!obj.addLoopTrack){return}
                newObj = obj.addLoopTrack(urls);
            });
            this.objects = [newObj];
            return this;
        }

        addLFO(prop, frequency, range, offset, object){

            this.objects.forEach(obj => {
                if(!obj.addLFO){return}
                obj.addLFO(prop, frequency, range, offset, object);
            });
            return this;
        }

        addDelay(params){

            this.objects.forEach(obj => {
                if(!obj.bus){return}
                obj.bus.addSerialDelay(params);
            });
            return this;
        }

        addReverb(params){

            this.objects.forEach(obj => {
                if(!obj.bus){return}
                obj.bus.addReverb(params);
            });
            return this;
        }

        addMotif(urls, q, upbeat){

            if(typeof urls === "string"){
                urls = [urls];
            }
            this.createDefaultSectionIfNeeded();
            var tags = urlsToTags(urls);
            if(this.objects.length){
                // add sections tags to motif
                tags = mergeArrays(tags, this.objects[0].tags);
            }
            var targetObj = this.objects.find(obj => {
                // connect Motif to Section
                return typeof obj.addMotif === "function";
            }) || defaultInstance;
            var params = typeof q == "object" ? q : {};
            params.tags =  params.tags || tags;
            params.quantize =  params.quantize || q;
            params.upbeat =  params.upbeat || upbeat;
            var newObj = targetObj.addMotif(params, urls);
            this.objects = [newObj];
            return this;
        }

        addLeadIn(urls, params){
            params = typeof params == "object" ? params : {quantize: "bar", type: "leadIn", upbeat: "bar"}
            this.addMotif(urls, params);
            return this;
        }

        loadFile(urls){
            this.addMotif(urls, "off");
            return this;
        }

        setSoloGroup(grp, val){

            this.objects.forEach(obj => {
                if(!obj.setSoloGroup){return}
                obj.setSoloGroup(grp, val);
            });
        }

	    // funkar den här och i sånt fall, hur?
        solo(selector){

            this.stop();
            this.find(selector).play();
            return this;

        }
		
		togglePlay(){

            this.objects.forEach(obj => {
                if(!obj.togglePlay){return}
                obj.togglePlay();
            });
            return this;
        }

        play(arg1, arg2, arg3){


            var returnVal = {};
			let delays = [];
            this.objects.forEach(obj => {
                if(!obj.play){return}
                let delay = obj.play(arg1, arg2, arg3);
				delays.push(delay);
            });
			returnVal.delay = Math.min(...delays);
            this.returnVal = returnVal;
            return this;
        }

        trig(arg1, arg2, arg3){
            return this.play(arg1, arg2, arg3);
        }

        replay(){

            this.objects.forEach(obj => {
                if(!obj.replay){return}
                return obj.replay();
            });
            return this;
        }

        stop(params){
            params = params || {};
            this.objects.forEach(obj => {
                if(!obj.stop){return}
                // to mute other tracks in a group
                if(obj == params.omit){return}
                return obj.stop();
            });
            return this;
        }

        stopAllSounds(){
            this.objects.forEach(obj => {
                if(!obj.stopAllSounds){return}
                obj.stopAllSounds();
            });
            return this;
        }

        isPlaying(){

            var isPlaying = false;
            this.objects.forEach(obj => {
                var curObjIsPlaying = obj.isPlaying ? obj.isPlaying() : obj.playing;
                isPlaying = isPlaying || curObjIsPlaying;
            });
            return isPlaying;
        }

        setActive(active){

            this.objects.forEach(obj => {
                if(!obj.setActive){return}
                return obj.setActive(active);
            });
            return this;
        }

        setActive(active){

            this.objects.forEach(obj => {
                if(!obj.setActive){return}
                return obj.setActive(active);
            });
            return this;
        }

        setVolume(arg1, arg2){


            this.objects.forEach(obj => {
                if(!obj.setVolume){return}
                return obj.setVolume(arg1, arg2);
            });
            return this;
        }

        getVolume(){

            var vol = -1;
            this.objects.forEach(obj => {
                if(!obj.getVolume){return -1}
                vol = Math.max(vol, obj.getVolume());
            });
            return vol;
        }

        fade(val, delay, duration){

            delay = delay || 0;
            duration = duration || 250;
            duration /= 1000;
            this.objects.forEach(obj => {
                if(!obj.fade){return}
                return obj.fade(val, delay, duration);
            });
            return this;
        }

        fadeIn(){
            this.objects.forEach(obj => {
                if(!obj.fadeIn){return}
                return obj.fadeIn();
            });
            return this;
        }

        fadeOut(duration, delay){

            if(duration){duration = duration / 1000}
            if(delay){delay = delay / 1000}
            this.objects.forEach(obj => {
                if(!obj.fadeOut){return}
                return obj.fadeOut(delay, duration);
            });
            return this;
        }

        setVariation(val, val2){

            this.objects.forEach(obj => {
                if(typeof obj.setVariation === "function"){
                    obj.setVariation(val, val2);
                } else {
                    obj.variation = val;
                }
            });
            return this;
        }

        setActiveVariations(activeVariations){

            this.objects.forEach(obj => {
                if(!obj.setActiveVariations){return}
                return obj.setActiveVariations(activeVariations);
            });
            return this;
        }
        get(param1, param2){
            var value;
            this.objects.forEach(obj => {
                if(!obj.get){return}
                value = obj.get(param1, param2);
            });
            return value;
        }

        setParams(params){

            this.objects.forEach(obj => {
                if(!obj.setParams){return}
                return obj.setParams(params);
            });
            return this;
        }

        set(param, value, value2){

            this.createDefaultSectionIfNeeded();
            this.objects.forEach(obj => {
                if(!obj.set){return}
                return obj.set(param, value, value2);
            });
            return this;
        }

        map(param, valIn, minIn, maxIn, minOut, maxOut, exp){

            this.objects.forEach(obj => {
                if(!obj.map){return}
                return obj.map(param, valIn, minIn, maxIn, minOut, maxOut, exp);
            });
            return this;
        }

        group(){

            var thisSelection = this;
            this.objects.forEach(obj => {
                if(obj.groups){
                    obj.groups.push(thisSelection);
                }
            });
            return this;
        }

        addTrackGroup(selection){
            this.objects.forEach(obj => {
                if(obj.addTrackGroup){
                    obj.addTrackGroup(selection);
                }
            });
            return this;
        }

        getPosition(pos, flags){

            var positionObj;
            if(!this.objects.length){
                this.objects = [defaultInstance];
            }
            this.objects.forEach(obj => {
                if(obj.getPosition){
                    positionObj = obj.getPosition(pos, flags);
                }
            });
            return positionObj;
        }

        on(event, fn, delay){

            this.objects.forEach(obj => {
                if(obj.eventHandler){
                    obj.eventHandler.addEvent(event, fn, delay);
                }
            });
        }

        update(arg1){

            this.objects.forEach(obj => {
                if(obj.update){
                    obj.update(arg1);
                }
            });
            return this;
        }

        find(selector){
            return new Selection(selector, this);
        }

	}


	class VoiceController {

		constructor(){
			this.counter = 0;
			this.voices = [];
			this.fadeTime = 0.001;
		}

		addVoiceObject(name, priority, gainObject, fadeTime = this.fadeTime){
			let voiceNames = name.split(" ").map(str => str.trim());
			this.voices.push(new VoiceObject(this.counter, voiceNames, priority, gainObject, fadeTime));
			return this.counter++;
		}

		removeVoiceObject(id){
			this.voices = this.voices.filter(voice.id !== id);
		}

		getVoiceObject(id){
			return this.voices.find(voice => voice.id == id);
		}

		getVoiceGroup(targetGroups, id){
			return this.voices.filter(voice => {
				// let include = voice.name == name;
				let include = voice.groups.find(group => targetGroups.includes(group)) ? true : false;
				if(typeof id !== "undefined"){
					// omit one voiceObject if specified
					include = include && voice.id != id;
				}
				return include;
			});
		}

		getVoicePriorityGroup(name, priority){
			return this.voices.filter(voice => voice.groups.find(str => str == name) && voice.priority == priority);
		}

		getLowerVoicePriorityGroups(priority){
			return this.voices.filter(voice => voice.groups.find(str => str == name) && voice.priority < priority);
		}

		playVoiceObject(id, startTime, endTime, voiceGroups){
			let voiceObject = this.getVoiceObject(id);
			if(voiceObject){
				voiceObject.play(startTime, endTime);
				this.getVoiceGroup(voiceGroups || voiceObject.groups, id).forEach(obj => {
					obj.mute(startTime, endTime, voiceObject.priority);
				}); 
			}
		}

	}


	class VoiceObject {
		constructor(id, groups, priority, gainObject, fadeTime){
			this.id = id;
			this.groups = groups;
			this.priority = priority;
			this.gainObject = gainObject;
			this.fadeTime = fadeTime;

			this.startMuteTime = 0;
			this.endMuteTime = 0;
		}
		play(startTime, endTime){
			this.gainObject.gain.cancelScheduledValues(startTime);

			// delay startTime if fadeTime requires it
			if(startTime-this.fadeTime < audioContext.currentTime){
				startTime = audioContext.currentTime + this.fadeTime;
			}
			this.gainObject.gain.setTargetAtTime(1, startTime-this.fadeTime, this.fadeTime);
			this.startTime = startTime;
			this.endTime = endTime;
			console.log(`Voice(${this.id}).start(${(startTime-audioContext.currentTime).toFixed(2)}, ${(endTime-audioContext.currentTime).toFixed(2)}, ${this.fadeTime.toFixed(2)})`)

			if(endTime == startTime){
			}

		}

		mute(startTime, endTime, priority){
			let currentTime = this.gainObject.context.currentTime;

			if(this.endTime && this.endTime > currentTime || priority > this.priority){
				// endTime is only set for motifs and leadins
				// Don't touch them if the stored endTime has already passed.
				// This preserves the audio tail in recently pleayed objects.

				this.gainObject.gain.cancelScheduledValues(0);
				
				// find earliest startTime (if several triggers interfers) 
				this.startMuteTime = this.startMuteTime < currentTime ? startTime : Math.min(startTime, this.startMuteTime);
				this.endMuteTime = this.endMuteTime < currentTime ? endTime : Math.max(endTime, this.endMuteTime);


				// delay startMuteTime if fadeTime requires it
				let startMuteTime;
				if(this.startMuteTime-this.fadeTime < audioContext.currentTime){
					startMuteTime = audioContext.currentTime - this.fadeTime;
				} else {
					startMuteTime = this.startMuteTime;
				}
				// delay endMuteTime if fadeTime requires it
				let endMuteTime;
				if(this.endMuteTime-this.fadeTime < audioContext.currentTime){
					endMuteTime = audioContext.currentTime - this.fadeTime;
				} else {
					endMuteTime = this.endMuteTime;
				}
				
				this.gainObject.gain.setTargetAtTime(0, startMuteTime-this.fadeTime, this.fadeTime);
				this.gainObject.gain.setTargetAtTime(1, endMuteTime-this.fadeTime, this.fadeTime);
				console.log(`Voice(${this.id}).mute(${(startMuteTime-this.fadeTime-audioContext.currentTime).toFixed(2)}, ${(endMuteTime-this.fadeTime-audioContext.currentTime).toFixed(2)})`);
			}

		}
	}



	// ******************************************************
	// GUI


	class GUI {

		constructor(target = document.body){

			var instID = 1;

			let shadowElement, el;
			let container = document.createElement("div");
			container.id = "iMusic-GUI";


			if(window.webAudioXML){
				shadowElement = window.webAudioXML.GUI.HTML;
			} else {
				let shadowContainer = document.createElement("div");
				shadowContainer.style.width = "0%";
				shadowContainer.style.height = "0%";
				shadowContainer.style.display = "none";
				shadowContainer.style.overflow = "visible";
				target.appendChild(shadowContainer);


				shadowElement = shadowContainer.attachShadow({mode: 'open'});
				// shadowElement.appendChild(style);

				
				var iMusBtn;
				if(iMus.getDefaultInstance().parameters.showGUI == "true"){
					iMusBtn = document.createElement("button");
					iMusBtn.innerHTML = "iMusic";
					iMusBtn.style.position = "absolute";
					target.appendChild(iMusBtn);
					iMusBtn.addEventListener("click", e => {
						e.target.style.display = "none";
						shadowContainer.style.width = "100%";
						shadowContainer.style.height = "100%";
						shadowContainer.style.display = "block";
					});
				}

				el = document.createElement("button");
				el.innerHTML = "X";
				el.classList.add("close");
				container.appendChild(el);
				el.addEventListener("click", e => {
					iMusBtn.style.display = "block";
					shadowContainer.style.width = "0%";
					shadowContainer.style.height = "0%";
					shadowContainer.style.display = "none";
				});
			}
			shadowElement.prepend(container);


			el = document.createElement("h1");
			el.innerHTML = "Play controls";
			if(container.childNodes.length){
				container.insertBefore(el, container.lastElementChild);
			} else {
				container.appendChild(el);
			}
			

			// el = document.createElement("button");
			// el.innerHTML = "PLAY";
			// el.classList.add("control");
			// container.appendChild(el);
			// el.addEventListener("click", e => iMusic.play());


			iMus.instances.forEach(inst => {
				instID++;
				let sectionTags = [];
				let motifTags = [];
				let selectGroups = {};
				let el, row, span;

				inst.sections.forEach(section => {

					section.tags.forEach(tag => {
							if(!inArray(tag, sectionTags) && tag.length){sectionTags.push(tag)}
					});

					let selectGroup = section.parameters["select-group"] || section.parameters["select-variable"];
					let selectValues = section.parameters["select-value"];
					let values;
					if(selectGroup){
						if(!selectGroups[selectGroup]){
							selectGroups[selectGroup] = [];
						}
						values = selectGroups[selectGroup];
						selectValues.forEach(val => {
							if(!inArray(val, values)){
								values.push(val);
							}
						});
					}

					section.tracks.forEach(track => {
						track.soloGroups.forEach(group => {
							if(!selectGroups[group.name]){
								selectGroups[group.name] = [];
							}
							let values = selectGroups[group.name];
							group.value.forEach(val => {
								if(!inArray(val, values)){
									values.push(val);
								}
							});
						});
					});


					section.motifs.forEach(motif => {
						if(motif.parameters.class){
							motif.parameters.class.split(" ").forEach(className => {
								className = className.trim();
								if(className.length && !inArray(className, motifTags) && !inArray(className, sectionTags)){
									motifTags.push(className);
								}
							});
						}
						motif.soloGroups.forEach(group => {
							if(!selectGroups[group.name]){
								selectGroups[group.name] = [];
							}
							let values = selectGroups[group.name];
							group.value.forEach(val => {
								if(!inArray(val, values)){
									values.push(val);
								}
							});
						});
					
					});

				});

				inst.motifs.forEach(motif => {
					if(motif.parameters.class){
						motif.parameters.class.split(" ").forEach(className => {
							className = className.trim();
							if(className.length && !inArray(className, motifTags) && !inArray(className, sectionTags)){
								motifTags.push(className);
							}
						});
					}
					motif.soloGroups.forEach(group => {
						if(!selectGroups[group.name]){
							selectGroups[group.name] = [];
						}
						let values = selectGroups[group.name];
						group.value.forEach(val => {
							if(!inArray(val, values)){
								values.push(val);
							}
						});
					});
				});


				// PLAY BUTTONS
				let buttons = [];
				this.sectionTriggerButtons = buttons;

				row = document.createElement("div");
				container.appendChild(row);

				if(sectionTags.length){
					// el = document.createElement("h3");
					// el.innerHTML = "Class names";
					// container.appendChild(el);
	
	
					sectionTags.forEach(tag => {
						el = document.createElement("button");
						el.innerHTML = tag;
						el.setAttribute("class", "tag sectionTrigger");
						el.setAttribute("selector", tag);
						row.appendChild(el);
						buttons.push(el);
	
						el.addEventListener("click", e => {
							let returnVal = waxml.trig(tag);
							let delay = returnVal ? returnVal.delay : 0;
							let targetBtn = e.target;
							targetBtn.classList.add("pending");
							
							// setTimeout(() => {
							// 	buttons.forEach(btn => btn.classList.remove("active"));
							// 	buttons.forEach(btn => btn.classList.remove("pending"));
							// 	targetBtn.classList.add("active");
							// }, delay*1000);
						});
					});
				}


				el = document.createElement("button");
				el.innerHTML = "STOP";
				el.classList.add("control");
				row.appendChild(el);
				el.addEventListener("click", e => {
					buttons.forEach(btn => btn.classList.remove("active"));
					waxml.stop();
				});

				// click
				let label = document.createElement("label");
				label.innerHTML = "Click";
				el = document.createElement("input");
				el.setAttribute("type", "checkbox");
				
				row.appendChild(label);
				label.appendChild(el);
				el.addEventListener("change", e => {
					waxml.setVariable("click", e.target.checked ? 1 : 0);
				});


				// tillfällig regel
				el = document.createElement("input");
				el.setAttribute("type", "range");
				el.setAttribute("min", "0");
				el.setAttribute("max", "100");
				el.addEventListener("input", e => {
					["BD-SN", "HH", "Fill", "Bass", "Sine", "Chord"].forEach(tr => {
						iMusic(tr).setActive(e.target.value / 100);
					});
				});
				row.appendChild(el);
				

				if(motifTags.length){
					el = document.createElement("h3");
					el.innerHTML = "Motifs";
					container.appendChild(el);
	
					row = document.createElement("div");
					container.appendChild(row);
	
					motifTags.forEach(tag => {
						el = document.createElement("button");
						el.innerHTML = tag;
						el.classList.add("tag");
						row.appendChild(el);
	
						el.addEventListener("click", e => {
							waxml.start(tag);
						});
					});
				}


				
				if(Object.keys(selectGroups).length){
					// el = document.createElement("h3");
					// el.innerHTML = "Variables";
					// container.appendChild(el);


					// el = document.createElement("p");
					// el.innerHTML = `Give the tracks different select-group and select-values to
					// make a variable control the dynamics by muting and unmuting them.
					// Use the slider (for numeric values) or menu (string values) to select
					// different tracks depending on their select-group and select-value settings.`;
					// container.appendChild(el);

					// selection sliders and radio buttons
					let filter = [];
					Object.keys(selectGroups).forEach(key => {

						let value = selectGroups[key];
						let range = new Range(value);
						row = document.createElement("div");
						// container.appendChild(row);

						el = document.createElement("span");
						el.innerHTML = key;
						el.classList.add("label");
						row.appendChild(el);


						switch (range.type) {
							case "number":
								// slider
								//let minVal = Math.min(0, range.min);
								let minVal = range.min;

								el = document.createElement("input");
								el.setAttribute("type", "range");
								el.setAttribute("min", minVal);
								el.setAttribute("max", range.max);
								el.setAttribute("value", minVal);
								el.setAttribute("class", "slider");
								row.appendChild(el);
								let numOutput = document.createElement("span");
								numOutput.classList.add("numOutput");
								row.appendChild(numOutput);

								numOutput.innerHTML = minVal;
								filter.push({name: key, value: minVal});
								

								el.addEventListener("input", e => {
									numOutput.innerHTML = e.target.value;
									iMusic.select(key, parseFloat(e.target.value).toFixed(2));
								});
								break;
							case "string":
								// radio
								let popMenu = document.createElement("select");
								value.forEach(str => {

									//
									// el = document.createElement("input");
									// el.value = str;
									//
									// let id = key + "-" + str;
									// el.id = id;
									// el.name = key;
									// el.type = "radio";
									// row.appendChild(el);
									//
									// el.addEventListener("change", e => {
									// 	iMusic.select(key, e.target.value);
									// });
									//
									// el = document.createElement("label");
									// el.innerHTML = str;
									// el.for = id;

									el = document.createElement("option");
									el.value = str;
									el.innerHTML = str;
									popMenu.appendChild(el);

								});
								popMenu.addEventListener("change", e => {
									iMusic.select(key, e.target.value);
								});
								filter.push({name: key, value: value[0]});
								row.appendChild(popMenu);
								break;
							default:

						}

					});
					iMusic.initSelection(filter);
				}
				
				instID++;
				inst.missingFiles.forEach(file => {
					waxml.log({
						type: "error",
						data: ["Missing file:", file]
					});
				});

				// if(inst.missingFiles.length){
				// 	let errorBox = document.createElement("div");
				// 	container.appendChild(errorBox);
				// 	errorBox.innerHTML = "<h3>Missing files:</h3>";
				// 	errorBox.className = "errorBox";				
				// 	let ul = document.createElement("ul");
				// 	errorBox.appendChild(ul);
				// 	inst.missingFiles.forEach(file => {
				// 		let li = document.createElement("li");
				// 		li.innerHTML = file;
				// 		ul.appendChild(li);
				// 	});
				// }
				

			});


		}

		indicateTriggerButtons(tag){
			let buttons = this.sectionTriggerButtons;
			let targetBtn = buttons.find(btn => btn.attributes.selector.value == tag);
			if(targetBtn){
				buttons.forEach(btn => btn.classList.remove("active"));
				buttons.forEach(btn => btn.classList.remove("pending"));
				targetBtn.classList.add("active");
			}
		}


		setCurrentSection(currentSection){

		}

	}





	// ******************************************************
	// HELPERS


	function getTimeSign(ts, defTimeSign){

		if(ts == "off"){return ts}

		var timeSign = {};


		// convert string to an object
		if(typeof ts === "string"){

			switch(ts){


				case "bar":
				return {nominator: defTimeSign.nominator, denominator: defTimeSign.denominator};
				break;


				case "beat":
				return {nominator: 1, denominator: defTimeSign.denominator};
				break;

				default:

				tsArr = ts.split("/");
				if(tsArr.length < 2){
					tsArr[1] = 1;
				}

				return {nominator: eval(tsArr[0]), denominator: eval(tsArr[1])};
				break;
			}

		}

		// if timeSign is already converted to an object
		if(typeof ts === "object"){
			if(ts.nominator && ts.denominator) {
				return ts;
			}
		}

		// return 4/4 if not specified
		return {nominator:4, denominator:4};

	}

	function stringIsTimeSign(str){
		return str.split("/").length == 2;
	}


	function divisionToTime(div, ts, beatDuration){

		if(!div){return 0;}
		if(typeof div == "number"){return div}

		if(div == "off"){
			// One year ;-)
			// good for non-looped tracks
			return 60 * 60 * 24 * 365;
		} else {
			ts = ts || this.parameters.timeSign;
			beatDuration = beatDuration || this.getBeatDuration();
			// barDuration = this.getBarDuration();
			var div = getTimeSign(div, ts);
			//return div.nominator * beatDuration * ts.denominator / div.denominator; // detta verkar fel?!? Hur kan jag missat under alla år??
			// return div.nominator * beatDuration * ts.nominator / div.denominator;
			
			// Unbelievable!! Even the second try was wrong! 
			// The idea is to take the provided musical length expression 
			// eg. 3/8 and find the time of this expression by finding the
			// relation to the length of a beat.
			return div.nominator * beatDuration / (div.denominator / ts.denominator);
		}


	}


	function getMaxUpbeatOffset(tracks){
		tracks = tracks || this.tracks;
		var offs = 0;
		for(var trackID in tracks){
			var track = tracks[trackID];
			if(track.parts.length){
				var parts = track.parts;
				var firstPart = parts[0];
				offs = Math.min(offs, firstPart.offset);
			}

		}
		return -offs;
	}


	function getMaxFadeTime(tracks){
		tracks = tracks || this.tracks;

		var time = 0;

		tracks.forEach(function(track){
			time = Math.max(time, track.parameters.fadeTime);
		});

		return time;
	}




	function arrayWithValue(length, value){

		var arr = [];
		for(var i=0; i<length; i++){
			arr[i] = value;
		}
		return arr;
	}


	function createGainNode(){
		// different methods to support different browsers
		if(typeof audioContext.createGain === 'undefined'){
			return audioContext.createGainNode();
		}else{
			return audioContext.createGain();
		}
	}


	function initAudioContextTimer(iMusInstance){
		//console.log("initAudioContextTimer", iMusInstance);

		if(audioContext.currentTime == 0){

			// on iOS the timer needs to be inited
			// by triggering a sound from a touch interaction
			// Therefore, make sure you call section::play() from
			// a touch event the first time or
			// make a direct call to iMusInstance::init() from
			// a touch event before playing anything.


			// Update 20191128
			// This workaround doesn't work any more


	 		audioContext.resume();
	 		return;

			var osc = audioContext.createOscillator();
			// play
			if (typeof osc.start === 'undefined'){
				osc.noteOn(0);
			}else{
				osc.start(0);
	 		}

	 		//osc.connect(audioContext.destination);

		}


	}





	function addLFO(prop, frequency, range, offset, object){

		if(typeof prop != "string"){return}



			var bus;

			if(typeof object === "undefined"){
			var musicObject = this instanceof Section || this instanceof Track || this instanceof Motif || this instanceof Sequence;
			if(musicObject){
				bus = this.bus;
			} else if(this instanceof Bus){
				bus = this;
			}

			if(bus){
				switch(prop){
					case "filter":
					object = bus.filter.detune;
					break;

					case "volume":
					object = bus.output.gain;
					break;
				}
			}
		} else {
			object = object;
		}

		if(typeof object != "object"){return}

		frequency = frequency || 1;
		range = range || 1;
		offset = offset || 0;

		var osc = audioContext.createOscillator();
		var amp = createGain();
		amp.gain.value = range;

		osc.frequency.value = frequency;
		osc.connect(amp);
		amp.connect(object);
		osc.start();

		/*
		var x = 0;
		var y;
		var range = max - min;

		var intervalTime = 10;
		var stepAmount = 2 / cycleTime * intervalTime;

		var intervalID = setInterval(function(){

			x += stepAmount;
			y = Math.sin(Math.PI*x)/2+0.5;

			object[prop] = min + y * range;

		}, intervalTime);

		*/
	}




	// ******************************************************

	// setup the audio context
	var audioContext;
	var maxChannelCount;

	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	if(window.webAudioXML){
		audioContext = window.webAudioXML._ctx;
	} else if (AudioContext){
		audioContext = new AudioContext();
	} else {
	  // Web Audio API is not available. Ask the user to use a supported browser.
	  alert('Web Audio API not supported. Please use another browser');
	  return;
	}


	maxChannelCount = audioContext.destination.maxChannelCount || 2;
	//maxChannelCount = Math.min(maxChannelCount, 32);

	console.log("Max audio channels: " + maxChannelCount);

	if (audioContext.destination.maxChannelCount) {
		audioContext.destination.channelCount = maxChannelCount;
	} else if (audioContext.destination.webkitMaxChannelCount) {
		audioContext.destination.webkitChannelCount = maxChannelCount;
	}


	//audioContext.destination.channelCountMode = "explicit";
	//audioContext.destination.channelInterpretation = "discrete";


	var channelCount = audioContext.destination.channelCount || audioContext.destination.webkitChannelCount;
	console.log("Number of channels: " + channelCount);



	var buffers = {};
	var timeWindow = 0.3; // s
	var checkQueueTime = 20; // ms




	function playSound(obj, time, callBackOnStart, callBackOnFinish, track, crop = 0) {

		// console.log(audioContext.currentTime);
		// check if source is already played
		// if so, disconnect
		time = time || 0;
		

		if(track){
	 		if(track.parameters.randomOffset){
		 		time += Math.random()*track.parameters.randomOffset - track.parameters.randomOffset/2;
	 		}
		}


		time = Math.max(audioContext.currentTime, time);

		// randomize if several urls
		var url;

		if(typeof obj.url === "object"){

			// support array with multiple files for random selection


			// if activeVariations is used, then use just those files, else use all
			var nrOfOptions;

			if(obj.parameters.retrig == "repeat" && (obj.counter % obj.parameters.repeat)) {

				// keep on repeating the same file obj.parameters.repeat times
				if(iMus.debug){console.log(obj.counter, obj.parameters.repeat)}

			} else {

				// generate a new randomly selected file
				if(obj.parameters.activeVariations){
					nrOfOptions = obj.parameters.activeVariations.length;
				} else if(obj.parameters.retrig == "next"){
					nrOfOptions = 0;

				} else {
					// default obj.parameters.retrig == "other". Add maybe support for "any"

					// use all urls first time or if there are less than 3 options or if obj.variation is used
					nrOfOptions = (typeof obj.rndID === "undefined" || obj.url.length < 3 || obj.parameters.retrig == "shuffle") ? obj.url.length : obj.url.length - 1;
				}

				var rnd;

				if(typeof obj.variation == "number"){
					// obj.variation can be set globally to syncronize random variation between objects
					// change to use parameters!!!
					rnd = obj.variation;
					rnd = Math.max(0,rnd);
					rnd = Math.min(0.9999999999,rnd);
				} else if(typeof obj.variation == "string"){
					if(obj.variationMaster == true){
						rnd = Math.random();
						iMus.setVariation(obj.variation, rnd);
					} else {
						rnd = iMus.getVariation(obj.variation);
					}
				} else {
					// create a new random value
					rnd = Math.random();
				}
				obj.rndID = Math.floor(rnd*nrOfOptions);


			}

			// pick file

			if(obj.parameters.activeVariations){
				// pick ID from active IDs
				url = obj.url[obj.parameters.activeVariations[obj.rndID]];
				if(!url){url = obj.url[0];}

			} else {
				url = obj.url[obj.rndID];
			}




		} else {
			url = obj.url;
		}

		var length = obj.length;
		var urlObj = url;

		if(typeof urlObj === "object"){
			// support objects with unique values for each url i.e. different musical length

			url = urlObj.url;
			length = urlObj.length || length;
		}



	 	var msToStart = Math.floor((time-audioContext.currentTime)*1000);
	 	var msToFinish = 0;

		if(buffers[url]){

			// create new source if file is loaded
			var source = audioContext.createBufferSource();

			
			if(iMus.debug){
				//console.log(obj.id, obj.playingSources);
			}
			obj.playingSources = obj.playingSources || [];

			// if not loaded. Error.
			if(buffers[url] == -1){return}

			// connect
			source.buffer = buffers[url];

			var destination = obj.bus.input || iMus.master.input;
			source.connect(destination);


			// play

	 		obj.playing = true;
	 		obj.trigging = true;
	 		obj.playingSources.push(source);

	 		if(typeof obj.active === "undefined"){
	 			obj.active = 1;
	 		}



	 		msToFinish = msToStart + Math.floor(source.buffer.duration*1000);


	 		var rnd = Math.random();
	 		if(rnd < obj.active || obj.parameters.fadeTime){

		 		// play
				if (typeof source.start === 'undefined'){
					// obsolete. Used in Safari ages ago.
					source.noteOn(time, crop);
				}else{
					source.start(time, crop);
		 		}

		 		obj.counter = ++obj.counter || 1;
		 		if(iMus.debug){
					console.log(url, time, audioContext.currentTime);
				}


				if(obj && obj.eventHandler){
					// for regions (parts) and motifs
					setTimeout(function(){
				 		obj.eventHandler.execute("playFile", url);
			 		}, msToStart);
				}


		 		if(track){
					// for tracks
					setTimeout(function(){
						track.eventHandler.execute("playFile", url);
					}, msToStart);
		 		}


		 		var e = new CustomEvent('iMusic', {
					 detail: {
						 command: "playFile",
						 url: url
					}
				});

				setTimeout(function(){
			 		window.dispatchEvent(e, msToStart);
			 	});


				var e2 = new CustomEvent('playFile', {
					detail: {
						url: url,
						id: track ? track.idName : obj.idName,
						classList: track ? track.tags : obj.tags
					}
			   	});

				setTimeout(e => defaultInstance.dispatchEvent(e2), msToStart);



		 		// call function if set when a sound is about to play
		 		// bad sync with JS
		 		if(typeof callBackOnStart === "function"){
		 			setTimeout(function(){
			 			callBackOnStart("playFile", url);
		 			}, msToStart);
		 		}

				// visualize in linear arranger
				// the code is a bit scattered at the moment. WAXML is attaching 
				// a graphical target container for each track, motif and leadin
				// poorly written... 
				let graphicalTrack = track ? track.graphicalTrack : obj.graphicalTrack
				let visualElements = track ? track.visualElements : obj.visualElements;
				if(graphicalTrack){
					let element = waxml.visualize({
						graphicalTrack: graphicalTrack,
						pos: time,
						length: source.buffer.duration - crop,
						label: waxml.pathToFileName(url)
					});
					visualElements.push(element);
				}


	 		} else {

		 		// don't play
		 		if(iMus.debug){console.log("Not playing: " + url + ", Math.random = " + rnd);}

	 		}

	 		// reset playing to allow object to be trigged again
	 		setTimeout(function(){
	 			obj.trigging = false;
	 			//console.log(obj.url, obj.playing, timeWindow * 1000 + msToStart);
	 		}, timeWindow * 2 * 1000);




	 		if(typeof length === "number"){

	 			// if a Part or Motif has a defined length then make callback before tail
	 			setTimeout(function(){
	 				if(typeof callBackOnFinish === "function"){callBackOnFinish();}
	 				obj.playing = false;

	 			}, msToStart + length * 1000 - timeWindow * 1000);
	 		}


	 		// disconnect and delete source object when played

			obj.timeouts = obj.timeOuts || [];
	 		let timeout = setTimeout(function(){
				// this function  will be called for parts or motifs after specified time
				// There have been some confusion when the part length is not specified
				// and I therefore skip the disconnection . It doesn't seem necessary

				// Hela den här funktionen är scary. Den är kvar efter tiden innan fadeTime och 
				// verkar kunna ställa till med alla möjliga problem.
				// Det viktigaste är att inte playingSources töms när den innehåller buffers som 
				// spelar vilket kan ske med dessa rader som de står. En avslutad ljudfil tömmer 
				// partens alla playingSources inkl. nytriggade filer. Inte bra.

	 			// obj.playing = false; // denna rad var bortkommenterad men jag kan inte komma på varför
	 			// //if(source){source.disconnect(0);}
	 			// if(obj.playingSources) {
		 		// 	while(obj.playingSources.length){
		 		// 		let oldSource = obj.playingSources.shift();

		 		// 		// oldSource.disconnect(0);
		 		// 		// oldSource = 0;

		 		// 	}
	 			// }

	 			// source = null;
	 			if(typeof callBackOnFinish === "function" && typeof length === "undefined"){
	 				callBackOnFinish();
	 			} else {

	 			}
	 			//console.log(obj.url + ".stop() " + audioContext.currentTime);
	 		}, msToFinish);
			obj.timeouts.push(timeout);

	 		//if(iMus.debug){console.log("msToFinish: " + msToFinish);}

 		} else {
	 		if(iMus.debug){console.log("Buffer not found: " + url);}
 		}

 		return urlObj;
	}



	function loadFile(obj, callBack, errorCallback){

		
		if(typeof obj.url != "string"){
			// this is not a file
			return;
		} 

		let body = document.querySelector("body");
		body.classList.add("imusic-loading");
		
		callBack = callBack || loadComplete;
		var url = this.addSuffix(obj.url);


		if(obj.url in buffers){
			// if already loaded

		} else {
			// else load URL
			buffers[obj.url] = 0;
			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.responseType = 'arraybuffer';

			var returnObj = {};
			returnObj.url = url;

			request.onload = function() {

				if(request.status != 200) { // analyze HTTP status of the response
					//alert(`Error ${request.status}: ${request.statusText}`); // e.g. 404: Not Found
					defaultInstance.missingFiles.push(request.responseURL);
					buffers[obj.url] = -1;
					if(errorCallback){errorCallback()}
				} else {
					// decode the buffer into an audio source
					audioContext.decodeAudioData(request.response, function(buffer) {
						if (buffer) {
							// store all buffers in buffers
						  buffers[obj.url] = buffer;
						  returnObj.duration = buffer.duration;
						  // store reference in this object
						  // obj.buffer = buffer;
						  //console.log(obj.url + " loaded. offset: " + obj.offset);
						  callBack(returnObj);
	  
						}
					  }, function(){
						  console.error('File "' + url + '" could not be decoded');
						  buffers[obj.url] = -1;
						  callBack();
					});
				}
		     };
		     request.onerror = function() {
		          console.error('File "' + url + '" could not be loaded');
		          buffers[obj.url] = -1;
		          callBack();
		     };

			request.send();
		}
	}

	function loadComplete(){


		for(var url in buffers){

			if(buffers[url] == 0){
				return false;
			}
		}

		console.log("LoadComplete");
		for(var obj in iMus.instances){

			iMus.instances[obj].loadComplete();
		}
		
		return true;
	}


	var Bus = function(o){


		o = o || {};

		this.parameters = this.initParameters(o);

		let webAudioDest;
		var destination = webAudioDest || o.destination || audioContext.destination;

		this.output = createGainNode();
		this.output.gain.value = (typeof o.volume == "number") ? o.volume : 1;
		

	  	this.input = createGainNode();
	  	this.voiceGain = createGainNode();
		this.input.connect(this.voiceGain).connect(this.output).connect(destination);


		return this;
	}


	Bus.prototype.initParameters = initParameters;
	Bus.prototype.addDefaultParameters = addDefaultParameters;
	Bus.prototype.getBeatDuration = getBeatDuration;
	Bus.prototype.getBarDuration = getBarDuration;
	Bus.prototype.getTime = getTime;


	Bus.prototype.setOutput = function(ch, targetCh){

		this.output.disconnect(0);
		this.splitter.disconnect(0);
		this.output.connect(this.splitter, 0, 0);
		this.outputGainList = [];


		if(typeof ch === "number"){
			ch = [ch]
		};

		if(targetCh){

			// source and target specified
			if(typeof targetCh === "number"){targetCh = [targetCh]};

		} else {

			// only target specified
			targetCh = ch;
			ch = [];
			for(var i = 0; i < this.output.channelCount; i++){
				ch.push(i);
			}
		}


		var lpCnt = Math.max(ch.length, targetCh.length);
		for(var i = 0; i < lpCnt; i++){

			var srcCh = ch[i % ch.length];
			srcCh = Math.min(srcCh, maxChannelCount-1);

			var trgCh = targetCh[i % targetCh.length];
			trgCh = Math.min(trgCh, maxChannelCount-1);

			var outputGain = createGainNode();
			this.outputGainList[trgCh] = outputGain;
			this.splitter.connect(outputGain, srcCh, 0);
			outputGain.connect(this.channelMerger, 0, trgCh);

		}


	}


	Bus.prototype.connect = function(dest){

		let destination;
		if(typeof dest == "string"){

			if(window.webAudioXML){
				destination = window.webAudioXML.getInputBus(dest);
			}
			if(!destination){
				destination = iMus.objects[dest];
			}

		} else if(dest instanceof AudioObject || dest instanceof Bus || dest instanceof Bus2){
			destination = dest;
		}
		if(!destination){console.warn("No destination");return}
		if(!destination.input){console.log("No input on destination");return}

		this.output.disconnect(0);
		this.output.connect(destination.input);
	}



	Bus.prototype.volume = function(vol){
		if(typeof vol == "undefined"){
			return this.input.gain.value;
		} else {
			this.input.gain.linearRampToValueAtTime(vol, audioContext.currentTime + 0.001);
		}
	}
	Bus.prototype.setVolume = Bus.prototype.volume;


	Bus.prototype.compression = function(params){
		if(typeof params == "undefined"){
			return this.compressor;
		} else {


			if(params == false){
				// disconnect

			} else {

				for(var param in params){
					this.compressor[param].value = params[param];
				}
			}
		}
	}

	Bus.prototype.animate = function(parameter, targetVal, time){


		time = time || 0;
		switch(parameter){

			case "pan":

			if(!this.outputGainList){
				// default to stereo if not routed yet
				if(this.channelMerger){
					this.setOutput([0,1], [0,1]);
				}
			}

			var dist = targetVal - this.parameters.pan;
			var nrOfOutputs = this.outputGainList.length;

			// step through animation with 50 states per second
			var fps = 10;

			// at least two steps if time is too short
			var steps = Math.max(2, time * fps);

			for(var i = 0; i <= steps; i++){

				var curVal = this.parameters.pan + dist * i/steps;

				var trgOut = (nrOfOutputs-1)*curVal;
				var targetOutput1 = Math.floor(trgOut);
				var offs = trgOut % 1;

				var t = audioContext.currentTime + time * i/steps;

				// Loop through all speakers for each step
				this.outputGainList.forEach(function(output, id){
					var val;
					switch(id){
						case targetOutput1:
						val = 1 - offs;
						break;

						case targetOutput1+1:
						val = offs;
						break;

						default:
						val = 0;
						break;
					}
					output.gain.linearRampToValueAtTime(val, t);
				});
			}
			this.parameters.pan = targetVal;
			break;



			default:
			var send = this.sends[parameter];
			if(!send){return;}
			var t = audioContext.currentTime + time;
			send.gain.linearRampToValueAtTime(targetVal, time);
			break;
		}

	}


	Bus.prototype.setFilter = function(val){
		var t = audioContext.currentTime + 0.01;
		this.filter.frequency.linearRampToValueAtTime(val, t);
	}

	Bus.prototype.addPingPongDelay = function(params){

		params = params || {};
		var feedBack = params.feedBack || 10;                    // nr of bounces

		var delay; // time between bounces
		if(typeof params.delay === "string"){
			delay = this.getTime(params.delay);
		} else {
			delay = params.delay ? params.delay / 1000 : 0.25;
		}

		var outputs = params.outputs || [0,1];                   // array with output numbers
		var volume = params.volume || 0.5;                       // volume for first delay

		var delayObj;
		var gainObj;

		this.pingPongDelay = createGainNode();

		// signal is routed in a parallell chain
		this.output.connect(this.pingPongDelay, 0, 0);

		// create one delay node for each feedback
		for(var i=1; i<=feedBack; i++){

			delayObj = audioContext.createDelay(feedBack*delay);
			this.pingPongDelay.connect(delayObj, 0);
			delayObj.delayTime.value = delay*i;
			gainObj = createGainNode();
			gainObj.gain.value = volume;
			volume *= 0.5;
			gainObj.channelCount = 1;
			gainObj.channelCountMode = "explicit";
			gainObj.channelInterpretation = "discrete";
			delayObj.connect(gainObj, 0, 0);

			// get random output channel (exclude last to avoid repeated bounces in the same)
			var id = Math.floor(Math.random()*outputs.length-1);
			var chNum = outputs.splice(id, 1)[0];
			outputs.push(chNum);

			gainObj.connect(this.channelMerger, 0, chNum);


		}

	}

	Bus.prototype.addSerialDelay = function(params){

		params = params || {};
		var feedBack = params.feedBack || 10;                    // nr of bounces
		if(Array.isArray(params.delayTimes)){
			if(params.delayTimes.length){this.delayTimes = params.delayTimes;}
		}
		this.delayTaps = [];

		var delay; // time between bounces
		if(typeof params.delay === "string"){
			delay = this.getTime(params.delay);
		} else if(typeof params.delay === "number"){
			if(this.delayTimes){
				var d = params.delay < this.delayTimes.length ? params.delay : 0;
				delay = this.delayTimes[d];
			} else {
				delay = params.delay / 1000;
			}

		} else {
			delay =  0.25;
		}

		var outputs = params.outputs || [0,1];                   // array with output numbers
		var volume = params.volume || 0.5;                       // volume for first delay
		var decrease = params.decrease || 0.5;
		this.delayDecrease = decrease;
		this.delayVolume = volume;
		this.delayMaxDelay = 10;
		var delay = 10;

		var delayObj;
		var gainObj;

		this.pingPongDelay = createGainNode();

		// signal is routed in a parallell chain
		this.output.connect(this.pingPongDelay, 0, 0);

		// create one delay node for each feedback
		for(var i=1; i<=feedBack; i++){

			delayObj = audioContext.createDelay(this.delayMaxDelay);
			this.pingPongDelay.connect(delayObj, 0);
			delayObj.delayTime.value = delay*i;
			gainObj = createGainNode();
			gainObj.gain.value = volume;
			volume *= decrease;
			gainObj.channelCount = 1;
			gainObj.channelCountMode = "explicit";
			gainObj.channelInterpretation = "discrete";
			delayObj.connect(gainObj, 0, 0);

			var chNum = outputs[i % outputs.length];
			chNum = Math.min(chNum, maxChannelCount-1);
			gainObj.connect(this.channelMerger, 0, chNum);

			this.delayTaps.push({delay: delayObj, gainObj: gainObj, id: i});

		}

	}


	Bus.prototype.setDelay = function(params){
		if(!this.delayTaps){
			this.addSerialDelay(params);
		} else {
			params = typeof params === "object" ? params : {delay: params};

			var delay; // time between bounces
			if(typeof params.delay === "string"){
				delay = this.getTime(params.delay);
			} else if(typeof params.delay === "number"){
				if(this.delayTimes){
					var d = Math.floor(params.delay * this.delayTimes.length);
					d = Math.max(0, Math.min(d, this.delayTimes.length-1));
					var delayStr = this.delayTimes[d];
					delay = this.getTime(delayStr);
				} else {
					delay = params.delay / 1000;
				}

			}

			if(params.decrease){
				this.delayDecrease = params.decrease;
			}

			var volume = this.delayVolume;
			this.delayTaps.forEach((tap)=>{
				if(delay){
					tap.delay.delayTime.linearRampToValueAtTime(tap.id * delay, audioContext.currentTime + 0.0000001);
				}

				if(params.volume){
					volume *= this.delayDecrease;
					tap.gainObj.gain.linearRampToValueAtTime(params.volume * volume, audioContext.currentTime + 0.001);
				}
			});

		}
	}

	Bus.prototype.addReverb = function(params){

		if(!params){return}
		if(typeof params === "string"){
			params = {url: params}
		}

		if(!params.url){return}

		if(typeof params.value === "undefined"){params.value = 1}

		var send = this.sends[params.url];
		if(!send){
			send = createGainNode();
			this.sends[params.url] = send;
		}
		send.gain.value = params.value;
		this.output.connect(send);

		params.src = send;
		var convolve = defaultInstance.addReverb(params);
		return {convolve: convolve, send: send};
	}



	Bus.prototype.insertEffect = function(type, initParams){

		var newFX = audioContext.createBiquadFilter();

		// last added FX will be first in inserts array
		var lastFXinChain = this.inserts[0];

		// disconnect last FX in chain
		lastFXinChain.disconnect(0);



		this.inserts.shift(newFX);

	}

	Bus.prototype.setPosition = function(newX, newY, newZ){

		if(!this.panner.active){
			this.filter.disconnect(0);
			this.filter.connect(this.panner);
			this.panner.active = true;
		}

		this.panner.setPosition(newX, newY, newZ);
		//audioContext.listener.setPosition(-newX, -newY, -newZ);
	}


	Bus.prototype.addAnalyser = function(fn, interval, fftSize){

		interval = interval || 100;
		var analyser = audioContext.createAnalyser();
		this.input.connect(analyser);
		analyser.fftSize = fftSize || 2048;
		var bufferLength = analyser.frequencyBinCount;

		var dataArray = new Uint8Array(bufferLength);
		//var dataArray = new Float32Array(bufferLength);


		setInterval(function(){

			//analyser.getFloatTimeDomainData(dataArray)
			analyser.getByteTimeDomainData(dataArray);
			fn(dataArray, bufferLength);

		}, interval);


	}



	var Sequence = function(data){

		this.iMusInstance = data.iMusInstance;
		this.objects = data.objects || [];
		this.firstOffset = data.firstOffset || 0;
		this.loopEnd = data.loopEnd;
		this.timerIDs = [];

	}


	Sequence.prototype.maxUpbeatOffset = function(){

	}

	Sequence.prototype.play = function(){

		var me = this;
		var delay = 1000;
		var runEachLoop = function(){

		}

		this.timerIDs.push(setTimeout(function(){

			//me.timerIDs.push(); VAd är detta?

		}, delay));

	}


	/*
	Sequence.prototype.stop = function(){

		this.timerIDs.forEach() = function(timerID){
			clearTimeout(timerID);
		}
		this.timerIDs = [];
	}
	*/

	var Envelope = function(_entries, _target){


		if(!Array.isArray(_entries)){
			console.log("Error: Envelope requires an array with values - ", _entries);
			return;
		}
		if(!typeof _target === "object"){
			console.log("Error: Envelope requires a Web Audio target object - ", _target);
			return;
		}

		this.entries = [];
		this.target = _target;

		_entries.forEach((entry)=>{

			if(!typeof point === "object"){
				console.log("Error: Envelope entires must be specified as objects - ", entry);
				return;
			}

			this.entries.push(entry);
		});
	}

	Envelope.prototype.play = function(){

		this.target.cancelScheduledValues(0);
		var val = this.target.value;
		var time = audioContext.currentTime;
		var zero = time;

		this.entries.forEach((entry)=>{

			val = (typeof entry.value === "number") ? entry.value : val;
			if(entry.delay){
				// relative to last entry
				time += entry.delay;
			} else if(entry.time){
				// relative to play event
				time = zero + entry.time;
			}

			this.target.linearRampToValueAtTime(val, time);

		});


	}

	Envelope.prototype.stop = function(){
		this.target.cancelScheduledValues(0);
	}



	var iMus = function(o, b) {

		o = o || {};

		if(typeof o === "string" || Array.isArray(o)){

			// Selection
			return new Selection(o, b);
		} else {

			// new iMusic instance
			o.onLoadComplete = o.onLoadComplete || b;
			self = this;
		}

		this._listeners = {};
		this.triggerIntervals = [];
		this.missingFiles = [];

		// Music instance
		this.loadFile = loadFile;


		this.init = function(){
			initAudioContextTimer(this);
			let body = document.querySelector("body");
			body.classList.add("imusic-running");
			body.classList.remove("imusic-pending");
		}

		this.getBus = function(id){

			switch(id){

				case "sfx":
				return this.sfxBus;
				break;

				case "motif":
				return this.motifBus;
				break;

				default:
				if(id <= self.busses.length){
					return self.busses[id-1];
				}else{
					this.parameters.destination = this.master.input;
					this.parameters.channelMerger = this.channelMerger;
					var bus = new Bus(this.parameters);
					self.busses[id] = bus;
					return bus;
				}
				break;
			}
		}

		this.addSection = function(){


			var params;

			//if(arguments.length){
				var args = Array.prototype.slice.call(arguments, 0) || [];
				if(typeof args[0] === "object"){

					// if first value is a Section params object
					if(!args[0].url){
						params = args.shift();
					}
				}

			//}
			params = params || {};
			if(!params.urls){
				if(args.length){params.urls = args}
			}

			if(typeof params.upbeat === "undefined"){params.upbeat = self.upbeat;}

			params.index = self.sections.length;
			var newSection = new Section(params);
			self.sections.push(newSection);
			return newSection;
		}




		this.stop = function(){
			clearInterval(self.queueID);
			self.queueID = null;
			self.playing = false;
			/*self.currentSection;
			self.currentTransition;
			self.transitionParts = [];*/
		}

		self.loadComplete = function(){
			switch(typeof self.parameters.onLoadComplete){

				case "function":
				self.parameters.onLoadComplete()
				break;

				case "string":
				iMus.play(self.parameters.onLoadComplete);
				break;
			}

			iMus.onload();
			let body = document.querySelector("body");
			body.classList.add("imusic-pending");
			body.classList.remove("imusic-loading");
		}

		/*

		this.getBeatDuration = function(){
			return 60.0 / this.tempo;
		}

		this.getBarDuration = function(){
			return this.getBeatDuration() * this.timeSign.nominator;
		}



		if (typeof o === 'function') {
		  callback = o;
		}

		*/


		// a collection of Sections, Transitions, Motifs and SFXs

		params = o || {};
		// why "this"?
		this.parameters = this.initParameters(o);
		
		self.volume = params.volume || 1;
		self.parameters.tempo = params.tempo || 120;
		self.parameters.timeSign = params.timeSign || "4/4";
		self.parameters.timeSign = getTimeSign(self.parameters.timeSign);

		self.upbeat = typeof params.upbeat === "string" ? this.getTime(params.upbeat) : params.upbeat;
		self.upbeat = self.upbeat || 0;

		self.externalOffset = params.offset;
		self.creationTime = new Date().getTime();


		// Styr upp denna härva av self och self.parameters...
		self.parameters = this.initParameters(params);
		self.parameters.onLoadComplete = params.onLoadComplete; // varför kopieras inte denna funktion i initParameters??
		self.parameters.destination = iMus.master.output;
		self.parameters.volume = self.volume;


		self.master = new Bus(this.parameters);
		self.bus = self.master;

		self.master.output.channelCount = maxChannelCount;

		// Create a Bus for mono sounds to be routed to a specific output channel
		self.channelMerger = audioContext.createChannelMerger(Math.max(32, maxChannelCount));
		self.channelMerger.channelCount = 1;
		self.channelMerger.channelCountMode = "explicit";
		self.channelMerger.channelInterpretation = "discrete";
		self.channelMerger.connect(self.master.output); //self.master.input);

		self.sendEffects = {};

		self.selectFilter = [];

		// Activate all inputs by creating dumb source objects and
		// preconnecting them to channelMerger

		for(var i=0; i<maxChannelCount; i++){
			var snd = audioContext.createBufferSource();
			snd.connect(self.channelMerger, 0, i);
		}



		//self.currentBarIDs = [];                // counters
		//self.nextTime = 0;

		self.transitionParts = [];
		self.sections = [];
		self.actions = [];
		self.currentSection;
		self.currentTransition;
		self.playing = false;
		self.sectionStart = 0;
		self.musicalStart = 0;

		self.motifs = [];
		self.busses = [];
		self.intervalIDs = [];

		this.parameters.destination = self.master.input;
		this.parameters.channelMerger = self.channelMerger;

		self.sfxBus = new Bus(this.parameters);
		self.motifBus = new Bus(this.parameters);



		iMus.instances.push(this);













		this.checkQueue = function(){



			if(!self.playing){return;}


			var currentTime = audioContext.currentTime;
			var musicTime = currentTime - self.sectionStart;
			self.musicTime = musicTime; // store the current music position pointer
			//if(musicTime < -timeWindow){return;} // what is this? It messed up the upbeats...


			
			// que parts on tracks in sections
			if(self.currentSection){
				tracks = self.currentSection.tracks;

				// click
				let barLength = self.currentSection.getBarDuration();
				let beatLength = self.currentSection.getBeatDuration();
				let timeInBeat = (musicTime + beatLength) % beatLength;
				let curBar = Math.floor(musicTime / barLength);
				let curBeat = Math.floor(musicTime / beatLength);

				if(beatLength-timeInBeat <= timeWindow){
					if(self.currentSection.curBeat != curBeat){
						self.currentSection.curBeat = curBeat;
						let nextClickTime = (curBeat + 1) * beatLength;
						let nextBarTime = (curBar + 1) * barLength;
						// console.log(`curBeat: ${curBeat}`);

						if(nextBarTime == nextClickTime){
							let barTime = nextClickTime + self.sectionStart; 
							waxml.start("#click_bar", {time:barTime});
							waxml.visualize({
								class: "barline",
								pos: barTime
							});
							self.currentBar++;
							// waxml.log(`Bar, ${self.currentBar}`);
						} else {
							let beatTime = nextClickTime + self.sectionStart; 
							waxml.start("#click_beat", {time:beatTime});
							waxml.visualize({
								class: "beatline",
								pos: beatTime
							})
						}

					} else {
						// console.log("self.currentSection.curBeat == curBeat");
					}

				} else {
					// console.log(musicTime.toFixed(2) , beatLength.toFixed(2), timeInBeat.toFixed(2), (beatLength-timeInBeat).toFixed(2), timeWindow);
				}

				
				tracks.forEach(track => {

					var trackWasNotPlaying = track.playing;
					var newLoop = false;

					//var trackTime = track.getTime(musicTime);
					var loopEnd = track.musicalPositionToTime(track.parameters.loopEnd);
					var loopID = Math.floor(musicTime / loopEnd);
					var loopStart = loopID * loopEnd;
					var timeInLoop = (musicTime + loopEnd*1000) % loopEnd;

					//mt = [musicTime, timeInLoop]; just for bug fix

					// do not loop tracks that should not be looped
					// needs testing!!



					if(loopID != track.loopID){

						// On every loop
						if(!track.active && track.parameters.fadeTime){
							// set volume to 0 if not active but in fade mode
							// to play silently until track recieves a play() command
							// track.bus.setVolume(0, true); -- already controlled by newTrack.setVolume()
							track.fadeOut();
						}

						// control the likeness for this loop to play
						var rnd = Math.random();
						track.playing = track.loopActive > rnd;
						//track.loopID = loopID;
						//console.log("LoopActive: " + track.loopActive + " > " + rnd);
						newLoop = true;

						setTimeout(function(){
							track.eventHandler.execute("loopEnd");
						}, loopEnd*1000);

						if(track.commands.length){
							track.loopID = loopID;
							if(loopID >= 0){
								console.log(`newLoop: ${track.id}: ${loopID}}`);
								track.commands.forEach(cmd => {
									let time = cmd.pos + loopStart + self.sectionStart;
									cmd.trig(time);
								});
							}
							
						}
						
					}

					// track.active is the parameter set by Track.setActive(), Track.play() and Track.stop()
					// track.playing is set on each trackloop depending on loopActive and random()
					// track.parameters.fadeTime is set to a value bigger than 0 if the track is supposed to
					// fade in/out on play/stop (like Ableton, Elias etc) rather than playing full audio files with audio tails

					if(track.active){
						//console.log(track.playing);
					}


					if((track.active > 0 && track.playing && !track.parameters.fadeTime) || track.parameters.fadeTime){

						//(track.parameters.fadeTime && (newLoop || musicTime < loopStart)
						// get local time inside this stem/track loop



						if(track.parameters.fadeTime && track.active > 0 && track.playing == false){
							//track.fadeIn();
							//console.log(track.id, "no fadeIn");
						}




						for(partID in track.parts){

							var targetPart = track.parts[partID];
							//if(iMus.debug){console.log(currentTime)};

							if(!(targetPart.playing || targetPart.trigging) || newLoop){




								// store randomness from track in part
								targetPart.active = track.active;
								targetPart.lastTriggedTime = targetPart.lastTriggedTime || 0;

								// store tracks fadeTime in part
								targetPart.parameters.fadeTime = track.parameters.fadeTime;

								var posInLoop = (targetPart.pos + targetPart.offset + loopEnd) % loopEnd;
								var posInNextLoop = posInLoop + loopEnd;
								var hit = timeInLoop <= posInLoop && (timeInLoop + timeWindow) > posInLoop;

								// check if loop is before bar 1 and part has not got upbeat
								//var partShouldNotPlay;// = (loopID < 0 && targetPart.offset >= 0) || loopID < -1;

								var hitInNextLoop = timeInLoop <= posInNextLoop && (timeInLoop + timeWindow) > posInNextLoop;
								var fadeTrackNeedsTrigging = track.parameters.fadeTime && !trackWasNotPlaying;
								fadeTrackNeedsTrigging = false; // do I really need fadeTrackNeedsTrigging any more??

								//if(iMus.debug){console.log("hit?", timeInLoop, loopEnd, loopID)};
								// terrible, terrible line to cope with all possible exceptions...
								if((hit || hitInNextLoop || fadeTrackNeedsTrigging) && loopID >= -1){


									// if targetPart is within timeWindow
									//var time = self.sectionStart + relPos; //+relPos;
									var time = self.sectionStart + loopStart + posInLoop + (hitInNextLoop ? loopEnd : 0);

									// make sure faded tracks are triggered correctly
									// if(track.parameters.fadeTime){
									//
									// 	while(time < currentTime){
									// 		time += loopEnd;
									// 	}
									//
									// }

									track.loopID = loopID;
									//if(hitInNextLoop){track.loopID++}

									var timeDiff = Math.abs(targetPart.lastTriggedTime - time);
									//console.log(hit, hitInNextLoop, newLoop, loopID, timeInLoop, timeDiff);

									if(time < currentTime){
									//if(false){

										// to prevent trig errors (I encountered logical problems with faded tracks)
										//console.log("Negative time: " + (time - currentTime));
									} else {



										if(timeDiff > 0){
											if(!track.playingParts.find(part => part == targetPart)){
												track.playingParts.push(targetPart);
											}
											

											targetPart.lastTriggedTime = time;
											targetPart.parameters.retrig = track.parameters.retrig;



											var chosenURL = playSound(targetPart, time, null, null, track);
											if(iMus.debug){console.log("newLoop", newLoop, track.loopID)}
											//console.log(hit, hitInNextLoop, time, newLoop, track.loopID);


											var spliceID;
											switch(track.parameters.retrig){

												case "next":
												case "other":
												case "shuffle":
												case "repeat":

												// det här måste fixas! OBS! Inte genomtänkt för alla case
												// fixen för activeVariations är gjort för att RTG inte ska gå åt pipan
												// Dumt att playSound returnerar chosenURL

												if(targetPart.parameters.activeVariations){

													if(targetPart.counter % targetPart.parameters.repeat){
														// don't shuffle
													} else {
														var ID = targetPart.parameters.activeVariations.splice(targetPart.rndID, 1)[0];
														targetPart.parameters.activeVariations.push(ID);
													}


												} else {

													var i = targetPart.url.indexOf(chosenURL);
													// pick target URL
													chosenURL = targetPart.url.splice(i, 1)[0];
													// move selected file last
													targetPart.url.push(chosenURL);
												}
												break;


											}


										} else {
											//console.log("timeDiff", timeDiff);
										}


									}

								} else {

									//console.log("no hit", timeInLoop, posInLoop, track.loopID, newLoop);
									//console.log("no hit", hit, hitInNextLoop, fadeTrackNeedsTrigging, newLoop, track.loopID);

								}


							} else {
								//console.log("playing:", targetPart.playing, targetPart.trigging, newLoop);
							}

						}

					}
				});
			}
		}




		function queueNextPartOnTrack(track, currentPart){
			var currentTime = audioContext.currentTime;
			var targetPart = track.parts[currentPart % track.parts.length];
			var nt;
			if(track.id < self.busses.length){var bus = self.busses[track.id];}


			if(track.id == 1){
				//console.log("track2");
			}
			if(currentTime + timeWindow >= track.nextTime + targetPart.offset){

				// trig next part if start (inkl offset/upbeat) happens less than timeWindow seconds
				// from now.

				var time;
				var startOffset;

				if(!track.nextTime){
					// first time

					time = audioContext.currentTime;
					self.sectionStart = time-targetPart.offset;
					//this.sectionStart = self.sectionStart;
					startOffset = self.sectionStart;
				} else {
					// all other times
					time = track.nextTime + targetPart.offset;
					startOffset = 0;
				}
				playSound(targetPart, time);
				return track.nextTime + targetPart.length + startOffset;
			}

		}















		var Section = function(o){

			// a (multi)track arrangement
			// concists of (at least) one track
			// console.log("new Section() id " + o.id);
			this.id = o.index;

			this.volume = o.volume || 1;
			if(typeof o.upbeat === "undefined"){
				this.upbeat = self.upbeat;
			}else{
				this.upbeat = this.divisionToTime(o.upbeat);
			}

			this.motifs  = [];
			this.tracks = [];
			this.transitions = [];
			this.leadIns = [];

			this.idName = o.id || "";


			this.tags = o.tags || o.class || urlsToTags(o.urls);
			if(typeof this.tags === "string"){this.tags = this.tags.split(" ")};



			this.parameters = this.initParameters(o, self.parameters);

			o.loopEnd = o.loopEnd || o.end || defaultParams.loopEnd;
			this.parameters.loopEnd = this.getPosition(o.loopEnd).time;
			this.parameters.length = this.divisionToTime(o.length);
			this.parameters.changeOnNextQ = this.divisionToTime(this.parameters.changeOnNext || self.parameters.changeOnNext);


			if(this.parameters.length && !o.changeOnNexts){
				// set this.parameters.changeOnNext by length if not specified separately 
				this.parameters.changeOnNext = this.parameters.length;
			}

			this.type = "section";


			this.getLength = function(){
				return this.parameters.length || this.getBarDuration(); 
			}

			this.addStem = function(urls){

				// create track object
				//console.log(urls);
				if(urls instanceof Array){
					//console.log("ulrs instanceof Array");
					// called from new Section where urls are specified with an array
					if(!urls[0].url && typeof urls[0] != "string"){
						//console.log("!urls[0].url", urls);

						o = urls.shift();

					}
				}else{

					var args = Array.prototype.slice.call(arguments, 0);

					if(typeof args[0] === "object"){
						if(!args[0].urls){
							o = args.shift();
						}
					}
					if(args.length){
						if(args[0] instanceof Array){
							urls = args[0];
						} else if(args[0] instanceof Object){
							urls = args[0].urls || [];
						} else {
							urls = args;
						}
					}
				}



				var params = (typeof o === "object") ? o : {};
				var id = this.tracks.length;
				params.loopActive = typeof params.loopActive === "number" ? params.loopActive : 1;
				params.active = typeof params.active === "number" ? params.active : 1;
				params.destination = params.destination || self.master.input;
				params.channelMerger = params.channelMerger || self.channelMerger;
				params.timeSign = params.timeSign || this.parameters.timeSign;
				params.tempo = params.tempo || this.parameters.tempo;
				params.upbeat = params.upbeat || this.parameters.upbeat;
				params.audioPath = params.audioPath || this.parameters.audioPath;
				//params.upbeat = (typeof params.upbeat == "number") ? params.upbeat : this.parameters.upbeat;
				params.partLength = params.partLength || this.parameters.partLength;
				
				if(params.loopLength){
					params.loopEnd = this.divisionToTime(String(params.loopLength));
				}
				params.loopEnd = params.loopEnd || this.parameters.loopEnd;


				params.volume = (typeof params.volume == "number") ? params.volume : this.parameters.volume;

				var bus;

				/*
					// skip the idea of sharing busses between sections
				if(self.busses.length == this.tracks.length){
					// create a new bus if needed
					bus = new Bus(params);
					self.busses.push(bus);
				}else{
					bus = self.busses[id];
				}
				*/

				bus = new Bus(params);
				self.busses.push(bus);

				if(params.output){
					bus.connect(params.output);
				}


				var parts = this.createParts(urls, params, bus, this);

				params.index = id;
				// if(parts.length){
					params.parts = parts;
					params.bus = bus;


					var newTrack = new Track(params, this);

					if(params.fadeTime){
						// This line does not seem to be needed any more. And it creates a conflict for tracks 
						// with both fadeTime and follow-variable set.
						// newTrack.setVolume(0, true); // true == dontStoreInParameters
						// console.log("fade out crossFaded track")
					}

					this.tracks.push(newTrack);
					return newTrack;

				// }

				// return;

			}


			// add stem on init track if urls are provided
			if(o){
				if(o.urls){
					if(o.urls.length){
						this.addStem(o);
					}
				}
			}


			this.addTransition = function(o){

				var args = Array.prototype.slice.call(arguments, 0);
				// treat first argument as targetPart
				var targetSection = args.shift();

				var firstObject = args[0];
				if(firstObject instanceof Object){

					// if object is the first part data
					if(firstObject.url){

					}else{
					// if object is default parameters for transition
						var params = args.shift();
					}
				}

				params = params || {};
				if(typeof params.upbeat === "undefined"){params.upbeat = self.upbeat;}
				params.urls = args;
				params.index = self.sections.length;
				this.transitions[targetSection.id] = new Section(params);


			}

			var triggedRecently = false;



			this.setOffset = function(offset){


				var oldMusicalStart = self.sectionStart;

				if(typeof offset === 'number'){
					self.sectionStart = audioContext.currentTime - offset / 1000;

				} else if(self.parameters.sync == 'true'){

					// sync to eternal clock

					let timeSince1970 = new Date().getTime() / 1000;
					self.sectionStart = audioContext.currentTime - timeSince1970;

				} else if(typeof self.externalOffset !== 'undefined'){
					var now = new Date().getTime();
					var timeSinceExternalOffset = (now - self.creationTime + externalOffset) / 1000;
					self.sectionStart = audioContext.currentTime - timeSinceExternalOffset;

				} else {

					// find the earliest start on any Stem and sets musicalStart accordingly

					var maxUpbeatOffset = getMaxUpbeatOffset(this.tracks);
					self.sectionStart = audioContext.currentTime + maxUpbeatOffset + timeWindow * 2;


				}
				//this.sectionStart = self.sectionStart;
				return self.sectionStart;


			}





			this.stop = function(callBack){
				triggedRecently = false;
				if(self.queueID){clearInterval(self.queueID)}
				self.queueID = null;



				if(self.playing && self.currentSection == this){


					if(this.postSection){

						this.postSection.play(1);

					} else {
						self.stop();
					}

				}


				self.playing = false;

				// reset all part counters
				this.tracks.forEach(function(track){
					//track.stop();
					track.parts.forEach(function(part){
						part.counter = 0;
					});



				});
			}


			this.queue = function(){


				this.play(1);

			}


			this.replay = function(){
				this.stop();


				this.play();
			}


			this.play = function(nrOfLoops, nextTime, selector){


				// exit if trigged recently or if this section is already playing
				if(triggedRecently || ((self.currentSection == this) && self.playing)){return;}


				// set all track states correctly
				// RangeError: Maximum call stack size exceeded. Fix bug!
				//variableWatcher.update(true);


				// reset if instance is not playing
	 			if(!self.playing){

	 				initAudioContextTimer(self);


					if(!self.queueID){

						self.queueID = setInterval(self.checkQueue, checkQueueTime);
						// There are timing problems with first event on track. Is this a solution?
						self.checkQueue();
					}
					self.currentBar = 1;
	 			}


	 			var barDuration = this.getBarDuration();
	 			var thisSection = this;

				if(self.currentSection && self.playing) {
					// set transition if it exists

					// var maxUpbeatInThis = this.getMaxUpbeatOffset();
					// var maxFadeTimeInThis = this.getMaxFadeTime();
					// var maxLeadInOffset = self.currentSection.getMaxLeadInUpbeatOffset(selector);
					// let maxUpbeat = Math.max(maxUpbeatInThis, maxLeadInOffset, maxFadeTimeInThis);

					// var nextTime = self.currentSection.getNextLegalBreak(maxUpbeat);
		 			
					nextTime = nextTime || getNextTime(self.currentSection, this, selector);

		 			var timeToLegalBreak = nextTime - audioContext.currentTime;
					// console.log(`timeToLegalBreak: ${timeToLegalBreak.toFixed(2)}, maxUpbeatInThis: ${maxUpbeatInThis.toFixed(2)}, maxLeadInOffset: ${maxLeadInOffset.toFixed(2)}`);


		 			self.currentSection.finishPlaying(timeToLegalBreak);
		 			// self.sectionStart = nextTime;


				} else {

					var nextTime = this.setOffset(); // sets musicalStart depending on max upbeat

					if(!self.playing){
						self.musicalStart = nextTime;
						self.sectionStart = nextTime;
					}

				}

				self.playing = true;

				var currentPartID;

				//console.log("play(section " + this.id + ", " + Math.floor(self.sectionStart*100)/100 + ")");

	 			if(nrOfLoops > 0){

	 				// queue a section in its full length
	 				// this way should probably merge into transtion playback
	 				self.sectionStart = nextTime;
	 				this.schedule(nrOfLoops);
	 				self.sectionStart += this.length * nrOfLoops;


	 			} else {

	 				// normal looped playback
	 				currentPartID = currentPartID || 0;

	 				for(var trackID in this.tracks){
	 					var track = this.tracks[trackID];
	 					track.currentPartID = currentPartID;
	 					track.nextTime = nextTime;
	 				}

					// These lines were added to cope with missing files with upbeat
					// if they are the first start of playback
					// maxOffset = maxOffset || this.getMaxUpbeatOffset();
					let maxOffset = this.getMaxUpbeatOffset();
					timeToLegalBreak = timeToLegalBreak || 0;
					
					let preroll = timeWindow * 1.5;
					let delay = timeToLegalBreak - maxOffset;
					// delay = delay > preroll ? delay - preroll: 0;
					delay = delay > preroll ? delay - preroll: 0;
					

					// activate event triggers for each listener
					setTimeout(e => {
						// stop current trigger intervals
						self.clearTriggerIntervals();
						self.sectionStart = nextTime;

						Object.keys(self._listeners).forEach(key => {

							switch(key){
								case "playFile":
									break;

								default:
									let time = this.divisionToTime(key);
									let event = new CustomEvent(key);

									self.dispatchEvent(event);
									let id = setInterval(() => self.dispatchEvent(event), time * 1000);
									self.triggerIntervals.push(id);
									break;
							}
						});
					}, timeToLegalBreak * 1000);
					
					setTimeout(() => {
						let tag = this.tags[0];
						iMus.GUI.indicateTriggerButtons(tag);
						let pos = this.getPosition(nextTime-self.musicalStart);
						// pos.bar = self.currentBar;
						waxml.log(`SECTION, ${tag}, 
							tempo: ${this.parameters.tempo}, 
							timeSign: ${this.parameters.timeSign.nominator}/${this.parameters.timeSign.denominator},
							${posObjectToString(pos)}`);
						waxml.dispatchEvent(new CustomEvent(tag));
					}, timeToLegalBreak * 1000);


					setTimeout(() => {
						// this will make the queue change to this section after
						// timeToLegalBreak

						self.currentSection = this;
						self.sectionStart = nextTime;
						let tag = this.tags[0];
						console.log("currentSection = " + tag);
						
						this.resetFades();

						// reset track fades and loopIDs
						this.tracks.forEach(function(track){

							track.nextTime = 0;
							// if(track.parameters.fadeTime){
							// 	if(track.active > 0){track.fadeIn(0,0)}
							//
							// }
							delete track.loopID;


						});

					}, delay * 1000);


				}


				this.timeToLegalBreak = timeToLegalBreak;
				triggedRecently = true;
				setTimeout(function(){triggedRecently = false;},200);
				return timeToLegalBreak;
			}

		}

		Section.prototype.getTimeToLegalBreak = function(){
			return this.timeToLegalBreak|| 0;
		}

		Section.prototype.stopAllSounds = function(){
			this.stop();
			this.tracks.forEach(function(track){
				track.stopAllSounds();
			});
		}

		Section.prototype.addLoopTrack = function(urls){

			if(typeof urls === "string"){urls = [urls];}
			let tags = [];
			if(!this.tags.length){
				tags = urlsToTags(urls);
			}
			// let tags = mergeArrays(urlsToTags(urls), this.tags);
			//var tags = urlsToTags(urls).concat(this.tags);
			return this.addStem({tags: tags}, urls);

		}

		Section.prototype.addMotif = function(params, urls){
			return defaultInstance.addMotif(params, urls, this);
		}


		Section.prototype.addStingerTrack = function(urls){

			var tags = urlsToTags(urls); // .concat(this.parameters.tags);
			return self.addMotif({tags: tags}, urls);

		}

		Section.prototype.addTrackGroup = function(selector){
			var selection = new Selection(selector, this.tracks);
			selection.group();

			selection.objects.forEach(function(track, id){
				var activeVal = (id == 0 ? 1 : 0);
				track.setActive(activeVal);
			});
		}

		Section.prototype.resetFades = function(){

			this.tracks.forEach(track => {
				let state = track.getFilterState(defaultInstance.selectFilter) != false;
				
				if(track.parameters.fadeTime){
					track.fade(state ? 1 : 0, 0, 0);
				}
			});
		}


		Section.prototype.schedule = function(nrOfLoops){

			var end = this.parameters.loopEnd * nrOfLoops;

			for(trackID in this.tracks){

				var nt = self.sectionStart;

				var track = this.tracks[trackID];

				for(var loopID = 0; nt < end; loopID++){
					var trackStart = loopID * track.parameters.loopEnd;
					for(partID in track.parts){

						var targetPart = track.parts[partID];

						// store randomness from track in part
						targetPart.active = track.active;
						var relPos = targetPart.pos + targetPart.offset;

						// if targetPart is within timeWindow
						var time = self.sectionStart + trackStart + relPos;
						playSound(targetPart, time);

					}
				}
			}
		}








		function getNextLegalBreak(targetTime, compareObjArr){


			// den här koden innehåller en del fel som gör att övergångar sker direkt när man använder fadeTime


			targetTime = targetTime || audioContext.currentTime;
			var musicTime = targetTime - self.sectionStart;
			this.musicTime = musicTime;


			var segmentDuration = this.divisionToTime(this.parameters.changeOnNext);

			//segmentDuration = this.getBarDuration();	
			let nextMusicTime = Math.ceil(musicTime / segmentDuration) * segmentDuration;
			if(nextMusicTime-musicTime < timeWindow * 2){
				// if current musicTime is before nextMusicTime but within timeWindow
				// skip to next segment
				nextMusicTime += segmentDuration;
			}

			var returnObj;
			returnObj = {};
			returnObj.time = self.sectionStart + nextMusicTime;
			returnObj.timeLeft = returnObj.time - audioContext.currentTime;
			returnObj.fadeTime = this.parameters.fadeTime || 0.01;
			returnObj.fadeTime = Math.min(returnObj.fadeTime, returnObj.timeLeft);
			//console.log(returnObj);
			return returnObj;



			// getTime() är inte stabil. Det jag behöver här är tiden sedan musiken startade
			//var localTime = this.getTime();


			var legalBreakPoints = this.parameters.legalBreakPoints || [{pos: "2.1"}];
			var loopEnd = this.musicalPositionToTime(this.get("loopEnd") || "2.1");

			targetTime = targetTime || audioContext.currentTime;
			var musicTime = targetTime - self.sectionStart;
			var localTime = musicTime % loopEnd;
			var loopID = Math.floor(musicTime / loopEnd);

			var targetBreakPoint = legalBreakPoints.find(function(breakPoint){
				var pos;

				switch(typeof breakPoint){

					case "object":
					pos = this.musicalPositionToTime(breakPoint.pos);
					break;

					case "number":
					pos = breakPoint;
					break;
				}



				var avoidPoint = false;
				/*
				if(compareObjArr){
					compareObjArr.forEach(function(compareObj){
						switch(compareObj.comp){
							case "equal":
							case "=":
							case "==":
							if(breakPoint[compareObj.prop] != compareObj.val){avoidPoint = avoidPoint || true}
							break;

							case "greaterThan":
							case ">":
							if(breakPoint[compareObj.prop] <= compareObj.val){avoidPoint = avoidPoint || true}
							break;

							case "lessThan":
							case "<":
							if(breakPoint[compareObj.prop] >= compareObj.val){avoidPoint = avoidPoint || true}
							break;

						}
					});
				}
				*/
				if(!avoidPoint){
					return pos > localTime;
				}

			}, this);

			if(!targetBreakPoint){
				targetBreakPoint = legalBreakPoints[legalBreakPoints.length-1];
			}

			console.log(loopID, loopEnd, targetBreakPoint);

			var returnObj;
			returnObj = {};
			returnObj.time = self.sectionStart + loopID * loopEnd + this.musicalPositionToTime(targetBreakPoint.pos);
			returnObj.fadeTime = targetBreakPoint.fadeTime || this.parameters.fadeTime || 0.01;
			returnObj.timeLeft = returnObj.time - audioContext.currentTime;

			if(returnObj.timeLeft < 0){
				console.log(returnObj);
				returnObj.timeLeft = 0;
			}


			// den här koden innehåller en del fel som gör att övergångar sker direkt när man använder fadeTime
			// därför har jag blockerat logiken för tillfället och använder jämna takter så länge



			return returnObj;
		}



		Section.prototype.getNextLegalBreak = function(offsets){

			let currentTime = audioContext.currentTime;
			let Q = this.divisionToTime(this.parameters.changeOnNext);
			let localTime = currentTime - self.sectionStart;
			let lastLegalBreak = Math.floor(localTime / Q) * Q;
			let b = Q;
			// while(b < offsets){
			// 	b += Q;
			// }
			while(self.sectionStart + lastLegalBreak + b < currentTime + offsets){
				b += Q;
			}
			return self.sectionStart + lastLegalBreak + b;

			while((nextMusicTime - offsets - timeWindow*1.5) <= nextMusicTime + Q){
				nextMusicTime += Q;
			}
			return nextMusicTime;
		}

		Section.prototype.finishPlaying = function(timeToLegalBreak){

			this.tracks.forEach(function(track){

				track.finishPlaying(timeToLegalBreak);

			});
		}


		Section.prototype.addLeadIn = function(params, urls){

			// används dessa rader alls? kolla addMotif
			params.quantize = params.quantize || "bar";
			var leadin = self.addLeadIn(params, urls, this);
			leadin.parameters.type = "leadIn";
			this.leadIns.push(leadin);
			return leadin;
		}

		// Section.prototype.getMaxLeadInUpbeatOffset = function(){
		// 	var maxOffset = 0;
		// 	if(this.leadIns){
		// 		this.leadIns.forEach(function(leadIn){
		// 			maxOffset = Math.max(maxOffset, leadIn.getMaxUpbeatOffset());
		// 		});
		// 	}
		// 	return maxOffset;
		// }

		Section.prototype.getMaxLeadInUpbeatOffset = function(selector){
			var minOffset = 0;
			let targetLeadins = this.leadIns.filter(leadIn => leadIn.tags.includes(selector));
			if(targetLeadins.length){
				targetLeadins.forEach(leadIn => {
					minOffset = Math.min(minOffset, leadIn.getMinUpbeatOffset());
			   	});
			} 
			
			return -minOffset;
		}

		Section.prototype.setTempo = function(value){

			this.parameters.tempo = value;

			this.tracks.forEach(function(track){
				track.parameters.tempo = value;

				track.parts.forEach(function(part){
					part.parameters.tempo = value;
				});
			});
		}


		Section.prototype.initParameters = initParameters;
		Section.prototype.addDefaultParameters = addDefaultParameters;
		Section.prototype.getBeatDuration = getBeatDuration;
		Section.prototype.getBarDuration = getBarDuration;
		Section.prototype.getPosition = getPosition;
		Section.prototype.getAbsolutePosition = getAbsolutePosition;
		Section.prototype.createParts = createParts;
		Section.prototype.getTime = getTime;
		Section.prototype.set = set;
		Section.prototype.setParams = setParams;
		Section.prototype.get = get;
		Section.prototype.map = map;
		Section.prototype.getMaxUpbeatOffset = getMaxUpbeatOffset;
		Section.prototype.getMaxFadeTime = getMaxFadeTime;
		Section.prototype.musicalPositionToTime = musicalPositionToTime;
		Section.prototype.divisionToTime = divisionToTime;









		var Track = function(o, section){

			// A collection of parts
			// Always playes in looped mode
			// Exists within a Section and Transition
			params = o || {}

			this.id = params.index;
			this.parts = params.parts;
			this.nextTime = 0;
			this.currentPartID = 0;
			this.tags = params.tags || params.class || "";
			if(typeof this.tags === "string"){this.tags = this.tags.split(" ")};
			this.idName = params.id || "";
			this.playingParts = [];
			this.groups = [];
			this.section = section;
			this.commands = [];

			this.type = "track";

			this.liveValues = {};
			this.soloGroups = [];
			this.envelopes = [];

			this.visualElements = [];


			this.bus = o.bus || self.getBus(this.id);
			this.volume = typeof o.volume === "number" ? o.volume : 1;
			this.bus.output.gain.value = this.volume;

			this.loopID;
			this.loopActive = typeof o.loopActive === "number" ? o.loopActive : 1;
			this.playing = false;



			// active is a number value between 0 and 1 that controls the the random factor
			// to play or not to play a part on an active track
			// 0 = muted = no parts will play
			// 0.5 = 50% of the parts will play controlled by random()
			// 1 = unmuted = all parts will play

			if(typeof params.active === "boolean"){
				this.active = params.active ? 1 : 0;
			}else if(typeof params.active === "number"){
				this.active = params.active > 1 ? 1 : (params.active < -1 ? -1 : params.active);
			}else{
				this.active = 1;
			}


			if(params.fadeTime){
				params.fadeTime = params.fadeTime / 1000;
			}

			this.parameters = this.initParameters(params, section.parameters);



			if(this.parameters.voice){
				this.parameters.voiceObjectID = iMus.voiceController.addVoiceObject(this.parameters.voice, 0, this.bus.voiceGain, this.parameters.fadeTime);
			}

			var beatDuration = self.getBeatDuration(); // !!
			var barDuration = self.getBarDuration();


			// this is a confusing section caused by the intention to provide both loopLength and loopEnd as valid input
			// parameters. If loopLength is used, the value is recalculated to a position and stored as loopEnd
			// If both are set, then loopLength take precidence over loopEnd

			var loopEnd;
			if(params.loopLength){
				loopEnd = this.divisionToTime(String(params.loopLength));
			}

			this.parameters.loopEnd = loopEnd || params.loopEnd || section.parameters.loopEnd || self.parameters.loopEnd || defaultParams.loopEnd;

			switch(typeof params.loopEnd){

				case "string":
				// get track length (for looping) from specified value
				// one year is currently enough to pretend it's off
				this.parameters.loopEnd = this.musicalPositionToTime(o.loopEnd);
				break;

				case "number":
				break;

				default:

				// use position and length of last part to define track length
				if(this.parts.length){
					var lastPart = this.parts[this.parts.length-1];
					lastPart.length = lastPart.length || barDuration;
					this.parameters.loopEnd = lastPart.pos + lastPart.length;
				} else {
					// to avoid errors
					this.parameters.loopEnd = barDuration;
				}
				break;
			}


			this.eventHandler = new EventHandler();


		}

		Track.prototype.togglePlay = function(){
			if(this.active > 0){
				this.stop();
			} else {
				this.play();
			}
		}


		Track.prototype.play = function(nextLegalBreakTimeLeft){

			// auto play the section of this track if iMusic is not playing
			if(!self.playing){
				// I took this line back in nov 2022...and removed it in 2023...
				// this.section.play(); //this is confusing in the new structure
			}

			initAudioContextTimer(self);

			var thisTrack = this;

			// Mute all tracks in group if track is part of a group
			/* This was removed after a more flexible select-function was introduced 2019
			this.groups.forEach(function(group){
				group.stop({omit:thisTrack});
			});
			*/

			/* The following lines are probably a confusion after
			adding fadeTime and keep on to the active setting.
			It seem to interfer with keeping active setting
			between arrangements */

			// if(this.active > 0){
			// 	if(this.parameters.fadeTime){
			// 		this.fadeIn();
			// 	}
			// 	return;
			// } else if(this.active == 0){
			// 	this.active = 1;
			// } else {
			// 	this.active = -this.active;
			// }
			this.active = Math.abs(this.active) || 1;

			//console.log(this, "play");

			if(self.playing){

				// make sure a track in fade mode is fading in
				if(this.parameters.fadeTime){

					// 2023-10-07
					// This is OK for switching between tracks but will it also
					// affect fading between different arrangements? If so, it would be 
					// wrong to use the nextLegalBreak() for the current track

					// add a track output before common bus input
					// or add a bus for each track

					var nextLegalBreak = this.getNextLegalBreak();
					if(!nextLegalBreak){
						nextLegalBreak = this.section.getNextLegalBreak();
						nextLegalBreak.fadeTime = this.parameters.fadeTime;
					}
					// if(nextLegalBreakTimeLeft != nextLegalBreak.timeLeft){
					// 	console.log("legalTimeOverride", nextLegalBreakTimeLeft);
					// }
					nextLegalBreak.timeLeft = nextLegalBreakTimeLeft || nextLegalBreak.timeLeft;
					//var timeToLegalBreak = nextLegalBreak.time - audioContext.currentTime;
					this.fade(1, nextLegalBreak.timeLeft, nextLegalBreak.fadeTime);
				}
			}
		}


		Track.prototype.stop = function(nextLegalBreakTimeLeft){

			// delete this.loopID;

			if(this.active <= 0){
				return;
			}
			this.active = -Math.abs(this.active);
			console.log(`track${this.id}.stop()`);

			if(this.parameters.fadeTime){
				if(self.playing){
					// make sure a track in fade mode is fading in

					// add a track output before common bus input
					// or add a bus for each track

					var nextLegalBreak = this.getNextLegalBreak(); // [{prop:"out", comp:"=", val:true}]

					nextLegalBreak.timeLeft = nextLegalBreakTimeLeft || nextLegalBreak.timeLeft;
					this.fade(0, nextLegalBreak.timeLeft, nextLegalBreak.fadeTime);
					this.playing = false;

				} else {
					this.fade(0, 0, 0);
				}

			}


		}

		Track.prototype.stopAllSounds = function(){

			this.finishPlaying(0);
		}

		Track.prototype.finishPlaying = function(timeToLegalBreak){

			var fadeTime = this.parameters.fadeTime;
			// delete this.loopID;


			// move this to the previous section instead!
			this.commands.forEach(cmd => {
				cmd.clear(timeToLegalBreak + self.sectionStart);
			});

			let disconnectAllObjects = (e => {
				while (this.playingParts.length) {
					let part = this.playingParts.pop();
					if(part.playingSources){
						if(iMus.debug){
							console.log(`playingSources.length: ${part.playingSources.length}`);
						}
						while (part.playingSources.length) {
							if(part.timeouts){
								let timeout = part.timeouts.pop();
								clearInterval(timeout);
								//clearTimeout(timeout);
							}
							let source = part.playingSources.pop();
							source.disconnect(0);
							

							// this does not handle the forced fade caused by
							// short regions triggered within loop before
							// nextLegalBreak
							// if(fadeTime){
							// 	source.disconnect(0);
							// }

						}
					}

				}
				// Is this really neeed? Is it enough to reset fades
				// When a section starts to play?
				//if(this.active > 0){this.fadeIn()}
			});

			/*
			var me = this;
			var disconnectAllObjects = function(){
				me.parts.forEach(function(part){
					if(part.playingSources){
			 			while(part.playingSources.length){
			 				var oldSource = part.playingSources.shift();
			 				oldSource.disconnect(0);
			 				oldSource = 0;
			 			}
					}
				});
			}
			*/

			if(fadeTime){
				this.playing = false;
				this.fade(0, timeToLegalBreak, fadeTime, disconnectAllObjects);
			} else {
				// not fading objects shall play their whole tail
				// and not be disconnected
				// BUT if timeToLegalBreak is shorter than the remaining part of the region
				// (set by partLength) it will be faded and disconnected anyway
				return;
				let remainingTime = 0;
				this.playingParts.forEach(part => {
					let remainingPartTime = (part.lastTriggedTime + part.length) - (audioContext.currentTime + timeToLegalBreak);
					remainingTime = Math.max(remainingTime, remainingPartTime);
				});
				if(remainingTime){
					fadeTime = 0.001;
					this.fade(0, timeToLegalBreak, fadeTime, disconnectAllObjects);
				} else {
					disconnectAllObjects();
				}
			}


		}

		Track.prototype.addEnvelopes = function(envelopes){
			this.envelopes = envelopes;
		}

		Track.prototype.setVariation = function(val, val2){
			this.parts.forEach(function(part){
				part.variation = val;
				part.variationMaster = (val2 == "master");
			});

		}


		Track.prototype.setSoloState = function(_param1, _param2, nextLegalBreakTimeLeft){
			if(!this.getSoloGroup(_param1)){return}

			var state = getSoloState(this.soloGroups, _param1, _param2);

			//console.log(`${this.section.id} - ${this.id} - ${state}`);

			// get longest nextLegalBreak time for involved tracks

			if(state === true){
				this.play(nextLegalBreakTimeLeft);
			} else if(state === false){
				this.stop(nextLegalBreakTimeLeft);
			}
		}

		Track.prototype.getSoloState = function(_param1, _param2){
			return getSoloState(this.soloGroups, _param1, _param2);
		}
		Track.prototype.getFilterState = getFilterState;

		Track.prototype.filter = function(globalFilter){
			let state = this.getFilterState(globalFilter);
			if(state == true){
				this.play();
			} else if (state == false){
				this.stop();
			}
		}


		Track.prototype.getSoloGroup = getSoloGroup;

		Track.prototype.setPartLength = function(value){

			value = this.divisionToTime(value);
			this.parts.forEach(function(part){
				part.length = value;
			});

		}


		Track.prototype.setUpbeat = function(value){

			value = this.divisionToTime(value);
			this.parts.forEach(function(part){
				part.offset = -value;
			});

		}

		Track.prototype.setRepeat = function(val){
			this.parts.forEach(function(part){
				part.parameters.repeat = val;
				part.counter = 0;
			});
		}

		Track.prototype.update = function(sequence){

			this.parts = this.createParts(sequence, this.parameters, this.bus, this);

		}



		Track.prototype.getNextLegalBreak = getNextLegalBreak;
		Track.prototype.initParameters = initParameters;
		Track.prototype.addDefaultParameters = addDefaultParameters;
		Track.prototype.getBeatDuration = getBeatDuration;
		Track.prototype.getBarDuration = getBarDuration;
		Track.prototype.getPosition = getPosition;
		Track.prototype.setActive = setActive;
		Track.prototype.createParts = createParts;
		Track.prototype.getTime = getTime;
		Track.prototype.setVolume = setVolume;
		Track.prototype.getVolume = getVolume;
		Track.prototype.fade = fade;
		Track.prototype.fadeIn = fadeIn;
		Track.prototype.fadeOut = fadeOut;
		Track.prototype.musicalPositionToTime = musicalPositionToTime;
		Track.prototype.setParams = setParams;
		Track.prototype.set = set;
		Track.prototype.map = map;
		Track.prototype.divisionToTime = divisionToTime;
		Track.prototype.get = get;

		Track.prototype.setSoloGroup = setSoloGroup;

		Track.prototype.urlToUpbeat = urlToUpbeat;

		Track.prototype.setActiveVariations = function(activeVariations){

			this.parameters.activeVariations = activeVariations;
			this.parts.forEach(function(part){
				part.parameters.activeVariations = activeVariations;
			});
		}




		var Part = function(o, defaultData, bus, curPos){
			// a (typically) one bar of music including (optional) upbeat and (recommended) release tag

			var thisPart = this;
			if(o instanceof Array){

				// if array with urls
				o = {url:o};

			} else if(typeof o === "string"){
				// if single url
				o = {url:o};
			}

			o = o || {};
			defaultData = defaultData || {};
			this.parameters = this.initParameters(defaultData);

			var beatDuration = getBeatDuration(defaultData);
			var barDuration = getBarDuration(defaultData);

			if(typeof defaultData.timeSign === "string"){
				defaultData.timeSign = getTimeSign(defaultData.timeSign);
				//defaultData.length = defaultData.timeSign.nominator * beatDuration * self.parameters.timeSign.denominator / defaultData.timeSign.denominator;
			}
			var timeSign = defaultData.timeSign || self.parameters.timeSign;


			// ******* UPBEAT ******* //
			/*
			var upbeat;
			if(typeof o.upbeat === "undefined"){
				upbeat = defaultData.upbeat;
			} else {
				upbeat = o.upbeat;
			}
			*/

			let upbeat = o.upbeat || self.parameters.upbeat || 0;

			if(typeof upbeat === "string"){
				upbeat = getTimeSign(upbeat);
				upbeat = upbeat.nominator * beatDuration * self.parameters.timeSign.denominator / upbeat.denominator;
			} else if(typeof upbeat === "number"){
				upbeat /= 1000;
			}
			this.offset = -upbeat || 0.0;



			// ******* POSITION ******* //
			if(typeof o.pos === "string"){
				// use specified pos if available, else calculated value from previous part
				// format has to be "bar.beat" ie "10.3" for beat 3 in bar 10
				curPos = this.musicalPositionToTime(o.pos);
			} else if(typeof o.pos === "number"){
				curPos = o.pos;
			}
			this.pos = curPos;




			// ******* LENGTH ******* //

			var length;
			if(typeof o.length === "number"){
				length = o.length;
			} else {
				length = o.length || defaultData.partLength;
				length = divisionToTime(length, defaultData.timeSign, beatDuration);
				/*
				if(typeof length === "string"){
					length = getTimeSign(length);
				}

				length = length.nominator * beatDuration; // * self.parameters.timeSign.denominator / length.denominator;
				*/
			}

			// maybe move this to parameters
			this.length = length;




			// store urls in array
			var urls = typeof o.url === "string" ? [o.url] : o.url;

			var urlsCopy = [];
			this.files = [];
			// make a fresh copy of urls (so we don't mess with incoming array)
			urls.forEach(function(url){
				urlsCopy.push(url);
			});
			this.url = urlsCopy;

			for(var urlID in this.url){

				if(typeof this.url[urlID] === "string"){
					if(this.url[urlID].length){
						var fullPath = addAudioPath(defaultData.audioPath, this.url[urlID]);
						this.url[urlID] = fullPath;

						self.loadFile({url: this.url[urlID]}, function(fileData){

							// double structure for future use
							thisPart.files.push(fileData);
							loadComplete();
						}, function(){
							// error 
							loadComplete();
						});

						//console.log(this.url[urlID] + ": pos: " + this.pos + "; offset: " + this.offset + "; length: " + this.length);
					}
				}
			}

			this.id = o.index;

			this.parameters.destination = bus.input;
			this.parameters.channelMerger = self.channelMerger;

			this.bus = new Bus(this.parameters);
		}

		Part.prototype.fade = fade;
		Part.prototype.initParameters = initParameters;
		Part.prototype.addDefaultParameters = addDefaultParameters;
		Part.prototype.getBeatDuration = getBeatDuration;
		Part.prototype.getBarDuration = getBarDuration;
		Part.prototype.getPosition = getPosition;
		Part.prototype.setActive = setActive;
		Part.prototype.musicalPositionToTime = musicalPositionToTime;










		var Motif = function(o, section){

			// A short, single track, single part, phrase to be played in addition
			// to a section. It can trigger quantized to a specific note value


			this.id = self.motifs.length;
			this.section = section;
			this.envelopes = [];
			this.commands = [];
			this.soloGroups = [];

			this.type = "motif";
			this.visualElements = [];

			var me = this;

			this.parentObj = section || defaultInstance;
			var beatDuration = this.parentObj.getBeatDuration();
			o.quantize = getTimeSign(o.quantize || this.parentObj.parameters.quantize || self.parameters.quantize, this.parentObj.parameters.timeSign);

			this.volume = o.volume || 1;

			// a terrible solution where urls CAN be an Array with Command objects
			// is passed to JSON.parse which is illegal. Terrible.
			let urls = o.urls;
			o.urls = undefined;

			this.parameters = this.initParameters(o, self.parameters);

			o.urls = urls;

			this.loop = o.loop || 0;
			this.loop = this.loop == "off" ?  0 : this.loop;
			this.loopCnt = 0;
			this.idName = o.id || "";

			this.tags = o.tags || o.class || [];
			if(typeof this.tags === "string"){this.tags = this.tags.split(" ")};
			this.tags = this.tags.concat(urlsToTags(o.urls));

			this.parameters.destination = self.motifBus.input;
			this.parameters.channelMerger = self.channelMerger;
			this.bus = new Bus(this.parameters);

			if(this.parameters.voice){
				this.parameters.voiceObjectID = iMus.voiceController.addVoiceObject(this.parameters.voice, 1, this.bus.voiceGain, this.parameters.fadeTime/1000);
			}

			if(this.parameters.output){
				this.bus.connect(this.parameters.output);
			}

			this.eventHandler = new EventHandler();


			this.active = typeof o.active === "number" ? o.active : 1;
			this.sounds = [];
			
			
			if(this.parameters.pos){
				// if specified with negative pos value
				this.offset = this.parentObj.divisionToTime(this.parameters.pos);
			} else {
				// old syntax with positive upbeat value
				this.offset = -this.parentObj.divisionToTime(this.parameters.upbeat);
			}
			
			// use setting from parent section if not set for the leadin
			this.changeOnNext = this.parentObj.divisionToTime(this.parameters.changeOnNext || this.parentObj.parameters.changeOnNext);
			this.parameters.length = this.parentObj.divisionToTime(this.parameters.length);

			// this.parameters.length

			var obj;
			var url;

			for(var urlID in o.urls){
				url = o.urls[urlID];


				if(typeof url === "string"){

					// url without parameters
					obj = {};
					obj.url = addAudioPath(self.parameters.audioPath, url);


					obj.offset = -this.urlToUpbeat(url) || this.offset;

					//obj.offset = this.offset || 0;
				} else if(typeof url === "object"){

					// url with parameters
					obj = url;

					let src = obj.url || obj.src;
					if(src){
						obj.url = addAudioPath(self.parameters.audioPath, obj.url || obj.src);
					}
					// length
					if(obj.length){
						obj.length = this.parentObj.divisionToTime(obj.length);

						// var length = getTimeSign(obj.length);
						// obj.length = length.nominator * beatDuration * this.parentObj.parameters.timeSign.denominator / length.denominator;
					} else {
						// default one beat
						// obj.length = beatDuration;
					}

					if(obj.voice){
						obj.voice = obj.voice.split(" ").map(str => str.trim());
					}

					obj.offset = obj.pos ? this.parentObj.divisionToTime(obj.pos) : (-this.parentObj.divisionToTime(obj.upbeat) || this.offset || 0);
					if(!obj.offset){
						obj.changeOnNext = this.parentObj.divisionToTime(this.parameters.changeOnNext);
					}
				} else {

					console.error("Motif url is not correct: " + url);
				}
				self.loadFile(obj);

				this.sounds.push(obj);
			}



			me.triggedRecently = false;

			this.play = function(arg1, nextTime){

				// only play if parent section is playing or if Motif is
				// not connected to a section

				// 2022-09-15
				// This is now controlled in the global function iMus.play() instead. The old way of triggering
				// all motifs and leadins and then check if they were a part of the currentSection caused problems
				// when triggered after the currentSection had changed to the new one (i.e. if triggered after 
				// timerWindow)
				
				// if(this.section){
				// 	if(!(this.section.parameters.tags == defaultSectionName || this.section == self.currentSection)){
				// 		return;
				// 	}
				// }

				if(this.active <= 0){return}

				let currentTime = audioContext.currentTime;

				// console.log(`currentTime: ${currentTime.toFixed(2)}, nextTime: ${nextTime.toFixed(2)}`);

				// I'm not sure what this is for. It seems to case problems, making the motifs
				// staying at zero volume
				if(this.parameters.fadeTime){
						//this.fadeOut(0, this.parameters.fadeTime);
				}


				// avoid cracy double trigging

				var blockRetrig = this.parameters.blockRetrig || 0;

				if(arguments.length){
					var args = Array.prototype.slice.call(arguments, 0);
					if(typeof args[0] === "number"){
						blockRetrig = args.shift();
					}

					if(typeof args[0] === "string"){
						var playFunction = args.shift();
						switch(playFunction) {

							// causes the motif to retrigger when played
							case "loop":
							this.loop = -1;
							break;
						}
					}


					if(typeof args[0] === "function"){
						this.callBackOnFinish = args.shift();
					}
				}

				if(me.triggedRecently){
					console.log("trigged recently");
					return;
				}

				me.playing = true;
				//console.log("Play Motif: " + this.parameters.classList);

				if(self.currentSection && this.parameters.quantize != "off"){

					let controllingSection = this.section || self.currentSection;


					var beatDuration = controllingSection.getBeatDuration();
					var Q;
					if(this.parameters.type == "leadIn"){
						Q = this.parentObj.parameters.changeOnNextQ;
					} else {
						Q  = this.parameters.quantize.nominator * beatDuration * controllingSection.parameters.timeSign.denominator / this.parameters.quantize.denominator;
					}

					time = controllingSection.getTime();

					var Qtime, localTime, timeToQ, t;

					if(nextTime){
						// predefined. merge with the sorting of sounds. this is not enough
						Qtime = nextTime;
						localTime = Qtime - self.sectionStart;
						timeToQ = Qtime - audioContext.currentTime;

					} else {
						// calculated
						Qtime = Math.ceil(time / Q) * Q + self.sectionStart;
						localTime = (time+Q) % Q;
						timeToQ = Q - localTime;
					}
					

					// sort all sounds with the one to be played nearest in the future first
					this.sounds.sort(function(a, b){
						var diffA = Q + a.offset - localTime;
						diffA = diffA < 0 ? diffA + Q : diffA;
						var diffB = Q + b.offset - localTime;
						diffB = diffB < 0 ? diffB + Q : diffB;
						return diffA - diffB;
					});
				} else {
					timeToQ = 0;
				}


				var targetSounds = [];

				// pick the url that best suits the time from now to Qtime
				for(var i = 0; i < this.sounds.length; i++) {


					var curSound = this.sounds[i];
					//console.log(`offset = ${curSound.offset}`);

					if(targetSounds.length) {

						// add sound if it has the same offset (then randomize)
						if(curSound.offset == targetSounds[0].offset){
							targetSounds.push(curSound);
						}
					} else {

						// add at least one sound
						targetSounds.push(curSound);
					}

				}

				//console.log(`offset = ${targetSounds[0].offset}`);

				// put all possible files in url-list
				this.url = [];
				for(var sndID in targetSounds){
					var targetSound = targetSounds[sndID]
					this.url.push(targetSound);
				}
				//var targetSound = targetSounds[Math.floor(Math.random()*targetSounds.length)];
				let crop = 0;
				let offset = targetSound ? targetSound.offset : this.offset;

				if(this.parameters.quantize != "off"){

					// move to next legal Q if time is to early
					let offset = (targetSound ? targetSound.offset : 0);
					t = (nextTime ? nextTime : Qtime) + offset;

					if(this.parameters.type != "leadIn"){

						// Motifs are always synchronized with the next section change.
						// Leadins are only played if they fit BEFORE the 
						// next Q-time
						while(t < currentTime) {
							t+=Q;
						}
					} else {
						if(!self.playing){
							// only play leadins if music is playing
							return;
						}

						if(t < currentTime){ //} - timeWindow){ 2023-10-17
							
							
							// If a leadin has changeOnNext set, then make a cut-in
							// t += Q; // next Q-point i.e. bar
							let ChOn = targetSound.changeOnNext || this.changeOnNext;
							if(ChOn){
								t += this.getMaxUpbeatOffset();
								let nrOfChOn = parseInt(timeToQ / ChOn);
								if(!nrOfChOn){
									// wait an extra bar
									if(!nextTime){t += Q}							
								} else {
									crop = Math.abs(offset) - nrOfChOn * ChOn;
									t -= nrOfChOn * ChOn;
									// timeToQ -= Q;
									// console.log({now:currentTime.toFixed(2), next: t.toFixed(2), Q: Q, nrOfChOn: nrOfChOn, crop: crop})	
								
								}
								
							} else {
								// don't play a leadin if it's too late
								console.log(`Too late: ${t, audioContext.currentTime, targetSound.offset}`);
								// return;

								// 2023-10-06 update. Play in next bar
								t += Q;
							}
						}
					}
				} else {
					t = currentTime;
				}
				//this.url = targetSound.url;

				var that = this;
				var doOnFinishPlaying = function(){

					// retrigg if eternal loop

					switch(me.loop) {

						case -1:
						if(me.playing){
							me.play();
						}

						break;

						case 0:
						me.playing = false;
						break;

						default:
						me.loopCnt++;
						if(me.loopCnt <= me.loop){
							me.play();
						} else {
							me.playing = false;
							me.loopCnt = 0;
						}
						break;

					}
					if(that.callBackOnFinish){that.callBackOnFinish();}
				}


				// This is problematic for various reasons. This.url is set to (potentially) multiple 
				// sound objects and the random selection is done in the playSound() method. This means 
				// that the Motif object needs to retrieve which one was set to do clever things depending on it. 
				
				// if(nextTime){
				// 	t = nextTime; // + offset;
				// }
				var chosenURL = playSound(this, t, this.callBackOnStart, doOnFinishPlaying, undefined, crop);

				let pos = this.getAbsolutePosition(t);

				let description;
				if(chosenURL && chosenURL.url){
					description = waxml.pathToFileName(chosenURL.url);
				} else {
					description = this.tags[0];
				}
				 
				let label = this.parameters.type == "leadIn" ? "LEAD-IN" : "MOTIF";
				
					
				waxml.log([label, 
					description, 
					"changeOnNext: " + this.parameters.changeOnNext,
					posObjectToString(pos)
				]);


				let barDuration = this.getBarDuration();

				// ENVELOPES
				this.envelopes.forEach(env => {
					let origTimes = env.getParameter("orig-times");
					let times = origTimes.split(",").map(time => {
						time = parseFloat(time);
						if(time <= 100){
							time = time * timeToQ / 100;
						} else {
							time -= 100;
							time = timeToQ + time * barDuration / 100;
						}
						//time += beatDuration;
						return time;
					});

					
					console.log(times);
					env.setTimes(times);
					env.start();
				});

				// COMMANDS
				this.commands.forEach(cmd => {
					cmd.trig(t);
					// cmd.trig(timeToQ);
				});

				if(chosenURL && chosenURL.commands){
					chosenURL.commands.forEach(cmd => {
						cmd.trig(t);
					});
				}



				if(this.parameters.voiceObjectID){
					let endTime;
					if(this.parameters.type == "leadIn"){
						endTime = Qtime;
					} else {
						let length = chosenURL.length || this.parameters.length || this.parentObj.getBeatDuration();
						endTime = t + length;
						if(!length){
							console.log(`No length:`, this);
						}
					}
					iMus.voiceController.playVoiceObject(this.parameters.voiceObjectID, t, endTime, chosenURL.voice);
				}

				switch(this.parameters.retrig){

					case "next":
					case "shuffle":
					case "repeat":
					case "other":
					var i = this.sounds.indexOf(chosenURL);
					// pick target URL
					chosenURL = this.sounds.splice(i, 1)[0];
					// move selected file last
					this.sounds.push(chosenURL);
					break;

				}


				// make sure it does not double trig on the same Q value
				blockRetrig = blockRetrig || timeToQ;

				if(blockRetrig){
					me.triggedRecently = true;
					setTimeout(function(){
						me.triggedRecently = false;
					},blockRetrig*1000);
				}

				return timeToQ;
			}


			this.stop = function(){

				me.playing = false;
				me.triggedRecently = false;
				var gainNode = this.bus.output;

				fadeAudioNode(gainNode, 1, 0, 0.01);

				if(me.playingSources){
					setTimeout(function(){
						me.playingSources.forEach(function(source){
							source.disconnect(0);
						});
						fadeAudioNode(gainNode, 0, 1, 0);
					}, 20);
				}


			}

		}



		this.addMotif = function(){

			var params = {};
			var q, upbeat;

			if(arguments.length){
				var args = Array.prototype.slice.call(arguments, 0);
				if(args[0] instanceof Object){
					if(!args[0].url){

						// Motif properties found
						params = args.shift();

					}

				}

/*
				while(!args[args.length-1]){
					args.pop();
				}
*/


				// check if urls was set with array
				if(Array.isArray(args[0])){
					params.urls = args[0];
				} else {
					params.urls = args;
				}


				// store reference to section
				var section = args[1];


			} else {

				return -1;
			}

			var newMotif = new Motif(params, section);
			self.motifs.push(newMotif);


			return newMotif;
		}

		Motif.prototype.getMaxUpbeatOffset = function(){

			var maxOffset = 0;
			if(this.sounds){
				this.sounds.forEach(function(sound){
					if(sound){
						maxOffset = Math.min(maxOffset, sound.offset);
					}
				});
			}

			return -maxOffset;
		}

		Motif.prototype.getMinUpbeatOffset = function(){

			var minOffset = -this.changeOnNext; // || sound.offset; // -this.getBarDuration();
			
			this.sounds.forEach(sound => {
				if(sound){
					// let thisOffset = -this.changeOnNext || sound.offset;
					minOffset = Math.max(minOffset, sound.offset);
				}
			});

			// console.log(`${this.tags[0]}.minUpbeatOffset = ${minOffset}`);
			return minOffset;
		}


		Motif.prototype.setSoloState = function(_param1, _param2){

			var state = getSoloState(this.soloGroups, _param1, _param2);
			if(state === true || state === false){this.active = state}
		}

		Motif.prototype.getFilterState = getFilterState;
		Motif.prototype.filter = function(globalFilter){
			let state = this.getFilterState(globalFilter);

			if(typeof state != "undefined"){
				let activeFactor = Math.abs(this.active);
				this.active = state ? activeFactor: -activeFactor;
			}
		}


		this.addLeadIn = this.addMotif;



		Motif.prototype.initParameters = initParameters;
		Motif.prototype.addDefaultParameters = addDefaultParameters;
		Motif.prototype.getBeatDuration = getBeatDuration;
		Motif.prototype.getBarDuration = getBarDuration;
		Motif.prototype.getPosition = getPosition;
		Motif.prototype.getAbsolutePosition = getAbsolutePosition;

		Motif.prototype.setActive = setActive;
		Motif.prototype.setVolume = setVolume;
		Motif.prototype.getVolume = getVolume;
		Motif.prototype.setParams = setParams;
		Motif.prototype.set = set;
		Motif.prototype.map = map;

		Motif.prototype.fade = fade;
		Motif.prototype.fadeIn = fadeIn;
		Motif.prototype.fadeOut = fadeOut;
		Motif.prototype.setActiveVariations = setActiveVariations;
		Motif.prototype.get = get;

		Motif.prototype.urlToUpbeat = urlToUpbeat;
		Motif.prototype.setSoloGroup = setSoloGroup;
		Motif.prototype.musicalPositionToTime = musicalPositionToTime;



		Motif.prototype.addEnvelopes = function(envelopes){
			this.envelopes = envelopes;
		}







		var SFX = function(){

			// a SFX object
			this.url = Array.prototype.slice.call(arguments, 0);

			this.bus = new Bus({destination: self.sfxBus.input, channelMerger: self.channelMerger});


			for(var urlID in this.url){
				this.url[urlID] = addAudioPath(self.parameters.audioPath, this.url[urlID]);
				self.loadFile({url: this.url[urlID]});
			}


			var triggedRecently = false;

			this.play = function(){

				var blockRetrig = this.parameters.blockRetrig;

				if(arguments.length){
					var args = Array.prototype.slice.call(arguments, 0);
					if(typeof args[0] === "number"){
						blockRetrig = args.shift();
					}

					if(typeof args[0] === "function"){
						var callBackOnFinish = args.shift();
					}
				}


				if(!triggedRecently){
					blockRetrig = blockRetrig || 500;

					playSound(this, audioContext.currentTime, null, callBackOnFinish);
					triggedRecently = true;
					setTimeout(function(){triggedRecently = false;},blockRetrig);
				}
			}

			return this;

		}


		SFX.prototype.setVolume = setVolume;
		SFX.prototype.getVolume = getVolume;
		SFX.prototype.get = get;


		//this.addSFX = SFX;
		this.addSFX = (function() {
		    function tempSFX(args) {
		        return SFX.apply(this, args);
		    }
		    tempSFX.prototype = SFX.prototype;

		    return function() {
		        return new tempSFX(arguments);
		    }
		})();








		function posStringToObject(pos) {
			obj = {}
			obj.bar = 1;
			obj.beat = 1;
			obj.offBeat = 0;


			if(typeof pos === "string"){
				var delimiter = pos.indexOf(",") != -1 ? "," : ".";
				pos = pos.split(delimiter);
				if(pos.length){obj.bar = eval(pos[0])};
				if(pos.length > 1){obj.beat = eval(pos[1])};
				if(pos.length > 2){obj.offBeat = eval("."+pos[2])};
			}
			return obj;
		}

		function posObjectToString(obj){
			let bar = obj.bar || 1;
			let beat = obj.beat || 1;
			let offbeat = obj.offbeat || 0;
			let offsetString = offbeat.toFixed(2).split(".").pop();
			return `${bar}.${beat}.${offsetString}`;
		}


		function musicalPositionToTime(pos){
			var time = 0;
			switch(typeof pos) {

				case "string":
				if(pos == "off"){
					// this is to give non-looped track a VERY long loop length
					 time = 60 * 60 * 24 * 365;
				} else {
					var obj = posStringToObject(pos);
					var beatDuration = this.getBeatDuration();
					time = this.getBarDuration() * (obj.bar-1) + beatDuration * (obj.beat-1) + beatDuration * obj.offBeat;
				}
				break;


				case "number":
				time = pos;
				break;

			}
			return time;
		}



		function createParts(urls, defaultData, bus){

			// create Part objects
			var parts = [];
			var curPos = 0;
			for(var i=0; i<urls.length; i++){
				if(urls[i]){
					var part = new Part(urls[i], defaultData, bus, curPos);
					parts.push(part);
					curPos = part.pos + part.length;
				}
			}
			return parts;
		}




	}


	function addSuffix(url){

		// check suffix
		var s = url.substr(-4);
		switch(s){

			case ".wav":
			case ".mp3":
			case ".ogg":
			return url;
			break;


			default:
			return url + "." + this.parameters.suffix;
			break;

		}


	}



	function setVolume(val, dontStore){

		if(!this.bus){return}
		this.bus.input.gain.linearRampToValueAtTime(val, audioContext.currentTime + 0.1);

		if(!this.parameters || dontStore){return}
		this.parameters.volume = val;
	}


	function getVolume(){

		if(!this.bus){return -1}
		return this.bus.output.gain.value;
	}


	function setSoloGroup(_param1, _param2){


		//
		var grp, valStr;

		if(_param2){
			grp = _param1;
			valStr = _param2;
		} else {
			grp = "default";
			valStr = _param1;
		}


		if(!this.soloGroups){
			this.soloGroups = [];
		}

		var values = new Range(valStr).values;

		this.soloGroups.push({name:grp, value: values});

	}

	function getSoloGroup(grp){
		if(!this.soloGroups){return}
		if(!this.soloGroups.length){return}
		var group = this.soloGroups.find(obj => {return obj.name == grp});
		return group;
	}

	function getFilterState(globalFilter = []){
		
		if(!this.soloGroups || !this.soloGroups.length){return} // super safe

		let state = true; 
		globalFilter.forEach(filter => {
			let group = this.soloGroups.find(group => group.name == filter.name);
			if(group){
				let val = filter.value;
				let groupState = false;
				// if there are specified groups and ALL of them are matching
				// then the filter state is true and the track/motif shall play
				group.value.forEach(curVal => {
					if(val == curVal){
						groupState = true;
					} else {
						if(curVal instanceof MinMax){
							if(typeof curVal.min == "number"){
								if(val >= curVal.min && val <= curVal.max){
									groupState = true;
								}
							}
						}
					}
				});
				state = state && groupState;
			}
		});
		return state;
	}


	function getSoloState(_soloGroups, _param1, _param2){

		if(!_soloGroups){return}
		if(!_soloGroups.length){return}

		var grp, val;

		if(typeof _param2 !== "undefined"){
			grp = _param1;
			val = _param2;
		} else {
			grp = "default";
			val = _param1;
		}


		var group = _soloGroups.find(obj => {return obj.name == grp});
		if(!group){return}

		var state = false;
		group.value.forEach(function(curVal){
			if(val == curVal){
				state = true;
			} else {
				if(curVal instanceof MinMax){
					if(typeof curVal.min == "number"){
						if(val >= curVal.min && val <= curVal.max){
							state = true;
						}
					}
				}
			}
		});
		return state;
	}




	iMus.prototype.initParameters = initParameters;
	iMus.prototype.addDefaultParameters = addDefaultParameters;
	iMus.prototype.getBeatDuration = getBeatDuration;
	iMus.prototype.getBarDuration = getBarDuration;

	iMus.prototype.getTime = getTime;
	iMus.prototype.addSuffix = addSuffix;
	iMus.prototype.getPosition = getPosition;
	iMus.prototype.divisionToTime = divisionToTime;
	iMus.prototype.fade = fade;
	iMus.prototype.fadeOut = fadeOut;
	iMus.prototype.fadeIn = fadeIn;

	iMus.prototype.clearTriggerIntervals = function(){
		while(this.triggerIntervals.length){
			clearInterval(this.triggerIntervals.pop());
		}
	}
	

	iMus.prototype.setOffset = function(offset){

		var nextTime;
		for(var sectionID in this.sections){

			var section = this.sections[sectionID];
			nextTime = section.setOffset(offset);
		}
		return nextTime;
	}



	iMus.prototype.find = find;


	iMus.prototype.play = function(selector){

		if(!this.sections.length){return;}
		this.sections[0].play();
	}


	iMus.prototype.call = function(selector, options){

		var selection = new Selection(selector, this);
		selection.play(options);

	}
	iMus.prototype.addAction = addAction;




	iMus.prototype.addReverb = function(params){

		if(!params){return}
		if(!params.url){return}
		if(!params.src){return}

		var url = addAudioPath(this.parameters.audioPath, params.url);

		var targetSFX = this.sendEffects[url];
		// var self = this;

		if(!targetSFX){

			targetSFX = audioContext.createConvolver();
			this.sendEffects[url] = targetSFX;

			this.loadFile({url:url}, function(){
				var buffer = buffers[url];
				var bufferSource = audioContext.createBufferSource();
				bufferSource.buffer = buffer;

				targetSFX.buffer = buffer;
				targetSFX.loop = true;
				targetSFX.normalize = true;
				targetSFX.connect(params.output || self.master.output);

			}, function(){
				// error
				buffers[url] = -1;
			});


		}

		params.src.connect(targetSFX);
		return targetSFX;
	}

	iMus.addLFO = addLFO;

	iMus.addEnvelope = function(_entries, _target){

		return new Envelope(_entries, _target);
	}


	iMus.prototype.setTempo = function(value){


		this.sections.forEach(function(section){

			section.setTempo(value);
		});
	}



	iMus.setTempo = function(value){


		this.instances.forEach(function(instance){

			instance.setTempo(value);
		});
	}




	iMus.timeToNext = function(val){
		return defaultInstance.timeToNext(val);
	}
	iMus.prototype.timeToNext = function(val){

		return this.divisionToTime(val)*1000;
	}




	iMus.solo = function(grp, val){


		this.instances.forEach(instance => {
			instance.sections.forEach(section => {

				let groupMatch = section.parameters["select-group"] == grp || section.parameters["select-variable"] == grp;
				let valueMatch = section.parameters["select-value"] ? section.parameters["select-value"].find(_val => _val == val) : false;

				if(groupMatch && valueMatch) {
					if(instance.playing){
						section.play();
					} else {
						instance.currentSection = section;
					}

				}

				let  nlbtl = 0;
				// find furtherst nextLegalBreak for affected tracks

				let affectedTracks = [];
				section.tracks.forEach(track => {
					let curState = track.active > 0;
					let newState = track.getSoloState(grp, val);
					if(newState != curState){
						affectedTracks.push(track);
						let nlb = track.getNextLegalBreak();
						if(nlb){
							nlbtl = Math.max(nlbtl, nlb.timeLeft);
						}
					}
				});


				affectedTracks.forEach(trackObj => {
					if(trackObj.state){
						trackObj.track.play(nlbtl);
					} else {
						trackObj.track.stop(nlbtl);
					}
				});

			});

			instance.motifs.forEach(motif => motif.setSoloState(grp, val));

		});


	}


	iMus.prototype.on = function on(int, fn, offset, repeat){


		if(!fn){return}
		offset = offset || 0;
		offset /= 1000;

		repeat = repeat || -1;
		// var self = this;
		var interval;
		var intervalID = 0;
		var counter = 1;

		switch(typeof int){

			case "string":
			interval = this.divisionToTime(int);
			break;

			case "number":
			interval = int/1000;
			break;

			default:
			return;
			break;

		}



		var delay;
		if(self.playing){

			var musicTime = Math.max(0, audioContext.currentTime - self.musicalStart);
			var nextTrig = Math.ceil(musicTime / interval) * interval + self.musicalStart + offset;
			delay = nextTrig - audioContext.currentTime;

		} else {
			delay = interval;
		}


		if(repeat == 1){
			if(delay < timeWindow*2 || musicTime < 0){delay += interval}
			return setTimeout(() => fn(), delay*1000);
		} else {
			if(musicTime < 0){delay += interval}
			var timerID = setInterval(() => {
				// this function will drift out of sync!!!
				setTimeout( () => fn(), delay*1000);
				counter++;

				if(counter >= repeat && repeat != -1){clearInterval(timerID)}
			}, interval*1000);
			return timerID;
		}


		return interval;

	}



	function addAction(id, fn){
		this.actions.push( new Action(id, fn) );
	}



	var Action = function(id, fn){

		this.idName = id;

		this.tags = id.split(" ");
		this.play = fn;

		return this;
	}



	// SELECTION OPERATIONS

	function find(selector){

		return new Selection(selector, this);

	}


	


	// EVENT HANDLER

	var Event = function(fn, delay){

		this.fn = fn;
		this.delay = delay || 0;
	}

	var EventHandler = function(){

		return this;
	}

	EventHandler.prototype.addEvent = function(event, fn, delay){

		if(typeof fn !== "function"){return}
		this[event] = this[event] || [];
		this[event].push( new Event(fn, delay) );

	}

	EventHandler.prototype.execute = function(event, param1){

		var events = this[event];
		if(!events){return}

		events.forEach(function(event){
			setTimeout(function(){
				event.fn(param1);
			}, event.delay);
		});

	}


	// HELPERS


	function widthEndingSlash(str){
		return str.substring(str.length-1) == "/" ? str : str + "/";
	}

	function addAudioPath(path, fileName){
		if(!fileName){
			console.log("no file")
		}
		if(fileName.includes("//")){
			return fileName;
		}
		var pathLength = path.length;
		path = path == fileName.substr(0, pathLength) ? "" : widthEndingSlash(path);
		return path + fileName;
	}


	// embryo till strToParamValue. Ännu inte ersatt 2019-03-17
	function urlToUpbeat(url){


		var patt = /up-(\d+)/;
		var result = url.match(patt);
		if(!result){
			return 0;
		}
		var nrOfBeats = Number(result.pop()) || 0;

		return this.getBeatDuration() * nrOfBeats;

	}



	function strToParamValue(str, param){


		str = removeSuffix(str);

		param = param || "";
		var patt = new RegExp(param+"-([A-Za-z0-9-.]+)");
		var result = str.match(patt);
		if(!result){
			return;
		}
		var val = result.pop();


		switch(param){
			case QUANTIZE:
			case LENGTH:
			case UPBEAT:
			val = val.replace("-", "/");
			break;

			default:
			break;
		}

		return val;

	}





	function urlsToFileNames(urls){

		var fileNames = [];
		if(typeof urls == "string"){urls = [urls]}
		urls = urls || [];

		urls.forEach(function(file){

			if(typeof file === "object"){

				// if part is defined by object with parameters
				if(file.url){
					if(file.url instanceof Array) {
						// if url is array with random alternatives
						var fileNamesFromVariations = urlsToFileNames(file.url);
						fileNames = fileNames.concat(fileNamesFromVariations);
					} else {
						fileNames.push(file.url);
					}

				} else if(file instanceof Array) {

					// if file is array with random alternatives
					var fileNamesFromVariations = urlsToFileNames(file);
					fileNames = fileNames.concat(fileNamesFromVariations);
				}

			} else if (typeof file === "string"){
				fileNames.push(file);
			}
		});

		return fileNames;

	}

	function removeSuffix(str){

		switch(str.substr(-4)){
			case ".mp3":
			case ".wav":
			case ".ogg":
			case ".aac":
			return str.substr(0, str.length-4);
			break;

			default:
			return str;
			break;
		}

	}

	function urlsToTags(urls){

		var tags = [];
		var allNames = {};

		var fileNames = urlsToFileNames(urls);


		fileNames.forEach(function(str){
			// add full file name
			tags.push(str);

			// remove suffix
			if(str.substr(-4, 1) == "."){
				str = str.substr(0, str.length-4);
			}

			// remove audioPath
			var lastSlash = str.lastIndexOf("/");
			if(lastSlash != -1){
				str = str.substr(lastSlash+1);
			}

			// get tags

			var curTags = str.split("_");
			curTags.forEach(function(curTag){
				allNames[curTag] = allNames[curTag] || 0;
				allNames[curTag]++;
			});


		});


		Object.keys(allNames).forEach(function (tag) {
			// add tag when all files share a tag
			if(allNames[tag] == fileNames.length){
				tags.push(tag);

				// strip variable prefix like "sc-", "tr-" etc
				var varVal = strToParamValue(tag);
				if(varVal){tags.push(varVal)}
			}

		});


		/*
		fileNames.forEach(function(str){
			var curTags = str.split("_");
			curTags.forEach(function(curTag){
				tags.push(curTag);
			});
		});
		*/

		return tags;
	}

	function round(val, decimals){
		decimals = decimals || 2;
		var factor = Math.pow(10, decimals);
		return Math.floor(val*factor)/factor;
	}

	function setActiveVariations(activeVariations){
		this.parameters.activeVariations = activeVariations;
	}

	function getBellCurveY(x, stdD, scale){
		// It returns values along a bell curve from 0 - 1 - 0 with an input of 0 - 1.
		scale = scale || false;
		stdD = stdD || 0.125;
		x = Math.min(1, Math.max(x, 0));
		var mean = 0.5;
		if(scale){
			return  1 / (( 1/( stdD * Math.sqrt(2 * Math.PI) ) ) * Math.pow(Math.E , -1 * Math.pow(x - mean, 2) / (2 * Math.pow(stdD,2))));
		}else{
			return (( 1/( stdD * Math.sqrt(2 * Math.PI) ) ) * Math.pow(Math.E , -1 * Math.pow(x - mean, 2) / (2 * Math.pow(stdD,2)))) * getBellCurveY(0.5, stdD, true);
		}
	}

	function getAbsolutePosition(t = audioContext.currentTime){
		return this.getPosition(t - self.musicalStart);
	}

	function getPosition(pos, flags){

		if(typeof pos == "undefined"){
			pos = this.musicTime || audioContext.currentTime - this.sectionStart || audioContext.currentTime - self.sectionStart;
		}

		obj = {};
		obj.bar = 1;
		obj.beat = 1;

		flags = flags || {};

		var params = this.parameters;
		var beatDuration = this.getBeatDuration();
		var barDuration = this.getBarDuration();

		switch(typeof pos){

			case "string":
			var delimiter = pos.indexOf(",") != -1 ? "," : ".";
			pos = pos.split(delimiter);
			if(pos.length){obj.bar = eval(pos[0])};
			if(pos.length > 1){obj.beat = eval(pos[1])};
			obj.time = barDuration * (obj.bar-1) + beatDuration * (obj.beat-1);
			break;

			case "number":
			switch(flags.roundTo){

				case "bar":
				pos = pos + barDuration / 2;
				break;

				case "beat":
				pos = pos + beatDuration / 2;
				break;

				default:
				break;
			}
			var bar = Math.floor(pos / barDuration);
			obj.beat = Math.floor(pos / beatDuration) % params.timeSign.nominator + 1;
			obj.bar = bar + 1;
			obj.offbeat = (pos / beatDuration) % 1;

			obj.distToBeat  = (pos + beatDuration/2) % beatDuration - beatDuration/2;
			obj.barDuration = barDuration;
			obj.beatDuration = beatDuration;
			obj.time = pos;
			break;


		}

		return obj;

	}



	function onEvent(event, fn, delay){

		this.eventHandler = this.eventHandler || new EventHandler();
		this.eventHandler.addEvent(event, fn, delay);
	}



	function getBeatDuration (params){
		params = params || this.parameters;
		return 60.0 / params.tempo;
	}

	function getBarDuration(params){
		params = params || this.parameters;
		var beatDuration = getBeatDuration(params);
		return beatDuration * params.timeSign.nominator;
	}

	function setActive(activeVal){

		var ar = this.parameters.activeRange;

		if(activeVal < 0) {

			// predefined passive val
			this.active = activeVal;

		} else if(activeVal >= ar.min && activeVal <= ar.max) {

			// this is a predecessor to the filter attribute.
			// sort it out and choose sollution. This is confusing.
			var range = ar.max - ar.min;
			var valInRange = activeVal - ar.min;

			var valueRange = ar.maxVal - ar.minVal;

			if(range == 0){
				this.active = ar.maxVal;
			} else {
				this.active = ar.minVal + valInRange / range * valueRange;
			}

		} else {
			this.active = 0;
		}

		if(this.parts){
			this.parts.forEach(part => {
				part.active = this.active;
			});
		}


		if(this.parameters.fadeTime){

			if(this.active > 0){
				this.fadeIn();
			} else {
				this.fadeOut();
			}

		}

	}


	function getTime(time){

		var timeSign = (this.parameters || defaultParams).timeSign;
		var tempo = (this.parameters || defaultParams).tempo;

		if(!timeSign){
			console.log(timeSign);
		}
		if(typeof time === "undefined"){

			time = audioContext.currentTime - (self.sectionStart || defaultInstance.sectionStart);
		} else if(typeof time === "string"){
			// if specified by "bar/beat"
			var posArr = time.split("/");
			if(posArr.length < 1){
				posArr = [0,timeSign.denominator];
			} else if(posArr.length < 2) {
				posArr[1] = timeSign.denominator;
			}

			var beat = posArr[0] * timeSign.denominator / posArr[1];
			time = beat * 60 / tempo;

		}
		time = time || 0;
		return time;
	}

	function inArray(needle, haystack){

		if(!(haystack instanceof Array)){return false}
		if(!haystack.length){return false}

		let needles = [];
		if(typeof needle == "string"){
			needles = needle.split(" ");
		} else if(typeof needle == "number"){
			needles.push(needle);
		} else if(needle instanceof Array){
			// all is well with my soul
			needles = needle;
		}
		if(!needles.length){return false}

		var matches = 0;

		needles.forEach(n => {

			let needle = String(n);
			let thisNeedelIsMatched = false;

			let matchPattern = needle.substr(0, 1) == "*";
			if(matchPattern){
				needle = needle.substr(1);
			}



			haystack.forEach(str => {
				if(matchPattern){
					if(str.substr(str.length-needle.length) == needle){
						thisNeedelIsMatched = true;
					}
				} else {
					if(str == needle){
						thisNeedelIsMatched = true;
					}
				}
			});

			if(thisNeedelIsMatched){matches++}
		});


		return matches >= needles.length;
	}


	function mergeArrays(targetArray, sourceArray){

		sourceArray.forEach(function(val){
			if(!inArray(val, targetArray)){
				targetArray.push(val);
			}
		});

		return targetArray;
	}


	function findAndReplace(originalString, needle, rplc){

		// remove init char if # or .
		var firstChar = needle.substr(0, 1);
		if(firstChar == "#" || firstChar == "."){
			needle = needle.substr(1);
		}


		var matchPattern = needle.substr(0, 1) == "*";
		if(matchPattern){
			needle = needle.substr(1);
			rplc = rplc.substr(1);
			return originalString.replace(needle, rplc);
		} else {
			return originalString;
		}
	}



	function initParameters(values, inheritedValues){

		// values = Object.create(values);
		inheritedValues = typeof inheritedValues === "undefined" ? {} : (JSON.parse(JSON.stringify(inheritedValues)));

		// overwrite with local values
		if(typeof values === "object"){
			values = (JSON.parse(JSON.stringify(values)));
			for(attr in values){
				inheritedValues[attr] = values[attr];
			}
		}

		// add classList
		if(values.class && values.class.length){
			inheritedValues.classList = values.class.split(" ");
		} else {
			inheritedValues.classList = [];
		}
		


		this.addDefaultParameters(inheritedValues);

		return inheritedValues;

	}



	var defaultParams = {};
	defaultParams.volume = 1;
	defaultParams.pan = 0.5;
	defaultParams.tempo = 120;
	defaultParams.audioPath = "audio";
	defaultParams.upbeat = 0;
	defaultParams.partLength = "1/1";
	defaultParams.changeOnNext = "1/1";
	defaultParams.timeSign = {nominator: 4, denominator: 4};
	defaultParams.fadeTime = 0.01;
	defaultParams.offset = 0;
	defaultParams.suffix = "mp3";
	defaultParams.loopActive = 1;
	defaultParams.loopEnd = "5.1";
	defaultParams.activeRange = {};
	defaultParams.activeRange.min = 0;
	defaultParams.activeRange.max = 1;
	defaultParams.activeRange.minVal = 0;
	defaultParams.activeRange.maxVal = 1;
	defaultParams.blockRetrig = 0;
	defaultParams.repeat = 1;
	defaultParams.retrig = "shuffle";
	defaultParams.release = 0;



	defaultParams.quantize = "1/8";

	function addDefaultParameters(params){


		params.volume = params.volume || defaultParams.volume;
		params.pan = typeof params.pan === "number" ? params.pan : defaultParams.pan;
		params.tempo = params.tempo || defaultParams.tempo;
		params.timeSign = getTimeSign(params.timeSign || defaultParams.timeSign);
		params.upbeat = params.upbeat || defaultParams.upbeat;
		params.quantize = params.quantize || defaultParams.quantize;
		params.fadeTime = typeof params.fadeTime === "undefined" ? defaultParams.fadeTime : params.fadeTime;
		params.partLength = params.partLength || defaultParams.partLength;
		params.changeOnNext = params.changeOnNext || defaultParams.changeOnNext;
		params.retrig = params.retrig || defaultParams.retrig;
		params.release = params.release || defaultParams.release;

		params.externalOffset = params.offset || defaultParams.offset;
		params.creationTime = params.creationTime  || new Date().getTime();
		params.suffix = params.suffix || defaultParams.suffix;

		params.audioPath = params.audioPath || defaultParams.audioPath;
		params.loopActive = typeof params.loopActive === "number" ? params.loopActive : defaultParams.loopActive;
		params.loopEnd = params.loopEnd || defaultParams.loopEnd;

		params.activeRange = params.activeRange || defaultParams.activeRange;
		params.activeRange.min = params.activeRange.min || defaultParams.activeRange.min;
		params.activeRange.max = params.activeRange.max || defaultParams.activeRange.max;
		params.activeRange.minVal = typeof params.activeRange.minVal === "undefined" ? defaultParams.activeRange.minVal : params.activeRange.minVal;
		params.activeRange.maxVal = typeof params.activeRange.maxVal === "undefined" ? defaultParams.activeRange.maxVal : params.activeRange.maxVal;


	}

	function fade(val, delay, duration, callBack){

		var gainNode = this.bus.output;
		if(this.fadeCallbackID){clearTimeout(this.fadeCallbackID);}

		var myObj = this;

		if(typeof duration === "undefined"){
			duration = this.parameters.fadeTime || 0.001;
		}
		duration = duration || 0.001;

		// make sure fade is finished at delay time
		// delay -= duration;
		delay = delay > 0 ? delay : 0;


		var fadeEndTime = audioContext.currentTime+delay+duration/2;
		var fadeStartTime = Math.max(audioContext.currentTime, fadeEndTime-duration);
		gainNode.gain.cancelScheduledValues(fadeStartTime);

		if(this.parameters){
			var defaultVal = this.parameters.volume;
		}
		// user either defined value, stored value or 1
		val = (typeof val === "undefined") ? (defaultVal || 1) : val;
		val = Math.max(val, 0);

		gainNode.gain.setTargetAtTime(val, fadeStartTime, duration);

		if(typeof callBack === "function"){
			this.fadeCallbackID = setTimeout(callBack, (delay+duration*3)*1000);
		}

		if(this.visualElements){

			while(this.visualElements.length){
				let el = this.visualElements.pop();
				waxml.visualFadeOut({
					element: el,
					time: fadeStartTime + duration,
					fadeTime: duration
				});
			}
			
		}

	}


	function fadeAudioNode(node, from, to, delay){

		node.gain.cancelScheduledValues(0);
		node.gain.setValueAtTime(from, 0);
		//node.gain.exponentialRampToValueAtTime(to, audioContext.currentTime+delay);
		node.gain.linearRampToValueAtTime(to, audioContext.currentTime+delay);

	}

	function fadeIn(delay, duration){

		this.fade(1, delay, duration);
	}

	function fadeOut(delay, duration){
		this.fade(0, delay, duration);
	}

	function get(param1, param2){

		var targetParams = this.parameters;
		switch(param1){

			case "bus":
			return this.bus;
			break;

			case "send":
			return this.bus.sends[param2];
			break;

			case "randomOffset":
			return targetParams[param1] * 1000;
			break;

			default:
			return targetParams[param1];
			break;


		}
	}

	function setParams(keyValues){

		if(!keyValues){return}
		if(!keyValues.length){return}

		for (let i in keyValues){
			if(keyValues.hasOwnProperty(i)){
				this.set(keyValues[i].name, keyValues[i].value);
			}

		}

	}


	function attributesToObject(attributes){

		var obj = {};

		if(!attributes){return obj}
		if(!attributes.length){return obj}



		// for (let i in attributes){
		// 	if(attributes.hasOwnProperty(i)){
		// 		let param = attributes[i].name;
		// 		let value = typeFixParam(param, attributes[i].value);
		// 		obj[param] = value;
		// 	}
		// }
		[...attributes].forEach(attr => {
			if(attr.name){
				let value = typeFixParam(attr.name, attr.value);
				obj[attr.name] = value;
			}
		});

		return obj;
	}

	function getFollowAttributes(attributes){
		let selectAttributes = [];
		Array.from(attributes).forEach(attribute => {
			if(attribute.name.includes("follow-")){
				let arr = attribute.name.split("-");
				arr.shift();
				let key = arr.join("-");
				selectAttributes.push({key: key, value: attribute.value});
			}
		});
		return selectAttributes;
	}

	function getFollowRules(str){

		let selectAttributes = [];
		if(str){
			if(str.includes("=")){
				// logical expression i.e. "intensity=1;mood=happy"
				selectAttributes = str.split(";").map(expression => {
					let arr = expression.split("=").map(s => s.trim());
					let rule;
					if(arr[0]){
						rule = {key: arr[0], value: arr[1]};
					} else {
						rule = -1; // syntax error
					}
					return rule;
				}).filter(rule => rule != -1);
			} 
		}
		return selectAttributes;
	}


	function typeFixParam(param, value){

		switch(param){

			case "volume":
			case "gain":
			if(value.includes("dB")){
				value = Math.pow(2, Number(value.split("dB")[0]) / 3);
			} else {
				value = Number(value);
			}
			break;

			case "normalize":
			value = value == "true";
			break;

			// iMusic objects
			case "pan":
			case "tempo":
			case "fadeTime":
			case "loopActive":
			case "blockRetrig":
			case "repeat":
			case "release":
			case "active":

			// AudioNodes

			//filter
			case "frequency":
			case "detune":
			case "Q":

			// delay
			case "delayTime":

			// compressor
			case "threshold":
			case "knee":
			case "ratio":
			case "reduction":
			case "attack":
			case "release":

			value = Number(value);
			break;

			default:

			break;

		}
		return value;

	}


	function set(param, value, value2){

		var targetParams = this.parameters || defaultInstance.parameters;

		switch(param){

			case "volume":


			if(this.setVolume){
				this.setVolume(value);
			}
			break;

			case "timeSign":
			value = getTimeSign(value);
			break;

			case "loopEnd":
			value = this.musicalPositionToTime(value);
			break;

			case "loopLength":
			value = this.divisionToTime(String(value));
			param = "loopEnd";
			break;


			case "partLength":
			if(typeof value === "number"){
				value /= 1000;
			}
			if(this.setPartLength){
				this.setPartLength(value);
			}
			break;


			case "changeOnNext":
			if(typeof value === "number"){
				value /= 1000;
			}
			break;


			case "randomOffset":
			value /= 1000;
			break;

			case "repeat":
			if(this.setRepeat){
				this.setRepeat(value);
			}
			break;

			case "upbeat":
			if(typeof value === "number"){
				value /= 1000;
			}
			if(this.setUpbeat){
				this.setUpbeat(value);
			}
			break;

			case "active":
			if(this.setActive){
				this.setActive(value);
			}
			break;


			case "fadeTime":
			value /= 1000;
			break;

			case "tags":
			if(typeof value === "string"){
				value = value.split(" ");
			}
			targetParams = this;
			break;


			case "blockRetrig":
			if(typeof value === "string"){
				value = (this.getTime || getTime)(value);
			} else {
				value /= 1000;
			}
			break;


			case "release":
			value /= 1000;
			break;

			case "tempo":
			if(this.setTempo){
				this.setTempo(value);
			}
			break;


			case "variation":
			if(this.setVariation){
				this.setVariation(value, value2);
			}
			break;

			case "solo":
			case "select-group":
			if(this.setSoloGroup){
				this.setSoloGroup(value, value2);
			}
			break;

			case "select-variable":
			if(this.setSoloGroup){

		  		let win = "window.";
			  	if(value.substr(0, 7) != win){value = win + value}

				this.setSoloGroup(value, value2);
			}
			break;

			case "output":
			if(this.bus){
				this.bus.setOutput(value, value2);
			}
			break;

			case "pan":
			if(this.bus){
				value2 = value2 || 1;
				this.bus.animate("pan", value, value2/1000);
			}
			break;

			case "filter":
			if(this.bus){
				this.bus.setFilter(value);
			}
			break;

			case "delay":
			if(this.bus){
				this.bus.setDelay(value);
			}

			default:
			if(this.bus){
				value2 = value2 || 1;
				this.bus.animate(value, value2);
			}
			break;
		}

		targetParams[param] = value;
		if(iMus.debug){console.log(param, value)}
		return {param: param, val: value};
	}



	function map(param, valIn, minIn, maxIn, minOut, maxOut, exp){

		exp = exp || 1;

		valIn = Math.max(valIn, minIn);
		valIn = Math.min(valIn, maxIn);

		var rangeIn = maxIn - minIn;
		var relVal = (valIn - minIn)/rangeIn;

		var rangeOut = maxOut - minOut;
		var valOut = Math.pow(relVal, exp) * rangeOut + minOut;

		this.set(param, valOut);
	}


	function strToParameters(str){


		var params = {};
		params.sectionID = strToParamValue(str, SECTION);
		params.trackID = strToParamValue(str, TRACK);
		params.motifID = strToParamValue(str, MOTIF);
		params.leadinID = strToParamValue(str, LEADIN);
		params.soundID = strToParamValue(str, SOUND);
		params.pos = strToParamValue(str, POSITION);
		params.variantID = strToParamValue(str, VARIANT);
		params.upbeat = strToParamValue(str, UPBEAT);
		params.quantize = strToParamValue(str, QUANTIZE);
		params.length = strToParamValue(str, LENGTH);

		return params;
	}


	var masterBus = new Bus();
	masterBus.output.channelCount = maxChannelCount;

	iMus.master = masterBus;

	iMus.audioContext = audioContext;
	iMus.instances = [];


	iMus.objects = {}
	iMus.setOffset = function(offset){


		var nextTime;
		for(var i=0; i<this.instances.length; i++){
			console.log("diff - " + new Date() + " : " + i);
			var curInstance = this.instances[i];
			nextTime = curInstance.setOffset(offset);
		}

		console.log("nextTime: " + nextTime);

	}


	iMus.setParams = setParams;

	iMus.set = function(param, val){
		var sectionID = defaultInstance.sections.length - 1;
		var obj = defaultInstance.sections[sectionID].set(param, val);
		defaultInstance.parameters[obj.param] = obj.val;
		defaultParams[obj.param] = obj.val;

		switch(param){

			case "osc":
			// Jag fick aldrig osc.WebSocketPort att funka, så nu fick det bli socket.io istället
			// if(osc){
			// 	// activate OSC communication if available
			// 	var oscPort = new osc.WebSocketPort({
			// 		url: val, // val shall contain the URL to your Web Socket server.
			// 		metadata: true
			// 	});
			// 	oscPort.open();
			// 	oscPort.on("message", oscMsg => {
			// 		console.log("OSC", oscMsg);
			// 	});
			// }

			if(io){
				socket = io(val);
				socket.on('serverToClient', msg => {
					let address = msg.address.split("/");
					let args = msg.args;
					if(address[1] == "waxml"){

						switch(address[2]){

							case "play":
							if(msg.args[0])window.waxml.trig(address[3]);
							break;

							case "stop":
							if(msg.args[0])window.waxml.stop(address[3]);
							break;

							case "set":
							// det här är ju ett dumt upplägg men det blir bra när waxml och imusic gifter sig ;-)
							window.waxml.setVariable(address[3], msg.args[0]);
							break;
						}

					}

				});
			}
			break;

			default:
			iMus.select(param, val);
			break;
		}
	}

	iMus.get = function(param){

		return defaultParams[param];
	}

	iMus.initSelection = function(filter){
		defaultInstance.selectFilter = filter;
		iMus.select();

	}

	iMus.select = function(key, value){

		
		if(key){
			// set new value
			var targetFilter = defaultInstance.selectFilter.find(curFilter => curFilter.name == key);
			if(targetFilter){
				targetFilter.value = value;
			} else {
				defaultInstance.selectFilter.push({name: key, value: value});
			}
		}
		
		// update filter for all tracks and motifs
		defaultInstance.sections.forEach(section => {
			section.tracks.forEach(track => track.filter(defaultInstance.selectFilter));
		});
		defaultInstance.motifs.forEach(motif => motif.filter(defaultInstance.selectFilter));


	}

	iMus.isPlaying = function(){
		return iMus.getDefaultInstance().playing;
	}

	iMus.play = function(selector, options, arg2, arg3){
		// play objects matched by selector or play defaultInstance
		let returnValues;

		if(selector){
			
			// get new selection
			var selection = new Selection().selectForPlayback(selector);

			if(iMus.playAfterInterlude && selection.sections.length){
				clearTimeout(iMus.playAfterInterlude);
			}

			if(selection.objects.length){
				// check if the selection includes a section
				if(selection.sections.length){
					let newSection = selection.sections[0];
					// Note: sections can have multiple classes. Find the one that matches this selector.
					
					let interludeSection, interludeSelection, interludeSelector;
					if(selection.string && iMus.lastSelectedSectionString){
						// make interlude selection (i.e. A-B)
						console.log(iMus.lastSelectedSectionString, "->", selection.string);
						interludeSelector = `${iMus.lastSelectedSectionString}-${selection.string}`;
						
						interludeSelection = new Selection().selectForPlayback(interludeSelector);
						interludeSection = interludeSelection.sections.pop();
					}
					if(interludeSection && iMus.isPlaying()){
						// if there is a match, first trig leadIns and Motifs now
						[...interludeSelection.motifs,...interludeSelection.leadIns].forEach(obj => obj.play(options, arg2, arg3));

						// then play interlude and store time until it changes
						returnValues = {};
						returnValues.delay = interludeSection.play(options, arg2, arg3);
						let timeToLegalBreak = interludeSection.getTimeToLegalBreak();
						let interludeLength = interludeSection.getLength();

						// delay call to play target selection until interlude is done
						let delay = timeToLegalBreak + interludeLength -timeWindow;
						iMus.playAfterInterlude = setTimeout(() => {
							iMus.lastSelectedSectionString = selection.string;
							returnValues = selection.play(options, arg2, selector).returnVal;

							let delay = waxml.toSignificant(returnValues.delay);
							waxml.log(`AUTO-TRIG->${selector}, delay: ${delay}`);
						}, delay * 1000);
						
					} else {
						// If no interlude is found, then play all matches now
						// This DOES NOT WORK!! xxx
						// Make sure the real distance to nextLegalBreak is calculated first
						// then, trigger the leadins and lastly the arrangement.
						iMus.lastSelectedSectionString = selection.string;

						let time = getNextTime(self.currentSection, newSection, selector);
						// returnValues = newSection.play(options, time, selector);
						returnValues = selection.play(options, time, selector).returnVal;
						
					}
				} else {
					// play only motifs in current section
					returnValues = selection.play(options, arg2, arg3).returnVal;
				}
			}

			
			
		} else {
			// No selector (i.e. iMus.play())

			// don't play anything - to be consistent with WAXML
			// if(defaultInstance.currentSection){
			// 	iMus.lastSelectedSectionString = defaultInstance.currentSection.parameters.classList[0];
			// 	defaultInstance.currentSection.play();
			// } else {
			// 	defaultInstance.currentSection = "default";
			// 	var selection = new Selection("default", defaultInstance);
			// 	return selection.play(options, arg2, arg3);
			// }
		}

		if(returnValues){
			// let delay = waxml.toSignificant(returnValues.delay);
			// waxml.log(`TRIG->${selector}, delay: ${delay}`);
			return returnValues;
		}

	}

	iMus.start = iMus.play;
	iMus.trig = iMus.play;

	iMus.next = function(){
		console.log("next");
		if(!defaultInstance.currentSection){
			iMus.play();
		} else {
			let i = defaultInstance.sections.indexOf(defaultInstance.currentSection);
			i = ++i % defaultInstance.sections.length;
			defaultInstance.sections[i].play();
		}

	}

	iMus.stop = function(selector){
		// stop objects matched by selector or play defaultInstance
		if(!defaultInstance.currentSection){return}

		if(iMus.playAfterInterlude){
			clearTimeout(iMus.playAfterInterlude);
		}

		if(selector && selector){
			var selection = new Selection(selector, defaultInstance);
			selection.stopAllSounds();
		} else {
			defaultInstance.currentSection.stopAllSounds();
		}
		defaultInstance.clearTriggerIntervals();
		
		//defaultInstance.playing = false;


		//defaultInstance.currentSection = null;

	}

	iMus.isPlaying = function(){
		var isPlaying = false;
		this.instances.forEach(function(instance){
			isPlaying = instance.playing || isPlaying;
		});
		return isPlaying;
	}


	iMus.prototype.addEventListener = function(name, fn) {
		if(typeof name !== "string"){return}
		if(typeof fn !== "function"){return}
		this._listeners[name] = this._listeners[name] || [];
		this._listeners[name].push(fn);
	}

	iMus.prototype.dispatchEvent = function(e) {
		this._listeners[e.type] = this._listeners[e.type] || [];
		this._listeners[e.type].forEach(fn => fn(e));
	}

	iMus.setInterval = function(fn, interval, offset, counter){
		counter = counter || -1;
		return defaultInstance.on(interval, fn, offset, counter);
	}


	iMus.setTimeout = function(fn, interval, offset){
		return defaultInstance.on(interval, fn, offset, 1);
	}

	iMus.getPosition = function(pos, flags){
		return defaultInstance.getPosition(pos, flags);
	}

	iMus.clearTimeouts = function(){

		while(defaultInstance.intervalIDs.length){
			var intervalID = defaultInstance.intervalIDs.pop();
			clearTimeout(intervalID);
		}

	}

	iMus.getDefaultInstance = function(){
		return defaultInstance;
	}

	

	iMus.fade = function(val, delay, duration){
		defaultInstance.fade(val, delay, duration);
	}

	iMus.fadeIn = function(delay, duration){
		defaultInstance.fadeIn(delay, duration);
	}

	iMus.fadeOut = function(delay, duration){
		defaultInstance.fadeOut(delay, duration);
	}


	iMus.createBus = function(){
		return defaultInstance.getBus();
	};

	//audioContext.createBufferSource(); //??
	window.audioContext = audioContext;


	iMus.addLoopTrack = function(urls){
		return iMus(defaultSectionName).addLoopTrack(urls);
	}

	iMus.addTrackGroup = function(selection){
		return iMus(defaultSectionName).addTrackGroup(selection);
	}


	iMus.addMotif = function(urls, q, upbeat){
		return iMus.getDefaultInstance().addMotif(urls, q, upbeat);
		//return iMus(defaultSectionName).addMotif(urls, q, upbeat);
	}


	iMus.loadJSON = function(jsonData){
		var data = JSON.parse(jsonData);
		this.loadData(data);
	}

	iMus.loadData = function(data){

		if(data.sections){

			data.sections.forEach(function(section){

				if(section.tracks){
					section.tracks.forEach(function(track){
						iMus(section.id).addLoopTrack(track.parts);
					});
				}

				if(section.motifs){
					section.motifs.forEach(function(motif){
						iMus(section.id).addMotif(motif.urls, motif.quantize);
					});
				}

				if(section.leadins){
					section.leadins.forEach(function(leadin){
						iMus(section.id).addLeadIn(leadin.urls);
					});
				}

				if(section.sounds){
					section.sounds.forEach(function(sound){
						iMus(section.id).addMotif(sound.urls, "off");
					});
				}
			});

		}



		if(data.tracks){
			data.tracks.forEach(function(track){
				iMus(defaultSectionName).addLoopTrack(track.parts);
			});
		}

		if(data.motifs){
			data.motifs.forEach(function(motif){
				defaultInstance.addMotif({quantize: motif.quantize}, motif.urls);
			});
		}

		if(data.leadins){
			data.gs.forEach(function(leadin){
				defaultInstance.addLeadIn({quantize: "bar"}, leadin.urls);
			});
		}

		if(data.sounds){
			data.sounds.forEach(function(sound){
				defaultInstance.addMotif({quantize: "off"}, sound.urls);
			});
		}
	}

	iMus.loadFiles = function(urls){

		var obj = filesNamesTodata(urls);
		this.loadData(obj);
	}


	iMus.filesNamesTodata = filesNamesTodata;

	function filesNamesTodata(urls){

		var obj = {};

/*
		obj.motifs = [];
		obj.leadins = [];
		obj.sounds = [];
*/


		urls.forEach(function(url){

			var params = strToParameters(url);
			var targetObj;

			if(params.sectionID){

				obj.sections = obj.sections || [];
				var section = getObjectFromParam(obj.sections, "id", params.sectionID);
				if(!section){
					section = {};
					obj.sections.push(section);
				}

				section.id = params.sectionID;
				section.tracks = section.tracks || [];

				if(params.trackID){
					var track = getObjectFromParam(section.tracks, "id", params.trackID);
					if(!track){
						track = {};
						section.tracks.push(track);
					}

					var curPos = "1";

					track.id = params.trackID;
					track.parts = track.parts || [];

					params.pos = params.pos || (params.variantID ? "1" : String(track.parts.length+1));
					var part = getObjectFromParam(track.parts, "pos", params.pos);
					if(!part){
						part = {};
						track.parts.push(part);
					}

					part.pos = params.pos;
					part.url = part.url || [];
					if(typeof params.upbeat !== "undefined"){part.upbeat = params.upbeat}
					part.url.push(url);
					if(typeof params.length !== "undefined"){part.length = params.length}

				}
			}

			targetObj = section ? section : obj;

			if(params.motifID){
				if(!targetObj.motifs){
					targetObj.motifs = [];
				}
				var motif = getObjectFromParam(targetObj.motifs, "id", params.motifID);
				if(!motif){
					motif = {};
					targetObj.motifs.push(motif);
				}

				motif.id = params.motifID;
				motif.urls = motif.urls || [];
				motif.urls.push(url);
				if(params.quantize){
					motif.quantize = params.quantize;
				}
			}


			if(params.leadinID){
				if(!targetObj.leadin){
					targetObj.leadin = [];
				}
				var leadin = getObjectFromParam(targetObj.leadins, "id", params.leadinID);
				if(!leadin){
					leadin = {};
					targetObj.leadins.push(leadin);
				}
				leadin.id = params.motifID;
				leadin.urls = motif.urls || [];
				leadin.urls.push(url);
				leadin.quantize = "bar";
			}

			if(params.soundID){
				if(!targetObj.sounds){
					targetObj.sounds = [];
				}
				var sound = getObjectFromParam(targetObj.sounds, "id", params.soundID) || {};
				sound.id = sound.soundID;
				sound.urls = sound.urls || [];
				sound.urls.push(url);
			}

		});

		return obj;

	}


	function getObjectFromParam(arr, param, val){
		return arr.find(function(params){
			return params[param] == val;
		});
	}





	// embryo for loadFiles. Used for single files only

	iMus.loadFile = function(urls){

		//if(typeof urls === "string")){urls = urls.split(",")}

		// to prevent same file to be added several times
		var existing = iMus(urls);
		if(existing.objects.length){return existing}

		var sectionID, trackID, motifID, leadinID, soundID;


		//urls.forEach(function(url){
			// detect section
			sectionID = strToParamValue(urls, SECTION);

			// detect track
			trackID = strToParamValue(urls, TRACK);

			// detect motif
			motifID = strToParamValue(urls, MOTIF);

			// detect leadIn
			leadinID = strToParamValue(urls, LEADIN);

			// detect sound
			soundID = strToParamValue(urls, SOUND);

		//});


		if(sectionID == undefined){
			if(trackID != undefined){
				return iMus(defaultSectionName).addLoopTrack(urls);
			} else if(motifID != undefined){
				var motif = defaultInstance.addMotif({url:urls});
				return new Selection(MOTIF + "-" + motifID);
			} else if(leadinID != undefined){
				var leadin = defaultInstance.addLeadIn({url:urls});
				return new Selection(LEADIN + "-" + leadinID);
			} else if(soundID != undefined){
				var sound = defaultInstance.addMotif({quantize:"off"}, urls);
				return new Selection(SOUND + "-" + soundID);
			}

		} else {

			//sectionID = SECTION + "-" + sectionID;
			var tags = urlsToTags(urls);
			var section = defaultInstance.addSection({tags: tags});
			if(motifID != undefined){
				return iMus(tags[0]).addMotif(urls);
			}  else if(leadinID != undefined){
				return iMus(tags[0]).addLeadIn(urls);
			} else if(soundID != undefined){
				return iMus(tags[0]).addMotif(urls, "off");
			} else if(trackID != undefined){
				return iMus(tags[0]).addLoopTrack(urls);
			} else {
				var selection = iMus(tags[0]);
				// if we not make a new selection, the old will be overwritten...
				iMus(tags[0]).addLoopTrack(urls);
				return selection;
			}

		}

	}






	iMus.addLeadIn = iMus.addMotif;
	iMus.addStingerTrack = iMus.addMotif;


	if(window.module){
		// support nodeJS
		module.exports = iMus;
	} else {
		// stand alone
		window.iMus = iMus;
		window.iMusic = iMus;
		//iMus.instances.push(defaultInstance);
	}

	var defaultInstance = new iMus();
	iMus.instance = defaultInstance;
	//defaultInstance.addSection({tags: defaultSectionName});
	// Ta bort denna tomma instans. Men det kräver också att kod
	// som beror på den måste fixas som t.ex. iMus.set()


	defaultInstance.addSection();
	iMus.addSection = defaultInstance.addSection;



	iMus.variations = {};

	iMus.voiceController = new VoiceController();


	iMus.setVariation = function(groupID, val){
		iMus.variations[groupID] = val;
	}

	iMus.getVariation = function(groupID){
		var val = iMus.variations[groupID];
		if(!val){val = 0};
		val = Math.min(val, Math.max(val, 0));
		return val;
	}



	iMus.onload = function(){
		// better to make this a dispatch a custom event
		iMus.GUI = new GUI();
	};


	document.addEventListener("click", function(){
		// to init Web Audio on first click
		initAudioContextTimer();
	});


	iMus.connectToHTML = e => {
		
		[...document.querySelectorAll("*")].forEach( el => {

			[...el.attributes].forEach( attr => {

				if(attr.localName.startsWith("data-waxml-")){
					let fn;
					let attrNameArr = attr.localName.split("-");

					let sustain;
					let animationData = attr.value.split(",");
					switch(attrNameArr[2]){

						// i.e. "beat, 0, 100, red, 0, 300"
						case "style":
							let Q = (animationData[0] || "beat").trim();
							let offset = (animationData[1] || "0").trim();
							sustain = (animationData[2] || "").trim();
							let className = (animationData[3] || "waxml-trigger").trim();
							let attack = (animationData[4] || "").trim();
							let decay = (animationData[5] || "").trim();
							defaultInstance.addEventListener(Q, e => {
								let delay = 0;
								if(offset.includes("ms")){
									delay = parseFloat(offset);
								} else {
									delay = defaultInstance.currentSection.divisionToTime(offset) * 1000;
								}
								
								let A = parseFloat(attack || el.style.transitionDuration || 0);
								let S = defaultInstance.currentSection.divisionToTime(sustain || Q) * 1000 / (sustain ? 1 : 2);
								el.style.transitionDuration = A + "ms";

								setTimeout(() => el.classList.add(className), delay);

								setTimeout(() => {
									if(decay){
										el.style.transitionDuration = decay + "ms";
									}
									el.classList.remove(className);
								}, delay + A + S);

							});
							break;

						
							case "trigger":
							sustain = 200;
							let url = animationData[0];
							defaultInstance.addEventListener("playFile", musicEvent => {
								if(musicEvent.detail.url == url){
									if(el.timeout){clearTimeout(el.timeout)}
									el.classList.add("waxml-trigger");
									el.timeout = setTimeout(e => el.classList.remove("waxml-trigger"), sustain);
								}
							});
							break;

						default:
							break;
					}
				}
			});
		});

		// add imusic commands to click on links
		[...document.querySelectorAll("*")].forEach( el => {

			[...el.attributes].forEach( attr => {
				if(attr.localName.startsWith("data-imusic")){

					// Create empty link for <a> elements
					if(el.localName == "a"){
						var deadLink = "javascript:void(0)";
						if(!el.attributes.href){
							el.setAttribute("href", deadLink);
						} else if(el.attributes.href.nodeValue == "#"){
							el.attributes.href.nodeValue = deadLink;
						}
					}

					let val = attr.nodeValue;
					let floatVal = parseFloat(val);
					if(!Number.isNaN(floatVal)){
						val = floatVal;
					}

					let fn = () => {}; // empty function
					let attrNameArr = attr.localName.split("-");

					if(attrNameArr.length == 2){
						// insert default click event
						attrNameArr.splice(2, 0, "click", val);
					} else if(attrNameArr.length == 3){
						// insert default click event and value as commandname
						attrNameArr.splice(3, 0, val);
						val = "";
					}

					let eventName = attrNameArr[2];
					let commandName = attrNameArr[3];
					let variableName = commandName; // duplet for clarity ;-) - it can be either or...

					switch(commandName){
						case "start":
						case "play":
						case "trig":
						case "select":
							fn = e => {
								val.split(",").forEach(v => iMusic.play(v.trim()));
							}
						break;

						case "toggle":
							fn = e => {
								let state = el.classList.contains("active");
								if(state){
									el.classList.remove("active");
								} else {
									el.classList.add("active");
								}
								val.split(",").forEach(v => iMusic(v.trim()).togglePlay());
							}
						break;

						case "stop":
							fn = e => iMusic.stop();
						break;


						case "set":
							// New syntax 2022-09-15. Target variable is now not be a part of 
							// the attribute name, but as a part of the expression
							// in the value
							// i.e. data-imusic-click="intensity=5"
							if(val.includes("=")){
								let values = [];
								// allow for multiple values
								let rules = val.split(";").forEach(expression => {
									let arr = expression.split("=").map(v => v.trim());
									let key = arr[0];
									let value = arr[1];
									if(key){
										if(value.includes("this.")){
											// allow for dynamic values from slider, switches etc.
											let targetProperty = value.replace("this", "el");
											value = {
												valueOf: () => {
													return eval(targetProperty);
												}
											}
										} 

										values.push({key: key, value: value});
									}
								});
								fn = e => {
									values.forEach(entry => iMusic.select(entry.key, entry.value.valueOf()));
								}
								
							} 
							break;

						case "trigger":
						case "style":
							// this is a bit weird
							// just added to avoid doing something wrong for attributes
							// that shall attach eventListeners to iMusic (above)
						break;

						default:
							if(variableName){
								if(eventName == "input"){
									fn = e => {
										iMusic.select(variableName, e.target.value);
									}
								} else {
									fn = e => {
										iMusic.select(variableName, val);
									}
								}		
							}
							break;
					}
					el.addEventListener(eventName, fn);


				}
			});

		});


  	}



  	class VariableWatcher {


	  	constructor(_instance){

		  	this.variables = [];
		  	this.instance = _instance;


		  	setInterval(() => this.update(), timeWindow/2);


	  	}

	  	update(force){

		  	this.variables.forEach(varObj => {

			  	let curVal;

			  	if(varObj.target){
				  	curVal = varObj.target[varObj.property];
			  	}
			  	//let curVal = eval(varObj.name);
			  	if((curVal != varObj.val  || force == true) && typeof curVal !== "undefined"){


				  	varObj.val = curVal;

				  	varObj.listeners.forEach(listener => {
					  	if(listener.variable == varObj.name){
						  	listener.target.map(listener.parameter, curVal);
					  	}
				  	});

				  	// this line seems to crash in the solo-function
				  	// that's why I keep it last. Fix bug!
				  	this.instance.select(varObj.name, curVal);



			  	}


		  	});
	  	}

	  	addVariable(_variable, obj, mapper){

		  	let win = "window.";
		  	if(_variable.substr(0, 7) != win){
			  	_variable = win + _variable;
		  	}


		  	let varObj = this.variables.find(obj => {
			  	return _variable == obj.name;
		  	});

		  	if(!varObj){
			  	varObj = {};
			  	varObj.name = _variable;
			  	varObj.listeners = [];


			  	let o = Data.fetchObject(_variable);
			  	varObj.property = o.property;
			  	varObj.target = o.target;

			  	this.variables.push(varObj);
		  	}

		  	if(obj){
			  	let listObj = {}
			  	listObj.target = obj;
			  	listObj.variable = _variable;
			  	listObj.parameter = mapper.parameter;
			  	varObj.listeners.push(listObj);
			}


	  	}


	  	// add reccursive function to get object


  	}

  	var variableWatcher = new VariableWatcher(iMus);


  	function addReferenceObject(tag, obj, parent){
	  	if(!tag){return}
	  	if(!obj){return}
	  	iMus.objects[tag] = obj;
	  	if(parent instanceof Object){parent[tag] = obj};
  	}

	function getNextTime(fromSection, toSection, selector){
		let maxUpbeatInThis = toSection.getMaxUpbeatOffset();
		let maxFadeTimeInThis = toSection.getMaxFadeTime();
		let maxLeadInOffset = fromSection ? fromSection.getMaxLeadInUpbeatOffset(selector) : 0;
		let maxUpbeat = Math.max(maxUpbeatInThis, maxLeadInOffset, maxFadeTimeInThis);
		let nextTime = fromSection ? fromSection.getNextLegalBreak(maxUpbeat) : 0;
		return nextTime;
	}



  	class Data {

  	}

  	Data.fetchObject = function(path){

	  	let returnObj = {};
	  	var obj = window;

	  	let l = path.split(".");
	  	returnObj.property = l.pop();

	  	l.forEach(str => {
		  	if(str != "window"){
			  	let curObj = obj[str];
			  	if(curObj){
				  	obj = curObj;
			  	} else {
				  	console.log("can't find variable reference: " + path);
			  	}

		  	}
	  	});

	  	returnObj.target = obj;
	  	return returnObj;
  	}

  	Data.loadXML = function(src, el){

	  	if(src){
		  	fetch(src)
		  	.then(response => response.text())
		  	.then(xml => {
			  	let parser = new DOMParser();
			  	let xmlDoc = parser.parseFromString(xml,"text/xml");
					let imusicData = xmlDoc.querySelector("imusic");
			  	this.parseXML(imusicData, el);
				if(waxml){
					waxml.initLinearArranger(self);
					// xxx better to connect to frame update
					setInterval(() => {
						waxml.scrollArrangeWindow();
					}, 1000/60);
				}
			})
		}

  	}

  	Data.parseXML = function(root){


	  	if(root){
		  	iMus.setParams(root.attributes);

			let schemaLocation = root.attributes["xsi:schemaLocation"];
			if(schemaLocation){
				let schemaFile = schemaLocation.value.split(" ").pop();
				if(schemaFile != expectedSchemaFile){
					console.warn(`Wrong iMusic XML Schema File. ${expectedSchemaFile} is expected`);
					waxml.log({
						type: "error",
						data: `Wrong iMusic XML Schema File, ${expectedSchemaFile} is expected`
					});
				}
			}
		  	var defInst = defaultInstance;
		  	var url, params, part;
		  	var selectKeys = [];

			this.tags = [];

		  	var arrangements = root.querySelectorAll("arrangement");
		  	arrangements.forEach((arr, _index) => {

			  	var id = arr.getAttribute("select-value"); // change in the future XXX
			  	url = arr.getAttribute("src");
			  	if(url == null){url = undefined}

			  	let params = attributesToObject(arr.attributes);
			  	params.tags = params.tags || id; // this is to make select-value work. Not stable.
				if(params["select-variable"]){
					if(params["select-variable"].substr(0, 7) != "window."){params["select-variable"] = "window." + params["select-variable"]}
			  	}
			  	if(params["select-value"]){
				  	params["select-value"] = params["select-value"].split(",").map(str => str.trim());
			  	}

			  	var section = defInst.addSection(params, url);
			  	//section.setParams(arr.attributes); Is this needed when params are passed on creation of section?

			  	// check selected
			  	if(arr.getAttribute("selected") == "true" || _index == 0){
				  	defInst.currentSection = section;
			  	}


				var tracks = arr.querySelectorAll("track");
				tracks.forEach((track) => {

					var urls = [];
					url = track.getAttribute("src");
					if(url){urls.push(url)}

					var regions = track.querySelectorAll("region");

					params = attributesToObject(track.attributes);

					regions.forEach((region) => {
						part = attributesToObject(region.attributes);
						url = region.getAttribute("src");

						if(!url){
							url = [];
							var sources = region.querySelectorAll("source, option");
							sources.forEach((source) => {
								var src = source.getAttribute("src");
								if(src){url.push(src)}
							});
						}

						part.url = url;

						urls.push(part);
					});
					var stem = section.addStem(params, urls);

					if(stem){
						// WAXML nodes
						if(window.webAudioXML){
							let envelopeNodes = track.querySelectorAll("envelope");
							let envelopes = [];
							envelopeNodes.forEach(xmlNode => {
								let env = window.webAudioXML.createObject(xmlNode);
								envelopes.push(env);
							});
							stem.addEnvelopes(envelopes);


							let commandNodes = track.querySelectorAll("command");
							let commands = [];
							commandNodes.forEach(xmlNode => {
								let command = waxml.createObject(xmlNode);
								// stupid conversion from string value = "-1/4"
								command.pos = section.musicalPositionToTime(command.pos);
								commands.push(command);
							});
							stem.commands = commands;
							
						}
					}
					


					// the solo-function needs to be reworked xxx
					if(track.hasAttribute("select-group")){
						var key = track.getAttribute("select-group");
						var value = track.getAttribute("select-value");
						// store solo values
						stem.setSoloGroup(key, value);
					}
					if(track.hasAttribute("select-variable")){
						var key = track.getAttribute("select-variable");
						var value = track.getAttribute("select-value");

						let win = "window.";
						if(key.substr(0, 7) != win){key = win + key}

						// store solo values
						stem.setSoloGroup(key, value);
					}


					// new XML syntax where group name is part of the attribute name
					// and value is the value of the old select-value attribute.
					// This allows for a system with multiple select-groups for one track
					// i.e. select-intensity="0...25"

					// getFollowAttributes(track.attributes).forEach(entry => {
					// 	stem.setSoloGroup(entry.key, entry.value);
					// });

					// 2022-09-15 update
					// It's NOT a good way of including variable-names as part of the attribute name
					// We should instead allow for multiple variables to be specified in the attribute value
					// separated with semicolon. And it should not be 'follow'. I'll try "filter"
					// i.e. filter="intensity=1; mood=happy; place=1,2..4,8"

					getFollowRules(track.getAttribute("filter")).forEach(entry => {
						stem.setSoloGroup(entry.key, entry.value);
					});

				});


				var motifs = arr.querySelectorAll("motif, leadin");
				motifs.forEach(motif => {

					let urls = [];

					let params = attributesToObject(motif.attributes);
					let url = motif.getAttribute("src");
					if(url){urls.push(url)}
					let sources = motif.querySelectorAll("source, option");
					sources.forEach(source => {
						var src = attributesToObject(source.attributes);
						src.commands = [];

						source.querySelectorAll("command").forEach(xmlNode => {
							let command = waxml.createObject(xmlNode);
							// xxx stupid conversion from string value = "-1/4"
							command.offset = section.divisionToTime(command.pos);
							src.commands.push(command);
						});
						//var src = source.getAttribute("src");
						if(src){urls.push(src)}
					});

					let motifObj;
					if(motif.nodeName == "motif"){
						motifObj = section.addMotif(params, urls);
					} else {

						// leadin default values
						if(typeof params.upbeat == "undefined" && typeof params.pos == "undefined"){
							// set leadin default to one bar
							// and changeOnNext to 1/8 so default
							// behaviour will be to auto crop leadin at next Q value
							params.upbeat = "bar";
							params.quantize = params.quantize || "bar";
							params.changeOnNext = params.changeOnNext || "1/8";
						}
						motifObj = section.addLeadIn(params, urls);
					}


					// the solo-function needs to be reworked xxx
			  		if(motif.hasAttribute("select-group")){
				  		var key = motif.getAttribute("select-group");
				  		var value = motif.getAttribute("select-value");
				  		// store solo values
				  		motifObj.setSoloGroup(key, value);
			  		}
			  		if(motif.hasAttribute("select-variable")){
				  		var key = motif.getAttribute("select-variable");
				  		var value = motif.getAttribute("select-value");

				  		let win = "window.";
					  	if(key.substr(0, 7) != win){key = win + key}

				  		// store solo values
				  		motifObj.setSoloGroup(key, value);
			  		}


					getFollowRules(motif.getAttribute("filter")).forEach(entry => {
						motifObj.setSoloGroup(entry.key, entry.value);
					});

					// WAXML nodes
					if(window.webAudioXML){
						let envelopeNodes = motif.querySelectorAll("envelope");
						let envelopes = [];
						envelopeNodes.forEach(xmlNode => {
							let musicalTimes = xmlNode.getAttribute("times");
							xmlNode.setAttribute("orig-times", musicalTimes);
							let env = window.webAudioXML.createObject(xmlNode);
							envelopes.push(env);
						});
						motifObj.addEnvelopes(envelopes);


						commands = [];
						[...motif.children].forEach(childNode => {
							if(childNode.localName.toLowerCase() == "command"){

								let command = waxml.createObject(childNode);
								// stupid conversion from string value = "-1/4"
								command.offset = section.divisionToTime(command.pos);
								commands.push(command);
							}
						});
						motifObj.commands = commands;

					}
				});
			});

			root.querySelectorAll("*[selected='true']").forEach((obj) => {

				let key = obj.getAttribute("select-group");
				if(!key){
					key = obj.getAttribute("select-variable");
			  		let win = "window.";
				  	if(key.substr(0, 7) != win){key = win + key}
				}
				if(!key){return}
				let value = obj.getAttribute("select-value");
				if(!value){return}
				iMus.select(key, value);
			});

			// add variable watchers for all objects with defined values
			root.querySelectorAll("*[select-variable]").forEach((obj) => {
				variableWatcher.addVariable(obj.getAttribute("select-variable"));
			});

			console.log("XML parse time: " + (Date.now() - XMLtimeStamp));

			iMus.connectToHTML();

	  	}



  	}




	var XMLtimeStamp;
	var musicStructure = document.currentScript.dataset.musicStructure;



	function parseImusicXML(){

		XMLtimeStamp = Date.now();


		if(musicStructure){
			let xmlDoc = document.querySelector(musicStructure);

			if(xmlDoc){
				Data.parseXML(xmlDoc);
			} else {
				Data.loadXML(musicStructure);
			}
		}

	}

	if(window.webAudioXML){

		// register and wait for callback from webAudioXML before parsing
		// (and especially connecting) iMusic environment
		window.webAudioXML.registerPlugin({
			name: "iMusic",
			variables: {},
			init:  parseImusicXML,
			setVariable: (key, val) => iMusic.select(key, val),
			connect: (destination) => {
				iMus.master.output.disconnect(0);
				iMus.master.output.connect(destination);
			},
			call: (fn, arg1, arg2, arg3) => {
				callFunction = iMusic[fn];
				if(callFunction){
					return callFunction(arg1, arg2, arg3);
				}
			},
			musicalStructure: self
		});
	} else {
		// else, just parse iMusic when window is loaded
		window.addEventListener("load", parseImusicXML);
	}






  	class AnalyserObject {

	  	constructor(ctx, target){
		  	this.ctx = ctx;
		  	this.target = target;
	  	}


	  	update(e){

	  	}
  	}

	

  	// class Bus2 {

	//   	constructor(ctx, el){
	// 	  	this.ctx = ctx;
	// 	  	this._input = new AudioNode("gain", {}, ctx, el);
	// 	  	this.nodes = [];
	// 	  	this._output = new AudioNode("gain", {}, ctx, el);
	// 	  	this._output.connect(this.ctx.destination);
	// 	  	this.sends = {};

	// 	  	this.parentEl = el;

	//   	}

	//   	get connection(){
	// 	  	return this._input.node;
	//   	}

	//   	get input(){
	// 	  	return this._input.node;
	//   	}

	//   	get output(){
	// 	  	return this._output.node;
	//   	}


	//   	addNode(nodeType, params){

	// 	  	let audioNode = new AudioNode(nodeType, params, this.ctx, this.el);

	// 	  	switch(nodeType){
	// 		  	case "send":
	// 		  	this.output.connect(audioNode.node);
	// 		  	if(params.output){
	// 		  		let destination = iMus.objects[params.output];
	// 		  		audioNode.connect(destination.input);
	// 		  	}
	// 		  	break;

	// 		  	case "oscillator":
	// 		  	audioNode.node.connect(this.output);
	// 		  	this.nodes.push(audioNode);
	// 		  	break;


	// 		  	default:
	// 		  	this.connect(audioNode.node);
	// 		  	audioNode.node.connect(this.output);
	// 		  	this.nodes.push(audioNode);
	// 		  	break;
	// 	  	}


	// 	  	return audioNode;

	//   	}


	//   	connect(destination){
	// 	  	destination = destination || this.output;
	// 	  	let last = this.nodes.slice(-1).pop() || this;
	// 	  	last.connection.disconnect(0);
	// 	  	last.connection.connect(destination);
	//   	}

	//   	addSend(classList, bus){
	// 	  	let gainObj = new AudioNode("gain", {}, this.ctx, this.el);
	// 	  	classList.forEach(tag => addReferenceObject(tag, gainObj, this.sends));
	// 	  	gainObj.connect(bus);
	//   	}


	//   	start(){
	// 	  	this.nodes.forEach(node => {node.start()});
	//   	}

	//   	stop(){
	// 	  	this.nodes.forEach(node => {node.stop()});
	//   	}


  	// }



  	class AudioNode{

	  	constructor(nodeType, params = {}, ctx, el){

		  	nodeType = nodeType.toLowerCase();
		  	if(nodeType.substr(-4) == "node"){
			  	nodeType = nodeType.substr(0, nodeType.length-4);
		  	}
		  	this.ctx = ctx || audioContext;
		  	let fn, src;
		  	let path = params.path || "audio";;
		  	this.nodeType = nodeType;

		  	switch(nodeType){

			  	case "audioBuffer":
			  	this.node = this.ctx.createAudioBuffer();
			  	src = addAudioPath(path, params.src);
			  	fetch(src)
			        .then(response => response.arrayBuffer())
			        .then(arrayBuffer => this.ctx.decodeAudioData(arrayBuffer,
			        	audioBuffer => this.node.buffer = audioBuffer,
			        	e => reject(e)
			        ));
			  	break;


			  	case "oscillator":
			  	this.node = this.ctx.createOscillator();
			  	if(params.autoPlay != "false"){
					this.node.start();
			  	}
			  	break;


			  	case "biquadfilter":
			  	this.node = this.ctx.createBiquadFilter();
			  	break;

			  	case "convolver":
			  	if(!params.src){return}
			  	src = addAudioPath(path, params.src);
			  	this.node = this.ctx.createConvolver();
			  	fetch(src)
			        .then(response => response.arrayBuffer())
			        .then(arrayBuffer => this.ctx.decodeAudioData(arrayBuffer,
			        	audioBuffer => this.node.buffer = audioBuffer,
			        	e => reject(e)
			        ));
			  	break;

			  	case "delay":
			  	this.node = this.ctx.createDelay();
			  	break;

			  	case "dynamicscompressor":
			  	break;

			  	case "waveshaper":
			  	break;

			  	case "periodicwave":
			  	break;

			  	case "iirfilter":
			  	break;

			  	case "gain":
			  	case "send":
			  	this.node = createGainNode();
			  	break;

			  	default:
			  	return false;
			  	break;

		  	}


		  	// mappers
		  	this.mappers = {};

		  	// set parameters
		  	if(params){Object.keys(params).forEach(key => this[key] = params[key])};



	  	}


	  	addController(type, params = {}){
		  	if(!type){return}



		  	switch(params.parameter){

			  	case "frequency":
			  	params.min = params.min || 0;
			  	params.max = params.max || 3;
			  	params.step = params.step || 0.01;
			  	params.conv = params.conv || "Math.pow(10,x)*20";
			  	break;

			  	case "detune":
			  	params.min = params.min || -153600;
			  	params.max = params.max || 53600;
			  	params.conv = params.conv || "";
			  	params.step = params.step || 1;
			  	break;

			  	default:
			  	params.min = params.min || 0;
			  	params.max = params.max || 1;
			  	params.step = params.step || 0.01;
			  	params.conv = params.conv || "Math.pow(x,3)";
			  	break;
		  	}

		  	params.valuetip = 1;

			type = type == "true" ? "slider" : type;
			let el = document.createElement("webaudio-" + type, params);
			this.el.appendChild(el);
			Object.keys(params).forEach(key => el.setAttribute(key, params[key]));

			el.addEventListener("input", e => {
				let paramObj = this.node[params.parameter];
				if(paramObj){
					paramObj.setTargetAtTime(e.target.convValue, 0, 0.001);
				}

			});



	  	}

	  	addMapper(paramName, follow, mapString){
		  	if(!paramName){return}
		  	//if(!mapString){return}

		  	let arr = mapString ? mapString.split(",") : null;

		  	let obj = {};

		  	if(arr){
			  	obj.minIn = Number(arr.shift());
			  	obj.maxIn = Number(arr.shift());
			  	obj.minOut = Number(arr.shift());
			  	obj.maxOut = Number(arr.shift());
			  	obj.exp = arr.shift();
		  	} else {

			  	switch(paramName){

				  	case "frequency":
				  	obj.minIn = -24000;
				  	obj.maxIn = 24000;
				  	obj.minOut = -24000;
				  	obj.maxOut = 24000;
				  	obj.exp = 1;
				  	break;

				  	case "detune":
				  	obj.minIn = -153600;
				  	obj.maxIn = 153600;
				  	obj.minOut = -153600;
				  	obj.maxOut = 153600;
				  	obj.exp = 1;
				  	break;

				  	default:
				  	obj.minIn = 0;
				  	obj.maxIn = 1;
				  	obj.minOut = 0;
				  	obj.maxOut = 1;
				  	obj.exp = 1;
				  	break;
			  	}
		  	}


		  	obj.target = this;
			obj.parameter= paramName;

		  	obj.follow = follow;

		  	let mapper = new Mapper(obj);

		  	this.mappers[paramName] = mapper;
		  	return mapper;
	  	}

	  	get connection(){
		  	return this.node;
	  	}

	  	get input(){
		  	return this.node;
	  	}

	  	disconnect(ch){
		  	ch = ch || 0;
		  	this.node.disconnect(ch);
	  	}

	  	connect(destination){
		  	destination = destination || this.ctx.destination;
		  	this.node.connect(destination);
	  	}

	  	start(){
		  	switch(this.nodeType){

			  	case "oscillator":
		  		if (typeof this.node.start === 'undefined'){
			  		this.node.noteOn(0);
			  	} else {
				  	this.node.start(0);
			  	}
			  	break;

			  	case "envelope":
			  	break;
		  	}
	  	}

	  	stop(){

		  	switch(this.nodeType){

			  	case "oscillator":
			  	break;

			  	case "envelope":
			  	break;
		  	}
	  	}




	  	setTargetAtTime(param, value, delay, transitionTime){

		  	let startTime = this.ctx.currentTime + (delay || 0);
		  	transitionTime = transitionTime || 0;
		  	//console.log(param, value);
		  	this.node[param].setTargetAtTime(value, startTime, transitionTime);
	  	}

	  	map(param, val, delay, transitionTime){


	  		let mapper = this.mappers[param];
	  		if(!mapper){return}

			val = mapper.getValue(val);
			this[mapper.parameter] = val;


	  	}


	  	set gain(val){
		  	this.setTargetAtTime("gain", val);
	  	}

	  	get gain(){
		  	return this.gain.value;
	  	}

	  	set frequency(val){
	  		this.setTargetAtTime("frequency", val);
	  	}

	  	get frequency(){
		  	return this.frequency.value;
	  	}

	  	set detune(val){
		  	this.setTargetAtTime("detune", val);
	  	}

	  	get detune(){
		  	return this.detune.value;
	  	}

	  	set Q(val){
		  	this.setTargetAtTime("Q", val);
	  	}

	  	get Q(){
		  	return this.Q.value;
	  	}

	  	set type(val){
		  	this.node.type = val;
	  	}

	  	get type(){
		  	return this.node.type;
	  	}

	  	set(key, value){
		  	if(typeof this.node[key] !== "undefined"){
			  	this[key] = value;
		  	}
	  	}


  	}


  	class Mapper{


		constructor(obj){

			this.minIn = obj.minIn || 0;
			this.maxIn = obj.maxIn || 1;
			this.rangeIn = obj.maxIn - obj.minIn;


			this.minOut = obj.minOut || 0;
			this.maxOut = obj.maxOut || 1;
			this.rangeOut = obj.maxOut - obj.minOut;

			this.exp = obj.exp || "x";

			this.follow = obj.follow;
			this.parameter = obj.parameter;
			if(Number(this.exp) == this.exp){this.exp = "Math.pow(x, " + this.exp + ")"};

		}


		getValue(x){

			x = Math.max(x, this.minIn);
			x = Math.min(x, this.maxIn);

			let valIn = eval(this.exp);

			let relVal = (valIn - this.minIn)/this.rangeIn;
			let valOut = relVal * this.rangeOut + this.minOut;

			return valOut;
		}


	}


  	class Range {

		constructor(_values){

			this.values = [];
			this._valueType = "number";
			if(_values){
				let arr;
				if(_values instanceof Array){
					arr = _values;
				} else {
					arr = _values.split(",");
				}
				arr.forEach(val => {

					if(typeof val != "object"){

						let v = Number(val);

						if(isNaN(v)){
	
							if(val.includes("...")){
								var minMaxStrings = val.split("...");
								var numValMin = eval(minMaxStrings[0]);
								var numValMax = eval(minMaxStrings[1]);
								this.values.push(numValMin);
								this.values.push(numValMax);
								val = new MinMax(numValMin, numValMax);
							}
	
							this._valueType = "string";
						} else {
							val = v;
						}
						this.values.push(val);
					}

				});

				this.values.sort();

				if(!this.values.length){
					this.values.push({min:0,max:1});
				}

			}

		}

		sort(){
			this.values = this.values.sort((a, b) => a - b);
			return this;
		}

		get value(){

			return Range.getRandomVal(this.values);

		}

		getRandomVal(dec, fn){
			return Range.getRandomVal(this.values, dec, fn);
		}

		get sortedValues() {
			let allValues = [];
			this.values.forEach(val => {
				if(val instanceof MinMax){
					allValues.push(val.min);
					allValues.push(val.max);
				} else {
					allValues.push(val);
				}
			});
			return allValues.sort((a, b) => a - b);
		}

		get min(){
			return this.sortedValues.shift();
		}
		get max(){
			return this.sortedValues.pop();
		}

		get type(){
			return this._valueType;
		}

		get isNumber(){
			return this._valueType == "number";
		}


	}

	Range.getRandomVal = function(arr, dec, fn){

		if(!arr){return 0}
		if(!arr.length){return 0}


		var ln = fn == "other" ? arr.length - 1 : arr.length;
		var rnd = Math.floor(Math.random()*ln);
		var val;
		dec = dec || 0;

		// pick from array
		switch(fn){
			case "remove":
			val = arr.splice(rnd, 1).pop();
			break;

			case "other":
			val = arr.splice(rnd, 1).pop();
			arr.push(val);
			break;

			case "sequence":
			val = arr.shift();
			arr.push(val);
			break;

			case "shuffle":
			default:
			val = arr[rnd];
			break;
		}

		if(val instanceof MinMax){

			// random between two values

			var range = val.max-val.min+1;
			var num = val.min + Math.random()*range;

			var factor = Math.pow(10, dec);
			num*=factor;
			num = Math.floor(num);
			num/=factor;
			val = num;

		}
		return val;

	}


	class MinMax {

		constructor(min, max){
			this.min = Math.min(min, max);
			this.max = Math.max(min, max);
		}

	}

	// console.log("iMusicXML is installed. Version 0.91.14");
	// var expectedSchemaFile = "https://momdev.se/lindetorp/imusic/scheme_1.1.21.xsd";



}(window.jQuery));




/*

To do:



Add support for preSection and postSection


Establish a params-property for all objects that is easily inherited and overwrited with local parameters

Try to merge Part/Motif/SFX (at least the Motif/SFX. SFX ought to be a Motif with quantize set to "off")



Implement channelSplitter and channelMerger into Bus

Make sure a masterbus is always working in multi channel mode.

Clean up the addSection, addStem, createParts - structure

remove parts from Track.playingParts when they stop playing.


Check the Action object. Does it work?

playSound triggers a setTimeout if length is typeof "number". This makes it possible to retrigg before tail but
also makes parts longer than default partLength retrig before finished.

Delay: Skapa möjlighet att skicka studsar till utgångar i en viss ordning



BUGS:
Loopade Motifs loopar inte i evighet. Kolla rad 507. me.playing blir false. Vad får det för konsekvenser att
ta bort kollen för -1-loopar.


getTime() - kolla igenom alla ställen den används. Hur ska den relatera till audiocontext.currentTime och self.sectionStart?
NU är det förvirring och det stör t.ex. getNextLegalBreak()









DONE:

OK Inför events som triggas av olika musikaliska händelser. Bar, beat etc
PROBLEM: 1925 krock mellan self och default
Reducera getPosition()
Byt ut classes till tags. Make sure Selection.find() works with multiple tags.
Skapa slumpgrupper
LegalBreakPoints verkar inte funka exakt som jag tänkt (men fixa multipla)
setInterval slutar efter ett tag (när man byter section?)
Work through inheritence of parameters
Motif slumpar inte totalt. Splice-funktionen fungerar inte eftersom url-listan sorteras om hela tiden.
fadeTime-tracks kickar inte igång mitt i en loop

Fixa klart Motifs så att de knyts till en Section och att Quantize-värdet sitter i Motif.parameters
Gör set tempo och set timeSign säker så att det går att byta för en viss section
Städa upp mellan musicalStart och sectionStart



*/

/*

Jonas ideas:

Add possibility to loop part for a certain number of times within a track
gör partposition oberoende av beatDuration etc.

2022-09-02

changeOnNext="12/4" ger tre takter om globala taktarten är 3/4 men changeOnNext="4" funkar
*/

},{}],46:[function(require,module,exports){
const BaseTimedAudioObject = require('./BaseTimedAudioObject.js');


class Sequence extends BaseTimedAudioObject {

	constructor(xmlNode, waxml, params){
		super(xmlNode, waxml, params);
		// init params
		params["sync-points"] = (params["sync-points"] || "").split(",").map(str => {
			return parseFloat(str);
		}).sort((a,b) => a - b);

		this._params = params;
	
	}
	

	start(params = {}){

		// merge and overwrite values from different objects
		params = {...{time: this.currentTime, offset: 0, minPos: this.minPos}, ...params};

		if(params.syncPointIndex && this.params["sync-points"]){
			params.offset = this.params["sync-points"][params.syncPointIndex] || params.offset;
		}
		
		if(params.offset <= 0){

			// start playback from beginning (and therefore, look for children with negative offset so all gets included)
			// if offset is positive, then child objects will trigger as soon as they are allowed to

			// params.offset = params.minPos;
			if(params.time + params.minPos < this.currentTime){
				// offset if needed
				params.time = this.currentTime - params.minPos;
			}
		} 

		super.start(params); // calls all children
	}
	
	stop(params = {}){
		// merge and overwrite values from different objects
		params = {...{time: this.currentTime}, ...params};

		super.stop(params); // calls all children
	}

	getNextSyncPoint(time = this.currentTime){

		let syncPoint = {syncPointIndex: 0, time: time, pos: 0};
		let localTime = this.localTime;
		let nextBreak, localNextBreak;

		// 		○ Välj ut den eller de slices som har högts priority (har inte gjort priority än)
		// 		○ Hitta end på denna slice
		let sliceBreaks = this.children.map(obj => obj.getNextBreak?.(time)).filter(t => t);


		if(sliceBreaks.length){
			nextBreak = Math.max(...sliceBreaks);
			// provide information about last slice end for next
			// sequence to use as a basis for fadeins 
			// syncPoint.nextBreak = nextBreak;
		} else {

		}
		nextBreak = nextBreak || time;
		localNextBreak = nextBreak - this.timeStamp;


		
		// 		○ Ta nästa synkpunkt efter. Spara ID
		if(this.params["sync-points"].length && this.state){

			// step 1 - get next 
			// let index = this.params["sync-points"].findIndex(pos => pos >= nextBreak - this.timeStamp); // tillfälligt bortkommenterad
			let index = this.params["sync-points"].findIndex(pos => pos >= localNextBreak); 
			let repeatOffset = 0;
			if(index == -1){
				// pos is after last syncPoint
				if(this.params.repeat){
					index = 0;
					repeatOffset = this.params["repeat-length"];
				}
			}
			syncPoint.syncPointIndex = index;
			syncPoint.pos = this.params["sync-points"][index];
			syncPoint.time = syncPoint.pos + this.timeStamp + repeatOffset;

			// it is important to forward the time position relative to 
			// the next syncPoint. That's the only stable position in
			// time at this moment.
			syncPoint.breakOffset = nextBreak - syncPoint.time;
			// console.log("breakOffset", syncPoint.breakOffset);

		} else {
			// this is not recommendable. 
			// to not use syncPoints
			// It will probably default to currentTime 
			syncPoint.time = nextBreak;
		}

		// console.log(`syncPoint.time = ${syncPoint.time}`);

		return syncPoint;
	}

	get voiceGroupPendingTimes(){

		// Only works on voices directly as children to a sequence
		// collect the voice objects with adjusted time positions
		const voiceGroups = this.children.reduce((group, obj) => {
			let { voice } = obj.params;
			voice = voice ?? "unnamed";
			group[voice] = group[voice] ?? [];
			group[voice].push(obj);
			return group;
		}, {});

		// console.log(voiceGroups);

		// 
		const entries = Object.entries(voiceGroups).map(([voice, objects]) => {
			// it should really be just one object per voice in a sequence
			// but for the sake of it...
			let pendingTime = Math.min(...objects.map(obj => obj.pendingTime)) || undefined;
			return [voice, pendingTime];
		});

		return Object.fromEntries(entries);

	}

	    
}

module.exports = Sequence;



/*

Vid vissa övergångar stannar fiolen och dragspelet tillsammans med vocal. Det verkar beroende av slices




*/
},{"./BaseTimedAudioObject.js":44}],47:[function(require,module,exports){
const BaseTimedAudioObject = require('./BaseTimedAudioObject.js');


class Slice extends BaseTimedAudioObject {

	constructor(xmlNode, waxml, params){
		super(xmlNode, waxml, params);

		this.params.from = parseFloat(this.params.from || 0);
		this.params.to = parseFloat(this.params.to || 0);
	}
	
	    
}

module.exports = Slice;

},{"./BaseTimedAudioObject.js":44}],48:[function(require,module,exports){
const BaseTimedAudioObject = require('./BaseTimedAudioObject.js');
const Loader = require('../Loader.js');


class Wave extends BaseTimedAudioObject {
	
	constructor(xmlNode, waxml, params){
		super(xmlNode, waxml, params);

		// defult values
		this._params = {...params};
	
		// load file
		if(params.src){this.src = params.src}
	}
	
	
	start(params = {}){

		params = {...params}; // make a local copy

		params.blockFade = true; // to avoid fading from super class
		if(!(params = super.start(params))){return} // local offsets are calculated


		// console.log(this.params.src, "before: adjustOffsetToSlice", params);
		this.adjustOffsetToSlice(params);

		this.adjustOffsetToTime(params);
		// console.log(this.params.src, "after: adjustOffsetToSlice", params);

		// This is annoying while it's already set in the parent class, 
		// but timeStamp needs to be reset after any eventual change
		this.timeStamp = params.time - params.offset;


		this.crossFade(1, params.time);

		if(params.offset >= 0){
			this.startBuffer(params);
		}

		this.pendingTime = params.time;

	}

	startBuffer(params){
		if(this._buffer){
			let sourceNode = new AudioBufferSourceNode(this._ctx, params);
			sourceNode.buffer = this._buffer;
			sourceNode.start(params.time, params.offset);
			sourceNode.connect(this.output);
			
			this.sourceNode = sourceNode;
			
		} else {
			this.addEventListener("loaded", e => this.startBuffer(params));
		}
	}


	stop(params = {}){

		// console.log(this.params.src + " stop");
		// support for individual slices
		// if(!this.adjustStopToSlice(params)){return}; // this line makes folk music not stop playing on changing sequence

		// control state

		params = {...params}; // make a local copy

		// console.log(this.params.src, "before: adjustStopToSlice", params);
		params.blockFade = true; // to avoid fading from super class
		if(!(params = super.stop(params))){return}

		this.adjustStopToSlice(params);
		// console.log(this.params.src, "after: adjustStopToSlice", params);
		
		// callback after fadeout
		let fadeCallback = () => {
			if(this.sourceNode){
				this.sourceNode.stop(params.time);
				this.sourceNode.disconnect();
			}
		};

		this.crossFade(0, params.time, undefined, fadeCallback);



	}


	// this function is currently needed to correctly offset wave objects when
	// started from the first slice. BUT the logic to find the appropriate 
	// position for cutting in and out voices should really be on the 
	// sequence level. Eller inte?


	adjustOffsetToSlice(params){
		// let localTargetTime = (params.nextBreak || this.currentTime) - this.timeStamp;
		// let localTime = this.localTime;

		let localTargetTime = params.offset + params.breakOffset;
		
		// Start last slice BEFORE offset AT or AFTER nextBreak
		// let targetSlice = this.children.filter(slice => slice.params.from < params.offset && slice.params.to >= localTime).pop();
		let targetSlice = this.children.filter(slice => slice.params.from > params.offset + params.breakOffset && slice.params.from < params.offset).pop();

		if(!targetSlice){
			// OR first slice AFTER offset
			targetSlice = this.children.find(slice => slice.params.from > params.offset);
		}


		if(targetSlice){
			// set crossfade to next slice in wave
			params.time = targetSlice.params.from + this.timeStamp;
			params.offset = targetSlice.params.from;

			// console.log(this.params.src, "id: ", targetSlice.childIndex, "from:", targetSlice.params.from, "localTime:", this.currentTime - this.timeStamp, params);
		}
			
		
	}


	adjustStopToSlice(params){

		let pendingTime;
		let targetSlices;
		let offset; // is changed if conditions are met
		let localTime = this.currentTime - this.timeStamp;
		let children = this.children; //
		
		if(params.pendingTimes && this.params.voice && children.length){
			pendingTime = params.pendingTimes[this.params.voice] || params.time;
			if(pendingTime){

				let localPendingTime = pendingTime-this.timeStamp;
				// If voice:
				// Stop at pendingTime for same voice
				// but never later than the last slice before pendingTime starts
				// targetSlices = this.children.filter(obj => obj.params.from <= localPendingTime && obj.params.to > localPendingTime);
				targetSlices = children.filter(obj => obj.params.from < localPendingTime && obj.params.from > localTime && obj.params.to >= localTime);

				let lastSliceBeforePendingTime = targetSlices.sort((a,b) => a.from - b.from).pop();
				if(lastSliceBeforePendingTime){
					localPendingTime = Math.min(localPendingTime, lastSliceBeforePendingTime.params.from);
					// console.log(`${this.params.src} from (${lastSliceBeforePendingTime.params.from}) < ${localPendingTime} && to (${lastSliceBeforePendingTime.params.to}) >= ${localTime}`);
				}
				offset = localPendingTime;
			}
		}

		if(!pendingTime){


			// If no voice with pendingTime
			// stop after last slice BEFORE offset
			// AT or AFTER nextBreak
			targetSlices = children.filter(obj => obj.to <= params.offset && obj.to >= params.nextBreak);
			if(targetSlices.length){
				offset = targetSlices.map(obj => obj.params.to || 0).sort((a,b) => a - b).pop();
			} else {
				return true;
			}

		}


		// adjust params
		if(typeof offset !== "undefined"){

			// console.log(this.params.src, "moveStop + ", this.timeStamp + offset - params.time);
			if(isNaN(offset)){
				return false;
			}
			params.time = this.timeStamp + offset;
		} 
	
	}


	adjustOffsetToTime(params){
		if(params.offset < 0){
			// there are various reasons why the offset might be negative:
			// a negative fade-offset value might be the current biggest issue (as per 2024-04-17)
			// but it can possibly be a result of various hierarchical settings in 
			// the future. For now, I try to move the time, otherwise move offset.
			let time = params.time + params.offset;
			if(time >= this.currentTime){
				params.time = time;
				params.offset = 0;
			} else {
				params.time = this.currentTime;
				params.offset = params.time - time;
			}
			
		}
	}

	


	getNextBreak(time = this.currentTime){
		let localTime = time - this.timeStamp;

		// find a currently playing slice
		let slice = this.children.find(obj => {
			return obj.params.from < localTime && obj.params.to > localTime;
		});
		if(slice){
			// console.log(`${this.params.src} time: ${time.toFixed(2)}, from: ${slice.params.from}, to: ${slice.params.to}`);
			return slice.params.to + this.timeStamp;
		}

	}


	// get offset(){
	// 	return this._playing ? this._ctx.currentTime - this.lastStarted + this._offset : (this._offset || 0);
	// }

	// set offset(val){
	// 	this._offset = val;
		
	// 	if(this._playing){
	// 		this.stop();
	// 		this._playing = false;
	// 		this.continue({from: val});
	// 	}
	// }

	set src(src){
		let localPath = this.getParameter("localpath") || "";
		Loader.loadAudio(localPath + src, this._ctx).then(audioBuffer => {
			this._buffer = audioBuffer;
			this.dispatchEvent(new Event("loaded"));
		});
	}


	get minPos(){
		// returns the offset value for the earliest child (slice) object
		// or the pos of the wave object if there are no slices
		let children = this.children;
		let pos = this.params.pos;

		if(children.length){
			pos += Math.min(...children.map(obj => obj.params.from || 0));
		}
		return pos; 
	}

	    
	get relPos(){
		
		return this._buffer ? this.localTime / this._buffer.duration : 0;
	}

	get pendingTime(){
		if(this.children.length)return this._pendingTime;
	}

	set pendingTime(val){
		this._pendingTime = val;
	}
}

module.exports = Wave;

},{"../Loader.js":20,"./BaseTimedAudioObject.js":44}],49:[function(require,module,exports){


class SnapshotComponent extends HTMLElement {

	constructor(xmlNode, waxml=window.waxml){
		super();
		this.inited = false;
		this.timeouts = [];
		this.waxml = waxml;
		if(xmlNode){
			this.init(xmlNode);
		}
	}

	// connectedCallback(){
	// 	if(!this.inited){
	// 		this.init({

	// 		});
	// 	}
		
	// }


	init(data){
		this.data = data;
		
		let snapshotTriggerBtn = document.createElement("button");
		let nameAttribute = data.attributes.id || data.attributes.class;
		
		if(data.attributes.id){
			this.setAttribute("id", data.attributes.id.value);
		}
		if(data.attributes.class){
			this.setAttribute("class", data.attributes.class.value);
		}

		snapshotTriggerBtn.innerHTML = nameAttribute.value;
		snapshotTriggerBtn.classList.add("snapshot");
		snapshotTriggerBtn.addEventListener("click", e => this.trig());

		let snapshotDeleteBtn = document.createElement("button");
		snapshotDeleteBtn.innerHTML = "-";
		snapshotDeleteBtn.classList.add("delete");
		snapshotDeleteBtn.addEventListener("click", e => {
			if(confirm(`Do you want to delete "${nameAttribute.value}"?`)){
				this.parentElement.removeChild(this);
			}
		});

		this.appendChild(snapshotTriggerBtn);
		this.appendChild(snapshotDeleteBtn);
		return this;
	}

	trig(data = {}){
		let fn = () => {
			this.dispatchEvent(new CustomEvent("recall"));
			this.sendData();
		}
		if(data.time){
			let delay = data.time - this.waxml._ctx.currentTime;
			this.timeouts.push(setTimeout(fn, delay*1000));
		} else {
			fn();
		}
		
	}

	sendData(){
		[...this.data.children].forEach(option => {
			let variable = option.attributes.variable.value;
			let value = parseFloat(option.attributes.value.value);
			this.waxml.setVariable(variable, value);
		});
		this.dispatchEvent(new CustomEvent("sendData"));
	}


	clear(){
		while(this.timeouts.length){
			clearTimeout(this.timeouts.pop());
		}
	}

	get variableNames(){
		let variableNames = [];
		[...this.data.children].forEach(option => {
			variableNames.push(option.attributes.variable.value);
		});
		return variableNames;
	}

	toString(){
		let data = this.data;
		let idStr = data.attributes.id ? ` id="${data.attributes.id.value}"` : ``;
		let nameStr = data.attributes.name ? ` name="${data.attributes.name.value}"` : ``;
		let classStr = data.attributes.class ? ` class="${data.attributes.class.value}"` : ``;
		
		let str = "";
		str += `- - - - - - - - - - - - - -\n`;
		str += `WAXML:\n`;
		str += `- - - - - - - - - - - - - -\n\n`;
		str += `<Snapshot${classStr}>\n`;

		let varArr = [];
		[...data.children].forEach(command => {
			str += `  <Command type="set" variable="${command.attributes.variable.value}" value="${command.attributes.value.value}" />\n`;
			varArr.push(`${command.attributes.variable.value}=${command.attributes.value.value}`);
		});
		str += `</Snapshot>\n\n`;
		str += `- - - - - - - - - - - - - -\n`;
		str += `HTML:\n`;
		str += `- - - - - - - - - - - - - -\n\n`;

		let nameAttribute = data.attributes.id || data.attributes.class;
		str += `<a data-waxml-click-trig="${nameAttribute.value}">${nameAttribute.value}</a>`;
		
		return str;
	}

	setAttributes(el = this, data){
		Object.entries(data).forEach(([key, value]) => {
			if(typeof value == "string" || typeof value == "number"){
				el.setAttribute(key, value);
			}
		});
	}
}

module.exports = SnapshotComponent;

},{}],50:[function(require,module,exports){
var SnapshotComponent = require('./SnapshotComponent.js');


class SnapshotController extends HTMLElement {

	constructor(attributes, waxml=window.waxml){
		super();
		this.inited = false;
		this.waxml = waxml;
		if(attributes){
			this.setAttributes(this, attributes);
		}
		this.curID = 1;
	}

	connectedCallback(){
		if(!this.inited){
			this.init({

			});
		}
		
	}


	init(){

		let variables = this.parentElement.querySelectorAll(`waxml-variable-controller`);
		if(!variables.length){
			this.classList.add("hide");
		}

		this.inited = true;
		this.style.display = "block";
		this.snapshotComponents = [];


		this.snapshotContainer = document.createElement("div");
		this.snapshotContainer.classList.add("waxml-snapshot-button-container");


		let selector = `waxml-variable-controller`;
		this.appendChild(this.snapshotContainer);
		

		this.output = document.createElement("textarea");
		this.output.classList.add("output");
		this.output.setAttribute("cols", "70");
		this.output.setAttribute("rows", "20");
		this.appendChild(this.output);

		let filter = `.${[...this.classList].join(".")}`;

		// I skip the filter function for the moment 2023-09-13
		// this.snapshots = this.waxml.querySelectorAll(`Snapshot${filter}`)
		this.snapshots = this.waxml.querySelectorAll(`Snapshot`)

		this.addBtn = document.createElement("button");
		this.addBtn.classList.add("add");
		this.addBtn.innerHTML = "+";
		this.snapshotContainer.appendChild(this.addBtn);
		this.addBtn.addEventListener("click", e => {
			let data = this.getData();
			if(data){
				let snapshotComponent = new SnapshotComponent(data);
				this.add(snapshotComponent);
			} else {
				alert("Please select one or more settings in the mixer.")
			}
			
		});

		this.snapshots.forEach(data => {
			this.add(data);
		});

		
		return this;
	}

	add(snapshotComponent){
		// find numbering in id-name
		let id = parseInt(snapshotComponent.getAttribute("class").split("-").pop());
		
		if(!isNaN(id)){
			this.curID = Math.max(this.curID, id);
		}
		// let snapshotComponent = new SnapshotComponent(data);
		snapshotComponent.addEventListener("recall", e => {
			this.output.innerHTML = e.target.toString();
		});
		snapshotComponent.addEventListener("sendData", e => {
			// select variables in matrix 
			// let selector = `*.${[...this.classList].join(".")} waxml-variable-controller`;
			// let vcs = this.parentElement.querySelectorAll(selector);

			// select all variable controllers
			let selector = `waxml-variable-controller`;
			let vcs = this.parentElement.querySelectorAll(selector);
			
			// deselect all variable controllers
			vcs.forEach(vc => vc.selected = false);
			
			// select all variable controllers in snapshot
			e.target.variableNames.forEach(vn => {
				[...vcs].filter(vc => {
					if(vc.watchedVariable == vn){
						vc.selected = true;
					}
				});
			});
		
		});

		this.snapshotContainer.insertBefore(snapshotComponent, this.addBtn);
	}

	getData(){
		// let selector = `*.${[...this.classList].join(".")} waxml-variable-controller.selected`;
		let selector = `waxml-variable-controller.selected`;
		let variables = this.parentElement.querySelectorAll(selector);
		if(!variables.length){
			return false;
		}

		let snapshot = document.createElement("Snapshot");
		// snapshot.setAttribute("class", this.attributes.class.value);
		// snapshot.setAttribute("id", `snapshot-${this.newID}`);
		snapshot.setAttribute("class", `snapshot-${this.newID}`);

		variables.forEach(variableController => {
			let command = document.createElement("Command");
			command.setAttribute("type", "set");
			command.setAttribute("variable", variableController.watchedVariable);
			command.setAttribute("value", variableController.value);
			snapshot.appendChild(command);
		});
		return snapshot;
	}

	get newID(){
		return ++this.curID;
	}

	setAttributes(el = this, data){
		Object.entries(data).forEach(([key, value]) => {
			if(typeof value == "string" || typeof value == "number"){
				el.setAttribute(key, value);
			}
		});
	}
}

module.exports = SnapshotController;

},{"./SnapshotComponent.js":49}]},{},[38]);
