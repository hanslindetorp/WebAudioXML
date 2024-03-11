# WebAudioXML
### Web Audio Made Easy
WebAudioXML is a plugin that helps content creators without any programming experience to prototype web audio applications with ease. It reduces the time spent on development radically compared to traditional technologies and distributes to all smartphones, tablets, and computers through a single web page.


### DEMOs
https://hanslindetorp.github.io/WebAudioXML/demos/

### Tutorials
* https://www.youtube.com/playlist?list=PLQ9EtICrzxGrR-x6MWhTl7ci2orezvjtQ
* https://www.youtube.com/playlist?list=PLQ9EtICrzxGrSvOLUT9Ibgrd07ColSu8m
* https://www.youtube.com/playlist?list=PLQ9EtICrzxGqf97kn5OX5lpy-rIwx58qQ


### [Documentation](https://github.com/hanslindetorp/WebAudioXML/wiki)
A detailed documentation covering the different elements, attributes, variable mapping and audio signal routing methods.

WebAudioXML is both a specification and a parser library. It defines how to structure Audio objects in a hierarchical, modular way using XML. The integration in a web-based application requires WebAudioXML.js - a free JavaScript library that parses the XML and creates and connects all Web Audio nodes into a tree-like structure, called an Audio Graph.

WebAudioXML is a PhD research project invented and maintained by Hans Lindetorp. It's free for anyone to use, but comes with no guarantees or support. Please don't hesitate to contact me if you find the project interesting.

Best wishes,
Hans

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


### Parameters / Attributes
Any valid Web Audio parameters can be set using attributes. The following example shows an oscillator node with type set to ‘sawtooth’ and frequency set to 880 Hz.

```XML
<?xml version="1.0" encoding="UTF-8"?>
<audio version="1.0">
 <OscillatorNode type="sawtooth" frequency="880"></OscillatorNode>
</audio>
```

Please follow the research on https://hans.arapoviclindetorp.se and https://www.facebook.com/hanslindetorpresearch/.
 
### Academic publications:
* [WebAudioXML: Proposing a new standard for structuring web audio (SMC2020)](https://zenodo.org/record/3898655#.X3HgbC0zLa4)
* [Audio Parameter Mapping Made Explicit Using WebAudioXML (SMC2021)](https://www.smc2020torino.it/SMC2021_papers/SMC_2021_paper_14.pdf)
* [Putting Web Audio API To The Test: Introducing WebAudioXML As A Pedagogical Platform (WAC2021)](https://webaudioconf2021.com/paper-b-1/)
* [Sonification for everyone everywhere – Evaluating the WebAudioXML Sonification Toolkit for browsers (ICAD2021)](https://icad2021.icad.org/wp-content/uploads/2021/06/ICAD_2021_9.pdf)
