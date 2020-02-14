
var Loader = require('./Loader.js');
var AudioObject = require('./AudioObject.js');
var Synth = require('./Synth.js');


	
class Parser {
		  	
	constructor(source, _ctx, callBack){
		
		this.callBack = callBack;
		this.externalFiles = [];
		this._ctx = _ctx;
		
		if(source){
			if(!source.includes("/")){
				this._xml = document.querySelector(source);
			}
			
			
			if(this._xml){
				this.parseXML(this._xml);
			} else {
					
				let extFile = new Loader(source, XMLroot => {
					this._xml = XMLroot;
					let localPath = Loader.getFolder(source);
					this.parseXML(XMLroot, localPath);
					this.checkLoadComplete();
				});
				this.externalFiles.push(extFile);
			}
		} else {
			console.error("No WebAudioXML source specified")
		}			
	}
	
	checkLoadComplete(){
		let loading = this.externalFiles.find(file => file.complete == false);
		if(!loading){
			this.callBack(this._xml);
		}
	}
	
	parseXML(xmlNode, localPath){
		
		let href = xmlNode.getAttribute("href");
		if(href && !xmlNode.loaded){
			
			href = Loader.getPath(href, localPath);
			localPath = Loader.getFolder(href);
			
			// if this node is external	and not yet linked
			let extFile = new Loader(href, externalXML => {
				
				xmlNode.loaded = true;
				this.parseXML(externalXML, localPath);
				
				// import audioObject and children into internal XML DOM
				xmlNode.audioObject = externalXML.audioObject;
				Array.from(externalXML.children).forEach(childNode => {
					if(childNode.nodeName.toLowerCase() != "parsererror"){
						xmlNode.appendChild(childNode);
					}
					
				});
				
				this.checkLoadComplete();
			});
			this.externalFiles.push(extFile);
			
		} else {
			
			// if this node is internal	
			let nodeType = xmlNode.nodeName.toLowerCase();
			
			switch(nodeType){
				
				case "parsererror":
				break;
				
				case "synth":
				let synth = new Synth(xmlNode, this._ctx, localPath);				
				xmlNode.audioObject = synth;
				xmlNode.querySelectorAll("voice").forEach(node => this.parseXML(node, localPath));
				break;
				
				default:
				xmlNode.audioObject = new AudioObject(xmlNode, this._ctx, localPath);
				Array.from(xmlNode.children).forEach(node => this.parseXML(node, localPath));				
				break;
			}

			
		
		}
		
		
	}
}
  	

  	
module.exports = Parser;
