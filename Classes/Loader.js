const InteractionManager = require("./InteractionManager");

var audioBufferList = {};

	
class Loader {
	init(src){
		// console.log(src);
		return new Promise((resolve, reject) => {
			if(src){
				this.complete = false;
				this.href = src;
				Loader.addLoader(this);
				fetch(src)
				.then(response => resolve(response), err => {
					reject(err);
				});
				Loader.loadComplete(this);
	
			} else {
				console.error("XML load error: No source specified.");
				reject("XML load error: No source specified.");
			}
	
		});
	}
}




Loader.getPath = (url, localPath) => {
	
	let slash = "/";
	if(localPath){
		if(!localPath.endsWith(slash)){
			localPath += slash;
		}
	} else {
		localPath = "";
	}
	
	if(!url.includes(slash + slash)){
		// add local path (relative to linking document
		// to URL so relative links are relative to the current XML scope and 
		// not to the main HTML-file
		url = localPath + url; 
	}
	
	return url;
}


Loader.getFolder = path => {

	let slash = "/";
	let i = path.lastIndexOf(slash);
	return path.substring(0, i+1);
	
}


Loader.loadAudio = (src, ctx) => {
	return new Promise((resolve, reject) => {
		// Var ska uppdelningen i localPath och fileName ske?
		// Här verkar det som att loadAudio förväntar sig relativa 
		// URLs i förhållande till server root istället för XML den lokala
		// document root vilket borde gå fel.

		if(audioBufferList[src]){
			resolve(audioBufferList[src]);
		} else {
			new Loader().init(src)
			.then(response => response.arrayBuffer())
			.then(arrayBuffer => ctx.decodeAudioData(arrayBuffer,
				audioBuffer => {
					audioBufferList[src] = audioBuffer;
					resolve(audioBuffer);
				},
				e => {
					let errMess = "WebAudioXML error. File not found: " + src;
					console.error(errMess);
					reject(errMess);
				}
			));
		}
		
	});
}


Loader.loadXML = (url) => {

	return new Promise((resolve, reject) => {
		new Loader().init(url)
			.then(response => response.text())
			.then(xml => {
				let parser = new DOMParser();
				let xmlDoc = parser.parseFromString(xml,"text/xml");
				resolve(xmlDoc.firstElementChild);
			},
			e => {
					let errMess = "WebAudioXML error. File not found: " + src;
					console.error(errMess);
					reject(errMess);
				}
			);
	});
}


Loader.loadText = (url) => {

	return new Promise((resolve, reject) => {
		new Loader().init(url)
			.then(response => response.text())
			.then(txt => resolve(txt));
	});
}



Loader.loadComplete = loader => {
	if(loader){
		loader.complete = true;
	}
	Loader.checkLoadComplete();
}


Loader.checkLoadComplete = () => {
	let stillLoading = Loader.filesLoading.filter(file => file.complete == false);
		
	if(!stillLoading.length){
		document.body.classList.remove("waxml-loading");
		return true;
	}
}

Loader.addLoader = obj => {
	document.body.classList.add("waxml-loading");
	Loader.filesLoading.push(obj);
}

Loader.filesLoading = [];


module.exports = Loader;
