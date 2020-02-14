	

	
	


class WebAudioUtils {



}



WebAudioUtils.typeFixParam = (param, value) => {

		
	switch(param){
		
		case "volume":
		case "gain":
		if(value.includes("dB")){
			value = Math.pow(2, Number(value.split("dB")[0]) / 3);
		} else {
			value = Number(value);
		}
		break;
		
		case "normalize":
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
		
		
		// Web Audio Synth
		case "voices":
		case "portamento":
		case "max":
		
		
		
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
		value = Number(value);
		break;
		
		
		
		case "ADSR":
		let arr = value.split(",");
		value = {
			attack: Number(arr[0]),
			decay: Number(arr[1]),
			sustain: Number(arr[2]),
			release: Number(arr[3])
		};
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
			let param = attributes[i].name;
			let value = WebAudioUtils.typeFixParam(param, attributes[i].value);
			obj[param] = value;
		}
		
	}
	return obj;
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

module.exports = WebAudioUtils;
