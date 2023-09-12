//console.log("Mall HT2022. Version 1.2");
//iMus.debug = true;

window.addEventListener("load", e => {


    let melodyBtns = document.querySelectorAll("section.play a");
    melodyBtns.forEach(btn => {
        btn.addEventListener("pointerdown", e => {
            waxml.setVariable("melodygain", 1);
        });
        btn.addEventListener("pointerup", e => {
            waxml.setVariable("melodygain", 0);
        });
    });

    let octaveBtns = document.querySelectorAll("section#sound a.octave");
    octaveBtns.forEach(btn => {
        btn.addEventListener("pointerdown", e => {
            octaveBtns.forEach(btn => btn.classList.remove("selected"));
            e.target.classList.add("selected");
        });
    });

    let bordunBtns = document.querySelectorAll("section#sound a.drone");
    bordunBtns.forEach(btn => {
        btn.addEventListener("pointerdown", e => {
            bordunBtns.forEach(btn => btn.classList.remove("selected"));
            e.target.classList.add("selected");
        });
    });

    
    let tuningButtons = document.querySelectorAll("section#key > #tuning > .button");
    tuningButtons.forEach(btn => {
        btn.addEventListener("pointerdown", e => {
            tuningButtons.forEach(btn => btn.classList.remove("selected"));
            e.target.classList.add("selected");
            let playBtn = document.querySelector("nav #playBtn");
            playBtn.setAttribute("href", `#play-${e.target.dataset.tuning}`);
        });
    });

    let keyBtns = document.querySelectorAll("section#key > a");
    keyBtns.forEach(btn => {
        btn.addEventListener("pointerdown", e => {
            keyBtns.forEach(btn => btn.classList.remove("selected"));
            e.target.classList.add("selected");
        });
    });

    let masterTune = document.querySelector("section#key > #tuning .slider");
    masterTune.addEventListener("dblclick", e => {
        e.target.value = 0;
        e.target.dispatchEvent(new CustomEvent("input"));
    });

    document.querySelectorAll("section > a").forEach(btn => {
        btn.addEventListener("touchstart", function(event) {event.preventDefault()});
        btn.addEventListener("touchmove", function(event) {event.preventDefault()});
        btn.addEventListener("touchend", function(event) {event.preventDefault()});
        btn.addEventListener("touchcancel", function(event) {event.preventDefault()});
    });
    
});