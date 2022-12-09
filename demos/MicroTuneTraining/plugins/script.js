console.log("Mall HT2022. Version 1.2");
//iMus.debug = true;

window.addEventListener("load", e => {


    let melodyBtns = document.querySelectorAll("section#play a");
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

    let keyBtns = document.querySelectorAll("section#key a");
    keyBtns.forEach(btn => {
        btn.addEventListener("pointerdown", e => {
            keyBtns.forEach(btn => btn.classList.remove("selected"));
            e.target.classList.add("selected");
        });
    });

    document.querySelectorAll("section > a").forEach(btn => {
        btn.addEventListener("touchstart", function(event) {event.preventDefault()});
        btn.addEventListener("touchmove", function(event) {event.preventDefault()});
        btn.addEventListener("touchend", function(event) {event.preventDefault()});
        btn.addEventListener("touchcancel", function(event) {event.preventDefault()});
    });
    
});