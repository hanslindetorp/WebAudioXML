# WebAudioXML v1.0
WebAudioXML is a javascript library that makes it possible to create Web Audio applications using XML syntax. It is a PhD research project by Hans Lindetorp. The XML syntax is a proposal for a standardized way of structuring audio node trees for Web Audio API using XML. The specification for WebAudioXML defines how to structure Audio objects in a hierarchical, modular way using XML. For integration in a web-based application, it requires WebAudioXML.js, a JavaScript library that parses the XML and creates and connects all Web Audio nodes into a tree-like structure, called an Audio Graph.

The full documentation is available from this page:
#### [Documentation](https://github.com/hanslindetorp/WebAudioXML/wiki)


### Installation
WebAudioXML is added to a web page using one line of HTML-code added to the <head>-element or at the end of the <body>. The ‘data-source’ attribute specifies the path to a WebAudioXML document.

ex. external file:
```HTML
<script src="WebAudioXML.js" data-source="audio.xml"></script>
```

The ‘data-source’ can be a relative path or an address pointing to a remote file. It is also possible to point to an embedded XML-element within the HTML-file using the ‘id’ attribute as an identifier.

ex. embedded XML:
```HTML
<xml id="WebAudioXML">
  <audio version="1.0"></audio>
</xml>

<script src="WebAudioXML.js" data-source="#WebAudioXML"></script>
```

### XMLstructure
The following shows the simplest configuration using only one OscillatorNode connected to the Web Audio destination:

```XML
<?xml version="1.0" encoding="UTF-8"?>
<audio version="1.0">
 <OscillatorNode></OscillatorNode>
</audio>
```

The structure of the XML-data follows some basic rules. The root element is named <audio> and the other elements can be either a valid Web Audio node, a Web Audio parameter or one of the following custom elements: mixer, chain, synth, voice, send, envelope or link. See the separate pages for comments on each element type.

### Native WebAudio nodes
Any valid Web Audio node can potentially be specified using WebAudioXML. The name structure follows the Web Audio API specification. Currently, the following nodes are implemented and tested:

* [AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode)
* [MediaStreamAudioSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamAudioSourceNode)
* [BiquadFilterNode](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode)
* [ConvolverNode](https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode)
* [DelayNode](https://developer.mozilla.org/en-US/docs/Web/API/DelayNode)
* [DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)
* [GainNode](https://developer.mozilla.org/en-US/docs/Web/API/GainNode)
* [OscillatorNode](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode)
* [StereoPannerNode](https://developer.mozilla.org/en-US/docs/Web/API/StereoPannerNode)
* [WaveShaperNode](https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode)

### Parameters / Attributes
Any valid Web Audio parameters can be set using attributes. The following example shows an oscillator node with type set to ‘sawtooth’ and frequency set to 880 Hz.

```XML
<?xml version="1.0" encoding="UTF-8"?>
<audio version="1.0">
 <OscillatorNode type="sawtooth" frequency="880"></OscillatorNode>
</audio>
```

Please follow the research on https://hans.arapoviclindetorp.se and https://www.facebook.com/hanslindetorpresearch/.
