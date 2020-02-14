
var WebAudioUtils = require('./WebAudioUtils.js'); 
var Watcher = require('./Watcher.js'); 

class Synth{
  	
  	
	constructor(xmlNode, _ctx, localPath){
		this._xml = xmlNode;
		this._ctx = _ctx;
		this._localPath = localPath;
		
		this._params = WebAudioUtils.attributesToObject(xmlNode.attributes);
		this._voices = this._params.voices || 1;
		this._voiceID = 0;
		
		this._node = this._ctx.createGain();
		this._node.gain.value = 1/this._voices;
	  	console.log(xmlNode.nodeName, this._node.__resource_id__);
		
		// duplicate XML nodes until there are correct number of voices
		this.voiceNodes = this._xml.children;
		let voiceNodeCount = xmlNode.querySelectorAll("voice").length;
		
		this.hasEnvelope = xmlNode.querySelectorAll("envelope").length > 0;
		
		if(voiceNodeCount){
			let curID = 0;
			while(this._xml.children.length < this._voices){
				let targetNode = this._xml.children[curID];
				if(targetNode.nodeName.toLowerCase() != "voice"){continue}
				
				let newNode = targetNode.cloneNode(true);
				this._xml.appendChild(newNode);
				curID++;
			}
			this.voiceNodes = xmlNode.querySelectorAll("voice");
		} else {
			console.error("Web Audio XML error. Voice node(s) are missing in Synth node.");
		}
				
		
		this.watcher = new Watcher(xmlNode, this._params.follow, note => {
			if(note[0]){
				this.noteOn(note[1]);
			} else {
				this.noteOff(note[1]);
			}
		});

		
	}
	
	
	connect(destination){
	  	
	  	if(this._node){
		  	if(this._node.connect){
			  	destination = destination || this._ctx.destination;
			  	this._node.connect(destination);
			  	this.destination = destination;
		  	}
	  	}
	  	
  	}
	
	
	noteOn(note, vel=1){
		
		let voiceNode = this.nextVoice;
		voiceNode.MIDInote = note;
		
		let data = {note:note, vel:vel, portamento: this.portamento};
		voiceNode.audioObject.start(data);
		voiceNode.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.start(data));
		
	}
	
	
	noteOff(note, vel=1){
		let voiceNode = this.noteToVoice(note);
		
		let data = {note:note, vel:vel};
		if(!this.hasEnvelope){voiceNode.audioObject.stop(data)};
		voiceNode.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.stop(data));
		voiceNode.MIDInote = 0;
	}
	
	
	get nextVoice(){
		
		return this.voiceNodes[this._voiceID++ % this._voices];		
		
	}
	
	noteToVoice(note){
		return Array.from(this.voiceNodes).find(voiceNode => voiceNode.MIDInote == note);
	}
	
	
}
	
module.exports = Synth;