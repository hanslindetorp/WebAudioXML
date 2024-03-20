class Signal extends AudioWorkletProcessor {



  constructor(){
    super();
    this.value = 1;
  }

  static get parameterDescriptors () {
    return [{
      name: 'value',
      defaultValue: 1,
      minValue: -10000000,
      maxValue: 10000000,
      automationRate: 'a-rate'
    }];
  }


  getValue(param, i = 0){
    return param.length > 1 ? param[i] : param[0];
  }



  process (inputs, outputs, parameters) {
    const output = outputs[0];

    output.forEach(channel => {
      for (let i = 0; i < channel.length; i++) {
        let value = this.getValue(parameters['value'], i);
        channel[i] = value;
      }
    })
    return true;
  }
}



registerProcessor('Signal', Signal);  