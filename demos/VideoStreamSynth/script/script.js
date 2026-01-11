const calibrateBtn = document.querySelector("#calibrateBtn");
const keyboard = document.querySelector("#key-selector");
const inputSelector = document.querySelector("#input-selector");
const soundSelector = document.querySelector("#sound-selector");
const keyIndicator = document.querySelector("#key-indicator");

var noteListVariable;
const inputSelectors = [];

waxml.addEventListener("inited", () => {

  document.querySelector("navigation > #playMusicBtn").addEventListener("click", e => {
    if(waxml.musicEngine && !waxml.musicEngine.isPlaying()){
      waxml.musicEngine.play();
    }
    if(e.target.checked){
      waxml.unmute();
    } else {
      waxml.mute();
    }
  });
  waxml.mute();
  noteListVariable = waxml.querySelector("var[name='frequency']");


  calibrateBtn.addEventListener("pointerdown", e => {
    waxml.querySelectorAll("var").forEach(element => {
      element.initCalibrateInputRange();
    });
  });
  calibrateBtn.addEventListener("pointerup", e => {
    waxml.querySelectorAll("var").forEach(element => {
      element.finishCalibrateInputRange();
    });
  });

  keyboard.pressedKeys = [60,62,64,67,69,72];

	// update selected notes
	keyboard.addEventListener("up", e => {
		let selectedNotes = e.target.pressedKeys;
    noteListVariable.mapout = e.target.pressedKeys;
    console.log(selectedNotes);

	});

  // move keyIndicator to correct position to 
  // indicate the current position on the keyboard
  waxml.querySelector("var[name='frequency']").addEventListener("change", e => {
    let rect = keyboard.keyToClientRect(e.target.value);
		let x = rect.x + rect.width / 2; 
		let y = rect.y + rect.height / 2;
    keyIndicator.style.left = x;
    keyIndicator.style.top = y;
  });

  waxml.querySelectorAll(".input-selector").forEach(el => {

    let key = el.name;
    inputSelectors.push(key);

    let opt = document.createElement("option");
    opt.setAttribute("value", key);

    var a,b;

    switch(key.substr(0,2)){
      case "rh":
        a = "Höger hand";
        break;
      case "lh":
        a = "Vänster hand";
        break;
      case "ns":
        a = "Näsa";
        break;
      case "lw":
        a = "Vänster handled";
        break;
      case "rw":
        a = "Höger handled";
        break;
      default:
        a = "";
    }

    switch(key[2]){
      case "y":
        b = "vertikal";
        break;
      case "x":
        b = "horsontell";
        break;
      case "2":
        b = "horsontell/vertikal";
        break;
      default:
        b = "";
    }
    opt.innerHTML = `${a} ${b}`;
    inputSelector.appendChild(opt);


  });
  

});



soundSelector.addEventListener("change", e => {
  waxml.setVariable("sound", e.target.selectedIndex);
});


inputSelector.addEventListener("change", e => {

  inputSelectors.forEach((key, i) => {
    waxml.setVariable(key, e.target.selectedIndex == i ? 1 : 0);
  });

});
