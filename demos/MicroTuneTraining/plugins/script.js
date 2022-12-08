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
    
});