
class Analogue extends AudioWorkletProcessor {

  constructor(){
    super();
    this.sampleRate = 44100;
    this.vals = [];
  }

  static get parameterDescriptors () {
    return [{
      name: 'factor',
      defaultValue: 1,
      minValue: 0,
      maxValue: 1,
      automationRate: 'k-rate'
    }]
  }

  process (inputs, outputs, parameters) {
    
    const output = outputs[0];
    const input = inputs[0];
    if(!this.vals.length){

    }

    const bufferSize = output[0].length;
    let factor = this.getValue(parameters['factor']);

    for (let i = 0; i < bufferSize; i++) {

      for(let ch = 0; ch < input.length; ch ++){
        let newVal = input[ch][i];
        let curVal = this.vals[ch] || 0;
        let diff = newVal - curVal;
        curVal += diff * (1-factor);
        this.vals[ch] = curVal;
        output[ch][i] = curVal;
      }

    }
    
    return true;
  }


  getValue(param, i = 1){
    return param.length > 1 ? param[i] : param[0];
  }
}

registerProcessor('analogue', Analogue)
