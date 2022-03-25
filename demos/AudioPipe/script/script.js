

//Get HTML elements and create global variables
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const controllers = document.querySelector(".controllers");

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
};




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
      this.setVariable(`hand_${pointTarget}`, point);

      Object.entries(point).forEach(([key, val]) => {
        let varName;



        this.setVariable(`hand_${pointTarget+key}`, val);
        

        // store distances to each other point
        this.storedLandmarks[hand] = landmarks;
        Object.entries(this.storedLandmarks).forEach(([hand2, landmarks2]) => {
          landmarks2.forEach((point2, i2) => {

            let distX = this.deltaX(point, point2);
            let distY = this.deltaY(point, point2);
            let dist = this.hypotenuse(distX, distY);

            let point2Target = hand2+i2;
            

            varName = `hand_${pointTarget}xto${point2Target}x`;
            this.setVariable(varName, distX);

            if(!this._triggers[varName] && distX < this.threshold){
              this._triggers[varName] = true;
              this._newTriggers[varName] = true;
            } else if(this._triggers[varName] && distX > this.threshold){
              this._triggers[varName] = false;
              this._newTriggers[varName] = false;
            }

            varName = `hand_${pointTarget}yto${point2Target}y`;
            this.setVariable(varName, distY);
            
            if(!this._triggers[varName] && distY < this.threshold){
              this._triggers[varName] = true;
              this._newTriggers[varName] = true;
            } else if(this._triggers[varName] && distY > this.threshold){
              this._triggers[varName] = false;
              this._newTriggers[varName] = false;
            }

            varName = `hand_${pointTarget}to${point2Target}`;
            this.setVariable(varName, dist);

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
      Object.entries(handController.newTriggers).forEach(([selector, state]) => {
        if(state){
          webAudioXML.trig(selector);
        } else {
          webAudioXML.release(selector);
        }
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
    myCodeMirror = CodeMirror.fromTextArea(myTextArea, {
      lineNumbers: true,
      mode: "xml"
    });

    let scale = document.querySelector("main").dataset.scale;
    document.querySelectorAll(".CodeMirror-cursors, .CodeMirror-measure:nth-child(2) + div").forEach(cmObj => {
      cmObj.style.transform = `scale(${1/scale},${1/scale}) translate(0%, 0%)`;
      cmObj.style.transformOrigin = "0 0";
    });

    str = XML.prettify(xml, true);
    myCodeMirror.setValue(str);

    let stats = webAudioXML.statistics;
    let so = stats.elementCount;
    let elCnt = 0;
    let tbody = document.querySelector("#statistics tbody");
    Object.entries(so).forEach(([key, value]) => {
      if(key == "audio"){return;}
      
      let tr = document.createElement("tr");
      tbody.appendChild(tr);

      let td = document.createElement("td");
      td.innerHTML = key;
      tr.appendChild(td);

      td = document.createElement("td");
      td.innerHTML = value;
      tr.appendChild(td);

      elCnt += value;
    });
    document.querySelector("#edit #elementCount").innerHTML = elCnt || 0;
  }

  let data = dataFromURL();
  
  if(data){

    document.querySelector("#instrument-name").value = data.title || "";
    document.querySelector("#author-name").value = data.name || "";
    document.querySelector("#demo-URL").value = data.demoURL || "";
    controllers.style.zIndex = data.ctrl || 0;
    controllers.style.opacity = data.ctrl || 0;

    webAudioXML.updateFromString(data.xml)
    .then(xml => initCodeMirror(xml));

  } else {
    controllers.style.zIndex = 0;
    webAudioXML.updateFromFile("audio-config.xml")
    .then(xml => initCodeMirror(xml));
  }
  
  document.querySelector("navigation > #editBtn").addEventListener("click", e => {
    webAudioXML.mute();
  });


  document.querySelector("navigation > #playBtn").addEventListener("click", e => {
    webAudioXML.updateFromString(myCodeMirror.getValue());
    
    webAudioXML.init();
    webAudioXML.unmute();
  });

  document.querySelector("navigation > #playMusicBtn").addEventListener("click", e => {
    if(iMusic.isPlaying()){
      iMusic.stop();
      e.target.style.backgroundColor = "#fff";
    } else {
      iMusic.play();
      e.target.style.backgroundColor = "#ccf";
    }
    e.preventDefault();
  });

  document.querySelector("navigation > #shareBtn").addEventListener("click", e => {

    webAudioXML.mute();

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


  document.querySelector("navigation select").addEventListener("change", e => {
    if(!e.target.value)return
    window.location = e.target.value;
  });

  document.querySelector("navigation #ctrlBtn").addEventListener("click", e => {
    controllers.style.zIndex = controllers.style.zIndex * -1 + 1;
    controllers.style.opacity = 1;
    e.preventDefault();
  });


  // remote control waxml_xy_handles with closed thumb+pointing finger on any hand
  document.querySelectorAll("waxml-xy-area[external-control]").forEach(el => {

    handController.addEventListener("update", e => {

      // direct pointOver->remoteControl
      let vars = el.pointsWithMatchingID(e.target.variables);
      let points = vars.map(v => e.target.valueToCoordinates(v));
      el.remoteControl(points);



      // grip control
      let overCoordinates = [];
      let remoteCoordinates = [];

      ["l","r"].forEach(h => {
        let point1 = e.target.jointToPoint(h, 4);
        let point2 = e.target.jointToPoint(h, 8);

        if(point1 && point2){
          let pointBetween = e.target.pointBetween(point1, point2);
          let coordinates = e.target.valueToCoordinates(pointBetween);
          coordinates.id = e.target.distanceToVarName(h,4,h,8);
          overCoordinates.push(coordinates);
  
          if(e.target.isNear(h, 4, h, 8)){
            remoteCoordinates.push(coordinates);
          }
        }

        if(remoteCoordinates.length){
          el.remoteControl(remoteCoordinates);
        } else if(overCoordinates.length){
          el.pointsOver(overCoordinates);
        }

      });
      
    });
    
  });



  window.location = "#play";

});

function getSharedLink(){
  let data = {
    title: document.querySelector("#instrument-name").value,
    name: document.querySelector("#author-name").value,
    url: document.querySelector("#demo-URL").value,
    ctrl: document.querySelector(".controllers").style.zIndex,
    xml: myCodeMirror.getValue()
  }
  let str = JSON.stringify(data);
  str = lzw_encode(str);
  return window.location.origin + window.location.pathname + "?data=" + encodeURIComponent(str);
}

function dataFromURL(){
  let indexOfQuery = window.location.hash.indexOf("?")+1;
  let queryString = window.location.hash.substr(indexOfQuery);
  let urlParams = new URLSearchParams(window.location.search);
  let dataStr = urlParams.get('data');
  if(!dataStr){return false}

  let str = decodeURIComponent(dataStr);
  str = lzw_decode(str);
  return JSON.parse(str);
}
