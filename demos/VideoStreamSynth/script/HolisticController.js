
class HolisticController extends EventTarget {

    constructor(canvas){
      super();
  
      this.canvas = canvas;
      this.variables = {};
    }
  
  
    setVariable(key, val){
      this.variables[key] = val;
      waxml.setVariable(key, val);
    }

    getVariable(key){
      return this.variables[key];
    }
  
  
    update(results){
      let presence = {};
      // if(results.leftHandLandmarks || results.rightHandLandmarks){
        // store landmarks for current hand

      ["leftHand", "rightHand", "pose"].forEach(target => { //  "face"]

          let landmarks = results[`${target}Landmarks`];
          if(landmarks){
            this.setVariable(`${target}Present`, 1);
            landmarks.forEach((point, i) => {
                Object.entries(point).forEach(([key, val]) => {
                    if(typeof val !== "undefined"){
                        this.setVariable(target+i+key, val);
                    }
                    
                });
            });
          } else {
            this.setVariable(`${target}Present`, 0);
          }


      });
      
      this.dispatchEvent(new CustomEvent("update", {target: this}));
    }
  
  }
  
  