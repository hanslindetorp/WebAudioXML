let y = 0;
let ticking = false;


// p5js
function setup() {};
function draw() {};


// scroll control
document.addEventListener("scroll", (event) => {
  y = window.scrollY;

  if (!ticking) {
    window.requestAnimationFrame(() => {
        let relScroll = y/(document.body.clientHeight-window.innerHeight);
        relScroll = Math.min(1, relScroll);
        waxml.setVariable("mix",  relScroll);
        // document.querySelector(".scrollY").innerHTML = (relScroll*100).toFixed(0);
        ticking = false;
    });

    ticking = true;
  }
});

// start music
window.addEventListener("DOMContentLoaded", e => {
    document.body.addEventListener("pointerdown", e => {
        iMusic.start("A");
    });
});