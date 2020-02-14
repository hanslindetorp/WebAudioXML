/*
MIT License

Copyright (c) 2020 hanslindetorp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


var Parser = require('./Parser.js');
var Connector = require('./Connector.js');

var source = document.currentScript.dataset.source;


class WebAudio {
	
	constructor(_ctx){
		
		if(!_ctx){
			
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			if (AudioContext) {
					// Web Audio API is available.
					_ctx = new AudioContext();	
			} else {
				console.error("This browser does not support Web Audio API");
			}

		}
	
			
		this._ctx = _ctx;
		
		if(source){
			window.addEventListener("load", () => {
				new Parser(source, _ctx, xmlDoc => {
					this._xml = xmlDoc;
					new Connector(xmlDoc, _ctx)
				});
			});
		} else {
			console.error("No WebAudioXML source specified")
		}
		
	}
	
	
	start(){
		this._xml.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.start());
	}
	
	stop(){
		this._xml.querySelectorAll("*").forEach(XMLnode => XMLnode.audioObject.stop());
	}
	
		
		
}


let webAudioXML = new WebAudio(); 
var ctxInited = false;
document.addEventListener("mousedown", e => {
	if(!ctxInited){
		ctxInited = true;
		webAudioXML._ctx.resume();
	}
	webAudioXML._xml.audioObject.mousedown = 1;
});
document.addEventListener("mouseup", e => webAudioXML._xml.audioObject.mousedown = 0);

window.webAudioXML = webAudioXML;
module.exports = WebAudio;



/*
	
	Test: Files on remote servers
	
*/