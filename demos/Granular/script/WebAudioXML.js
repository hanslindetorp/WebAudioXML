(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./BufferSourceObject.js":3,"./WebAudioUtils.js":28}],2:[function(require,module,exports){

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




class AudioObject{

  	constructor(xmlNode, waxml, localPath, params){

	  	this.waxml = waxml;
	  	let _ctx = this.waxml._ctx;
      let parentAudioObj = xmlNode.parentNode.audioObject;
      this._parentAudioObj = parentAudioObj;

      if(parentAudioObj){
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
        let maxDelayTime = (this._params.maxDelayTime || this._params.delayTime).valueOf();
		  	maxDelayTime = Math.max(1, maxDelayTime * this._params.timescale);
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

		  	case "audio":
        case "gainnode":
        case "mixer":
        case "voice":
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
        this.input = new ChannelSpitterNode(this._ctx, {
          numberOfOutputs: this._ctx.destination.maxChannelCount,
          channelCount: this._ctx.destination.maxChannelCount,
          channelCountMode: "explicit",
          channelInterpretation: "discrete"
        });
		  	this._node = this._ctx.createGain();
        break;

        case "channelmergernode":
        this._node = new ChannelMergerNode(this._ctx, {
          numberOfInputs: this._ctx.destination.maxChannelCount,
          channelCount: 1,
          channelCountMode: "explicit",
          channelInterpretation: "discrete"
        });
        this.inputs = [];
        while(this.inputs.length < this._ctx.destination.maxChannelCount){
          let gainNode = new GainNode(this._ctx, {
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "discrete"
          });
          gainNode.connect(this._node, 0, this.inputs.length);
          this.inputs.push(gainNode);
        }
        break;


		  	case "envelope":
		  	this._node = xmlNode.parentNode.audioObject._node;
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
		  	this.setTargetAtTime(this._node, 0, 0, 0, true);
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
        let envName;
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
            } else if(envName = WebAudioUtils.getEnvelopeName(value)){

              // make connection to controlling Envelope
              let envNode = WebAudioUtils.findXMLnodes(xmlNode, "name", envName).pop();
              if(envNode){
                envNode.obj.addListener(this._node[key], value);
              } else {
                console.error(`No envelope matches the name '${envName}'`);
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

  	start(data){
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
          this._node.start();
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

  	stop(data){

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

        case "audiobuffersourcenode":
        case "objectbasedaudio":
        case "ambientaudio":
        //if(this._node.stop){this._node.stop()}
        this._node.stop();
        break;
	  	}
  	}




  	setTargetAtTime(param, value, delay, transitionTime, cancelPrevious, audioNode){

	  	let startTime = this._ctx.currentTime + (delay || 0);
	  	//transitionTime = transitionTime || 0.001;
	  	//console.log(value, delay, transitionTime, cancelPrevious);
      audioNode = audioNode || this._node;

      if(typeof value == "undefined"){
        console.warn("Cannot set " + param + " value to undefined");
        return;
      }



      if(audioNode && this._nodeType != "channelmergernode"){

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
  		  	param.setTargetAtTime(value, startTime, transitionTime/3);
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
    fade(val, fadeTime = 0.001){
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
	  	return this._node.gain.value;
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
	  	this.setTargetAtTime("delayTime", val * this._params.timescale);
  	}

  	set value(val){
	  	this.setTargetAtTime(this._node, val);
  	}

  	get value(){
	  	return this._node.value;
  	}



    set mix(val){

      val = Math.max(0, Math.min(val, 1));
      this._params.mix = val;
      let targets = this.childObjects; //.length ? this.childObjects : this.inputs;
        
      val *= targets.length; // 0 - nr of children or channelCount

      let crossFadeRange = this._params.crossfaderange;
      crossFadeRange = typeof crossFadeRange == "undefined" ? 1 : crossFadeRange;
      crossFadeRange = crossFadeRange || 0.000001;
      let frameWidth = 1 - crossFadeRange;

      // Det vore kanske bättre att lägga ut detta i Mapper-objektet
      // Och att ha en extra GainNode mellan child-objekt och input
      targets.forEach((target, i) => {
        let input = target.output ? target.output : target;
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
          peak = i + 0.5;
          fw = frameWidth;
        }
        let dist;
        let reduction;

        // no reduction far left or far right
        // if not specified with peak range
        let toTheLeft = i == 0 && val <= peak;
        let toTheRight = i == targets.length-1 && val >= peak;
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
        input.gain.setTargetAtTime(gain, input.context.currentTime, 0.001);
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
        targets.forEach((target, i) => {
          let input = target.output ? target.output : target;
          let dist = Math.abs(i - val);
          let reduction = Math.min(dist, 1);
          reduction = Math.pow(reduction, 2); // +3dB for equal power
          let gain = 1 - reduction;
          input.gain.setTargetAtTime(gain, input.context.currentTime, 0.001);
        });

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
      return this._params.positionX;
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
      return this._params.positionY;
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
      return this._params.positionZ;
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
      return this._params.refDistance;
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
      return this._params.rolloffFactor;
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


}


module.exports = AudioObject;

},{"./AmbientAudio.js":1,"./BufferSourceObject.js":3,"./ConvolverNodeObject.js":5,"./Loader.js":14,"./Mapper.js":15,"./Noise.js":17,"./ObjectBasedAudio.js":18,"./Variable.js":24,"./VariableContainer.js":25,"./Watcher.js":26,"./WebAudioUtils.js":28}],3:[function(require,module,exports){
var Loader = require('./Loader.js');
var WebAudioUtils = require('./WebAudioUtils.js');


class BufferSourceObject {

	constructor(obj, params){
		this._ctx = obj._ctx;
		this._node = new AudioBufferSourceNode(this._ctx);
		this._params = {...params};
		this._parentAudioObj = obj;
		this.callBackList = [];
	}

	connect(destination){
		this.destination = destination;
		this._node.connect(destination);
		return destination;
	}
	
	start(time, offset, duration){
		let params = {}
		if(typeof this._params.loop != "undefined"){params.loop = this._params.loop}
		if(typeof this._params.loopStart != "undefined"){params.loopStart = this._params.loopStart * this._params.timescale}
		if(typeof this._params.loopEnd != "undefined"){params.loopEnd = this._params.loopEnd * this._params.timescale}
		if(typeof this._params.playbackRate != "undefined"){params.playbackRate = this._params.playbackRate}
		if(typeof this._params.randomDetune != "undefined"){params.playbackRate *= WebAudioUtils.centToPlaybackRate(this._params.randomDetune)}

		this._node.disconnect();
		this._node = new AudioBufferSourceNode(this._ctx, params);
		this._node.buffer = this._buffer;

		// this.loop = this._params.loop;
		// if(this.loop){
		// 	if(typeof this._params.loopEnd != "undefined"){
		// 	this.loopEnd = this._params.loopEnd;
		// 	}
		// 	if(typeof this._params.loopStart != "undefined"){
		// 	this.loopStart = this._params.loopStart;
		// 	}
		// }
		// if(typeof this._params.playbackRate != "undefined"){
		// 	this.playbackRate = this._params.playbackRate;
		// }
		let factor = Math.abs(this._params.playbackRate || 1)
		this._node.connect(this.destination);	
		this._node.start(time, offset * factor, duration * factor);

	}

	stop(){
		this._node.disconnect();
	}



	getParameter(paramName){
        if(typeof this._params[paramName] === "undefined"){
            
            if(this._parentAudioObj){
                return this._parentAudioObj.getParameter(paramName);
            } else {
                return 0;
            }

        } else {
            return this._params[paramName];
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
		//this._node.setTargetAtTime("playbackRate", val, 0);
		this._node.playbackRate.setTargetAtTime(val, 0, this.getParameter("transitionTime"));

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

},{"./Loader.js":14,"./WebAudioUtils.js":28}],4:[function(require,module,exports){


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

				}


			}
			break;

			case "channelsplitternode":
			// connect each channel to separate child nodes
			let srcCh = 0;
			xmlNode.children.forEach(node => {
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
			let selector = xmlNode.obj.getParameter("outputbus");
			if(!selector){selector = xmlNode.obj.getParameter("bus")}
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
					// don't connect
					break;
				default:
				// connect


				switch(parentNodeType){

					case "mixer":
					case "audio":
					case "voice":
					case "synth":
					case "xi:include":
					case "channelsplitternode":
					xmlNode.obj.connect(xmlNode.parentNode.obj._node);
					break;


					case "channelmergernode":
					let trgCh = xmlNode.obj.getParameter("channel") || [[...xmlNode.parentNode.children].indexOf(xmlNode)];
					let channelCount = this._ctx.destination.channelCount; //xmlNode.parentNode.obj.inputs.length;
					trgCh.forEach((outputCh, i) => {
						let inputCh = i % xmlNode.obj._node.channelCount;
						xmlNode.obj.connect(xmlNode.parentNode.obj.inputs[outputCh % channelCount], inputCh, 0);
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
			targetElements = curNode.querySelectorAll(selector);
			curNode = curNode.parentNode;
		}
		return targetElements;
	}
}




module.exports = Connector;

},{}],5:[function(require,module,exports){
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

},{"./Loader.js":14}],6:[function(require,module,exports){
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
		let parentAudioObj = xmlNode.parentNode.obj;
		this._parentAudioObj = parentAudioObj;
		this.timeScale = this.getParameter("timescale") || 1;


		// convert ADSR attribute to times and values
		if(this._params.adsr){
			this._params.times = [this._params.adsr.attack, this._params.adsr.decay, this._params.adsr.release];
			this._params.values = [params.max, this._params.adsr.sustain, 0];
		}
		if(!this._params.times){
			console.error(`No times specified for ${this._xml}`);
			this._params.times = [0,100];
		}
		this._params.times = this._params.times.map(time => time * this.timeScale);

		if(!this._params.values){
			console.error(`No values specified for ${this._xml}`);
			this._params.values = [1,0];
		}

		this.timeModVal = this._params.times.length;
		this._listeners = [];

		this._params.targetvariables = this._params.targetvariables  || [];
	}

	addListener(param, expression){

		expression = WebAudioUtils.replaceEnvelopeName(expression);
		let values = this._params.values.map(x => this.mapValue(x, expression));

		param.setTargetAtTime(values[values.length-1], this._ctx.currentTime, 0.001);
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

	start(args = []){

		args = [...args];
		let factor = typeof args[0] == "undefined" ? 1 : args[0];

		// make it possible to update variables with data from event (like velocity or key)
		this._params.targetvariables.forEach((varName, index) => {
			this.waxml.setVariable(varName, args[index % args.length]);
		});

		this.running = true;



		let delay = this.getParameter("delay");
        let startTime = delay * this.timeScale + this._ctx.currentTime;

		// map values and times to (possibly be modified by dynamic values * factor (like velocity)
		let times = this._params.times.map((val, index) => this.mapDynamicValue(val, factor, this._params.dynamictimes, index));
		
		if(this._params.mode == "mono" && args[2] == 0){
			// don't retrigger if legato
		} else {
			this._listeners.forEach(target => {
				target.obj.cancelScheduledValues(startTime);
				let timeOffset = 0;
				let values = target.values.map((val, index) => this.mapDynamicValue(val, factor, this._params.dynamicvalues, index));
			
				// remove release value
				values.pop();
				values.forEach((value, index) => {
					let time = times[index % this.timeModVal];
					// See info about timeConstant and reaching the target value:
					// https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
					target.obj.setTargetAtTime(value, startTime + timeOffset, time/3);
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

	stop(args = []){

		args = [...args];
		let factor = typeof args[0] == "undefined" ? 1 : args[0];

		this.running = false;
		this.nextStartTime = 0;

		let delay = this.getParameter("delay");
		let releaseTime = this._ctx.currentTime + delay * this.timeScale;

		let vIndex = this._params.values.length-1;
		

		let tIndex = this.timeModVal-1;
		let t = this._params.times[tIndex];
		let time = this.mapDynamicValue(t, factor, this._params.dynamicvalues, tIndex)
		
		if(this._params.mode == "mono" && args[2] == 0){
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

},{"./WebAudioUtils.js":28}],7:[function(require,module,exports){

var Sequence = require('./Sequence.js');


class EventTracker {

	constructor(_varRouter){
		this._variableRouter = _varRouter;

		this._sequences = [];
		this._registeredEvents = [];

		this._curSeqName = "default";
		this.addSequence();
	}

	getSequence(name = this._curSeqName){
		return this._sequences.find(seq => seq.name == name);
	}

	addSequence(name = this._curSeqName, events = []){
		let seq = this.getSequence(name);
		if(seq){
			seq.update(events);
		} else {
			seq = new Sequence(this, name, events);
			this._sequences.push(seq);
		}
		return seq;
	}

	addSequenceFromLastGesture(name){
		let events = this.lastGesture;
		let seq = new Sequence(this, name, events);
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

	trigEvent(name, value){
		let ev = this._registeredEvents.find(ev => ev.name == name);
		if(ev.execute){ev.execute(value)}
	}

	clear(name = this._curSeqName){

		this.getSequence(name).clear();
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
		let events = seq.events("touchstart", "touchend", ["touchstart", "touchmove", "touchend"], ["relX", "relY"]);
		return new Sequence(this, name, events);
	}

	get lastGesture(){
		let seq = this.getSequence("default");
		let name = seq.name;
		let events = seq.events("pointerdown", "pointerup", ["pointerdown", "pointermove", "pointerup"], ["relX", "relY"]);
		return new Sequence(this, name, events);
	}

	set playing(state){
		this._playing = state;
	}
	get playing(){
		return this._playing;
	}
}


module.exports = EventTracker;

},{"./Sequence.js":21}],8:[function(require,module,exports){

var Mapper = require('./Mapper.js');
var WebAudioUtils = require('./WebAudioUtils.js');
//var Finder = require('../finderjs/index.js');

class GUI {

	constructor(xmlNode, waxml){

		this.waxml = waxml;
		this.elementCounter = 0;

		
		let style = document.createElement("style");
		style.innerHTML = `

			* {
				font-family: sans-serif;
			}
			#waxml-GUI {
				font-size: 80%;
				top: 0px;
				left: 0px;
				width: 100%;
				height: 100%;
				position: absolute;
				overflow: auto;
				padding: 1em;
				transition: 0.5s;
				background-color: white;
				color: black;
			}

			#waxml-GUI .container {
				border-top: 1px solid grey;
				margin-top: 1em;
			}
			#waxml-GUI button {
				border-radius: 3px;
				padding: 0.2em 0.5em;
   				margin: 0em 0.2em;
			}

			#waxml-GUI > button.close {
				min-width: 40px;
				font-weight: bold;
				background-color: red;
				position: absolute;
				top: 2px;
				right: 30px;
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
		
		`;

		let container = document.createElement("div");
		container.id = "waxml-GUI";
		container.classList.add("WebAudioXML");

		let allNodes = xmlNode.querySelectorAll("*[controls='true'], *[controls='show']");

		if(xmlNode.firstChild.getAttribute("controls") == "show"){
			document.head.appendChild(style);
			document.body.append(container);
		} else {


			let shadowContainer = document.createElement("div");
			shadowContainer.style.width = "0%";
			shadowContainer.style.height = "0%";
			shadowContainer.style.display = "none";
			shadowContainer.style.overflow = "visible";
			shadowContainer.style.position = "absolute";
			shadowContainer.style.zIndex = "1";
			shadowContainer.style.backgroundColor = "white";

			document.body.prepend(shadowContainer);


			let shadowElement = shadowContainer.attachShadow({mode: 'open'});
			shadowElement.appendChild(style);

			shadowElement.appendChild(container);

			
			let openbtn = document.createElement("button");
			openbtn.innerHTML = "WebAudioXML GUI";
			openbtn.style.position = "absolute";
			openbtn.style.right = "2px";
			openbtn.style.top = "2px";
			document.body.appendChild(openbtn);
			openbtn.addEventListener("click", e => {
				e.target.style.display = "none";
				shadowContainer.style.width = "100%";
				shadowContainer.style.height = "100%";
				shadowContainer.style.display = "block";
			});
			openbtn.style.display = allNodes.length ? "block": "none";


			let btn = document.createElement("button");
			btn.innerHTML = "X";
			btn.classList.add("close");
			container.appendChild(btn);
			btn.addEventListener("click", e => {
				openbtn.style.display = "block";
				shadowContainer.style.width = "0%";
				shadowContainer.style.height = "0%";
				shadowContainer.style.display = "none";
			});
		}
		
		

		let header = document.createElement("h1");
		header.innerHTML = "WebAudioXML";
		container.appendChild(header);



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


		// Generate triggers
		this.XMLtoTriggerButtons(xmlNode, container);

		// Create container for unspecified variable sliders
		let unspecVarsContainer = document.createElement("div");
		container.appendChild(unspecVarsContainer);

		// Generate sliders for <var> elememts and audio parameters
		let specifiedContainer = document.createElement("div");
		specifiedContainer.innerHTML = "<h2>&lt;var&gt; elements and Audio Parameters</h2>";
		specifiedContainer.classList.add("container");
		container.appendChild(specifiedContainer);



		allNodes.forEach(xmlNode => {
			this.XMLtoSliders(xmlNode, specifiedContainer, true);
		});

		this.addUnspecifiedVariableSliders(this.usedVariables, unspecVarsContainer);
		
		let columnView = document.createElement("div");
		columnView.classList.add("columnView");
		document.body.appendChild(columnView);
		this.XMLtoColumnView([this.waxml.structure.XMLtree], columnView);
	}


	remove(){
		// not implementet yet
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
		container.classList.add("container", "triggers");
		container.innerHTML = "<h2>Triggers</h2>";
		el.appendChild(container);

		xmlNode.querySelectorAll("*[id]").forEach(xmlNode => {
			IDs.push(xmlNode.id);
		});
		[...new Set(IDs)].forEach(id => this.addButton(id, container, e => this.waxml.start(`#${id}`)));

		xmlNode.querySelectorAll("*[class]").forEach(xmlNode => {
			xmlNode.classList.forEach(className => classNames.push(className));
		});
		[...new Set(classNames)].forEach(className => this.addButton(className, container, e => this.waxml.start(`.${className}`)));

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
			
			
			Array.from(xmlNode.children).forEach(childNode => {
				slidersAdded = this.XMLtoSliders(childNode, subEl) || slidersAdded;
			});
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

}


module.exports = GUI;






},{"./Mapper.js":15,"./WebAudioUtils.js":28}],9:[function(require,module,exports){



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

},{}],10:[function(require,module,exports){
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
},{"./HL1.js":9}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){

var EventTracker = require('./EventTracker.js');
var VariableContainer = require('./VariableContainer.js');
var WebAudioUtils = require('./WebAudioUtils.js');
var XY_area = require('./XY_area.js');
var XY_handle = require('./XY_handle.js');
var Variable = require("./Variable.js");
var KeyboardManager = require("./KeyboardManager.js");
var MidiManager = require("./MidiManager.js");


class InteractionManager {

	constructor(waxml){
		this.defineCustomElements();

		

		let initCall = e => {
			this.waxml.init();
			window.removeEventListener("pointerdown", initCall);
		}
		window.addEventListener("pointerdown", initCall);

		this.eventTracker = new EventTracker();
		this.waxml = waxml;
		this.inited = false;
		this.variables = new VariableContainer();

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
			this.connectToHTMLelements();
			this.keyboardManager = new KeyboardManager(this.waxml);
			this.midiManager = new MidiManager(this.waxml);
		});

	}

	defineCustomElements(){
		customElements.define('waxml-xy-area', XY_area);
		customElements.define('waxml-xy-handle', XY_handle);
	}


	init(){
		this.inited = true;
		this.waxml.init();

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
		// this.waxml.querySelectorAll("[start]:not([start=''])").forEach((obj, i) => {
		// 	let trigData = WebAudioUtils.split(obj.parameters.start);
		// 	let trigSelector = trigData[0];

		// 	if(trigSelector){
		// 		trigSelector = trigSelector.replace("/", "\\/");
		// 		document.querySelectorAll(trigSelector).forEach((el, i) => {
		// 			let trigEventName = trigData[1] || "pointerdown";
		// 			el.addEventListener(trigEventName, e => obj.start());
		// 		});

		// 		if(obj.parameters.stop){
		// 			let releaseData = WebAudioUtils.split(obj.parameters.stop);
		// 			let releaseSelector = releaseData[0];
		// 			if(releaseSelector){
		// 				document.querySelectorAll(releaseSelector).forEach((el, i) => {
		// 					let releaseEventName = releaseData[1] || "pointerup";
		// 					el.addEventListener(releaseEventName, e => obj.stop());
		// 				});
		// 			}
		// 		}
		// 	}
		// });

		// this.waxml.querySelectorAll("[release]:not([release=''])").forEach((obj, i) => {
		// 	let trigData = WebAudioUtils.split(obj.parameters.trig);
		// 	let selector = trigData[0];
		// 	let eventName = trigData[1] || "click";
		// 	if(selector){
		// 		document.querySelectorAll(selector).forEach((el, i) => {
		// 			el.addEventListener(eventName, e => obj.stop());
		// 		});
		// 	}
		// });


		// add waxml commands to HTML elements
		[...document.querySelectorAll("*")].forEach( el => {

			[...el.attributes].forEach( attr => {
				if(attr.localName.startsWith("data-waxml-")){

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
					
					if(val.includes("this.")){
						let targetProperty = val.replace("this", "el");
						val = {
							valueOf: () => {
								return eval(targetProperty);
							}
						}
					} else {
						let floatVal = parseFloat(val);
						if(!Number.isNaN(floatVal)){
							val = floatVal;
						}
					}
					

					let fn;
					let attrNameArr = attr.localName.split("-");
					if(attrNameArr.length == 3){
						// insert default click event
						attrNameArr.splice(2, 0, "click");
					}

					let eventName = attrNameArr[2];
					let commandName = attrNameArr[3];

					switch(commandName){
						case "start":
						case "play":
							fn = e => this.waxml.start(val);
							break;

						case "stop":
							fn = e => this.waxml.stop(val);
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
				}
			});

		});


		// add waxml commands to HTML input and waxml-xy-handle elements
		let filter = "[data-waxml-target]:not([data-waxml-target=''])";
		[...document.querySelectorAll(`input${filter}, waxml-xy-handle${filter}`)].forEach( el => {
			let targets = el.dataset.waxmlTarget.split(",");
			// remove dollar sign from variables
			
			el.addEventListener("input", e => {
				// double parenthesis allows for single values (sliders)
				// and double values (XY-handles)
				let values = e.target.value;
				values = values instanceof Array ? values : [values];
				targets.forEach((target, i) => {
					target = target.split("$").join("").trim();
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

	setDeviceMotion(e){}

	setDeviceOrientation(e){
		this._variables.alpha = e.alpha;
		this._variables.beta = e.beta;
		this._variables.gamma = e.gamma;
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

	getSequence(name="_storedGesture"){
		return this.eventTracker.getSequence(name);
	}


	get variables(){
		return this._variables;
	}
	set variables(val){
		this._variables = this._variables || val;
	}

	setVariable(key, val, transistionTime){
		// 2022-03-23
		// This is really bad design. There is a global layer of "invisible"
		// variable objects stored in this._variables and there are global
		// variable objects created by XML stored in this.waxml.master.variables
		// These really ought to be the same container, but for now, they aren't...
		
		let container;
		if(this.waxml.master && this.waxml.master.variables[key] instanceof Variable){
			container = this.waxml.master.variables;
		} else if(this._variables[key] instanceof Variable){
			container = this._variables;
		}
		if(container){
			if(transistionTime){
				// override transitionTime if specified
				container[key].setValue(val, transistionTime);
			} else {
				container[key].value = val;
			}
			
		} else {
			this._variables[key] = val;
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

},{"./EventTracker.js":7,"./KeyboardManager.js":13,"./MidiManager.js":16,"./Variable.js":24,"./VariableContainer.js":25,"./WebAudioUtils.js":28,"./XY_area.js":29,"./XY_handle.js":30}],13:[function(require,module,exports){


class KeyboardManager {

	constructor(waxml){

		document.addEventListener("keydown", e => this.keyDown(e));
		document.addEventListener("keyup", e => this.keyUp(e));
		this.keysPressed = {};
		this.waxml = waxml;
	}

	keyDown(e){
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
		}
		
	}

	keyUp(e){
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
		}

		
	}

}

module.exports = KeyboardManager;

},{}],14:[function(require,module,exports){
const InteractionManager = require("./InteractionManager");



	
class Loader {
	init(src){
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
		new Loader().init(src)
			.then(response => response.arrayBuffer())
			.then(arrayBuffer => ctx.decodeAudioData(arrayBuffer,
				audioBuffer => {
					resolve(audioBuffer);
				},
				e => {
					let errMess = "WebAudioXML error. File not found: " + src;
					console.error(errMess);
					reject(errMess);
				}
			));
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

},{"./InteractionManager":12}],15:[function(require,module,exports){
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
		this.isNumeric = this.mapout ? this.mapout.every(element => typeof element.valueOf() === 'number') : true;
	}

	printInfo(params){
		if(params.mapin && params.mapout){
			let mapin = `${Math.min(...params.mapin)}...${Math.max(...params.mapin)}`;
			let mapout = `${Math.min(...params.mapout)}...${Math.max(...params.mapout)}`;
			console.log(`${params.name} -> mapin: ${mapin}, mapout: ${mapout}`);
		}
	}

	getValue(x){

		// truncate x if needed
		if(typeof x == "undefined")return x;

		switch(typeof x){
			case "undefined":
			return x;
			break;

			case "string":
			let i = this.mapin.indexOf(x);
			if(i == -1){
				return 0;
			} else {
				x = this.mapout[i];
				x = this.convert(x, i);
				return x;
			}
			break;

			default:
			x = x.valueOf();
			x = this.mapin ? Math.max(x, Math.min(...this.mapin)) : x;
			x = this.mapin ? Math.min(x, Math.max(...this.mapin)) : x;
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

		return x;

  	}

	inToMapInIndex(x){

		let e = this.mapin.filter(entry => entry <= x).pop();
		let i = this.mapin.indexOf(e);
		return i;
	}

	inToMapOutIndex(x, i){
		// let e = this.mapin.filter(entry => entry <= x).pop();
		// let i = this.mapin.indexOf(e);

		if(this.mapout.length > this.mapin.length && i+2 == this.mapin.length){
			// more out-values than in-values and this is the next to last in-value
		
			// pick an out-value from the range between next to last and last in value
			let outValues = this.mapout.filter((val, index) => index >= i);
			let len = outValues.length-1;
			let x2 = x * len; // / Math.max(...this.mapin);
			i += Math.floor(x2);
			x = x == 1 ? x : x2 % 1;
		} else if(this.mapout.length >= this.mapin.length && i+1 == this.mapin.length){
			// last mapin-value is mapped to last mapout-value
			i = this.mapout.length-1;
			x = 0;
		} else {
			// if(i+2 >= this.mapout.length){
			// match in to out values
			i = i % this.mapout.length;
		}
		return {i:i,x:x};
	}

	in2Rel(x, i){
		let in1 = this.mapin[i % this.mapin.length];
		let in2 = this.mapin[(i+1) % this.mapin.length];
		return (x-in1)/(in2-in1);
	}

	rel2Out(x, i){
		if(this.isNumeric){
			// interpolate between two in-values

			if(this.steps){
				let curSteps = this.steps[i % this.steps.length];
				if(curSteps instanceof Array){
					return this.applySteps(x, i, curSteps);
				}
			}

			let out1 = this.mapout[i % this.mapout.length];
			let out2 = this.mapout[(i+1) % this.mapout.length];

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
			return this.mapout[i % this.mapout.length];
		}
	}


	applySteps(x, i, steps){
			//let cycle = Math.floor(noteOffs / obj.stepsCycle);
			//let noteInCycle = noteOffs % obj.stepsCycle;


		if(steps instanceof Array){
			let out1 = this.mapout[i % this.mapout.length];
			let out2 = this.mapout[(i+1) % this.mapout.length];
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
		if(this.isNumeric){
			return x + this.mapout[i % this.mapout.length];
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

},{"./Range.js":20,"./WebAudioUtils.js":28}],16:[function(require,module,exports){

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
				console.error('Could not access your MIDI devices.');
			});
		} else {
			console.error('WebMIDI is not supported in this browser.');
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
},{}],17:[function(require,module,exports){

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


},{}],18:[function(require,module,exports){
var BufferSourceObject = require('./BufferSourceObject.js');
var ConvolverNodeObject = require('./ConvolverNodeObject.js');


class ObjectBasedAudio {

	constructor(obj, params, waxml){
        params.panningModel = params.panningModel || "HRTF";
        this._params = params;
        this._ctx = obj._ctx;
		this._parentAudioObj = obj;

        this.input = new GainNode(this._ctx);
        this.pannerNode = new PannerNode(this._ctx, params);
        this.send = new GainNode(this._ctx);
        this.output = new GainNode(this._ctx);

        this.input.connect(this.pannerNode);   
        this.pannerNode.connect(this.send)
        this.pannerNode.connect(this.output);

        if(params.src){
            this.bufferSource = new BufferSourceObject(this, params);
            this.bufferSource.connect(this.pannerNode);
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
        return this.pannerNode.positionX;
    }
    set positionX(val){
        this._params.positionX = val;
        this.pannerNode.positionX.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    get positionY(){
        if(typeof this._params.positionY == "undefined"){
            this._params.positionY = this.pannerNode.positionY;
        }
        return this.pannerNode.positionY;
    }
    set positionY(val){
        this._params.positionY = val;
        this.pannerNode.positionY.setTargetAtTime(val, this._ctx.currentTime, this.getParameter("transitionTime"));
    }

    get positionZ(){
        if(typeof this._params.positionZ == "undefined"){
            this._params.positionZ = this.pannerNode.positionZ;
        }
        return this.pannerNode.positionZ;
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
        return this.output.gain;
    }
     
    connect(destination){
        this.output.connect(destination);
        return destination;
    }
	
    start(){

        if(this.bufferSource._buffer){
            this.bufferSource.start();
        } else {
            let fn = () => this.start();
            this.bufferSource.addCallBack(fn);
        }
    }

    stop(){
        if(this.bufferSource)this.bufferSource.stop();
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
	    
}

module.exports = ObjectBasedAudio;

},{"./BufferSourceObject.js":3,"./ConvolverNodeObject.js":5}],19:[function(require,module,exports){

var WebAudioUtils = require('./WebAudioUtils.js');
var Loader = require('./Loader.js');
var AudioObject = require('./AudioObject.js');
var Variable = require('./Variable.js');
var Envelope = require('./Envelope.js');
var Watcher = require('./Watcher.js');
var Synth = require('./Synth.js');



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
					// embedded <XML> element inside HTML
					this.parseXML(this._xml);
					this._xml.style.display = "none";
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
					.then(xmlNode => {
						// snyggare att lyfta ut audio-in till en egen class 
						if(this.allElements.mediastreamaudiosourcenode){
							navigator.getUserMedia({audio: true}, stream => this.onStream(stream), error => this.onStreamError(error));
						}
						// return root <Audio> element
						return resolve(this._xml.firstElementChild);
					});
				}
			} else {
				console.error("No WebAudioXML source specified");
			}

		});

	}

	onStream(stream){
		this.allElements.mediastreamaudiosourcenode.forEach(inputNode => inputNode.obj.initStream(stream));
	}

	onStreamError(){
		console.warn("Audio input error");
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

	appendXMLnode(parentNode, curNode, localPath){

		parentNode = parentNode.appendChild(curNode);

		return new Promise((resolve, reject) => {
			
			let cnt = curNode.children.length;

			if(curNode.localName == "include"){
				let href = curNode.getAttribute("href");
				this.linkExternalXMLFile(curNode, href, localPath)
				.then(xmlNode => {
					return resolve(xmlNode);
				});
			} else if(cnt){

				
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
						} else {
							fileName = attr.value;
						}
						Loader.loadText(localPath + fileName)
						.then(txt => {
							if(attr.value.includes(".js")){
								if(fnCallIncluded){
									// execution of external function is included in the 
									// attribute (including (optional) arguments)
									attr.value = eval(`(${txt})(${args})`);
								} else {
									let fn = eval(txt);
									attr.value = fn instanceof Function ? fn() : "";
								}
							} else {
								attr.value = txt;
							}
							
							if(!--cnt){
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
									// Det är ganska dumt att den här kopplingen 
									// är skriven i parsern
									// Det borde ligga i object-klassen
									if(typeof time == "undefined"){
										time = xmlNode.obj.getParameter("transitionTime");
									}
									switch(key){
										case "mix":
										xmlNode.obj[key] = val;
										break;

										default:
										xmlNode.obj.setTargetAtTime(key, val, 0, time);
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

			case "envelope":
			xmlNode.obj = new Envelope(xmlNode, this.waxml, params);
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

	get XMLstring(){
		return this._XMLstring;
	}
}



module.exports = Parser;

},{"./AudioObject.js":2,"./Envelope.js":6,"./Loader.js":14,"./Synth.js":22,"./Variable.js":24,"./Watcher.js":26,"./WebAudioUtils.js":28}],20:[function(require,module,exports){
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

},{"./WebAudioUtils.js":28}],21:[function(require,module,exports){



class Sequence {

	constructor(eventTracker, name, events = []){
		this._eventTracker = eventTracker;
		this._name = name;
		this._eventTypes = [];
		this._events = events;
		this._timeouts = [];
	}

	allEvents(filter = []){
		return this.events(0, this._events.length, filter);
	}

	events(start = 0, end, filter = [], variableFilter = []){

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

		let newEventList = [];
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


module.exports = Sequence;

},{}],22:[function(require,module,exports){

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

},{"./Trigger.js":23,"./Watcher.js":26,"./WebAudioUtils.js":28}],23:[function(require,module,exports){



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

},{}],24:[function(require,module,exports){
// var Watcher = require('./Watcher.js');
var Mapper = require('./Mapper.js');
var WebAudioUtils = require('./WebAudioUtils.js');


class Variable {

	constructor(xmlNode, params){
		this._params = params;
		this._callBackList = [];
		this.waxml = params.waxml;
		this.lastUpdate = 0;
		this._polarity = 0;
		this._derivative = 0;
		this._derivativePolarity = 0;
		this._derivative2 = 0;
		this._derivative2Polarity = 0;
		this._xml = xmlNode;
		this.name = params.name;

		this.derivativeValues = [0];
		// this.derivative2Values = [0];
		this.smoothDerivative = 2;


		this._mapper = new Mapper(params);
		this.scheduledEvents = [];

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
		if(typeof params.default != "undefined"){
			this.value = params.default;
		} else if(typeof params.value != "undefined"){
			this.value = params.value.valueOf();
		}

		// setInterval(e => {
		// 	console.log(this.name, this.mappedValue, this.derivative, this.derivative2);
		// }, 500);
		
	}

	addCallBack(callBack, prop){
		this._callBackList.push({callBack: callBack, prop: prop});
		if(typeof this.value != "undefined"){
			callBack(this[prop]);
		}
	}

	valueOf(){
		return this.value;
	}

	setValue(val, transistionTime){

		if(this._value != val){
			// this.setDerivative(val);

			let now = this.time;

			this._value = val;
			this.mappedValue = this._mapper.getValue(this._value);

			if(typeof this.lastMappedValue == "undefined"){
				this.lastMappedValue = this.mappedValue;
				this.lastUpdate = now;
			} else {
				let diff = this.mappedValue - this.lastMappedValue;
				this.lastMappedValue = this.mappedValue;
				
				let time = 1; // now - this.lastUpdate;
			
				if(time){
					if(diff >= 0 && this._polarity <= 0){
						this._polarity = 1;
						this.broadCastEvent("trough");
						this.broadCastEvent("polarityChange");
					} else if(diff <= 0 && this._polarity >= 0){
						this._polarity = -1;
						this.broadCastEvent("crest");
						this.broadCastEvent("polarityChange");
					}


					let newDerivative = diff; // / time;
					this.lastUpdate = now;
	
					let lastAVG = this._derivative;
					let newAVG = this.setDerivative(newDerivative);

					this._derivative = newAVG;
					
					this._derivative2 = newAVG - lastAVG;

					// this._derivative2 = newDerivative - this._derivative;
					// this._derivative = newDerivative;
				}
				
				// this._derivative = newDerivative;
			}


			this.doCallBacks(transistionTime);
		}
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

	setDerivative(val){
		if(isNaN(val)){
			console.log(`setDerivative(${val})`);
		}
		this.derivativeValues.push(val);
		if(this.derivativeValues.length > this.smoothDerivative){
			this.derivativeValues.shift();
		}
		return this.average(this.derivativeValues);
	}

	get derivative(){
		return this.average(this.derivativeValues);
		// return this._derivative || 0;
	}

	get derivative2(){
		// return this.average(this.derivative2Values);
		return this._derivative2 || 0;
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
			return Date.now();
		}
	}

	broadCastEvent(eventName){
		if(this._xml){
			let selector = `[start="${this.name}.${eventName}"]`;
			this._xml.parentElement.querySelectorAll(selector).forEach(xmlNode => {
				xmlNode.obj.start();
			});
		}
		
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
		return this._params.default ? this._params.default : 1;
	}

	get defaultValue(){
		return this.default;
	}

	doCallBacks(transistionTime){
		this._callBackList.forEach(obj => {
			obj.callBack(this[obj.prop], transistionTime);
		});
	}

	getVariable(key){
		return this[key];
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

}

module.exports = Variable;

},{"./Mapper.js":15,"./WebAudioUtils.js":28}],25:[function(require,module,exports){



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

},{}],26:[function(require,module,exports){
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
					return variableObj.value;
					return this._props[variable].value;
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
	
					// support comma separated array
					let me = this; // this is undefined inside forEach:eval
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

},{"./Variable.js":24,"./WebAudioUtils.js":28}],27:[function(require,module,exports){
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

var version = "1.0.7";


var WebAudioUtils = require('./WebAudioUtils.js');
var Parser = require('./Parser.js');
var Connector = require('./Connector.js');
var GUI = require('./GUI.js');
var InteractionManager = require('./InteractionManager.js');
var ConvolverNodeObject = require('./ConvolverNodeObject.js');
var Variable = require('./Variable.js');
var InputBusses = require('./InputBusses.js');




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

					console.log("WebAudioXML is installed. Version " + version);
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

		this.audioInited = false;
		this.parser = new Parser(this);

		this.inputBusses = new InputBusses(_ctx);

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

		this.ui = new InteractionManager(this);


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
		this.master.fadeOut(0.1);
	}

	unmute(){
		this.master.fadeIn(0.1);
	}

	getXMLString(){
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
		new Connector(xmlDoc, this._ctx);
		this.plugins.forEach(plugin => {
			plugin.init();
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

	getInputBus(selector){
		let destinations = [];
		this.querySelectorAll(selector).forEach(obj => {
			destinations.push(obj.input);
		});
		return this.inputBusses.getBus(selector, destinations);
	}

	start(selector, options){

		if(!selector){
			selector = "*";
		} else if(!(selector.includes("#") || selector.includes(".") || selector.includes("["))){
			selector = `*[start='${selector}']`;
		}
		if(this._ctx.state != "running"){
			this.init();
		}
		this._xml.querySelectorAll(selector).forEach(XMLnode => {
			if(XMLnode.obj.start){
				XMLnode.obj.start(options);
			} else if(XMLnode.obj.noteOn){
				XMLnode.obj.noteOn(options);
			}
		});
		
	}

	trig(selector, options){
		if(!this._xml){return}

		this._xml.querySelectorAll(`*[trig='${selector}'],*[noteon='${selector}'],*[start='${selector}']`).forEach(XMLnode => {
			if(XMLnode.obj.start){
				XMLnode.obj.start(options);
			} else if(XMLnode.obj.noteOn){
				XMLnode.obj.noteOn(options);
			}
		});
	}
	

	release(selector, options){
		if(!this._xml){return}
		
		this._xml.querySelectorAll(`*[noteoff='${selector}'], *[stop='${selector}']`).forEach(XMLnode => {
			if(XMLnode.obj.stop){
				XMLnode.obj.stop(options);
			} else if(XMLnode.obj.noteOff){
				XMLnode.obj.noteOn(options);
			}
		});
	}

	stop(selector, options){
		this.release(selector, options);
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

	addEventListener(name, fn){
		if(typeof name !== "string"){return}
		if(typeof fn !== "function"){return}
		this._listeners[name] = this._listeners[name] || [];
		this._listeners[name].push(fn);
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

	setVariable(key, val, transitionTime){

		// move to a separate object
		// read transitionTime
		let xTime = transitionTime
		if(this._xml){
			xTime = xTime || this._xml.obj.getParameter("transitionTime");
		}
		xTime = xTime || 0.001;

		let floatVal = parseFloat(val);
		if(typeof floatVal == "number"){
			let listener = this._ctx.listener;
			switch(key){
				case "positionx":
				listener.positionX.setTargetAtTime(floatVal, 0, xTime);
				break;
				case "positiony":
				listener.positionY.setTargetAtTime(floatVal, 0, xTime);
				break;
				case "positionz":
				listener.positionZ.setTargetAtTime(floatVal, 0, xTime);
				break;
	
				case "forwardx":
				listener.forwardX.setTargetAtTime(floatVal, 0, xTime);
				break;
				case "forwardy":
				listener.forwardY.setTargetAtTime(floatVal, 0, xTime);
				break;
				case "forwardz":
				listener.forwardZ.setTargetAtTime(floatVal, 0, xTime);
				break;
	
				case "upx":
				listener.upX.setTargetAtTime(floatVal, 0, xTime);
				break;
				case "upy":
				listener.upY.setTargetAtTime(floatVal, 0, xTime);
				break;
				case "upz":
				listener.upZ.setTargetAtTime(floatVal, 0, xTime);
				break;
			}
			if(val == floatVal){val = floatVal}
		}
		
		this.ui.setVariable(key, val, transitionTime);

		// this REALLY need to be worked through
		// at the moment I just pass the variable "hand_r8y"
		if(key == "hand_r8y"){
			this.plugins.forEach(plugin => {
				if(plugin.setVariable){
					plugin.setVariable(key, val);
				}
			});
		}
		
	}
	getVariable(key){
		return this.ui.getVariable(key);
	}

	// InteractionManager
	get lastGesture(){
		return this.ui.lastGesture;
	}

	addSequence(events, name){
		this.ui.addSequence(events, name);
	}

	getSequence(name){
		return this.ui.getSequence(name);
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
		this._xml.querySelectorAll(selector).forEach(xml => {
			let audioObject = xml.obj;
			arr.push(xml.obj);
		});
		return arr;
	}
	querySelector(selector){
		let xml = this._xml.querySelector(selector);
		if(xml){
			return xml.obj;
		}
		return -1;
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

}

WebAudio.prototype.noteOn = WebAudio.prototype.trig;
WebAudio.prototype.noteOff = WebAudio.prototype.release;
WebAudio.prototype.stop = WebAudio.prototype.release;



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

},{"./Connector.js":4,"./ConvolverNodeObject.js":5,"./GUI.js":8,"./HL2.js":10,"./InputBusses.js":11,"./InteractionManager.js":12,"./Parser.js":19,"./Variable.js":24,"./WebAudioUtils.js":28}],28:[function(require,module,exports){

class WebAudioUtils {



}

var rxp = /[$][{]([a-z0-9:_]+)[}]|[$]([a-z0-9:_.]*)|var[(]([a-z0-9:_]+)[)]/gi;
var rxpVal = /([a-z0-9:_\+\-\$\*\/\ \.]+)/gi;
var ENVrxp = /[€]([a-z0-9:_.]*)/gi;


WebAudioUtils.rxp = rxp;
WebAudioUtils.rxpVal = rxpVal;

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
			
		
		value = parseFloat(value);
		break;


		case "maxDelayTime":
		value = parseFloat(value) || 1;
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

		default:
		floatVal = parseFloat(value);
		if(!Number.isNaN(floatVal)){
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
WebAudioUtils.split = (str, separator) => {
	if(typeof str != "string"){
		console.log(str);
	}
	separator = separator || str.includes(";") ? ";" : str.includes(",") ? "," : " ";
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

WebAudioUtils.wrapExpression = (str = "", q = '"') => {
	if(typeof str != "string"){return 0};	

	return str.replaceAll(rxpVal, a => parseFloat(a) == a ? a : a == " " ? "" : q + a + q);
}

WebAudioUtils.strToVariables = (str = "", callerNode, variableType) => {
	// regExp
	// ${x} || var(x) -> this.getVariable(x)
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

module.exports = WebAudioUtils;

},{}],29:[function(require,module,exports){


class XY_area extends HTMLElement {

	constructor(){
		super();
		// this.style.backgroundColor = this.getAttribute("background-color") || "#555";

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
		this.style.display = "block"; // not good

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



	connectedCallback() {
	}
}

module.exports = XY_area;

},{}],30:[function(require,module,exports){



class XY_handle extends HTMLElement {

	constructor(){
		super();
		this.style.position = "absolute";
		this.style.minWidth = this.getAttribute("width") || this.getAttribute("size")  || "20px";
		this.style.minHeight = this.getAttribute("height") || this.getAttribute("size") || "20px";
		this.style.backgroundColor = this.getAttribute("background-color") || "#555";
		this.style.border = "2px solid black";
		this.style.boxSizing = "border-box";
		this.style.borderRadius = parseFloat(this.style.minWidth) / 2 + "px";
		this.style.fontFamily = "sans-serif";
		this.style.textAlign = "center";
		this.style.verticalAlign = "middle";
		this.style.lineHeight = "1.3em";
		this.style.padding = "3px";
		this.style.cursor = "pointer";

		// ensure that the XY_area has a specified position
		this.parentElement.style.position = this.parentElement.style.position || "relative";

		this.initRects();

		let dir = this.getAttribute("direction");
		this.direction = {
			x: dir.includes("x"),
			y: dir.includes("y")
		}



		let x =  this.getAttribute("x") || 0;
		let y = this.getAttribute("y") || 0;

		this.x = parseFloat(x);
		this.y = parseFloat(y);

		this.move(this.x, this.y);



		this.addEventListener("pointerdown", e => {
			this.initRects();
			this.dragged = true;
			this.clickOffset = {x: e.offsetX, y:e.offsetY};
			this.setPointerCapture(e.pointerId);
		}, false);

		this.addEventListener("pointerup", e => {
			this.dragged = false;
		}, false);

		this.addEventListener("pointermove", e => {
			//event.preventDefault();
			if(this.dragged){

				if(this.direction.x){
					let x = e.clientX-this.clickOffset.x-this.boundRect.left;
					x = Math.max(0, Math.min(x, this.boundRect.width));
					this.x = x / this.boundRect.width;
					this.style.left = `${x}px`;
				}

				if(this.direction.y){
					let y = e.clientY-this.clickOffset.y-this.boundRect.top;
					y = Math.max(0, Math.min(y, this.boundRect.height));
					this.y = y / this.boundRect.height;
					this.style.top = `${y}px`;
				}
				this.dispatchEvent(new CustomEvent("input"));
			}
		}, false);

		this.style.touchAction = "none";

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

	get value(){
		if(this.direction.x && this.direction.y){
			return [this.x, this.y];
		} else if(this.direction.x){
			return this.x;
		} else if(this.direction.y){
			return this.y;
		}
		
	}

	set value(point){
		this.x = Math.max(0, Math.min(1, point.x));
		this.y = Math.max(0, Math.min(1, point.y));
	}

	initRects(){

		this.rect = this.getBoundingClientRect();
		let br = this.parentNode.getBoundingClientRect();
		this.boundRect = {
			left: br.left,
			top: br.top,
			width: br.width - this.rect.width,
			height: br.height - this.rect.height
		};
	}

	move(x, y){
		if(this.direction.x)this.style.left = x * this.boundRect.width + "px";
		if(this.direction.y)this.style.top = y * this.boundRect.height + "px";
	}
	connectedCallback() {

	}
}

module.exports = XY_handle;

},{}]},{},[27]);
