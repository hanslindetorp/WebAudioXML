(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

var WebAudioUtils = require('./WebAudioUtils.js');
var Loader = require('./Loader.js');
var Watcher = require('./Watcher.js');
var VariableContainer = require('./VariableContainer.js');
var Variable = require('./Variable.js');
var Mapper = require('./Mapper.js');



class AudioObject{

  	constructor(xmlNode, waxml, localPath, params){

	  	this.waxml = waxml;
	  	let _ctx = this.waxml._ctx;

	  	this._params = params;
      this.variables = new VariableContainer();
	  	this._xml = xmlNode;
	  	let timeUnit = this.getParameter("timeunit");

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


	  	switch(nodeType){


		  	case "analysernode":
		  	this._node = this._ctx.createAnalyser();
		  	break;


		  	case "audiobuffersourcenode":
		  	// just a temporary node
		  	this._node = this._ctx.createBufferSource();
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



			  	src = Loader.getPath(src, this._localPath);
			  	var node = this._ctx.createConvolver();
			  	this._node = node;



			  	/*
			  	let request = new XMLHttpRequest();
				request.open('GET', src, true);
				request.responseType = 'arraybuffer';


				request.onload = function() {
			        // decode the buffer into an audio source
			        _ctx.decodeAudioData(request.response, function(audioBuffer) {
			          if (buffer) {
			          	// store all buffers in buffers
			            //buffers[obj.url] = buffer;
			            //returnObj.duration = buffer.duration;
			            // store reference in this object
			            // obj.buffer = buffer;
			            node.buffer = audioBuffer
			            //console.log(obj.url + " loaded. offset: " + obj.offset);
			            //callBack(returnObj);

			          }
			        }, function(){
			        	console.error('File "' + src + '" could not be decoded');
			        	//buffers[obj.url] = -1;
			        	//callBack();
			        });
			     };
			     request.onerror = function() {
			          console.error('File "' + src + '" could not be loaded');
			          //buffers[obj.url] = -1;
			          //callBack();
			     };

				request.send();


			  	*/



			  	fetch(src) // "https://cors-anywhere.herokuapp.com/" + src
			        .then(response => response.arrayBuffer())
			        .then(arrayBuffer => this._ctx.decodeAudioData(arrayBuffer,
			        	audioBuffer => this._node.buffer = audioBuffer,
			        	e => console.error("WebAudioXML error. File not found: " + src)
			        ));

		  	}

		  	break;

		  	case "delaynode":
		  	if(this._params.maxDelayTime){
			  	this._node = this._ctx.createDelay(this._params.maxDelayTime * this._params.timescale);
		  	} else {
			  	this._node = this._ctx.createDelay();
		  	}

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
        break;

        case "pannernode":
        this._node = this._ctx.createPanner();
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

        var k = 400,
          n_samples = 44100,
          curve = new Float32Array(n_samples),
          deg = Math.PI / 180,
          i = 0,
          x;
        for ( ; i < n_samples; ++i ) {
          x = i * 2 / n_samples - 1;
          curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
        }
        this._node.curve = curve;
        this._node.oversample = '4x';
		  	break;

		  	case "periodicwavenode":
		  	break;

		  	case "iirfilternode":
		  	break;

        case "audioworkletnode":
        src = this._params.src;
        if(src){
          let processorName = src.split(".").shift().split("/").pop();
          if(this._ctx.audioWorklet){
            this._ctx.audioWorklet.addModule(src)
            .then(e =>{
              this._node = new AudioWorkletNode(this._ctx, processorName);
              this._node.connect(this._destination);
            });
          } else {
            console.error("WebAudioXML error. No support for AudioWorkletNode");
          }
          // temporary
          this._node = this._ctx.createGain();
        }
        break;

		  	case "xml":
		  	break;

		  	case "audio":
        case "gainnode":
        case "mixer":
        case "voice":
		  	this._node = this._ctx.createGain();
		  	break;

        case "send":
		  	//this.input = this._ctx.createGain();
		  	this._node = this._ctx.createGain();
        //this.input.connect(this._node);
        break;

		  	case "chain":
		  	this.input = this._ctx.createGain();
		  	//console.log("chain input", this.input.__resource_id__);
		  	this._node = this._ctx.createGain();
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
        // these should really be separate classes!
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
            parentAudioObj._params[nodeType] = this._params.value;
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
                callBack: val => {

      						val = this.mapper.getValue(val);
                  let time = 0;

      						switch(targetName){
      							case "delayTime":
      							val *= this._params.timescale;
      							break;

                    case "frequency":
                    if(parentAudioObj){
                      if(parentAudioObj._nodeType.toLowerCase() == "oscillatornode"){
                        time = this.getParameter("portamento") || 0;
                        time = this.getParameter("transitionTime") || time;
                        time *= this._params.timescale;
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
        Object.entries(this._params).forEach(entry => {
          const [key, value] = entry;
          if(typeof this[key] !== "function"){

            if(WebAudioUtils.nrOfVariableNames(value)){
              new Watcher(xmlNode, value, {
                waxml: this.waxml,
                containsVariableNames: true,
                callBack: val => {
                  let time = 0;
                  switch(key){
                    case "delayTime":
                    val *= this._params.timescale;
                    break;

                    case "frequency":
                    if(this.parent){
                      if(this.parent._nodeType.toLowerCase() == "oscillatornode"){
                        time = this.getParameter("portamento") || 0;
                        time = this.getParameter("transitionTime") || time;
                        time *= this._params.timescale;
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
            }

            // varning!! Super dangerous feature. Must be changed
            // so that attributes don't overwrite any class functions
            // typeof this[key] !== "function" was added to save from
            // a disaster
            let v = this._params[key].valueOf();
            if(typeof v !== "undefined")this[key] = v;
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
		  	if(this._xml.parentNode){
			  	if(this._xml.parentNode.audioObject){
				  	return this._xml.parentNode.audioObject.getParameter(paramName);
			  	} else {
				  	return 0;
			  	}

		  	} else {
			  	return 0;
		  	}

	  	} else {
		  	return this._params[paramName];
	  	}
  	}


  	get connection(){
	  	return this._node;
  	}

  	get input(){

	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	case "audiobuffersourcenode":
        case "audioworkletnode":
		  	break;

		  	default:
		  	return this._input || this._node;
		  	break;
		  }

  	}

  	set input(node){
	  	this._input = node;
  	}


  	getParameterNode(param){
	  	if(!this._node){return}
      //if(param == "pan"){return this._node}
	  	return this._node[param];
  	}

  	disconnect(ch){
	  	if(!this._node){return}
	  	ch = ch || 0;
	  	this._node.disconnect(ch);
  	}

  	connect(destination){

	  	if(this._node){
		  	if(this._node.connect){
			  	destination = destination || this._ctx.destination;
			  	this._node.connect(destination);

		  	}
	  	}
	  	this._destination = destination;;

  	}


  	inputFrom(sourceObject){
	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	case "audiobuffersourcenode":
        case "audioworkletnode":
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


		  	case "audiobuffersourcenode":
		  	this._node = this._ctx.createBufferSource();
		  	this._node.buffer = this._buffer;

        this.loop = this._params.loop;
        if(this.loop){
          if(typeof this._params.loopEnd != "undefined"){
            this.loopEnd = this._params.loopEnd;
          }
          if(typeof this._params.loopStart != "undefined"){
            this.loopStart = this._params.loopStart;
          }
        }
        if(typeof this._params.playbackRate != "undefined"){
          this.playbackRate = this._params.playbackRate;
        }
		  	this._node.connect(this._destination);
		  	this._node.start();
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
		  	if(this._params.adsr){
          let fn = e => {
            this.setTargetAtTime(this._node, this._params.valuescale * 100, 0, this._params.adsr.attack * this._params.timescale, true);
  			  	this.setTargetAtTime(this._node, this._params.valuescale * this._params.adsr.sustain, this._params.adsr.attack * this._params.timescale, this._params.adsr.decay * this._params.timescale);
          }
          let delay = this.getParameter("delay");
          if(delay){
            setTimeout(fn, delay * this._params.timescale * 1000);
          } else {
            fn();
          }
		  	}
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
        //if(this._node.stop){this._node.stop()}
        this._node.disconnect();
        break;
	  	}
  	}




  	setTargetAtTime(param, value, delay, transitionTime, cancelPrevious){

	  	let startTime = this._ctx.currentTime + (delay || 0);
	  	//transitionTime = transitionTime || 0.001;
	  	//console.log(value, delay, transitionTime, cancelPrevious);

      // checking that value is OK (i.e. not undefined)
      if(!isFinite(value)){
        console.log("non-finite");
        return;
      }



      if(this._node){

        //  web audio parameter
        if(typeof param == "string"){
          // stupid code because Classes are not structured into
          // AudioNode, AudioParameter and WebAudioXML objects
          if(this._nodeType == param){
            param = this._node;
          } else {
            // some properties, like "coneInnerAngle" are not parameter objects but numbers
            if(typeof this._node[param] == "object"){
              param = this._node[param];
            } else {
              this._node[param] = value;
              return;
            }

          }
          if(!param){return}
        }
        //if(typeof param == "string"){param = this._node}
        //if(param.value == value){return}

  	  	if(cancelPrevious){
  		  	param.cancelScheduledValues(this._ctx.currentTime);
  	  	}
  	  	if(transitionTime){
  		  	param.setTargetAtTime(value, startTime, transitionTime);
  	  	} else {
  		  	param.setValueAtTime(value, startTime);
  	  	}

      } else {

        // javascript object
        if(param == "pan"){
            this._parentAudioObj.pan = value;
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
	  	this._src = path;

	  	switch(this._nodeType){

		  	case "oscillatornode":
		  	break;

		  	case "audiobuffersourcenode":
		  	let src = Loader.getPath(path, this._localPath);

		  	fetch(src)
		        .then(response => response.arrayBuffer())
		        .then(arrayBuffer => this._ctx.decodeAudioData(arrayBuffer,
		        	audioBuffer => {
			        	this._buffer = audioBuffer;
			        },
		        	e => console.error("WebAudioXML error. File not found: " + src)
		        ));


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
		  	return this._src;
		  	break;

		  	default:
		  	return false;
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
        this.setTargetAtTime("playbackRate", val);
      }
    }

    get playbackRate(){
      if(typeof this._params.playbackRate == "undefined"){
        this._params.playbackRate = his._node.playbackRate.value;
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
	  	this.setTargetAtTime("gain", val, 0, 0.001, true);
      //console.log(this._nodeType + ".gain = " + val);
  	}

  	get gain(){
	  	return this._node.gain.value;
  	}

  	set frequency(val){
  		this.setTargetAtTime("frequency", val);
  	}

  	get frequency(){
	  	return this._node.frequency.value;
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
					.then((response) => {
						return response.json();
					})
					.then((jsonData) => {
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

  	set pan(val){
      this._params.pan = val;
	  	if(this.parent.fakePanner){
			     this._parentAudioObj._node.setPosition(val, 0, 1-Math.abs(val));
/*
		  	this.setTargetAtTime(this.L.gain, 0.5-(val/2));
		  	this.setTargetAtTime(this.R.gain, 0.5+(val/2));
*/
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


    get coneInnerAngle(){
      if(typeof this._params.coneInnerAngle == "undefined"){
        this._params.coneInnerAngle = this._node.coneInnerAngle;
      }
      return this._params.coneInnerAngle;
    }
    set coneInnerAngle(val){
      this._params.coneInnerAngle = val;
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
      this.setTargetAtTime("coneOuterAngle", val);
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
      this.setTargetAtTime("positionX", val);
    }

    get positionY(){
      if(typeof this._params.positionY == "undefined"){
        this._params.positionY = this._node.positionY;
      }
      return this._params.positionY;
    }
    set positionY(val){
      this._params.positionY = val;
      this.setTargetAtTime("positionY", val);
    }

    get positionZ(){
      if(typeof this._params.positionZ == "undefined"){
        this._params.positionZ = this._node.positionZ;
      }
      return this._params.positionZ;
    }
    set positionZ(val){
      this._params.positionZ = val;
      this.setTargetAtTime("positionZ", val);
    }

    get refDistance(){
      if(typeof this._params.refDistance == "undefined"){
        this._params.refDistance = this._node.refDistance;
      }
      return this._params.refDistance;
    }
    set refDistance(val){
      this._params.refDistance = val;
      this.setTargetAtTime("refDistance", val);
    }

    get rolloffFactor(){
      if(typeof this._params.rolloffFactor == "undefined"){
        this._params.rolloffFactor = this._node.rolloffFactor;
      }
      return this._params.rolloffFactor;
    }
    set rolloffFactor(val){
      this._params.rolloffFactor = val;
      this.setTargetAtTime("rolloffFactor", val);
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

},{"./Loader.js":6,"./Mapper.js":7,"./Variable.js":13,"./VariableContainer.js":14,"./Watcher.js":15,"./WebAudioUtils.js":17}],2:[function(require,module,exports){


class Connector {

	constructor(xml, _ctx){

		this._xml = xml;
		this._ctx = _ctx;
		this.connect(xml);
	}



	connect(xmlNode){


		let nodeName = xmlNode.nodeName.toLowerCase();
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
						//case "send":
						case "oscillatornode":
						case "audiobuffernode":
						case "synth":
						break;

						case "send":
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

			case "parsererror":
			case "style":
			case "link":
			return;
			break;
		}


		let output = xmlNode.getAttribute("output");
		if(output){

			// connect to specified node within the scope of this (external) document
			let topElement = xmlNode.closest("[href$='.xml]") || this._xml;
			topElement.querySelectorAll(output).forEach(target => {
				xmlNode.audioObject.connect(target.audioObject.input);
			});

		} else {

			// connect in chain or mix

			let target;
			let parentNodeType = xmlNode.parentNode.nodeName.toLowerCase();

			switch (xmlNode.nodeName.toLowerCase()) {
				case "var":
					// don't connect
					break;
				default:
				// connect


				switch(parentNodeType){

					case "mixer":
					case "audio":
					case "voice":
					case "synth":
					xmlNode.audioObject.connect(xmlNode.parentNode.audioObject._node);
					break;

					case "chain":

					// run through following nodes to connect all
					// sends
					let targetNode = xmlNode;
					let done = false;

					while(!done){

						targetNode = targetNode.nextElementSibling;


						if(!targetNode){

							// connect last object to chain output
							done = true;
							targetNode = xmlNode.parentNode;
							xmlNode.audioObject.connect(targetNode.audioObject._node);
						} else {
							// stupid way of dealing with non-audio elements. But for now...
							if(targetNode.nodeName == "#text"){continue}

							done = targetNode.nodeName.toLowerCase() != "send";
							xmlNode.audioObject.connect(targetNode.audioObject.input);
						}


					}

					target = this.getNextInput(xmlNode);
					break;


					// connect to parameter input
					case "gain":
					xmlNode.audioObject.connect(xmlNode.parentNode.audioObject._node);
					break;

					default:
					xmlNode.audioObject.connect(this._ctx.destination);
					break;
				}
			}
		}
		Array.from(xmlNode.children).forEach(childNode => this.connect(childNode));

	}

	getNextInput(xmlNode){
		let nextSibling = xmlNode.nextElementSibling;
		if(nextSibling){
			if(nextSibling.audioObject.input){
				return nextSibling.audioObject.input;
			} else {
				return this.getNextInput(nextSibling);
			}
		} else {
			return xmlNode.parentNode.audioObject._node;
		}

	}
}




module.exports = Connector;

},{}],3:[function(require,module,exports){

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

		let targetEl;
		if(typeof target == "string"){
			targetEl = document.querySelector(target);
		}
		if(targetEl == null){
			//console.warn("WebAudioXML error: There is no interactionArea with selector " + target + ". Document will be used instead.");
			target = document;
		} else {
			target = targetEl;
		}

		let ev = this.getEventObject(name, execute, process, target);
		if(target.addEventListener){
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

},{"./Sequence.js":10}],4:[function(require,module,exports){

var Mapper = require('./Mapper.js');
var WebAudioUtils = require('./WebAudioUtils.js');


class GUI {

	constructor(xmlNode, targetElement){
		let el = this.parseXML(xmlNode, targetElement);
		el.classList.add("WebAudioXML");
	}


	parseXML(xmlNode, targetElement){

		let nodeName = xmlNode.nodeName.toLowerCase();


		switch(nodeName){
			case "link":
			case "style":
			case "parsererror":
			return;
			break;
		}


		let node = xmlNode.audioObject._node;

		let params = WebAudioUtils.getParameters(node);

		let el;

		if(params.length){

			el = document.createElement("div");

			el.className = nodeName;
			if(nodeName.substr(-4) == "node"){
				el.classList.add("node");
			}
			targetElement.appendChild(el);
			let title = document.createElement("header");
			title.innerHTML = nodeName;
			el.appendChild(title);

			params.forEach(param => this.addElement(node, el, param));
		} else {
			// attach child elements to the parent if this was not a node
			el = targetElement;
		}

		Array.from(xmlNode.children).forEach(childNode => this.parseXML(childNode, el));
		return el;
	}

	addElement(node, targetElement, param){

		let labelEl = document.createElement("label");
		let header = document.createElement("header");
		header.innerHTML = param.label;

		let el = document.createElement(param.nodeName);
		let output = document.createElement("span");
		output.className = "output";

		//Object.keys(param.attributes).forEach(key => el.setAttribute(key, param.attributes[key]));


		//el._attributes = param.attributes;

		labelEl.appendChild(header);
		labelEl.appendChild(el);
		labelEl.appendChild(output);
		targetElement.appendChild(labelEl);

		el.addEventListener("input", e => {
			let val = node.mapper.getValue(e.target.value);
			output.innerHTML = val;


			param.audioParam.setTargetAtTime(val, 0, 0.001);
		});
	}
}




module.exports = GUI;

},{"./Mapper.js":7,"./WebAudioUtils.js":17}],5:[function(require,module,exports){

var EventTracker = require('./EventTracker.js');
var VariableContainer = require('./VariableContainer.js');
var WebAudioUtils = require('./WebAudioUtils.js');
var XY_area = require('./XY_area.js');
var XY_handle = require('./XY_handle.js');

class InteractionManager {

	constructor(waxml){
		this.defineCustomElements();

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

		this.waxml.addEventListener("inited", e => this.connectToHTMLelements());

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
		this.waxml.querySelectorAll("[start]:not([start=''])").forEach((obj, i) => {
			let trigData = WebAudioUtils.split(obj.parameters.start);
			let trigSelector = trigData[0];

			if(trigSelector){
				document.querySelectorAll(trigSelector).forEach((el, i) => {
					let trigEventName = trigData[1] || "pointerdown";
					el.addEventListener(trigEventName, e => obj.start());
				});

				if(obj.parameters.stop){
					let releaseData = WebAudioUtils.split(obj.parameters.stop);
					let releaseSelector = releaseData[0];
					if(releaseSelector){
						document.querySelectorAll(releaseSelector).forEach((el, i) => {
							let releaseEventName = releaseData[1] || "pointerup";
							el.addEventListener(releaseEventName, e => obj.stop());
						});
					}
				}
			}
		});

		this.waxml.querySelectorAll("[release]:not([release=''])").forEach((obj, i) => {
			let trigData = WebAudioUtils.split(obj.parameters.trig);
			let selector = trigData[0];
			let eventName = trigData[1] || "click";
			if(selector){
				document.querySelectorAll(selector).forEach((el, i) => {
					el.addEventListener(eventName, e => obj.stop());
				});
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

	setVariable(key, val){
		this._variables[key] = val;
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

},{"./EventTracker.js":3,"./VariableContainer.js":14,"./WebAudioUtils.js":17,"./XY_area.js":18,"./XY_handle.js":19}],6:[function(require,module,exports){



	
class Loader {



	constructor(src, callBack){
		
		this.href = src;
		this.complete = false;
	
		if(src){
		  	fetch(src)
		  	.then(response => response.text())
		  	.then(xml => {
			  	let parser = new DOMParser();
			  	let xmlDoc = parser.parseFromString(xml,"text/xml");
			  	this.complete = true;
			  	callBack(xmlDoc.firstChild);
			})
	/*
			.catch((error) => {
				console.error('XML load error:', error);
			});
	*/
		} else {
			console.error("XML load error: No source specified.");
		}
	}
}


Loader.getPath = (url, localPath = "") => {
	
	let slash = "/";
	if(!localPath.endsWith(slash)){
		localPath += slash;
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
	return path.substring(0, i);
	
}


module.exports = Loader;

},{}],7:[function(require,module,exports){
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


	getValue(x){

		// truncate x if needed
		if(typeof x == "undefined")return x;
		
		x = x.valueOf();
		x = this.mapin ? Math.max(x, Math.min(...this.mapin)) : x;
		x = this.mapin ? Math.min(x, Math.max(...this.mapin)) : x;

		return this.mapValue(x);
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

		let i = 0;
		if(this.mapin){
			let e = this.mapin.filter(entry => entry <= x).pop();
			i = this.mapin.indexOf(e);

			x = this.in2Rel(x, i);
			x = this.applyCurve(x, i);
			x = this.rel2Out(x, i);
			x = this.offset(x, i);
		}

		x = this.convert(x, i);

		return x;

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
				if(curSteps){
					return this.applySteps(x, i, curSteps);
				}
			}

			let out1 = this.mapout[i % this.mapout.length];
			let out2 = this.mapout[(i+1) % this.mapout.length];
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


		if(steps){
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

},{"./Range.js":9,"./WebAudioUtils.js":17}],8:[function(require,module,exports){

var WebAudioUtils = require('./WebAudioUtils.js');
var Loader = require('./Loader.js');
var AudioObject = require('./AudioObject.js');
var Variable = require('./Variable.js');
var Watcher = require('./Watcher.js');
var Synth = require('./Synth.js');



class Parser {

	constructor(source, waxml, callBack){

		this.elementCount = {};
		this.followCount = {};
		this.allElements = {};

  	this.waxml = waxml;
  	let _ctx = this.waxml._ctx;

		this.callBack = callBack;
		this.externalFiles = [];
		this._ctx = _ctx;

		if(source){
			if(source.includes(".") || source.includes("#") || source == "xml"){
				// if check if XML is embedded in HTML
				let xml = document.querySelector(source);
				if(xml){
					this._xml = xml.firstElementChild;
				}

			}


			if(this._xml){
				this.parseXML(this._xml);
				this._xml.style.display = "none";
				this.checkLoadComplete();
			} else {

				let extFile = new Loader(source, XMLroot => {
					this._xml = XMLroot.parentNode.querySelector("Audio, audio");
					let localPath = Loader.getFolder(source) || location.href.substr(0,location.href.lastIndexOf("/")+1);
					this.parseXML(this._xml, localPath);
					this.checkLoadComplete();
				});
				this.externalFiles.push(extFile);
			}
		} else {
			console.error("No WebAudioXML source specified");
		}
	}

	checkLoadComplete(){
		let loading = this.externalFiles.find(file => file.complete == false);
		if(!loading){
			if(this.allElements.mediastreamaudiosourcenode){
				navigator.getUserMedia({audio: true}, stream => this.onStream(stream), error => this.onStreamError(error));
			}
			this.callBack(this._xml);
		}
	}


	onStream(stream){
		this.allElements.mediastreamaudiosourcenode.forEach(inputNode => inputNode.obj.initStream(stream));
	}

	onStreamError(){
		console.warn("Audio input error");
	}




	parseXML(xmlNode, localPath){

		let href = xmlNode.getAttribute("href");
		let nodeName = xmlNode.nodeName.toLowerCase();

		this.elementCount[nodeName] = this.elementCount[nodeName] ? this.elementCount[nodeName] + 1 : 1;
		this.allElements[nodeName] = this.allElements[nodeName] || [];
		this.allElements[nodeName].push(xmlNode);



		if(href && !xmlNode.loaded && nodeName != "link"){

			href = Loader.getPath(href, localPath);
			localPath = Loader.getFolder(href);

			// if this node is external	and not yet linked
			let extFile = new Loader(href, externalXML => {

				xmlNode.loaded = true;
				this.parseXML(externalXML, localPath);

				// import audioObject and children into internal XML DOM
				xmlNode.audioObject = externalXML.audioObject;
				xmlNode.obj = xmlNode.audioObject;

				Array.from(externalXML.children).forEach(childNode => {
					if(childNode.nodeName.toLowerCase() != "parsererror"){
						xmlNode.appendChild(childNode);
					}

				});

				this.checkLoadComplete();
			});
			this.externalFiles.push(extFile);

		} else {

			// if this node is internal
			let parentNode = xmlNode.parentNode;
			let params = WebAudioUtils.attributesToObject(xmlNode.attributes);

			// check if any parameter needs to be replaced with a Variable object

			let variableObj;

			Object.keys(params).forEach(key => {
				let param = params[key];
				if(typeof param == "string"){
					if(WebAudioUtils.nrOfVariableNames(param)){
						//variableObj = new Variable({waxml: this.waxml});
						params[key] = new Watcher(xmlNode, param, {
							waxml: this.waxml,
							callBack: val => {
								if(xmlNode.obj)xmlNode.obj[key] = val;
							}
						});
						//params[key] = variableObj;
					}
				} else if(param instanceof Array){
					// clumpsy structure to support multi-dimensional arrays, I know...
					param.forEach((value, i) => {
						if(typeof value == "string"){
							if(WebAudioUtils.nrOfVariableNames(value)){
								//variableObj = new Variable({waxml: this.waxml});
								params[key][i] = new Watcher(xmlNode, value, {
									waxml: this.waxml,
									callBack: val => {
										if(xmlNode.obj)xmlNode.obj[key] = param;
									}
								});
								//params[key][i] = variableObj;
							}
						} else if(value instanceof Array){
							value.forEach((item, j) => {
								if(typeof item == "string"){
									if(WebAudioUtils.nrOfVariableNames(item)){
										//variableObj = new Variable({waxml: this.waxml});
										params[key][i][j] = new Watcher(xmlNode, item, {
											waxml: this.waxml,
											callBack: val => {
												if(xmlNode.obj)xmlNode.obj[key] = param;
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
				variableObj = new Variable(params);
				if(params.follow){

					this.watcher = new Watcher(xmlNode, params.follow, {
						waxml: this.waxml,
						callBack: val => {
							variableObj.value = val;
						}
					});
				} else if (WebAudioUtils.nrOfVariableNames(params.value)) {

					this.watcher = new Watcher(xmlNode, params.value, {
						waxml: this.waxml,
						variableObj: variableObj,
						containsVariableNames: true,
						callBack: val => {
							variableObj.value = val;
						}
					});
				}
				xmlNode.obj = variableObj;
				parentNode.obj.setVariable(params.name, variableObj);
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

		}


	}
}



module.exports = Parser;

},{"./AudioObject.js":1,"./Loader.js":6,"./Synth.js":11,"./Variable.js":13,"./Watcher.js":15,"./WebAudioUtils.js":17}],9:[function(require,module,exports){
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

},{"./WebAudioUtils.js":17}],10:[function(require,module,exports){



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

},{}],11:[function(require,module,exports){

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


		this.trigger = new Trigger(this, 0, waxml);

	}


	connect(destination){

	  	if(this._node){
		  	if(this._node.connect){
			  	destination = destination || this._ctx.destination;
			  	this._node.connect(destination);
			  	this.destination = destination;
		  	}
	  	}

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

  	if(cancelPrevious){
	  	param.cancelScheduledValues(this._ctx.currentTime);
  	}
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

},{"./Trigger.js":12,"./Watcher.js":15,"./WebAudioUtils.js":17}],12:[function(require,module,exports){



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
		return this._frequency;
	}

	set frequency(f){
		//console.log(`f = ${f}`);
		let oldFrequency = this._frequency;
		this._frequency = Math.max(f, 1 / 1000);
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

},{}],13:[function(require,module,exports){
// var Watcher = require('./Watcher.js');
var Mapper = require('./Mapper.js');


class Variable {

	constructor(params){
		this._params = params;
		this._callBackList = [];
		this.waxml = params.waxml;
		this.lastUpdate = Date.now();
		this.derivataFactor = 0;
		this.name = params.name;

		this._mapper = new Mapper(params);

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

		if(typeof params.value != "undefined"){
			this.value = params.value.valueOf();
		}

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

	get value() {
		//return this._value;
		return this._mapper.getValue(this._value);
		//
		// if(typeof this._value == "undefined"){
		// 	return this._value;
		// } else {
		// 	//if(this.name)console.log(this.name, this._value);
		// 	return this._mapper.getValue(this._value);
		// }
	}

	set value(val) {
		if(this._value != val){
			this.setDerivative(val);
			this._value = val;
			this.doCallBacks();
		}
	}

	get derivative(){
		return this._derivative || 0;
	}

	get acceleration(){
		return this.derivative;
	}

	setDerivative(newVal){
		let diff = newVal - (this.value || newVal);
		let now = Date.now();
		let time = now - this.lastUpdate;
		this.lastUpdate = now;
		let newDerivative = diff / time;
		// auto scale to keep derivatives between -1 and 1
		this.derivataFactor = Math.max(Math.abs(newDerivative), this.derivataFactor);
		newDerivative /= this.derivataFactor;

		this.setDerivative2(newDerivative);
		this._derivative = newDerivative;
	}

	get derivative2(){
		return this._derivative2 || 0;
	}

	setDerivative2(newDerivative){
		this._derivative2 = newDerivative - this._derivative;
	}


	get getterNsetter(){
		return {
			get: this.get,
			set: this.set
		}
	}

	doCallBacks(){
		this._callBackList.forEach(obj => obj.callBack(this[obj.prop]));
	}

	getVariable(key){
		return this[key];
	}


}

module.exports = Variable;

},{"./Mapper.js":7}],14:[function(require,module,exports){



class VariableContainer {

	constructor(){
		this._props = {};
	}

	setVariable(key, val){
		this[key] = val;
	}
	getVariable(key){
		return this[key];
	}

	getVariableObject(key){
		return this._props[key];
	}

}


module.exports = VariableContainer;

},{}],15:[function(require,module,exports){
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

		this._variables = this.strToVariables(arr, xmlNode, Variable, params);
		if(Object.keys(this._variables).length > 0){
			this.callBack = params.callBack;
			this.value = WebAudioUtils.replaceVariableNames(arr);
			this.update(this.value);
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
			variableObj = new Variable(params);
			//variableObj = params.variableObj || new Variable(params);


			Object.defineProperty(obj, variable, {
				get() {
					return variableObj.value;
					return this._props[variable].value;
				},
				set(val) {
					variableObj.value = val;
					// this has been moved to the Variable object
					return;
					if(this._props[variable].value != val){
						this._props[variable].value = val;
						this._props[variable].callBackList.forEach(callBack => callBack(val));
					}
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

		return this._variables[varName].valueOf();

	}

	replaceVariableNames(str) {
		// regExp
		// ${x} || var(x) -> this.getVariable(x)
		if(typeof str != "string"){return 0};

		let rxp = WebAudioUtils.rxp;
		return str.replaceAll(rxp, (a, b, c) => b ? `this.getVariable('${b}')` : `this.getVariable('${c}')`);

	}

	strToVariables(str = "", xmlNode, variableType, params){
		// regExp
		if(typeof str != "string"){return 0};
		// ${x} || var(x) -> this.getVariable(x)
		let rxp = WebAudioUtils.rxp;
		let variables = {};

		[...str.matchAll(rxp)].forEach(match => {
			let varName = match[1] || match[2] || match[3];
			let parentObj = WebAudioUtils.getVariableContainer(varName, xmlNode, variableType);
			let prop = this.variablePathToProp(varName);

			let props;
			if(parentObj){
				props = parentObj.variables;
			} else {
				props = params.waxml.variables._props;
				this.addVariableWatcher(params.waxml.variables, varName);
			}
			let varObj = props[varName];
			varObj.addCallBack(v => this.update(v), prop);
			variables[varName] = varObj;

		});

		return variables;
	}

	update(val){

		if(this.callBack){
			val = this.valueOf(val);
			if(typeof val !== "undefined")this.callBack(val);
		}

	}

	valueOf(val){
		if(typeof this.value == "string"){
			try {
				let v = eval(this.value);
				val = Number.isNaN(v) ? val : v;
				//console.log(`Watcher.update(${this.value})`);
			} catch {

			}
		}
		return val;
	}

}

module.exports = Watcher;

},{"./Variable.js":13,"./WebAudioUtils.js":17}],16:[function(require,module,exports){
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

var version = "1.0.4";


var WebAudioUtils = require('./WebAudioUtils.js');
var Parser = require('./Parser.js');
var Connector = require('./Connector.js');
var GUI = require('./GUI.js');
var InteractionManager = require('./InteractionManager.js');



var source = document.currentScript.dataset.source;

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
					console.log("WebAudioXML is installed. Version " + version);
			} else {
				console.error("This browser does not support Web Audio API");
			}

		}

		source = source || src;
		if(!source){
			console.error("No WebAudioXML configuration file specified");
			return;
		}

		this.plugins = [];
		this._ctx = _ctx;
		this._listeners = [];
		this.audioInited = false;

		if(source){
			window.addEventListener("load", () => {

				this.parser = new Parser(source, this, xmlDoc => {
					this._xml = xmlDoc;
					let interactionArea = this._xml.getAttribute("interactionArea");
					if(interactionArea){
						this.ui.registerEvents(interactionArea);
					}

					this.master = this._xml.audioObject;
					//this.master.fadeOut();

					//webAudioXML = xmlDoc.audioObject;
					//webAudioXML.touch = touches;
					new Connector(xmlDoc, _ctx);
					this.plugins.forEach(plugin => {
						plugin.init();
					});
					if(this._xml.getAttribute("controls") == "true"){
						new GUI(xmlDoc, document.body);
					}


					this.dispatchEvent(new CustomEvent("inited"));
					this.dispatchEvent(new CustomEvent("init"));


				});
			});
		} else {
			console.error("No WebAudioXML source specified")
		}

		this.ui = new InteractionManager(this);

	}

	/*
	// Maybe to be implemented when moved from AudioObject
	addVariableWatcher(variable, callBack){
		this.variableRouter.addVariableWatcher(variable, callBack);
	}
	*/
	init(){
		if(!this.audioInited){
			this.audioInited = true;
			this._ctx.resume();
			//this.master.fadeIn(0.01);
		}
	}

	start(selector = "*"){
		if(this._ctx.state != "running"){
			this.init();
		}

		this._xml.querySelectorAll(selector).forEach(XMLnode => {
			if(XMLnode.audioObject && XMLnode.audioObject.start){
				XMLnode.audioObject.start();
			}
		});
	}

	trig(selector = "*"){
		this._xml.querySelectorAll(selector).forEach(XMLnode => {
			if(XMLnode.audioObject.start){
				XMLnode.audioObject.start();
			} else if(XMLnode.audioObject.noteOn){
				XMLnode.audioObject.noteOn();
			}
		});
	}

	stop(selector = "*"){
		this._xml.querySelectorAll(selector).forEach(XMLnode => {
			if(XMLnode.audioObject && XMLnode.audioObject.stop){
				XMLnode.audioObject.stop();
			}
		});
	}

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

		var retrieveObjects = (el, parentObj = {}) => {
			let obj = {};
			if(el.audioObject){
				obj.name = el.id || [...el.classList].join(".") || el.nodeName;
				obj.children = [];
				obj.type = el.nodeName;
				obj.level = (parentObj.level || 0) + 1;
				obj.id = counter++;
				obj.target = el.audioObject;
				obj.parent = parentObj;
				obj.path = el.audioObject.path;

				audioObjects.push(obj);

				// add webAudioXML parameters
				el.audioObject.getWAXMLparameters().forEach(paramObj => {
					paramObj.id = counter++;
					// add to tree
					obj.children.push(paramObj);
					paramObj.parent = obj;
					paramObj.path = obj.path + "." + paramObj.name;

					// add to linear list with parameter objects
					parameters.push(paramObj);
				});


				// add parameters for audioNode
				if(el.audioObject._node){
					for(let key in el.audioObject._node){
						let param = el.audioObject._node[key];
						if(param instanceof AudioParam){
							let range = WebAudioUtils.paramNameToRange(key);
							let paramObj = {
								id: counter++,
								name: key,
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
					let childObj = retrieveObjects(childNode, obj);
					if(childObj){obj.children.push(childObj)}
				});
			}
			return obj;
		}
		let struct = {
			parameters: parameters,
			audioObjects: audioObjects,
			tree: retrieveObjects(this._xml),
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

	setVariable(key, val){
		this.ui.setVariable(key, val);
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
			let audioObject = xml.audioObject;
			arr.push(xml.audioObject);
		});
		return arr;
	}
	querySelector(selector){
		let xml = this._xml.querySelector(selector);
		if(xml){
			return xml.audioObject || xml.obj;
		}
		return -1;
	}

}



let webAudioXML = new WebAudio();

window.webAudioXML = webAudioXML;
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

},{"./Connector.js":2,"./GUI.js":4,"./InteractionManager.js":5,"./Parser.js":8,"./WebAudioUtils.js":17}],17:[function(require,module,exports){


class WebAudioUtils {



}

var rxp = /[$][{]([a-z0-9_]+)[}]|[$]([a-z0-9_]*)|var[(]([a-z0-9_]+)[)]/gi;
var rxpVal = /([a-z0-9_\+\-\$\*\/\ \.]+)/gi;
WebAudioUtils.rxp = rxp;
WebAudioUtils.rxpVal = rxpVal;

WebAudioUtils.typeFixParam = (param, value) => {

	//param = param.toLowerCase();
	let arr;
	let floatVal;
	if(WebAudioUtils.nrOfVariableNames(value)){
		let firstChar = value.charAt(0);
		if(firstChar == "[" || firstChar == "{"){
			// JSON array or object
			//value = WebAudioUtils.replaceVariableNames(value, '"');
			value = WebAudioUtils.wrapExpression(value, '"');
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
		if(typeof value == "string"){
			if(value.includes("dB") || value.includes("db")){
				value = Math.pow(2, parseFloat(value) / 3);
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
	if(!attributes.length){return obj}



	for (let i in attributes){
		if(attributes.hasOwnProperty(i)){

			// XML parser is inconsistent with the document
			// When the XML DOM is embeded inside HTML some
			// browsers interpret all attributes as written
			// with capital letters
			let param = attributes[i].name.toLowerCase();

		  	param = WebAudioUtils.caseFixParameter(param);

			let value = WebAudioUtils.typeFixParam(param, attributes[i].value);
			obj[param] = value;
		}

	}
	return obj;
}

WebAudioUtils.caseFixParameter = param => {


	switch(param){
	  	 case "q":
	  	 param = "Q";
	  	 break;

	  	 case "delaytime":
	  	 param = "delayTime";
	  	 break;

			 case "loopend":
			 param = "loopEnd";
			 break;

			 case "loopstart":
			 param = "loopStart";
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
WebAudioUtils.split = (str, separator) => {
	separator = separator || str.includes(";") ? ";" : str.includes(",") ? "," : " ";
	let arr = str.split(separator).map(item => {
		item = item.trim();
		let i = parseFloat(item);
		return i == item ? i : item;
	});
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


WebAudioUtils.paramNameToRange = name => {
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


WebAudioUtils.nrOfVariableNames = (str = "") => {
	// regExp
	if(typeof str != "string"){return 0};

	// ${x} || $x || var(x) -> this.getVariable(x)
	return [...str.matchAll(rxp)].length;
}

WebAudioUtils.replaceVariableNames = (str = "", q = "") => {
	if(typeof str != "string"){return 0};
	// regExp
	return str.replaceAll(rxp, (a, b, c, d) => {
		let v = b || c || d;
		return `${q}this.getVariable('${v}')${q}`;
	});
}

WebAudioUtils.wrapExpression = (str = "", q = "") => {
	if(typeof str != "string"){return 0};	

	return str.replaceAll(rxpVal, a => parseFloat(a) == a ? a : q + a + q);
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

module.exports = WebAudioUtils;

},{}],18:[function(require,module,exports){


class XY_area extends HTMLElement {

	constructor(){
		super();
		this.style.position = "relative";
		this.style.backgroundColor = this.getAttribute("background-color") || "#555";

		// grid
		let columns = parseInt(this.getAttribute("columns") || 10);
		let rows = parseInt(this.getAttribute("rows") || 10);
		let gridColor = this.getAttribute("grid-color") || "black";

		let colWidth = 100 / columns;
		let rowHeight = 100 / rows;

		this.style.backgroundImage = `linear-gradient(${gridColor} 1px, transparent 0),
		linear-gradient(90deg, ${gridColor} 1px, transparent 0)`;
		this.style.backgroundSize = `${colWidth}% ${rowHeight}%`;

		this.style.touchAction = "none";

	}
	connectedCallback() {
	}
}

module.exports = XY_area;

},{}],19:[function(require,module,exports){



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

		this.rect = this.getBoundingClientRect();
		let br = this.parentNode.getBoundingClientRect();
		this.boundRect = {
			left: br.left,
			top: br.top,
			width: br.width - this.rect.width,
			height: br.height - this.rect.height
		};

		this.direction = this.getAttribute("direction") || "xy";

		let x =  this.getAttribute("x") || 0;
		let y = this.getAttribute("x") || 0;

		this.x = parseFloat(x);
		this.y = parseFloat(y);

		this.move(this.x, this.y);



		this.addEventListener("pointerdown", e => {
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

				if(this.direction.includes("x")){
					let x = e.clientX-this.clickOffset.x-this.boundRect.left;
					x = Math.max(0, Math.min(x, this.boundRect.width));
					this.x = x / this.boundRect.width * 100;
					this.style.left = `${x}px`;
				}

				if(this.direction.includes("y")){
					let y = e.clientY-this.clickOffset.y-this.boundRect.top;
					y = Math.max(0, Math.min(y, this.boundRect.height));
					this.y = y / this.boundRect.height * 100;
					this.style.top = `${y}px`;
				}
				this.dispatchEvent(new CustomEvent("input"));
			}
		}, false);

	}

	move(x, y){
		this.style.left = x / 100 * this.boundRect.width + "px";
		this.style.top = y / 100 * this.boundRect.height + "px";
	}
	connectedCallback() {

	}
}

module.exports = XY_handle;

},{}]},{},[16]);
