
var myCodeMirror;


waxml.addEventListener("inited", () => {


  let initCodeMirror = xml => {
    let myTextArea = document.querySelector("#xml-edit");
    myCodeMirror = CodeMirror.fromTextArea(myTextArea, {
      lineNumbers: true,
      mode: "xml"
    });

    let scale = document.querySelector("main").dataset.scale;
    document.querySelectorAll(".CodeMirror-cursors, .CodeMirror-measure:nth-child(2) + div").forEach(cmObj => {
      cmObj.style.transform = `scale(${1/scale},${1/scale}) translate(0%, 0%)`;
      cmObj.style.transformOrigin = "0 0";
    });

    str = XML.prettify(xml, true);
    myCodeMirror.setValue(str);

    let stats = webAudioXML.statistics;
    let so = stats.elementCount;
    let elCnt = 0;
    let tbody = document.querySelector("#statistics tbody");
    Object.entries(so).forEach(([key, value]) => {
      if(key == "audio"){return;}
      
      let tr = document.createElement("tr");
      tbody.appendChild(tr);

      let td = document.createElement("td");
      td.innerHTML = key;
      tr.appendChild(td);

      td = document.createElement("td");
      td.innerHTML = value;
      tr.appendChild(td);

      elCnt += value;
    });
    document.querySelector("#edit #elementCount").innerHTML = elCnt || 0;
  }

  let data = dataFromURL();
  
  if(data){

    document.querySelector("#instrument-name").value = data.title || "";
    document.querySelector("#author-name").value = data.name || "";
    document.querySelector("#demo-URL").value = data.demoURL || "";

    webAudioXML.updateFromString(data.xml)
    .then(xml => initCodeMirror(xml));

  } else {
    initCodeMirror(waxml._xml);

    // webAudioXML.updateFromFile("audio-config.xml")
    // .then(xml => initCodeMirror(xml));
  }
  
  document.querySelector("navigation > #editBtn").addEventListener("click", e => {
    webAudioXML.mute();
  });

  document.querySelector("navigation > #playMusicBtn").addEventListener("click", e => {
    if(!iMusic.isPlaying()){
      iMusic.play();
    }
  });


  document.querySelector("navigation > #playBtn").addEventListener("click", e => {
    if(webAudioXML.muted){
      webAudioXML.init();
      webAudioXML.updateFromString(myCodeMirror.getValue());
      iMusic.play();
      webAudioXML.unmute();
      e.target.style.backgroundColor = "#ccf";
    } else {
      webAudioXML.mute();
      e.target.style.backgroundColor = "#fff";
    }
  });

  document.querySelector("navigation > #shareBtn").addEventListener("click", e => {

    webAudioXML.mute();

    let url = getSharedLink();  
    let outputText = document.querySelector("#shareURL");
    outputText.innerHTML = url;
    
    /* Select the text field */
    outputText.select();
    outputText.setSelectionRange(0, 99999); /* For mobile devices */

    /* Copy the text inside the text field */
    document.execCommand("copy");

    /* Alert the copied text */
    alert("Configuration data copied to clipboard");

  });


  document.querySelector("navigation select").addEventListener("change", e => {
    if(!e.target.value)return
    window.location = e.target.value;
  });


  window.location = "#play";

});

function getSharedLink(){
  let data = {
    title: document.querySelector("#instrument-name").value,
    name: document.querySelector("#author-name").value,
    url: document.querySelector("#demo-URL").value,
    xml: myCodeMirror.getValue()
  }
  let str = JSON.stringify(data);
  str = lzw_encode(str);
  return window.location.origin + window.location.pathname + "?data=" + encodeURIComponent(str);
}

function dataFromURL(){
  let indexOfQuery = window.location.hash.indexOf("?")+1;
  let queryString = window.location.hash.substr(indexOfQuery);
  let urlParams = new URLSearchParams(window.location.search);
  let dataStr = urlParams.get('data');
  if(!dataStr){return false}

  let str = decodeURIComponent(dataStr);
  str = lzw_decode(str);
  return JSON.parse(str);
}
