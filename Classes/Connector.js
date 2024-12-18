

class Connector {

	constructor(xml, _ctx){

		this._xml = xml;
		this._ctx = _ctx;


		// terrible...
		// very terrible...
		if(xml.obj && xml.obj._node){
			xml.obj._node.gain.value = 0;
			this.connect(xml);
			setTimeout(() => xml.obj.fade(xml.obj._params.gain, 0.5), 1000);
		}
		
	}



	connect(xmlNode){


		let nodeName = xmlNode.nodeName.toLowerCase();
		let targetElements;

		// connect AudioParameters if specified. I.e. for FM synthesis

		if(xmlNode.obj && xmlNode.obj.parameters){
			if(xmlNode.obj._node){
				// to avoid trying to connect variables, envelopes etc.
				Object.entries(xmlNode.obj.parameters).forEach(([key, value]) => {
					if(typeof value == "string"){
						if(xmlNode.obj._node[key] instanceof AudioParam){
							let modulators = this.getTargetElements(xmlNode, value);
							if(modulators){
								modulators.forEach(modulatorNode => {
									modulatorNode.obj.output.connect(xmlNode.obj._node[key]);
								});
							}
						}
					}
				});
			}
			
			
		}
		

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
					switch (targetNode.nodeName.toLowerCase()) {
						case "#text":
						case "parsererror":
						case "var":
							continue;
							break;
						default:
					}


					switch(targetNode.nodeName.toLowerCase()){
						case "oscillatornode":
						case "audiobuffernode":
						case "synth":
						case "mixer":
						break;

						case "channelmergernode":
						// it causes connection bugs to connect incoming signals to ChannelMergers
						// children as I would like to do
						targetNode.audioObject.inputFrom(xmlNode.audioObject.input);
						break;

						case "send":
						// is this really correct? Why should "done" not be set to true?
						targetNode.audioObject.inputFrom(xmlNode.audioObject.input);
						break;

						default:
						done = true;
						targetNode.audioObject.inputFrom(xmlNode.audioObject.input);
						break;
					}
					// 2022-08-30 I try to set done=true always which means that
					// chain element input are only connected to the first audio child element
					// and only if they allow audio input.
					done = true;

				}


			}
			break;

			case "channelsplitternode":
			// connect each channel to separate child nodes
			let srcCh = 0;
			[...xmlNode.children].forEach(node => {
				xmlNode.obj.input.connect(node.obj.input, srcCh, 0);
				srcCh++;
			});
			break;

			case "parsererror":
			case "style":
			case "link":
			return;
			break;

			case "send":
			let selector = xmlNode.obj.getParameter("outputbus") || xmlNode.obj.getParameter("bus") || xmlNode.obj.getParameter("output");
			targetElements = this.getTargetElements(xmlNode, selector);
			targetElements.forEach(target => {
				xmlNode.obj._bus.connect(target.obj.input);
			});
			break;
		}


		let output = xmlNode.getAttribute("output");
		let done = false;

		if(output){

			// connect to specified node within the scope of this (external) document
			// let topElement = xmlNode.closest("[href$='.xml]") || this._xml;
			let curNode = xmlNode;
			let targetElements = [];
			switch(output){
				case "audioContext.destination":
					xmlNode.obj.connect(this._ctx.destination);
				break;

				case "none":
					console.log(xmlNode);
				break;

				case "next":
					let nextElement = xmlNode.nextElementSibling;
					if(nextElement){
						let obj = nextElement.obj;
						if(obj){
							if(obj.input){
								xmlNode.obj.connect(obj.input);
							}
						}
					} 
				break;


				case "parent":
					let parentNode = xmlNode.parentNode;
					if(parentNode){
						let obj = parentNode.obj;
						if(obj){
							if(obj.input){
								xmlNode.obj.connect(obj.input);
							}
						}
					} 
				break;

				default:
					// while(!targetElements.length && curNode != this._xml.parentNode){
					// 	targetElements = curNode.querySelectorAll(output);
					// 	curNode = curNode.parentNode;
					// }

					targetElements = this.getTargetElements(curNode, output);
		
					targetElements.forEach(target => {
						xmlNode.obj.connect(target.obj.input);
					});
				break;
			}

			

		} else {

			// connect in chain or mix

			let target;
			let parentNodeType = xmlNode.parentNode.nodeName.toLowerCase();

			switch (xmlNode.nodeName.toLowerCase()) {
				case "var":
				case "envelope":
				case "command":
				case "snapshot":
					// don't connect
					break;
				default:
				// connect


				switch(parentNodeType){

					case "mixer":
					let i = [...xmlNode.parentNode.children].indexOf(xmlNode);
					//console.log(xmlNode, "connect to mixer", i);
					xmlNode.obj.connect(xmlNode.parentNode.obj.inputs[i]);
					break;

					case "audio":
					case "voice":
					case "synth":
					case "xi:include":
					case "include":
					case "channelsplitternode":
					xmlNode.obj.connect(xmlNode.parentNode.obj._node);
					break;


					// I implement "input" for all new objects
					// that inherits from the BaseAudioObject class
					case "select":
					case "sequence":
					case "wave":
					xmlNode.obj.connect(xmlNode.obj.parent.input);
					break;
					

					case "channelmergernode":
					let trgCh = xmlNode.obj.getParameter("channel") || [[...xmlNode.parentNode.children].indexOf(xmlNode)];
					let nodeIndex = [...xmlNode.parentNode.children].indexOf(xmlNode);
					let targetInput = xmlNode.parentNode.obj.inputs[nodeIndex];
					xmlNode.obj.connect(targetInput);

					let channelCount = this._ctx.destination.channelCount; //xmlNode.parentNode.obj.inputs.length;
					
					trgCh.forEach((outputCh, i) => {
						let inputCh = i % xmlNode.obj._node.channelCount;
						outputCh = outputCh % channelCount;
						//xmlNode.obj.connect(xmlNode.parentNode.obj.inputs[outputCh % channelCount], inputCh, 0);
						//xmlNode.obj.connect(xmlNode.parentNode.obj.inputs[targetInput], inputCh, outputCh);
						let targetChannel = xmlNode.parentNode.obj.channels[outputCh];
						targetInput.connect(targetChannel, inputCh, 0);

						console.log(`childIndex: ${targetInput}, inputCh: ${inputCh}, output: ${outputCh}`);
					});
					break;

					case "chain":

					// run through following nodes to connect all
					// sends
					let targetNode = xmlNode;
					done = false;


					while(!done){

						targetNode = targetNode.nextElementSibling;

						if(!targetNode){
							// connect last object to chain output
							xmlNode.audioObject.connect(xmlNode.parentNode.audioObject._node);
							done = true;
						} else {

							switch(targetNode.nodeName.toLowerCase()){

								case "var":
								case "#text":
								// stupid way of dealing with non-audio elements. But for now...
								break;
									
								default:
								xmlNode.audioObject.connect(targetNode.audioObject.input);
								done = true;
								break;
							}
						}
					}



					// while(!done){

					// 	targetNode = targetNode.nextElementSibling;
					// 	if(!targetNode){

					// 		// connect last object to chain output
					// 		done = true;
					// 		targetNode = xmlNode.parentNode;
					// 		xmlNode.audioObject.connect(targetNode.audioObject._node);
					// 	} else {
					// 		// stupid way of dealing with non-audio elements. But for now...
					// 		if(targetNode.nodeName == "#text"){continue}
					// 		if(targetNode.nodeName.toLowerCase() == "var"){continue}

					// 		done = targetNode.nodeName.toLowerCase() != "send";
					// 		xmlNode.audioObject.connect(targetNode.audioObject.input);
					// 	}
					// }

					target = this.getNextInput(xmlNode);
					break;


					// connect to parameter input. Envelopes inside gainnode
					// case "gain":
					case "gainnode":
					xmlNode.audioObject.connect(xmlNode.parentNode.audioObject._node);
					break;

					case "#document":
					xmlNode.audioObject.connect(this._ctx.destination);
					break;

					default:
					// do not connect
					break;
				}
			}
		}
		Array.from(xmlNode.children).forEach(childNode => this.connect(childNode));

	}

	getNextInput(xmlNode){
		let nextSibling = xmlNode.nextElementSibling;
		if(nextSibling){
			if(nextSibling.obj && nextSibling.obj.input){
				return nextSibling.audioObject.input;
			} else {
				return this.getNextInput(nextSibling);
			}
		} else {
			return xmlNode.parentNode.audioObject._node;
		}

	}

	getTargetElements(curNode, selector){
		let targetElements = [];
		while(!targetElements.length && curNode != this._xml.parentNode){
			try{
				targetElements = curNode.querySelectorAll(selector);
			} catch {

			}
			
			curNode = curNode.parentNode;
		}
		return targetElements;
	}
}




module.exports = Connector;
