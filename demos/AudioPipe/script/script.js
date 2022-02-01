

//Get HTML elements and create global variables
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
};


//Trigger note if index fingers touching
let t1on = false;
let fingerDistanceActivate = 0.02;
let fingerDistanceDeactivate = 0.05;


function Trigger1(distance) {
  if(distance <= fingerDistanceActivate){
    if(t1on)return;
    t1on = true;
    output.playNote(midi1Note, [trigger1Channel.value]);
    setTimeout(function(){output.stopNote(midi1Note, [trigger1Channel.value])}, 500);
  }
  if(distance > fingerDistanceDeactivate){
    t1on = false;
  }
}


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

    if(classification.score > 0.8){
      let target = ("hand_" + classification.label + "_").toLowerCase();
      landmarks.forEach((data, i) => {
        Object.entries(data).forEach(([key, val]) => {
          webAudioXML.setVariable(target + i + key, val);
        });
        
      });
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





var myCodeMirror;


window.addEventListener("load", () => {

  let myTextArea = document.querySelector("#xml-edit");
  myCodeMirror = CodeMirror.fromTextArea(myTextArea);

  webAudioXML.addEventListener("init", e => {
    let str = XML.prettify(webAudioXML._xml, true);
    myCodeMirror.setValue(str);
  });


  document.querySelector("navigation > #playBtn").addEventListener("click", e => {
    webAudioXML.updateFromString(myCodeMirror.getValue());
  });

  document.querySelector("navigation > #shareBtn").addEventListener("click", e => {
    let url = getSharedLink();  
    let outputText = document.querySelector("#shareURL");
    outputText.innerHTML = url;
    
    /* Select the text field */
    outputText.select();
    outputText.setSelectionRange(0, 99999); /* For mobile devices */

    /* Copy the text inside the text field */
    document.execCommand("copy");

    /* Alert the copied text */
    alert("Configuration data copied to clipboard");

  });

  let done = initFromURL();
  if(!done){
    // init from file
    webAudioXML.updateFromFile("audio-config.xml")
    .then(xml => {
      let str = XML.prettify(xml, true);
      myCodeMirror.setValue(str);
    });
  }

  window.location = "#play";

});

function getSharedLink(){
  let str = lzw_encode(myCodeMirror.getValue());
  return window.location.origin + window.location.pathname + "?data=" + encodeURIComponent(str);
}

function initFromURL(){
  let indexOfQuery = window.location.hash.indexOf("?")+1;
  let queryString = window.location.hash.substr(indexOfQuery);
  let urlParams = new URLSearchParams(window.location.search);
  let dataStr = urlParams.get('data');
  if(!dataStr){return false}

  let str = lzw_decode(dataStr);
  myCodeMirror.setValue(str);
  webAudioXML.updateFromString(str);

  return true;
}