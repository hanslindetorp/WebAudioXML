
	
class Connector {
		  	
	constructor(xml, _ctx){
		
		this._xml = xml;
		this._ctx = _ctx;
		this.connect(xml);			
	}
	
	
	
	connect(xmlNode){
		
		
		let nodeName = xmlNode.nodeName.toLowerCase();
		switch(nodeName){
			case "chain":
			// connect chain input to first element in chain
			let done = false;
			let targetNode;
			while(!done){
				if(!targetNode){
					targetNode = xmlNode.firstChild;
				} else {
					targetNode = targetNode.nextElementSibling;
				}
				
				
				if(!targetNode){
					// no children - connect to chain's output
					done = true;
					xmlNode.audioObject.input.connect(xmlNode.audioObject._node);
				} else {
					if(targetNode.nodeName == "#text"){continue}
					if(targetNode.nodeName == "parsererror"){continue}
					
					switch(targetNode.nodeName.toLowerCase()){
						case "send":
						case "oscillatornode":
						case "audiobuffernode":
						break;
						
						default:
						done = true;
						targetNode.audioObject.inputFrom(xmlNode.audioObject.input);
						break;
					}
					
				}
				

			}
			break;
			
			case "parsererror":
			return;
			break;
		}
			
		
		let output = xmlNode.getAttribute("output");
		if(output){
			
			// connect to specified node within the scope of this (external) document
			let topElement = xmlNode.closest("[href$='.xml]") || this._xml;
			topElement.querySelectorAll(output).forEach(target => {
				xmlNode.audioObject.connect(target.audioObject.input);
			});
			
		} else {
			
			// connect in chain or mix
			
			let target;
			let parentNodeType = xmlNode.parentNode.nodeName.toLowerCase();
			switch(parentNodeType){
				
				
				case "mixer":
				case "audio":
				case "voice":
				case "synth":
				xmlNode.audioObject.connect(xmlNode.parentNode.audioObject._node);
				break;
				
				case "chain":
				
				// run through following nodes to connect all
				// sends 
				let targetNode = xmlNode;
				let done = false;
				
				while(!done){
					targetNode = targetNode.nextElementSibling;
					
					if(!targetNode){
						
						// connect last object to chain output
						done = true;
						targetNode = xmlNode.parentNode;
						xmlNode.audioObject.connect(targetNode.audioObject._node);
					} else {
						if(targetNode.nodeName == "#text"){continue}
						done = targetNode.nodeName.toLowerCase() != "send";
						xmlNode.audioObject.connect(targetNode.audioObject.input);
					}
					
					
				}
				
				target = this.getNextInput(xmlNode);
				break;
				
				
				// connect to parameter input
				case "gain":
				xmlNode.audioObject.connect(xmlNode.parentNode.audioObject._node);
				break;
				
				default:
				xmlNode.audioObject.connect(this._ctx.destination);
				break;
			}		
			
			
			
		
		}
		Array.from(xmlNode.children).forEach(childNode => this.connect(childNode));
		
	}
	
	getNextInput(xmlNode){
		let nextSibling = xmlNode.nextElementSibling;
		if(nextSibling){
			if(nextSibling.audioObject.input){
				return nextSibling.audioObject.input;
			} else {
				return this.getNextInput(nextSibling);
			}
		} else {
			return xmlNode.parentNode.audioObject._node;
		}

	}
}
  	


  	
module.exports = Connector;
