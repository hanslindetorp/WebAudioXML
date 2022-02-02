

//Get HTML elements and create global variables
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
};




class HandController {

  constructor(){
    this.threshold = 0.1;
    this.fingersUp = Array(10).fill(0);
    this._variables = {};
  }

  get numberOfFingersUp(){
    return this.fingersUp.reduce((accumulator, curr) => accumulator + curr);
  }

  update(hand, landmarks){
    hand = hand.toLowerCase();
    let handOffset = hand == "right" ? 5 : 0;

    // store landmarks for current hand
    let target = (`hand_${hand}_`);
    landmarks.forEach((data, i) => {
      Object.entries(data).forEach(([key, val]) => {
        this._variables[target + i + key] = val;
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
          let deltaX = landmarks[joint].x - landmarks[tip].x;
          let deltaY = landmarks[joint].y - landmarks[tip].y;
          dists.push(Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2)));
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
    this._variables["hand_left_fingersup"] = leftCnt;

    // right hand
    let rightCnt = 0;
    for(let i = 5; i < 10; i++){
      rightCnt += this.fingersUp[i];
    }
    this._variables["hand_right_fingersup"] = rightCnt;
    this._variables["hand_fingersup"] = leftCnt + rightCnt;
    // console.log(this.fingersUp);

    return this.variables;
  }

  get variables(){
    return this._variables;
  }

}




var handController = new HandController();


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
        webAudioXML.setVariable(key, val);
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


  let initCodeMirror = xml => {
    let myTextArea = document.querySelector("#xml-edit");
    myCodeMirror = CodeMirror.fromTextArea(myTextArea);

    let scale = document.querySelector("main").dataset.scale;
    document.querySelectorAll(".CodeMirror-cursors, .CodeMirror-measure:nth-child(2) + div").forEach(cmObj => {
      cmObj.style.transform = `scale(${1/scale},${1/scale}) translate(0%, 0%)`;
      cmObj.style.transformOrigin = "0 0";
    });


    str = XML.prettify(xml, true);
    myCodeMirror.setValue(str);
  }

  let str = dataFromURL();

  if(str){
    webAudioXML.updateFromString(str)
    .then(xml => initCodeMirror(xml));
  } else {
    webAudioXML.updateFromFile("audio-config.xml")
    .then(xml => initCodeMirror(xml));
  }


  document.querySelectorAll("navigation > a:not([id='playBtn'])").forEach(el => {
    el.addEventListener("click", e => {
      webAudioXML.mute();
      iMusic.stop();
    });
  });

  document.querySelector("navigation > #playBtn").addEventListener("click", e => {
    webAudioXML.updateFromString(myCodeMirror.getValue());
    iMusic.play();
    webAudioXML.init();
    webAudioXML.unmute();
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


  window.location = "#play";

});

function getSharedLink(){
  let str = lzw_encode(myCodeMirror.getValue());
  return window.location.origin + window.location.pathname + "?data=" + encodeURIComponent(str);
}

function dataFromURL(){
  let indexOfQuery = window.location.hash.indexOf("?")+1;
  let queryString = window.location.hash.substr(indexOfQuery);
  let urlParams = new URLSearchParams(window.location.search);
  let dataStr = urlParams.get('data');
  if(!dataStr){return false}

  let str = lzw_decode(dataStr);
  return str;
}