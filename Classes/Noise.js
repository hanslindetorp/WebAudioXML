
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

