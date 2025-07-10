
// import { io } from "socket.io-client";
// import {io} from "./socket.io.min.js";

// const videoElement = document.getElementsByClassName('input_video')[0];
// const canvasElement = document.getElementsByClassName('output_canvas')[0];
// const canvasCtx = canvasElement.getContext('2d');
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


const trigTest = (t) => {
  
  waxml.setVariable("masterTestGain", 1);
  setTimeout(() => waxml.setVariable("masterTestGain", 0), 50);
  setTimeout(() => {
    clientToServer({command: "trig-test", value: t});
  }, 1000);
};

window.trigTest = trigTest;

waxml.addEventListener("inited", () => {

  keyboardElement = document.querySelector("waxml-midi-controller");

    waxml.addEventListener("midiIn", (event) => {
        // convert noteOffs
        let midiEvent = event.detail;
        if(midiEvent.status == 9 && midiEvent.data2 == 0){
            midiEvent.status = 8;
        }

        if(midiEvent.channel == 1){
         
          // indicate on keyboard
          if(midiEvent.status == 8){
            keyboardElement.indicateKey(midiEvent.data1, false);
          }



          socket.emit("clientToServer", {
              command: "midiIn",
              value: midiEvent
          }); 


        } else if(midiEvent.channel == 10){

          if(midiEvent.status == 9 && midiEvent.data1 == 42 && midiEvent.data2 > 0){
            clientToServer({command: "set-solo", value: 2}); // all solo
          }

          if(midiEvent.status == 9 && midiEvent.data1 == 46 && midiEvent.data2 > 0){
            clientToServer({command: "set-solo", value: 1}); // one solo
          }
  
          if(midiEvent.status == 9 && midiEvent.data1 == 36 && midiEvent.data2 > 0){
            clientToServer({command: "set-solo", value: 0}); // no solo
          }
  
          if(midiEvent.status == 9 && midiEvent.data1 == 50 && midiEvent.data2 > 0){
            trigTest(0);
          }
  
          if(midiEvent.status == 9 && midiEvent.data1 == 45 && midiEvent.data2 > 0){
            trigTest(1);
          }
  
          if(midiEvent.status == 9 && midiEvent.data1 == 51 && midiEvent.data2 > 0){
            trigTest(2);
          }

          if(midiEvent.status == 9 && midiEvent.data1 == 49 && midiEvent.data2 > 0){
            clientToServer({command: "set-mode", value: "form"});
          }
          
        }
        

    });

    // iMusic.getDefaultInstance().parameters.onLoadComplete = audioRouting;


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

    // document.querySelector("#play").addEventListener("click", e => {

    //     iMusic.play("A");

    // });

    // document.querySelector("#number").addEventListener("click", e => {

    //     clientToServer({command: "generate-number"});

    // });
    // document.querySelector("#solo").addEventListener("pointerdown", e => {

    //     clientToServer({command: "set-solo"});

    // });
    // document.querySelector("#solo").addEventListener("pointerup", e => {

    //     clientToServer({command: "set-solo", value: -1});

    // });
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


// function audioRouting(){
//     let tracks = iMus.getDefaultInstance().sections[1].tracks;
//     // let outputs = waxml.querySelectorAll("ChannelMergerNode GainNode");

//     let subOutput = waxml.querySelector(`.ch-30`);

//     tracks.forEach((track, i) => {
        
//         let targetNode = waxml.querySelector(`.ch-${(i%16)+1}`);

//         if(track.parts.length){
//             let info = track.parts[0].url[0].split("/")[1].split("-");
//             let type = info[0];
//             let key = parseInt(info[1]);
//             loopTracks[key].push(track);
//             let g;
//             switch(type){
//                 case "bounce":
//                     g = 1;
//                     break;
                
//                 case "long":
//                     g = 0.3;
//                     break;

//                 case "marcato":
//                     g = 0.3;
//                     break;

//                 case "synth":
//                     g = 1.5;
//                     break;
//             }

//             let gainNode = new GainNode(waxml._ctx, {gain: g});
//             track.bus.output.disconnect();
//             track.bus.output.connect(gainNode).connect(targetNode.input);
            
//             if(type == "bounce"){
//                 let oppositTarget = waxml.querySelector(`.ch-${((i+8)%16)+1}`);
//                 let delayNode = new DelayNode(waxml._ctx, {delayTime: 2/3})
//                 let delayGain = new GainNode(waxml._ctx, {gain: 0.2});
//                 gainNode.connect(delayNode).connect(delayGain).connect(oppositTarget.input);
//             }
//             // koppla synthbas till sub
//             if(type == "synth" && key < 50){
//                 gainNode.connect(subOutput.input);
//             }
//         }
        
//         track.setVolume(0);
//     });

// }





























