


class Watcher {

	constructor(xmlNode, str, callBack){
		
		
		let arr = str.split(",");
		
		
		// allow for different ways of specifying target, event and variable
		let target, variable, targetStr, event;
		if(arr.length){
			variable = arr.pop().trim();
		} else {
			console.log("Web Audio XML error. 'follow' attribute requires at least one parameter.")
			return false;
		}
		
		if(arr.length){
			// target object is an XML node closest to the calling object
			// variable is a property of WebAudioXML.
			targetStr = arr.shift().trim();
		} else {
			// target object is top XML node of this document
			// variable is a property of the audioObject connected to that XML node
			target = xmlNode.getRootNode().querySelector("audio");
		}
		
		if(arr.length){
			// target object is a DOM element
			// event to use with addEventListener
			// variable expected to be a property of the event object in the callback of addEventListener
			event = arr.shift().trim();
		}
			
		target = target || xmlNode.closest(targetStr) || document.querySelector(targetStr) || eval(targetStr);		
		
		if(target){

			
			if(target.nodeName.toLowerCase() == "audio"){
				
				// if target is an WebAudioXML-node
				
				if(target.audioObject){
					Object.defineProperty(target.audioObject, variable, {
					  get() {
						let varName = "_" + variable;
					    return this[varName];
					  },
					  set(val) {
						let varName = "_" + variable;
						if(this[varName] != val){
							this[varName] = val;
							callBack(val);
						}
					  }
					});	
					
				}
			
				

			} else if(target.addEventListener){
				
				// make sure variable starts with e. 
				if(variable.substr(0, 2) != "e."){
					if(variable.substr(0, 6) == "event."){
						variable = variable.substr(6);
					}
					variable = "e." + variable;
				}			
				
				target.addEventListener(event, e => {
					let val = eval(variable);
					if(typeof val !== "undefined"){
						callBack(val);
					} else {
						console.error("Web Audio XML Parameter follow error. Target object event does not contain variable.", variable);
					}
				});
							
			} else {
				console.error("Web Audio XML Parameter follow error. Target object does not support addEventListener.", targetStr);
			}
		} else {
			console.error("Web Audio XML Parameter follow error. Target object not found: ", targetStr);
		}
		
	}
	
	
	    
}

module.exports = Watcher;
