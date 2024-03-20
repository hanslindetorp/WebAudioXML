


var var1;
const ctx = new AudioContext();

// setup signal
ctx.audioWorklet.addModule("Signal.js")

.then(() => {

    // setup audio graph
    let osc = new OscillatorNode(ctx, {type: "sawtooth", frequency: 110});
    let filter = new BiquadFilterNode(ctx, {frequency: 0});    
    osc.connect(filter).connect(ctx.destination);   
    osc.start();

    // create and connect variables
    var1 = new Variable(ctx, {min: 110, max: 880});
    var1.connect(osc.frequency);

    var2 = new Variable(ctx, {min: 0, max: 1000});
    var2.connect(filter.frequency);


});


window.addEventListener("DOMContentLoaded", e => {

    window.addEventListener("mousemove", e => {
        var1.value = e.clientX;
        document.querySelector("#pitch").innerHTML = var1.value.toFixed(0);
        
        var2.value = e.clientY;
        document.querySelector("#cutoff").innerHTML = var2.value.toFixed(0);
    
    
    });

    document.querySelector("#mapOutMin").addEventListener("input", e => {
        var1.min = e.target.value;
        e.target.parentElement.querySelector(".value").innerHTML = e.target.value;
    });

    document.querySelector("#mapOutRange").addEventListener("input", e => {
        var1.range = e.target.value;
        e.target.parentElement.querySelector(".value").innerHTML = e.target.value;
    });

    document.querySelector("#initBtn").addEventListener("click", e => {
        ctx.resume();
    });

    
});









class Variable {


    constructor(ctx, params){

        this.minOut = typeof params.min !== "undefined" ? params.min : 0;
        this.rangeOut = typeof params.min !== "undefined" ? params.range : 1000;

        this.transitionTime = 1 / 10;

        this.ctx = ctx;

        // the signal is the carrier of the incoming value
        // it is represented in a nonsign Float32bit audio stream
        this.signal = new AudioWorkletNode(this.ctx, "Signal");

        // this is an offset signal for the minimum value
        let minOutSignal = new AudioWorkletNode(this.ctx, "Signal");
        this.minOut = new GainNode(ctx, {gain:0}); 
        minOutSignal.connect(this.minOut);

        // minOut + rangeOut = maxOut 
        this.rangeOut = new GainNode(ctx, {gain:1});
        this.signal.connect(this.rangeOut);


        this.mapOut = {min: 0, max: 1000}
  
    }
  
    connect(destination){
        this.minOut.connect(destination);
        this.rangeOut.connect(destination);
        return this;
    }
  
    set value(val){
        // init variable first time
        if(typeof this.minIn == "undefined"){
            this.minIn = val;
            this.maxIn = val;
        }

        // auto calibrate input signal
        this.minIn = Math.min(this.minIn, val);
        this.maxIn = Math.max(this.maxIn, val);
        this.rangeIn = this.maxIn - this.minIn; 

        if(this.rangeIn > 0){
            // set the signal to represent the range in 32bit float
            // between 0 and 1
            let val32 = (val - this.minIn) / this.rangeIn;
            this.signal.parameters.get("value").value = val32;
        }
       
    }
  
    get value(){
        let val32 = this.signal.parameters.get("value").value;
        let val =  val32 * this.rangeOut.gain.value + this.minOut.gain.value;
        return val;
    }
  
  
    set min(val){
        this.minOut.gain.setTargetAtTime(val, this.ctx.currentTime, this.transitionTime);
    }

    set range(val){
        this.rangeOut.gain.setTargetAtTime(val, this.ctx.currentTime, this.transitionTime);
    }
    
    set mapOut(values){
        let min = typeof values.min !== "undefined" ? values.min : 0;
        let max = typeof values.max !== "undefined" ? values.max : 1;
        let range = max - min;

        this.minOut.gain.setTargetAtTime(min, this.ctx.currentTime, this.transitionTime);
        this.rangeOut.gain.setTargetAtTime(range, this.ctx.currentTime, this.transitionTime);
    }

}
