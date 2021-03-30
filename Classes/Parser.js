
var WebAudioUtils = require('./WebAudioUtils.js');
var Loader = require('./Loader.js');
var AudioObject = require('./AudioObject.js');
var Variable = require('./Variable.js');
var Watcher = require('./Watcher.js');
var Synth = require('./Synth.js');



class Parser {

	constructor(source, waxml, callBack){

		this.elementCount = {};
		this.followCount = {};
		this.allElements = {};

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
					this._xml = XMLroot.parentNode.querySelector("Audio, audio");
					let localPath = Loader.getFolder(source) || location.href.substr(0,location.href.lastIndexOf("/")+1);
					this.parseXML(this._xml, localPath);
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
			if(this.allElements.mediastreamaudiosourcenode){
				navigator.getUserMedia({audio: true}, stream => this.onStream(stream), error => this.onStreamError(error));
			}
			this.callBack(this._xml);
		}
	}


	onStream(stream){
		this.allElements.mediastreamaudiosourcenode.forEach(inputNode => inputNode.obj.initStream(stream));
	}

	onStreamError(){
		console.warn("Audio input error");
	}




	parseXML(xmlNode, localPath){

		let href = xmlNode.getAttribute("href");
		let nodeName = xmlNode.nodeName.toLowerCase();

		this.elementCount[nodeName] = this.elementCount[nodeName] ? this.elementCount[nodeName] + 1 : 1;
		this.allElements[nodeName] = this.allElements[nodeName] || [];
		this.allElements[nodeName].push(xmlNode);



		if(href && !xmlNode.loaded && nodeName != "link"){

			href = Loader.getPath(href, localPath);
			localPath = Loader.getFolder(href);

			// if this node is external	and not yet linked
			let extFile = new Loader(href, externalXML => {

				xmlNode.loaded = true;
				this.parseXML(externalXML, localPath);

				// import audioObject and children into internal XML DOM
				xmlNode.audioObject = externalXML.audioObject;
				xmlNode.obj = xmlNode.audioObject;

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
			let parentNode = xmlNode.parentNode;
			let params = WebAudioUtils.attributesToObject(xmlNode.attributes);
			params.waxml = this.waxml;

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
				let synth = new Synth(xmlNode, this.waxml, localPath, params);
				xmlNode.audioObject = synth;
				xmlNode.obj = xmlNode.audioObject;
				xmlNode.querySelectorAll("voice, Voice").forEach(node => this.parseXML(node, localPath));
				break;

				case "var":
				let variableObj = new Variable(params);
				if(params.follow){

					new Watcher(xmlNode, params.follow, {
						waxml: this.waxml,
						variableObj: variableObj,
						callBack: val => {
							variableObj.value = val;
						}
					});
				}
				xmlNode.obj = variableObj;
				parentNode.obj.setVariable(params.name, variableObj);
				break;

				default:
				xmlNode.audioObject = new AudioObject(xmlNode, this.waxml, localPath, params);
				xmlNode.obj = xmlNode.audioObject;
				Array.from(xmlNode.children).forEach(node => this.parseXML(node, localPath));
				break;
			}

			// statistics
			let follow = xmlNode.getAttribute("follow");
			if(follow){
					this.followCount[follow] = this.followCount[follow] ? this.followCount[follow] + 1 : 1;
			}

		}


	}
}



module.exports = Parser;
