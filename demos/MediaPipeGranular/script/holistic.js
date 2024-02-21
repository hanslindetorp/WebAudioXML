const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

var holisticController = new HolisticController(canvasElement);

function onResults(results) {
    if(!results){return}

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if(results.segmentationMask){
    canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
  }
  
  holisticController.update(results);

  // Only overwrite existing pixels.
  canvasCtx.globalCompositeOperation = 'source-in';
  canvasCtx.fillStyle = '#00FF00';
  canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

  // Only overwrite missing pixels.
  canvasCtx.globalCompositeOperation = 'destination-atop';
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);

  canvasCtx.globalCompositeOperation = 'source-over';

//   if(results.poseLandmarks){
//     results.poseLandmarks = results.poseLandmarks.filter((el, i) => i > 10);
//     POSE_CONNECTIONS = POSE_CONNECTIONS.filter((el, i) => i > 10);
//   }

  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, 
    {color: '#00F', lineWidth: 3});

  drawLandmarks(canvasCtx, results.poseLandmarks,
                {color: '#FFF', lineWidth: 2});

  // drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION,
  //                {color: '#C0C0C070', lineWidth: 1});

  // drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS,
  //                {color: '#CC0000', lineWidth: 2});

  // drawLandmarks(canvasCtx, results.leftHandLandmarks,
  //               {color: '#00FF00', lineWidth: 2});

  // drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS,
  //                {color: '#00CC00', lineWidth: 2});

  // drawLandmarks(canvasCtx, results.rightHandLandmarks,
  //               {color: '#FF0000', lineWidth: 2});

  canvasCtx.restore();


}

const holistic = new Holistic({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
}});
holistic.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: true,
  refineFaceLandmarks: true,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});
holistic.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await holistic.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();