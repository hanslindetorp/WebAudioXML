
var Loader = require('./Loader.js');
var AudioObject = require('./AudioObject.js');
var Synth = require('./Synth.js');



class Parser {

	constructor(source, waxml, callBack){

	  	this.waxml = waxml;
	  	let _ctx = this.waxml._ctx;

		this.callBack = callBack;
		this.externalFiles = [];
		this._ctx = _ctx;

		if(source){
			if(source.includes(".") || source.includes("#") || source == "xml"){
				// if check if XML is embedded in HTML
				let xml = document.querySelector(source);
				if(xml){
					this._xml = xml.firstElementChild;
				}

			}


			if(this._xml){
				this.parseXML(this._xml);
				this._xml.style.display = "none";
				this.checkLoadComplete();
			} else {

				let extFile = new Loader(source, XMLroot => {
					this._xml = XMLroot;
					let localPath = Loader.getFolder(source) || window.location.pathname;
					this.parseXML(XMLroot, localPath);
					this.checkLoadComplete();
				});
				this.externalFiles.push(extFile);
			}
		} else {
			console.error("No WebAudioXML source specified");
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
		let nodeName = xmlNode.nodeName.toLowerCase();


		if(href && !xmlNode.loaded && nodeName != "link"){

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


			switch(nodeName){

				case "parsererror":
				break;

				case "link":
				// import style if specified
				href = Loader.getPath(href, localPath);
				let linkElement = document.createElement("link");
				linkElement.setAttribute("href", href);
				linkElement.setAttribute("rel", "stylesheet");
				document.head.appendChild(linkElement);
				break;

				case "style":
				// import style if specified
				document.head.appendChild(xmlNode);
				break;

				case "synth":
				let synth = new Synth(xmlNode, this.waxml, localPath);
				xmlNode.audioObject = synth;
				xmlNode.querySelectorAll("voice, Voice").forEach(node => this.parseXML(node, localPath));
				break;

				default:
				xmlNode.audioObject = new AudioObject(xmlNode, this.waxml, localPath);
				Array.from(xmlNode.children).forEach(node => this.parseXML(node, localPath));
				break;
			}



		}


	}
}



module.exports = Parser;
