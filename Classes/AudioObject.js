
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
            } else if(envName && envName == WebAudioUtils.getEnvelopeName(value)){

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
      this._playing = true;
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
      let gainParam = this._node.gain;
	  	return gainParam ? this._node.gain.value : false;
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

    get playing(){
      return this._node.playing;
    }


    set mix(val){

      val = Math.max(0, Math.min(val, 1));
      this._params.mix = val;
      let targets = this.childObjects; //.length ? this.childObjects : this.inputs;
        
      val *= targets.length; // 0 - nr of children or channelCount

      let crossFadeRange = this._params.crossfaderange.valueOf();
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
