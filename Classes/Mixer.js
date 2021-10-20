
  	class Mixer {

	  	constructor(ctx, el){
		  	this.ctx = ctx;
		  	this._input = new AudioNode("gain", {}, ctx, el);
		  	this.nodes = [];
		  	this._output = new AudioNode("gain", {}, ctx, el);
		  	this._output.connect(this.ctx.destination);
		  	this.sends = {};
				this._xml = el;

				if(this._xml.parentNode.audioObject){
	        this.parent = this._xml.parentNode.audioObject;
	      }

	  	}

	  	get connection(){
		  	return this._input.node;
	  	}

	  	get input(){
		  	return this._input.node;
	  	}

	  	get output(){
		  	return this._output.node;
	  	}


	  	addNode(nodeType, params){

		  	let audioNode = new AudioNode(nodeType, params, this.ctx, this.el);

		  	switch(nodeType){
			  	case "send":
			  	this.output.connect(audioNode.node);
			  	if(params.output){
					// vad i hela friden är detta? iMus??
			  		let destination = iMus.objects[params.output];
			  		audioNode.connect(destination.input);
			  	}
			  	break;

			  	case "oscillatornode":
			  	audioNode.node.connect(this.output);
			  	this.nodes.push(audioNode);
			  	break;


			  	default:
			  	this.connect(audioNode.node);
			  	audioNode.node.connect(this.output);
			  	this.nodes.push(audioNode);
			  	break;
		  	}


		  	return audioNode;

	  	}


	  	connect(destination){
		  	destination = destination || this.output;
		  	let last = this.nodes.slice(-1).pop() || this;
		  	last.connection.disconnect(0);
		  	last.connection.connect(destination);
	  	}

	  	addSend(classList, bus){
		  	let gainObj = new AudioNode("gain", {}, this.ctx, this.el);
		  	classList.forEach(tag => addReferenceObject(tag, gainObj, this.sends));
		  	gainObj.connect(bus);
	  	}


	  	start(){
		  	this.nodes.forEach(node => {node.start()});
	  	}

	  	stop(){
		  	this.nodes.forEach(node => {node.stop()});
	  	}

			get path(){
	      return this.parent ? this.parent.path + (this._xml.className || this._xml.id || this._xml.nodeName) + "." : "";
	    }
  	}


  	module.exports = Mixer;
