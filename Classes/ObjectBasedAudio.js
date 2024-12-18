var BufferSourceObject = require('./BufferSourceObject.js');
var ConvolverNodeObject = require('./ConvolverNodeObject.js');
var Watcher = require('./Watcher.js');


class ObjectBasedAudio extends EventTarget{

	constructor(obj, params, waxml){
        super();
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

        this.bufferSource.addEventListener("ended", e => {
            this.dispatchEvent(new CustomEvent("ended"));
        });

        this.bufferSource.addEventListener("loadComplete", e => {
            this.dispatchEvent(new CustomEvent("loadComplete", {
                detail: e.detail
            }));
        });

        

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
