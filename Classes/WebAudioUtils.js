
class WebAudioUtils {



}

var rxp = /[$][{]([a-z0-9:_]+)[}]|[$]([a-z0-9:_.]*)|var[(]([a-z0-9:_]+)[)]/gi;
var rxpVal = /([a-z0-9:_\+\-\$\*\/\ \.]+)/gi;
var ENVrxp = /[€]([a-z0-9:_.]*)/gi;


WebAudioUtils.rxp = rxp;
WebAudioUtils.rxpVal = rxpVal;

WebAudioUtils.typeFixParam = (param, value) => {

	//param = param.toLowerCase();
	let arr;
	let floatVal;

	// Irriterande koll för att se om value redan är konverterad till en 
	// Watcher. Det går inte att skriva if(value instanceof Watcher)
	// för det blir en rundgång i dependencies om jag importerar klassen
	// Watcher här. Tänk istället igenom ordningen för hur hela XML-trädet
	// ska parsas så att allt sker i rätt ordning.
	if(typeof value == "object" && value.type == "watcher"){
		return value;
	}
	if(WebAudioUtils.getEnvelopeName(value)){
		return value;
	}
	if(WebAudioUtils.nrOfVariableNames(value)){
		let firstChar = value.charAt(0);
		if(firstChar == "[" || firstChar == "{"){
			// JSON array or object
			//value = WebAudioUtils.replaceVariableNames(value, '"');
			value = WebAudioUtils.wrapExpression(value);
			try {
				// multi dimensional array
				value = JSON.parse(value);
			} catch {

			}
		}
		return value;
	}

	switch(param){

		case "volume":
		case "gain":
		case "convolutionGain":
		if(typeof value == "string"){
			if(value.includes("dB") || value.includes("db")){
				value = WebAudioUtils.dbToPower(value);
			} else {
				value = parseFloat(value);
			}
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
		case "xrelease": // detta krockar med relase i WebAudioXML
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

		// waxml
		case "transitionTime":
			
		
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
		// allow for multiple values
		value.conv = conv;
		break;

		case "level":
		case "range":
		case "curve":
		case "follow":
		case "mapin":
		case "mapout":
		case "times":
		case "values":
		case "channel":
		case "dynamictimes":
		case "dynamicvalues":
		case "targetvariables":
		value = WebAudioUtils.split(value);
		break;

		case "convert":
		value = WebAudioUtils.split(value, ";");
		break;


		case "steps":
		try {
			// multi dimensional array
			value = JSON.parse(value);
		} catch {
			// single array
			value = [WebAudioUtils.split(value)];
		}
		break;

		case "value":
		// try to convert to Number if possible
		floatVal = parseFloat(value);
		if(!Number.isNaN(floatVal)){
			value = floatVal;
		}
		break;

		default:
		floatVal = parseFloat(value);
		if(!Number.isNaN(floatVal)){
			value = floatVal;
		}
		break;

	}
	return value;

}

WebAudioUtils.convert = (x=1, conv) => {
	switch (typeof conv) {
		case "number":
			return Math.pow(x, conv);
		break;
		case "string":
			return eval(str);
		break;
		default:
			return x;
	}
}

WebAudioUtils.attributesToObject = attributes => {

	var obj = {};

	if(!attributes){return obj}
	// if(!attributes.length){return obj}


	[...attributes].forEach(attribute => {
		param = WebAudioUtils.caseFixParameter(attribute.name);
		let value = WebAudioUtils.typeFixParam(param, attribute.value);
		obj[param] = value;
	});

	// for (let i in attributes){
	// 	if(attributes.hasOwnProperty(i)){

	// 		// XML parser is inconsistent with the document
	// 		// When the XML DOM is embeded inside HTML some
	// 		// browsers interpret all attributes as written
	// 		// with capital letters
	// 		let param = attributes[i].name.toLowerCase();

	// 	  	param = WebAudioUtils.caseFixParameter(param);

	// 		let value = WebAudioUtils.typeFixParam(param, attributes[i].value);
	// 		obj[param] = value;
	// 	}

	// }
	return obj;
}

WebAudioUtils.caseFixParameter = param => {

	param = param.toLowerCase();

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

		case "coneinnerangle":
		param = "coneInnerAngle";
		break;

		case "coneouterangle":
		param = "coneOuterAngle";
		break;

		case "coneoutergain":
		param = "coneOuterGain";
		break;

		case "distancemodel":
		param = "distanceModel";
		break;

		case "maxdistance":
		param = "maxDistance";
		break;

		case "orientationx":
		param = "orientationX";
		break;

		case "orientationy":
		param = "orientationY";
		break;

		case "orientationz":
		param = "orientationZ";
		break;

		case "panningmodel":
		param = "panningModel";
		break;

		case "positionx":
		param = "positionX";
		break;

		case "positiony":
		param = "positionY";
		break;

		case "positionz":
		param = "positionZ";
		break;

		case "refdistance":
		param = "refDistance";
		break;

		case "rollofffactor":
		param = "rolloffFactor";
		break;

		case "convolutiongain":
		param = "convolutionGain";
		break;

		case "transitiontime":
		param = "transitionTime";
		break;

		case "timeunit":
		param = "timeUnit";
		break;

		case "crossfade":
		param = "crossFade";
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

WebAudioUtils.dbToPower = value => {
	return Math.pow(2, parseFloat(value) / 3);
}
WebAudioUtils.split = (str, separator) => {
	if(typeof str != "string"){
		console.log(str);
	}
	separator = separator || str.includes(";") ? ";" : str.includes(",") ? "," : " ";
	let arr = str.split(separator).map(item => {
		item = item.trim();
		let i = parseFloat(item);
		return i == item ? i : item;
	});
	arr = arr.filter(item => item !== "");
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


WebAudioUtils.paramNameToRange = (name) => {
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

		case "positionX":
		case "positionY":
		case "positionZ":
		range.default = 0;
		range.min = -10;
		range.max = 10;
		range.conv = 1;
		break;

		case "coneInnerAngle":
		case "coneOuterAngle":
		case "orientationX":
		case "orientationY":
		case "orientationZ":
		range.default = 360;
		range.min = 0;
		range.max = 360;
		range.conv = 1;
		break;

		case "var":
		range.default = 50;
		range.min = 0;
		range.max = 100;
		range.conv = 1;
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

WebAudioUtils.getEnvelopeName = (str = "") => {
	if(typeof str != "string"){
		return false;
	} else {
		return [...str.matchAll(ENVrxp)].map(match => match[1]).pop();
	}
}
WebAudioUtils.replaceEnvelopeName = (str = "") => {
	return str.replaceAll(ENVrxp, () => "x");
}

WebAudioUtils.getVariableNames = (str = "") => {
	if(typeof str != "string"){
		return [];
	} else {
		return [...str.matchAll(rxp)].map(match => match[1] || match[2] || match[3]);
	}
}

WebAudioUtils.nrOfVariableNames = (str = "") => {
	// regExp
	if(typeof str != "string"){return 0};

	// ${x} || $x || var(x) -> this.getVariable(x)
	return [...str.matchAll(rxp)].length;
}

WebAudioUtils.replaceVariableNames = (str = "", q = "") => {
	if(typeof str != "string"){return 0};
	// regExp
	return str.replaceAll(rxp, (a, b, c, d, e, f) => {
		let arr = (b || c || d).split(".");
		let varName = arr[0];
		let prop = arr[1] || "value";
		return `${q}me.getVariable('${varName}').${prop}${q}`;
	});
}

WebAudioUtils.wrapExpression = (str = "", q = '"') => {
	if(typeof str != "string"){return 0};	

	return str.replaceAll(rxpVal, a => parseFloat(a) == a ? a : a == " " ? "" : q + a + q);
}

WebAudioUtils.strToVariables = (str = "", callerNode, variableType) => {
	// regExp
	// ${x} || var(x) -> this.getVariable(x)
	if(typeof str != "string"){return {}};
	let variables = {};

	[...str.matchAll(rxp)].forEach(match => {
		let variable = match[1] || match[2] || match[3];
		let parentObj = WebAudioUtils.getVariableContainer(variable, callerNode, variableType);
		variables[variable] = parentObj[variable];
	});

	return variables;
}



WebAudioUtils.getVariableContainer = (variable, callerNode, variableType) => {
	let target;
	let curNode = callerNode;
	let rootNode = curNode.getRootNode();
	variable = variable.split(".").shift();
	while(!target && curNode != rootNode){
		if(curNode.obj && curNode.obj.getVariable(variable) instanceof variableType){
			// if target is the name of a variable that is specified
			// for a parent object (at any distans from xmlNode)
			// as a dynamic variable object using the "var" element
			target = curNode.obj;
		}
		curNode = curNode.parentNode;
	}
	return target;
}


WebAudioUtils.findXMLnodes = (callerNode, attrName, str) => {
	let targets = [];
	let curNode = callerNode.parentNode;
	let rootNode = curNode.getRootNode();
	while(!targets.length && curNode != rootNode){
		targets = curNode.querySelectorAll(`:scope > Envelope[${attrName}='${str}']`);
		curNode = curNode.parentNode;
	}
	return [...targets];
}

module.exports = WebAudioUtils;
