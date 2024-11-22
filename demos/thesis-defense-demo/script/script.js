

const socket = io();
var noSleep = new NoSleep();

socket.on('connect', () => {
    socket.emit("addClient");
});

socket.on('serverToClient', (msg) => {
    // document.querySelector(".output").innerHTML = `${msg.value || ""}`;



    switch(msg.command){

        case "midinote":
            waxml.setVariable("key", msg.value.key);
            waxml.setVariable("padGate", msg.value.gain);
           

            let noteName = typeof msg.value.key == 'undefined' ? "" : ["C","C#","D","D#","E","F","F#","G","G#","A","Bb","B"][msg.value.key % 12];
            document.querySelector(".note-name").innerHTML = noteName;
        break;

        case "midinoteoff":
            waxml.setVariable("padGate", 0);
        break;

        case "filterControl":
            waxml.setVariable("filter", msg.value)
        break;

        case "set-mode":
            window.location = `#${msg.value}`;
            switch(msg.value){
                case "solo":
                    waxml.setVariable("solo", 1);
                    waxml.setVariable("pad", 0);
                break;

                case "pad":
                    waxml.setVariable("solo", 0);
                    waxml.setVariable("pad", 1);
                break;
            }
        break;
    }
});

waxml.addEventListener("inited", () => {

    // draw solo buttons
    let keys = [69, 73, 74, 76, 77, 79, 81];
    let bw = 150;
    let w = 600;
    let c = w / 2 - bw / 2;
    let r = w / 3;
    let nrOfButtons = keys.length;
    let targetEl = document.querySelector("#solo .buttonContainer");

    for(let i = 0; i < nrOfButtons; i++){
        let x = Math.PI*i/nrOfButtons*2;
        let l = Math.sin(x);
        let t = Math.cos(x);

        let btn = document.createElement("a");
        btn.classList.add("button");
        btn.style.left = `${l*r}px`;
        btn.style.top = `${t*r}px`;
        btn.style.width = `${bw}px`;
        btn.style.height = `${bw}px`;

        targetEl.appendChild(btn);

        btn.addEventListener("pointerdown", e => {
            waxml.setVariable("key", keys[i]);
            waxml.setVariable("soloGate", 1);
            console.log("key", keys[i]);
        });
        btn.addEventListener("pointerup", e => {
            waxml.setVariable("soloGate", 0);
        });
    }

    document.querySelector("#initBtn").addEventListener("click", e => {
        document.body.style.touchAction = "none";
        waxml.init();
        noSleep.enable();
    });
    

    // window.location = "#solo";
    window.location = `#${document.querySelector("main > section").getAttribute("id")}`;

    // requestWakeLock();


});

// The wake lock sentinel.
let wakeLock = null;

// Function that attempts to request a screen wake lock.
const requestWakeLock = async () => {
    try {
        wakeLock = await navigator.wakeLock.request();
        wakeLock.addEventListener('release', () => {
            console.log('Screen Wake Lock released:', wakeLock.released);
            });
        console.log('Screen Wake Lock released:', wakeLock.released);
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}
