
var data;

window.addEventListener("load", e => {
    document.querySelector("waxml-xy-handle").addEventListener("input", e => {
        document.querySelector("#output").innerHTML = 
        `angle: ${e.target.value[0]} <br />
        radius: ${e.target.value[1]} <br />
        dragged: ${e.target.value[2]} </br />
        d1: ${waxml.getVariable("d1")}`;
    });

    waxml.addEventListener("init", e => {
        waxml.variablesToStore = "a1, a2, a3, r1, r2, r3, d1, d2, d3, timeStamp".split(",").map(s => s.trim());

        var triggerObject = {}
        triggerObject.setVariable = (key, val) => {
            let el = document.querySelector(`#handle_${key.substr(1,1)}`);
            if(el){
                let i = el.targets.indexOf(key);
                if(i >= 0){
                    let target = el.sources[i];
                    if(target == "angle"){
                        val = (1 + val - el.angleOffset) % 1;
                    }
                    el[target] = val;
                }
                
            }
            
            
        }

        waxml.registerPlugin(triggerObject);

    });

    data = readData();
    initSelectMenu(data.sessions);

    document.querySelector("#timeStamp").addEventListener("click", e => {
        waxml.setVariable("timeStamp", new Date().getTime());
    });

    document.querySelector("#newSession").addEventListener("click", e => {
        newSession();
    });

    document.querySelector("#selectSession").addEventListener("change", e => {
        let events = data.sessions[e.target.selectedIndex].events;
        let offsets = data.sessions[e.target.selectedIndex].offsets;
        let handles = [...document.querySelectorAll("waxml-xy-handle")];
        offsets.forEach((val, i) => {
            handles[i].angleOffset = val;
        });
       let eventList = events.map(event => {
           console.log(event);
            return {
                time: event[0],
                name: event[1],
                value: event[2]
            }
        });
        waxml.clearSequence("stored");
        waxml.addSequence("stored", eventList);
        waxml.playSequence("stored");
    });


});


function newSession(){
    let session = {};
    session.time = new Date().getTime();
    session.offsets = [...document.querySelectorAll("waxml-xy-handle")].map(el => {
        return el.angleOffset;
    });
    session.states = [...document.querySelectorAll("waxml-xy-handle")].map(el => {
        return {id: el.getAttribute("id"), angle: el.angle, radius: el.radius};
    });
    session.events = waxml.getSequenceData({name: "default", precision: 3, frameRate: 15}).events;

    if(session.events.length){
        waxml.clearSequence("default");

        data.sessions.push(session);
        initSelectMenu(data.sessions);
    
        writeData(data);
    }
    
    initHandles();
}

function initSelectMenu(sessions){
    let seletion = document.querySelector("#selectSession");
    seletion.innerHTML = "";

    sessions.forEach(session => {
        let option = document.createElement("option");
        option.innerHTML = new Date(session.time).toLocaleTimeString();
        seletion.appendChild(option);
    });
}



function readData(){
    data = window.localStorage.getItem("waxml-data");

    if(data){
        data = JSON.parse(data);
    } else {
        data = {};
        data.appName = "Ficson";
        data.version = "1.1";
        data.sessions = [];
    }
    return data;
}

function writeData(data){
    data = JSON.stringify(data);
    window.localStorage.setItem("waxml-data", data);
}

function initHandles(){
    document.querySelectorAll("waxml-xy-handle").forEach(el => {
        el.classList.remove("changed");
        el.angleOffset = Math.random();
    });
}


