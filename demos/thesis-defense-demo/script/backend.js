
// import { io } from "socket.io-client";
// import {io} from "./socket.io.min.js";

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
var keyboardElement;

var loopTracks = Array(128).fill(0).map(() => Array());

const socket = io('https://localhost:4500', {rejectUnauthorized: false});
// const socket = new Server('//localhost', {rejectUnauthorized: false});


socket.on('serverToClient', (msg) => {
    switch (msg.command) {
        case "xxx":
            document.querySelector(".output").innerHTML = msg.value;
        break;

        default:
            break;
    }
    
});

const clientToServer = (msg) => {
    socket.emit("clientToServer", msg);
};

waxml.addEventListener("inited", () => {

  keyboardElement = document.querySelector("waxml-midi-controller");

    waxml.addEventListener("midiIn", (event) => {
        // convert noteOffs
        let midiEvent = event.detail;
        if(midiEvent.status == 9 && midiEvent.data2 == 0){
            midiEvent.status = 8;
        }

        // indicate on keyboard
        if(midiEvent.status == 8){
          keyboardElement.indicateKey(midiEvent.data1, false);
        }
        if(midiEvent.status == 9){
          keyboardElement.indicateKey(midiEvent.data1, true);
        }
        



        socket.emit("clientToServer", {
            command: "midiIn",
            value: midiEvent
        });

        loopTracks[midiEvent.data1].forEach(track => track.setVolume(midiEvent.status == 9));
        if(midiEvent.data1 < 50){
            loopTracks[midiEvent.data1-12].forEach(track => track.setVolume(midiEvent.status == 9));
        }

        if(midiEvent.status == 9 && midiEvent.data1 == 31){
          iMusic.play("A");
        }

        if(midiEvent.status == 9 && midiEvent.data1 == 72){
          iMusic.stop();
        }

        if(midiEvent.status == 9 && midiEvent.data1 == 71){
          clientToServer({command: "set-solo"});
        }

        if(midiEvent.status == 9 && midiEvent.data1 == 70){
          clientToServer({command: "set-solo", value: -1});
        }

    });

    iMusic.getDefaultInstance().parameters.onLoadComplete = audioRouting;


    // let str = "";
    // ["bounce", "long", "marcato", "synth"].forEach(name => {
    //     let a = name == "synth" ? 24 : 36;
    //     let b = name == "synth" ? 72 : 67;
    //     for(let i = a; i <= b; i++){
    //         let fileName = `audio/${name}-${i}.wav`;
    //         str += `<track src="${fileName}" />\n`;
    //     }
    // });
    // console.log(str);

});


document.addEventListener("DOMContentLoaded", e => {

    document.querySelector("#play").addEventListener("click", e => {

        iMusic.play("A");

    });

    // document.querySelector("#number").addEventListener("click", e => {

    //     clientToServer({command: "generate-number"});

    // });
    document.querySelector("#solo").addEventListener("pointerdown", e => {

        clientToServer({command: "set-solo"});

    });
    document.querySelector("#solo").addEventListener("pointerup", e => {

        clientToServer({command: "set-solo", value: -1});

    });
    // document.querySelector("#chord").addEventListener("pointerdown", e => {

    //     clientToServer({command: "midiIn", value: {
    //         channel: 1, 
    //         status: 9, 
    //         data1: 60, 
    //         data2: 120
    //     }});
    //     clientToServer({command: "midiIn", value: {
    //         channel: 1, 
    //         status: 9, 
    //         data1: 64, 
    //         data2: 120
    //     }});
    //     clientToServer({command: "midiIn", value: {
    //         channel: 1, 
    //         status: 9, 
    //         data1: 67, 
    //         data2: 120
    //     }});

    // });
    // document.querySelector("#chord").addEventListener("pointerup", e => {

    //     clientToServer({command: "midiIn", value: {
    //         channel: 1, 
    //         status: 9, 
    //         data1: 60, 
    //         data2: 0
    //     }});
    //     clientToServer({command: "midiIn", value: {
    //         channel: 1, 
    //         status: 9, 
    //         data1: 64, 
    //         data2: 0
    //     }});
    //     clientToServer({command: "midiIn", value: {
    //         channel: 1, 
    //         status: 9, 
    //         data1: 67, 
    //         data2: 0
    //     }});

    // });


});


function audioRouting(){
    let tracks = iMus.getDefaultInstance().sections[1].tracks;
    // let outputs = waxml.querySelectorAll("ChannelMergerNode GainNode");

    let subOutput = waxml.querySelector(`.ch-30`);

    tracks.forEach((track, i) => {
        
        let targetNode = waxml.querySelector(`.ch-${(i%16)+1}`);

        if(track.parts.length){
            let info = track.parts[0].url[0].split("/")[1].split("-");
            let type = info[0];
            let key = parseInt(info[1]);
            loopTracks[key].push(track);
            let g;
            switch(type){
                case "bounce":
                    g = 1;
                    break;
                
                case "long":
                    g = 0.3;
                    break;

                case "marcato":
                    g = 0.3;
                    break;

                case "synth":
                    g = 1.5;
                    break;
            }

            let gainNode = new GainNode(waxml._ctx, {gain: g});
            track.bus.output.disconnect();
            track.bus.output.connect(gainNode).connect(targetNode.input);
            
            if(type == "bounce"){
                let oppositTarget = waxml.querySelector(`.ch-${((i+8)%16)+1}`);
                let delayNode = new DelayNode(waxml._ctx, {delayTime: 2/3})
                let delayGain = new GainNode(waxml._ctx, {gain: 0.2});
                gainNode.connect(delayNode).connect(delayGain).connect(oppositTarget.input);
            }
            // koppla synthbas till sub
            if(type == "synth" && key < 50){
                gainNode.connect(subOutput.input);
            }
        }
        
        track.setVolume(0);
    });

}






























class HandController extends EventTarget {

    constructor(canvas){
      super();
  
      this.canvas = canvas;
      this.threshold = 0.07;
      this.fingersUp = Array(10).fill(0);
      this.variables = {};
      this._triggers = {};
      this._newTriggers = {};
      this.storedLandmarks = {};
      this._listeners = {};
    }
  
  
    get numberOfFingersUp(){
      return this.fingersUp.reduce((accumulator, curr) => accumulator + curr);
    }
  
    setVariable(key, val){
      this.variables[key] = val;
    }
  
    jointToVarName(hand1, joint1, axis1=""){
      return `hand_${hand1+joint1+axis1}`;
    }
  
    jointToPoint(hand1, joint1){
      let varName = this.jointToVarName(hand1, joint1);
      return this.variables[varName];
    }
  
    pointBetween(point1, point2){
      return {x: (point1.x + point2.x)/2, y: (point1.y + point2.y)/2}
    }
  
    distanceToVarName(hand1, joint1, hand2, joint2){
      return `hand_${hand1+joint1}to${hand2+joint2}`;
    }
  
    jointsToDistance(hand1, joint1, hand2, joint2){
      let varName = this.distanceToVarName(hand1, joint1, hand2, joint2);
      return this.variables[varName];
    }
  
    isNear(hand1, joint1, hand2, joint2){
      let varName = this.distanceToVarName(hand1, joint1, hand2, joint2);
      return this._triggers[varName];
    }
  
    update(hand, landmarks){
      hand = hand.toLowerCase().substr(0,1);
      let handOffset = hand == "r" ? 5 : 0;
  
      // store landmarks for current hand
      
      landmarks.forEach((point, i) => {
        let pointTarget = hand+i;
        // this.setVariable(`hand_${pointTarget}`, point);
  
        Object.entries(point).forEach(([key, val]) => {
          let varName;
  
  
  
        //   this.setVariable(`hand_${pointTarget+key}`, val);
          
  
          // store distances to each other point
          this.storedLandmarks[hand] = landmarks;
          Object.entries(this.storedLandmarks).forEach(([hand2, landmarks2]) => {
            landmarks2.forEach((point2, i2) => {
  
              let distX = this.deltaX(point, point2);
              let distY = this.deltaY(point, point2);
              let dist = this.hypotenuse(distX, distY);
  
              let point2Target = hand2+i2;
              
  
              varName = `hand_${pointTarget}xto${point2Target}x`;
            //   this.setVariable(varName, distX);
  
              if(!this._triggers[varName] && distX < this.threshold){
                this._triggers[varName] = true;
                this._newTriggers[varName] = true;
              } else if(this._triggers[varName] && distX > this.threshold){
                this._triggers[varName] = false;
                this._newTriggers[varName] = false;
              }
  
              varName = `hand_${pointTarget}yto${point2Target}y`;
            //   this.setVariable(varName, distY);
              
              if(!this._triggers[varName] && distY < this.threshold){
                this._triggers[varName] = true;
                this._newTriggers[varName] = true;
              } else if(this._triggers[varName] && distY > this.threshold){
                this._triggers[varName] = false;
                this._newTriggers[varName] = false;
              }
  
              varName = `hand_${pointTarget}to${point2Target}`;
            //   this.setVariable(varName, dist);
  
              if(!this._triggers[varName] && dist < this.threshold){
                this._triggers[varName] = true;
                this._newTriggers[varName] = true;
              } else if(this._triggers[varName] && dist > this.threshold){
                this._triggers[varName] = false;
                this._newTriggers[varName] = false;
              }
  
            });
          });
        });
      });
  
  
  
      let handWidth = Math.abs(landmarks[17].x - landmarks[5].x);
  
      // fingers up
      for(let finger = 0; finger < 5; finger++){
        let targetIndex = handOffset + finger;
        let fingerOffset = finger * 4;
        let tip = fingerOffset + 4;
        let joint = fingerOffset + 1;
        
        let dist;
        if(finger == 0){
          // compare thumb with all other finger joints
          let dists = [];
          [5,9,13,17].forEach(joint => {
            dists.push(this.distance(landmarks[joint], landmarks[tip]));
          });
          dist = Math.min(...dists);
  
        } else {
          // all other fingers
          dist = landmarks[joint].y - landmarks[tip].y;
        }
        let state = dist > handWidth * 0.9 ? 1 : 0;
        this.fingersUp[targetIndex] = state;
      }
  
      // left hand
      let leftCnt = 0;
      for(let i = 0; i < 5; i++){
        leftCnt += this.fingersUp[i];
      }
      this.variables["hand_fingersUpL"] = leftCnt;
  
      // right hand
      let rightCnt = 0;
      for(let i = 5; i < 10; i++){
        rightCnt += this.fingersUp[i];
      }
      this.variables["hand_fingersUpR"] = rightCnt;
      this.variables["hand_fingersUp"] = leftCnt + rightCnt;

        let filterVal = landmarks[0].y > 0.6 ? 0 : leftCnt / 5;
        socket.emit("clientToServer", {
            command: "filterControl",
            value: filterVal
        });
  
      
      this.dispatchEvent(new CustomEvent("update", {target: this}));
  
  
  
      return this.variables;
    }
  
    deltaX(point1, point2){
      return point1.x - point2.x
    }
    deltaY(point1, point2){
      return point1.y - point2.y
    }
    hypotenuse(deltaX, deltaY){
      return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    }
  
    distance(point1, point2){
      let deltaX = this.deltaX(point1, point2);
      let deltaY = this.deltaY(point1, point2);
      return this.hypotenuse(deltaX, deltaY);   
    }
  
    variableToCoordinate(varName, axis){
      let v = this.variables[varName] || 0;
      let factor = axis == "x" ? this.canvas.width : this.canvas.height;
      let br = this.canvas.getBoundingClientRect();
      let offset = axis = "x" ? br.left : br.top;
      return offset + v * axis;
    }
  
    valueToCoordinates(point){
      let br = this.canvas.getBoundingClientRect();
      let x = br.left + point.x * br.width;
      let y = br.top + point.y * br.height;
      return {x: x, y: y, id:point.id};
    }
  
    get variables(){
      return this._variables;
    }
  
    set variables(v){
      this._variables = v;
    }
  
    get newTriggers(){
      let triggers = this._newTriggers;
      this._newTriggers = {};
      return triggers;
    }
  
  }
  
  
  
  
  var handController = new HandController(canvasElement);
  
  
  function onResults(results) {
  
    //Draw Hand landmarks on screen
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  
  
    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let index = 0; index < results.multiHandLandmarks.length; index++) {
        const classification = results.multiHandedness[index];
        const isRightHand = classification.label === 'Right';
        const landmarks = results.multiHandLandmarks[index]; 
  
        drawConnectors(
          canvasCtx, landmarks, HAND_CONNECTIONS,
          {color: isRightHand ? '#fff' : '#056df5'}),
        drawLandmarks(canvasCtx, landmarks, {
          color: isRightHand ? '#fff' : '#056df5',
          fillColor: isRightHand ? '#056df5' : '#fff',
          radius: (x) => {
            return lerp(x.from.z, -0.15, .1, 10, 1);
          }
        })
  
      if(classification.score > 0.7){     
        let vars = handController.update(classification.label, landmarks);
        Object.entries(vars).forEach(([key, val]) => {
          if(typeof val == "number"){
            webAudioXML.setVariable(key, val);
          }
          
        });
        // Object.entries(handController.newTriggers).forEach(([selector, state]) => {
        //   if(state){
        //     webAudioXML.trig(selector);
        //     if(selector == "hand_l8tor8" && iMusTriggerBlocker == false){
        //       iMusic.next();
        //       iMusTriggerBlocker = true;
        //       setTimeout(() => iMusTriggerBlocker = false, 1000);
        //     }
            
        //   } else {
        //     webAudioXML.release(selector);
        //   }
        // });
      }
      
    }
    canvasCtx.restore();
    }
  
  }


const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.3/${file}`;
  }});
  
  hands.setOptions({
    selfieMode: true,
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  
  hands.onResults(onResults);
  
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({image: videoElement});
    },
    width: 1280,
    height: 720
  });
  camera.start();