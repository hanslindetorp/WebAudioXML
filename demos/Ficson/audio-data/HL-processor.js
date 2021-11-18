class HLprocessor extends AudioWorkletProcessor {
  

  constructor(){
    super();
    this.smoothCounter = 0;
    this.smoothLength = 3000;
    this.sampleRate = 44100;
    this.phaseIndex = 0;
  }

  static get parameterDescriptors () {
    return [{
      name: 'frequency',
      defaultValue: 100,
      minValue: 20,
      maxValue: 20000,
      automationRate: 'a-rate'
    },{
      name: 'harmonics',
      defaultValue: 20,
      minValue: 1,
      maxValue: 30,
      automationRate: 'a-rate'
    },{
      name: 'spectrum',
      defaultValue: 1,
      minValue: 0,
      maxValue: 10,
      automationRate: 'a-rate'
    },{
      name: 'formants',
      defaultValue: 1,
      minValue: 1,
      maxValue: 10,
      automationRate: 'a-rate'
    }
    ]
  }

  process (inputs, outputs, parameters) {
    
    const output = outputs[0];
    const bufferSize = output[0].length;

    for (let i = 0; i < bufferSize; i++) {

      let frequency = this.getValue(parameters['frequency'], i);
      let harmonics = this.getValue(parameters['harmonics'], i);
      let spectrum = this.getValue(parameters['spectrum'], i);
      let formants = this.getValue(parameters['formants'], i);
      spectrum = Math.floor(spectrum);

      // let factor = Math.min(1, this.smoothCounter / this.transitionTime);
      // let smooth = Math.sin(factor / 2 * Math.PI);


      // let targetFrequency = this.frequency + (this.newFrequency - this.frequency) * smooth;
      
      // add harmonics
      let y = 0;
      let mainGain = 0.01;
      for(let h = 1; h <= harmonics; h+=(spectrum+1)){
        let harmonicsGain = 1 - h / harmonics;
        let f = h * frequency;
        let formantGain = Math.cos(f/5000*formants*2*Math.PI);
        y += Math.sin(this.phaseIndex * h * 2 * Math.PI + h) * mainGain * harmonicsGain * formantGain;
      }

      output.forEach(channel => { 
        channel[i] = y;
      });

      
      // this.sampleIndex++;
      // this.smoothCounter++;
      let phaseIncrement = 1/(this.sampleRate / frequency);
      this.phaseIndex += phaseIncrement;
    }
    
    return true;
  }
  getValue(param, i = 1){
    return param.length > 1 ? param[i] : param[0];
  }


}


registerProcessor('HL-processor', HLprocessor)
