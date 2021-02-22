





class WebAudioUtils {



}



WebAudioUtils.typeFixParam = (param, value) => {

	//param = param.toLowerCase();
	let arr;

	switch(param){

		case "volume":
		case "gain":
		if(value.includes("dB") || value.includes("db")){
			value = Math.pow(2, parseFloat(value) / 3);
		} else {
			value = parseFloat(value);
		}
		break;

		case "normalize":
		case "loop":
		value = value == "true";
		break;

		// iMusic objects
		case "pan":
		case "tempo":
		case "fadeTime":
		case "loopActive":
		case "blockRetrig":
		case "repeat":
		case "release":
		case "active":

		// WebAudioXML _objects
		case "transitionTime":
		case "transitiontime":

		// Web Audio Synth
		case "voices":
		case "portamento":
		case "max":
		case "delay":



		// AudioNodes

		//filter
		case "frequency":
		case "detune":
		case "Q":

		// delay
		case "delayTime":

		// compressor
		case "threshold":
		case "knee":
		case "ratio":
		case "reduction":
		case "attack":
		case "release":

		// AudioBufferSourceNode
		case "playbackRate":
		case "loopStart":
		case "loopEnd":
		value = parseFloat(value);
		break;


		case "maxDelayTime":
		value = parseFloat(value) || 1;
		break;

		case "adsr":
		arr = WebAudioUtils.split(value);
		value = {
			attack: parseFloat(arr[0]),
			decay: parseFloat(arr[1]),
			sustain: parseFloat(arr[2]),
			release: parseFloat(arr[3])
		};
		break;

		case "map":
		// str is a comma separated string with at least four values
		// minIn, maxIn, minOut, mixOut
		// potentially also a fifth value indicating Math.power
		arr = WebAudioUtils.split(value);
		value = {};
  	value.minIn = parseFloat(arr.shift());
  	value.maxIn = parseFloat(arr.shift());
  	value.minOut = parseFloat(arr.shift());
  	value.maxOut = parseFloat(arr.shift());

		value.minIn = typeof value.minIn == "number" ? value.minIn : 0;
		value.maxIn = typeof value.maxIn == "number" ? value.maxIn : 1;
		value.minOut = typeof value.minOut == "number" ? value.minOut : 0;
		value.maxOut = typeof value.maxOut == "number" ? value.maxOut : 1;

		let conv = 1;
		if(arr.length){
			conv = arr.shift();
			let float = parseFloat(conv)
			conv = float == conv ? float : conv;
		}
		value.conv = [conv];
		break;

		case "level":
		case "steps":
		case "range":
		case "curve":
		case "follow":
		case "mapSrc":
		case "mapDest":
		case "mapCurve":
		case "mapConvert":
		value = WebAudioUtils.split(value);
		break;

		case "value":
		// try to convert to Number if possible
		let floatVal = parseFloat(value);
		if(!Number.isNaN(floatVal)){
			value = floatVal;
		}
		break;

		default:


		break;

	}
	return value;

}

WebAudioUtils.evalConvString = (x=1, str) => {
	if(!str){
		return x;
	} else {
		return eval(str);
	}
}

WebAudioUtils.attributesToObject = attributes => {

	var obj = {};

	if(!attributes){return obj}
	if(!attributes.length){return obj}



	for (let i in attributes){
		if(attributes.hasOwnProperty(i)){

			// XML parser is inconsistent with the document
			// When the XML DOM is embeded inside HTML some
			// browsers interpret all attributes as written
			// with capital letters
			let param = attributes[i].name.toLowerCase();

		  	param = WebAudioUtils.caseFixParameter(param);

			let value = WebAudioUtils.typeFixParam(param, attributes[i].value);
			obj[param] = value;
		}

	}
	return obj;
}

WebAudioUtils.caseFixParameter = param => {


	switch(param){
	  	 case "q":
	  	 param = "Q";
	  	 break;

	  	 case "delaytime":
	  	 param = "delayTime";
	  	 break;

			 case "loopend":
			 param = "loopEnd";
			 break;

			 case "loopstart":
			 param = "loopStart";
			 break;

			 case "playbackrate":
			 param = "playbackRate";
			 break;

	  	 case "maxdelaytime":
	  	 param = "maxDelayTime";
	  	 break;

  	}


  	return param;
}

WebAudioUtils.addAudioPath = (path, fileName) => {
	if(fileName.includes("//")){
		return fileName;
	}
	var pathLength = path.length;
	path = path == fileName.substr(0, pathLength) ? "" : WebAudioUtils.widthEndingSlash(path);
	return path + fileName;
}

WebAudioUtils.widthEndingSlash = (str) => {
	return str.substring(str.length-1) == "/" ? str : str + "/";
}

WebAudioUtils.MIDInoteToFrequency = note => {
	return 440 * Math.pow(2, (note - 69) / 12);
}
WebAudioUtils.split = str => {
	let separator = str.includes(",") ? "," : " ";
	let arr = str.split(separator).map(item => {
		item = item.trim();
		let i = parseFloat(item);
		return i == item ? i : item;
	});
	return arr;
}



WebAudioUtils.getParameters = node => {

	let params = [];


	Object.keys(node.__proto__).forEach(key => {

		let param = node[key];
		if(param instanceof AudioParam){

			let obj = {};
			obj.audioParam = param;
			obj.label = key;
			let attr = {};
			obj.attributes = attr;
			params.push(obj);

			obj.nodeName = "input";
			attr.type = "range";
			attr.value = param.value;

			let range = WebAudioUtils.paramNameToRange(key);
			attr.min = range.min;
			attr.max = range.max;
			attr.conv = range.conv;

			attr.step = (attr.max - attr.min) / 100;

		} else if(param instanceof String){
			console.log(key, node[key]);
		}

	});

	return params;
}


WebAudioUtils.paramNameToRange = name => {
	range = {};

	switch(name){


		case "frequency":
			range.default = 440;
			range.min = 0;
			range.max = 20000; //22050;
			range.conv = 2; //"Math.pow(10, x*3)/1000";
			break;

		case "detune":
			range.default = 0;
	  	range.min = -4800;
	  	range.max = 4800;
	  	range.conv = 1;
	  	break;

		case "Q":
		case "q":
			range.default = 0;
	  	range.min = 0;
	  	range.max = 100;
	  	range.conv = 1;
	  	break;

		case "playbackRate":
		case "playbackrate":
			range.default = 1;
	  	range.min = 0;
	  	range.max = 5;
	  	range.conv = 2;
	  	break;

		case "pan":
			range.default = 0;
	  	range.min = -1;
	  	range.max = 1;
	  	range.conv = 1;
	  	break;

		case "trigger":
			range.default = 0;
	  	range.min = 0;
	  	range.max = 30;
	  	range.conv = 1;
	  	break;

		case "gain":
			range.default = 1;
	  	range.min = 0;
	  	range.max = 4;
	  	range.conv = 2;
			break;


		default:
			range.default = 1;
	  	range.min = 0;
	  	range.max = 1;
	  	range.conv = 1;
	  	break;

	}

	return range;
}

WebAudioUtils.convertUsingMath = (x, conv) => {

}

module.exports = WebAudioUtils;
