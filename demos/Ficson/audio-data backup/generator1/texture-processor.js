
class TextureProcessor extends AudioWorkletProcessor {

  constructor(){
    super();
    this.val = 0;
    this.nextVal = 0;
    this.sampleIndex = 0;
    this.sampleRate = 44100;
    this.chunkLength = 0;
    this.smoothCounter = 0;
    this.smoothLength = 3000;

    this.phaseIndex = 0;
  }

  static get parameterDescriptors () {
    return [{
      name: 'chunklength',
      defaultValue: 100,
      minValue: 1,
      maxValue: 1000000,
      automationRate: 'k-rate'
    },{
      name: 'chunkvariation',
      defaultValue: 0,
      minValue: 0,
      maxValue: 1000000,
      automationRate: 'k-rate'
    },{
      name: 'transition',
      defaultValue: 100,
      minValue: 1,
      maxValue: 1000000,
      automationRate: 'k-rate'
    },{
      name: 'minfrequency',
      defaultValue: 100,
      minValue: 20,
      maxValue: 20000,
      automationRate: 'k-rate'
    },{
      name: 'maxfrequency',
      defaultValue: 8000,
      minValue: 20,
      maxValue: 20000,
      automationRate: 'k-rate'
    }
    ]
  }

  process (inputs, outputs, parameters) {
    
    const output = outputs[0];
    const bufferSize = output[0].length;
    if(!this.chunkLength){
      this.chunkLength = this.getChunkLength(parameters);
      this.frequency = this.getRandomFrequency(parameters);
    }

    for (let i = 0; i < bufferSize; i++) {

      // let frequency = this.getValue(parameters['frequency'], i);
      // let noise = this.getValue(parameters['noise'], i);

      let posInChunck = this.sampleIndex % this.chunkLength;
      if(!posInChunck){ // generate a new nextVal for each chunk
        this.frequency = this.newFrequency;
        this.newFrequency = this.getRandomFrequency(parameters);
        
        // needed first time
        this.frequency = this.frequency || this.newFrequency;
        
        this.chunkLength = this.getChunkLength(parameters);
        this.smoothCounter = 0;
        this.transitionTime = this.getValue(parameters['transition']);
      
      }


      

      // let sine1 = Math.sin(this.frequency * this.sampleIndex / this.sampleRate * 2 * Math.PI);
      // let sine2 = Math.sin(this.newFrequency * this.sampleIndex / this.sampleRate * 2 * Math.PI);
      // let diff = sine2 - sine1;
      let factor = Math.min(1, this.smoothCounter / this.transitionTime);
      let smooth = Math.sin(factor / 2 * Math.PI);
      let targetFrequency = this.frequency + (this.newFrequency - this.frequency) * smooth;
      let y = Math.sin(this.phaseIndex * 2 * Math.PI);

      output.forEach(channel => { 
        channel[i] = y;
      });
      this.sampleIndex++;
      this.smoothCounter++;
      let phaseIncrement = 1/(this.sampleRate / targetFrequency);
      this.phaseIndex += phaseIncrement;
    }
    
    return true;
  }

  get randomVal(){
    return Math.random() * 2 - 1;;
  }

  getRandomFrequency(parameters){
    let minfrequency = this.getValue(parameters['minfrequency']);
    let maxfrequency = this.getValue(parameters['maxfrequency']);

    return minfrequency + Math.random() * (maxfrequency - minfrequency);
  }

  getValue(param, i = 1){
    return param.length > 1 ? param[i] : param[0];
  }

  getChunkLength(parameters){

    let chunkLength = this.getValue(parameters['chunklength']);
    let chunkVariation = this.getValue(parameters['chunkvariation']);
    
    // chunkLength = Math.max(1, chunkLength - chunkVariation / 2);
    chunkLength += (Math.random() * chunkVariation);
    chunkLength = Math.floor(chunkLength);
    return chunkLength;
  }
}

registerProcessor('texture-processor', TextureProcessor)
