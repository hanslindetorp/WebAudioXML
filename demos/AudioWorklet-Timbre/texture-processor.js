
class TextureProcessor extends AudioWorkletProcessor {

  constructor(){
    super();
    this.sampleRate = 44100;
    this.phaseIndex = 0;
  }

  static get parameterDescriptors () {
    return [{
      name: 'frequency',
      defaultValue: 440,
      minValue: 20,
      maxValue: 20000,
      automationRate: 'k-rate'
    },{
      name: 'spread',
      defaultValue: 1,
      minValue: 1,
      maxValue: 100,
      automationRate: 'k-rate'
    },{
      name: 'damping',
      defaultValue: 1,
      minValue: 1,
      maxValue: 100,
      automationRate: 'k-rate'
    },{
      name: 'formants',
      defaultValue: 1,
      minValue: 1,
      maxValue: 16,
      automationRate: 'k-rate'
    },{
      name: 'formant_gain',
      defaultValue: 1,
      minValue: 1,
      maxValue: 16,
      automationRate: 'k-rate'
    }
    ]
  }

  process (inputs, outputs, parameters) {
    
    const output = outputs[0];
    const bufferSize = output[0].length;
    let spread = parseInt(this.getValue(parameters['spread']));
    let damping = parseInt(this.getValue(parameters['damping']));
    let formants = parseInt(this.getValue(parameters['formants']));
    let formant_gain = parseInt(this.getValue(parameters['formant_gain']));

    

    for (let i = 0; i < bufferSize; i++) {

      let frequency = this.getValue(parameters['frequency'], i);
      let y = 0;
      let harmonic = 1;
      let cnt = 0;
      while(frequency * harmonic < 20000){
        let gain = harmonic == 1 ? 1 : 1/(harmonic*damping/4);

        y += Math.sin(this.phaseIndex * 2 * Math.PI * harmonic) * gain;
        harmonic += spread / 4;
        cnt++;
      }
  
      y = y / cnt;

      output.forEach(channel => { 
        channel[i] = y;
      });
      
      this.phaseIndex += 1/(this.sampleRate / frequency);
    }
    
    return true;
  }


  getValue(param, i = 1){
    return param.length > 1 ? param[i] : param[0];
  }
}

registerProcessor('texture-processor', TextureProcessor)
