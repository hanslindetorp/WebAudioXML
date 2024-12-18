
var WebAudioUtils = require('./WebAudioUtils.js');
var Loader = require('./Loader.js');
var AudioObject = require('./AudioObject.js');
var Variable = require('./Variable.js');
var Envelope = require('./Envelope.js');
var Command = require('./Command.js');
var Watcher = require('./Watcher.js');
var Synth = require('./Synth.js');
const SnapshotComponent = require('./variable-matrix/SnapshotComponent.js');

const Select = require('./Select.js');
const Sequence = require('./musical-structure/Sequence.js');
const Wave = require('./musical-structure/Wave.js');
const Slice = require('./musical-structure/Slice.js');



class Parser {

	constructor(waxml){

		this.elementCount = {};
		this.followCount = {};
		this.allElements = {};

		this.waxml = waxml;
		this._ctx = this.waxml._ctx;

		// Loader.callBack = () => {
		// 	// snyggare att lyfta ut till en egen class 
		// 	if(this.allElements.mediastreamaudiosourcenode){
		// 		navigator.getUserMedia({audio: true}, stream => this.onStream(stream), error => this.onStreamError(error));
		// 	}
		// 	//callBack(this._xml);
		// }
		
	}

	init(source){
		return new Promise((resolve, reject) => {
			this.loadXML(source)
			.then(xmlNode => {
				console.log(`Parser.init done - ${xmlNode.localName}`);
				return resolve(this.parseXML(xmlNode));
			});
		});

	}

	initFromString(str){
		return new Promise((resolve, reject) => {
			this.XMLstring = str;
			let parser = new DOMParser();
			let xml = parser.parseFromString(str,"text/xml");
			this._xml = xml.firstElementChild;
			if(this._xml.firstElementChild.tagName == "parsererror"){
				alert(this._xml.firstElementChild.textContent);
				reject(this._xml);
			} else {
				this.parseXML(this._xml);
				resolve(this._xml);
			}
			
		});
	}


	loadXML(source){

		return new Promise((resolve, reject) => {
		

			if(source){
				if(document.querySelector("xml")){
					if((source.includes(".") || source.includes("#") || source == "xml") && !(source.includes("/"))){
						// if check if XML is embedded in HTML
						this._xml = document.querySelector(source);
					}
				}
				


				if(this._xml){
					// embedded <XML> element inside HTML or already initialized
					this.parseXML(this._xml.firstElementChild);
					if(this._xml.style){
						this._xml.style.display = "none";
					}
					//Loader.checkLoadComplete();
				} else {
					// external file(s)
					// let localPath = Loader.getFolder(source) || location.href.substr(0,location.href.lastIndexOf("/")+1);
					
					let path = source.split("/");
					source = path.pop();
					let localPath = path.join("/");
					localPath = localPath ? `${localPath}/` : "";
					
					this._xml = document.implementation.createDocument(null, null);
					this.linkExternalXMLFile(this._xml, source, localPath)
					.then((xmlNode) => {
						// return root <Audio> element
						return resolve(this._xml.firstElementChild);
					});
				}
			} else {
				console.error("No WebAudioXML source specified");
			}

		});

	}

	
	linkExternalXMLFile(parentXML, src, localPath){
		// console.log("linkExternalXMLFile", parentXML.localName, src, localPath);

		return new Promise((resolve, reject) => {

			let url = localPath + src;
			localPath = Loader.getFolder(url);
			Loader.loadXML(url)
			.then((externalXML) => {
				
				externalXML.setAttribute("localpath", localPath);
				return resolve(this.appendXMLnode(parentXML, externalXML, localPath));
			});
			
		});

	}


	linkExternalAttributes(parentNode, curNode, localPath){

		return new Promise((resolve, reject) => {


			let linkedAttributes = [];
			switch(curNode.localName.toLowerCase()){
				case "audioworkletnode":
				// let the AudioObject handle linking
				break;

				default:
				linkedAttributes = [...curNode.attributes]
				.filter(attr => attr.value.includes(".txt") 
					|| attr.value.includes(".csv")
					|| attr.value.includes(".js"));

				
				break;
			}
			let cnt = linkedAttributes.length;
			if(cnt){
				linkedAttributes.forEach(attr => {
					let fileName, args;
					let fnCallIncluded =  attr.value.substr(-1) == ")";
					if(fnCallIncluded){	
						let matches = [...attr.value.matchAll(/\(([^\)]+)\)/g)];
						fileName = matches[0][1];
						args = matches[1][1];
						let argsValue = eval(args);
						if(typeof argsValue != "undefined"){
							args = argsValue;
						}
					} else {
						fileName = attr.value;
					}
					Loader.loadText(localPath + fileName)
					.then(txt => {
						if(attr.value.includes(".js")){
							if(fnCallIncluded){
								// execution of external function is included in the 
								// attribute (including (optional) arguments)
								attr.value = eval(txt)(args);
							} else {
								let fn = eval(txt);
								attr.value = fn instanceof Function ? fn() : "";
							}
						} else {
							attr.value = txt;
						}
						
						if(!--cnt){
							// count down to see if all linked attributes are 
							// loaded
							return resolve(curNode);
						}
						
					});
				});
			} else {
				return resolve(curNode);
			}

		});
	}



	appendXMLnode(parentNode, curNode, localPath){

		parentNode = parentNode.appendChild(curNode);

		return new Promise((resolve, reject) => {



			// FIRST LINK ATTRIBUTES (if external)
			this.linkExternalAttributes(parentNode, curNode, localPath)
			
			.then(xmlNode => {
			
				// THEN LINK THE WHOLE NODE (if external)

				if(curNode.localName == "include"){
					let href = curNode.getAttribute("href");
					this.linkExternalXMLFile(curNode, href, localPath)
					.then(xmlNode => {
						return resolve(xmlNode);
					});
				} else if(curNode.children.length){

					// APPEND CHILDREN (if any)
					let cnt = curNode.children.length;
					Array.from(curNode.children).forEach(childNode => {

						if(childNode.nodeName.toLowerCase() != "parsererror"){
							this.appendXMLnode(parentNode, childNode, localPath)
							.then(xmlNode => {
								// countdown to see if all children are linked before 
								// resolving promise
								if(!--cnt){return resolve(xmlNode);}
							});
						}
					});
				} else {

					// IF NO CHILDREN -> resolve
					return resolve(xmlNode);
				}

			});

		});
	}



	appendXMLnode_Backup(parentNode, curNode, localPath){

		parentNode = parentNode.appendChild(curNode);

		return new Promise((resolve, reject) => {
			
			let cnt = curNode.children.length;

			if(curNode.localName == "include"){
				let href = curNode.getAttribute("href");
				this.linkExternalXMLFile(curNode, href, localPath)
				.then(xmlNode => {
					return resolve(xmlNode);
				});
			} else if(curNode.children.length){

				
				Array.from(curNode.children).forEach(childNode => {

					if(childNode.nodeName.toLowerCase() != "parsererror"){
						this.appendXMLnode(parentNode, childNode, localPath)
						.then(xmlNode => {
							// countdown to see if all children are linked before 
							// resolving promise
							if(!--cnt){return resolve(xmlNode);}
						});
					}
				});
			} else {
				// link external attribute files if needed
				let linkedAttributes = [];
				switch(curNode.localName.toLowerCase()){
					case "audioworkletnode":
					// let the AudioObject handle linking
					break;

					default:
					linkedAttributes = [...curNode.attributes]
					.filter(attr => attr.value.includes(".txt") 
						|| attr.value.includes(".csv")
						|| attr.value.includes(".js"));
	
					
					break;
				}
				cnt = linkedAttributes.length;
				if(cnt){
					linkedAttributes.forEach(attr => {
						let fileName, args;
						let fnCallIncluded =  attr.value.substr(-1) == ")";
						if(fnCallIncluded){	
							let matches = [...attr.value.matchAll(/\(([^\)]+)\)/g)];
							fileName = matches[0][1];
							args = matches[1][1];
							let argsValue = eval(args);
							if(typeof argsValue != "undefined"){
								args = argsValue;
							}
						} else {
							fileName = attr.value;
						}
						Loader.loadText(localPath + fileName)
						.then(txt => {
							if(attr.value.includes(".js")){
								if(fnCallIncluded){
									// execution of external function is included in the 
									// attribute (including (optional) arguments)
									attr.value = eval(txt)(args);
								} else {
									let fn = eval(txt);
									attr.value = fn instanceof Function ? fn() : "";
								}
							} else {
								attr.value = txt;
							}
							
							if(!--cnt){
								// count down to see if all linked attributes are 
								// loaded
								return resolve(curNode);
							}
							
						});
					});
				} else {
					return resolve(curNode);
				}
				
			}

		});
		// console.log(`curNode: ${curNode.localName}, waitForExternalFile = ${waitForExternalFile}`);
	}












	parseXML(xmlNode, localPath){

		// OBS!! Jag tror att localPath kan OCH BÖR tas bort ur parseXML(). Det är ett arv från tiden
		// innan all länkning av externa filer gjordes först, men det kräver en noggrann kontroll
		// av anropen nedan som f.n. använder localPath. Det bästa vore nog att spara localPath som 
		// ett attribute på varje XML-node eller audio object så att parsern hittar rätt ljudfil.

		// Run through the entire XML structure, build AudioObjects for all elements and
		// connect them with the XML nodes. This is inventive but maybe not the best 
		// way to do it. It would be better to leave the XML object when storing the structure
		// internally.

		// console.log("parserXML", xmlNode, localPath);
		// let href = xmlNode.getAttribute("href");
		let nodeName = xmlNode.nodeName.toLowerCase();

		this.elementCount[nodeName] = this.elementCount[nodeName] ? this.elementCount[nodeName] + 1 : 1;
		this.allElements[nodeName] = this.allElements[nodeName] || [];
		this.allElements[nodeName].push(xmlNode);
	

		// if this node is internal
		let parentNode = xmlNode.parentNode;
		let params = WebAudioUtils.attributesToObject(xmlNode.attributes);

		// check if any parameter needs to be replaced with a Variable object

		let variableObj;

		Object.keys(params).forEach(key => {
			let param = params[key];
			if(typeof param == "string"){
				if(WebAudioUtils.nrOfVariableNames(param)){
					//variableObj = new Variable(xmlNode, {waxml: this.waxml});
					
					params[key] = new Watcher(xmlNode, param, {
						waxml: this.waxml,
						callBack: (val, time) => {
							if(xmlNode.obj){
								switch(xmlNode.obj._nodeType){

									case "envelope":
									// envelopes shall not be updated directly
									// from watcher, but get their values upon
									// triggering
									break;

									default:
									// Det är dumt att den här kopplingen 
									// är skriven i parsern
									// Det borde ligga i object-klassen

									// Sort out the differences between setting an audio parameter directly
									// or silently referring to a javascript value stored in the Watcher
									// The current system (per 2024-04-17) is really a mixture of various 
									// tryouts.
									if(typeof time == "undefined"){
										time = xmlNode.obj.getParameter("transitionTime");
									}
									switch(key){
										case "mix":
										case "selectindex":
										xmlNode.obj[key] = val;
										break;

										default:
										// double check that the target can be set using setTargetAtTime()
										if(xmlNode.obj.setTargetAtTime){
											xmlNode.obj.setTargetAtTime(key, val, 0, time);
										}
										break;
									}
									
									break;
								}
								
								//xmlNode.obj[key] = val;
							}
						}
					});
					//params[key] = variableObj;
				}
			} else if(param instanceof Array){
				// clumpsy structure to support multi-dimensional arrays, I know...
				param.forEach((value, i) => {
					if(typeof value == "string"){
						if(WebAudioUtils.nrOfVariableNames(value)){
							//variableObj = new Variable(xmlNode, {waxml: this.waxml});
							params[key][i] = new Watcher(xmlNode, value, {
								waxml: this.waxml,
								callBack: (val, time) => {
									if(xmlNode.obj){
										xmlNode.obj.setTargetAtTime(key, val, 0, time);
										//xmlNode.obj[key] = val;
									}
								}
							});
							//params[key][i] = variableObj;
						}
					} else if(value instanceof Array){
						value.forEach((item, j) => {
							if(typeof item == "string"){
								if(WebAudioUtils.nrOfVariableNames(item)){
									//variableObj = new Variable(xmlNode, {waxml: this.waxml});
									params[key][i][j] = new Watcher(xmlNode, item, {
										waxml: this.waxml,
										callBack: (val, time) => {
											if(xmlNode.obj){
												xmlNode.obj.setTargetAtTime(key, val, 0, time);
												//xmlNode.obj[key] = val;
											}
										}
									});
									//params[key][i][j] = variableObj;
								}
							}
						});
					}
				});
			}
		});


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
			variableObj = new Variable(xmlNode, params);
			if(params.follow){

				this.watcher = new Watcher(xmlNode, params.follow, {
					waxml: this.waxml,
					callBack: (val, time) => {
						variableObj.setValue(val, time);
					}
				});
			} else if (WebAudioUtils.nrOfVariableNames(params.value)) {
				this.watcher = new Watcher(xmlNode, params.value, {
					waxml: this.waxml,
					variableObj: variableObj,
					containsVariableNames: true,
					callBack: (val, time) => {
						variableObj.setValue(val, time);
					}
				});
			}
			xmlNode.obj = variableObj;
			let target;
			// if(parentNode.nodeName.toLowerCase() == "audio"){
			// 	// top level - should be properly merged with this.waxml
			// 	target = this.waxml;
			// } else {
			// 	target = parentNode.obj;
			// }
			target = parentNode.obj;
			target.setVariable(params.name, variableObj);
			break;

			case "snapshot":
			xmlNode.obj = new SnapshotComponent(xmlNode);
			this.waxml.addSnapshot(xmlNode.obj);
			break;

			case "envelope":
			xmlNode.obj = new Envelope(xmlNode, this.waxml, params);
			break;

			case "select":
			xmlNode.obj = new Select(xmlNode, this.waxml, params);
			Array.from(xmlNode.children).forEach(node => this.parseXML(node, localPath));
			break;

			case "sequence":
			xmlNode.obj = new Sequence(xmlNode, this.waxml, params);
			Array.from(xmlNode.children).forEach(node => this.parseXML(node, localPath));
			break;

			case "wave":
			xmlNode.obj = new Wave(xmlNode, this.waxml, params);
			Array.from(xmlNode.children).forEach(node => this.parseXML(node, localPath));
			break;

			case "slice":
			xmlNode.obj = new Slice(xmlNode, this.waxml, params);
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

		return this._xml.firstElementChild;

	}

	set XMLstring(str){
		if(str){
			this._XMLstring = str;
		}		
	}

	get XMLstring(){
		return this._XMLstring;
	}


	createObject(xmlNode){
		let params = WebAudioUtils.attributesToObject(xmlNode.attributes);
		let obj;
		switch(xmlNode.nodeName.toLowerCase()){
			case "envelope":
			obj = new Envelope(xmlNode, this.waxml, params);
			break;

			case "command":
			obj = new Command(params, this.waxml);
			break;

			default:
			obj = new AudioObject(xmlNode, this.waxml, "", params);
			break;
		}
		return obj;
	}


}



module.exports = Parser;
