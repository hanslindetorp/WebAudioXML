
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
  
  
    update(results){
  
      // store landmarks for current hand

        ["leftHand", "rightHand", "face", "pose"].forEach(target => {

            let landmarks = results[`${target}Landmarks`];
            if(landmarks){
                landmarks.forEach((point, i) => {
                    Object.entries(point).forEach(([key, val]) => {
                        if(typeof val !== "undefined"){
                            this.setVariable(target+i+key, val);
                        }
                        
                    });
                });
            }
        });
      
        this.dispatchEvent(new CustomEvent("update", {target: this}));
    }
  
  }
  
  