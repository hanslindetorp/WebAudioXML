
waxml.addEventListener("inited", () => {

    let postionSliders = document.querySelectorAll("#positionPointers input");
    let trackIDs = ["#vocal", "#fiddle", "#accordion"];
    
    postionSliders.forEach((el, seqID) => {
        let timeOutput = el.parentElement.querySelector(".timeOutput");
        let images = el.parentElement.querySelectorAll("img");
        setInterval(() => {
            let targetSequence = waxml.querySelector(`#intens-${seqID+1}`);
            el.disabled = targetSequence.state < 2;
            if(targetSequence.state){
                el.value = targetSequence.relPos;

                let t = targetSequence.localTime;
                let h = Math.floor(t / 3600);
                let m = Math.floor((t % 3600) / 60);
                let s = Math.floor((t % 60)*100) / 100;

                m = m < 10 ? "0" + m : m;
                s = s < 10 ? "0" + s : s;

                timeOutput.innerHTML = `${h}:${m}:${s}`;
                
            }

            images.forEach((img, imgID) => {
                
                let seq = waxml.querySelectorAll("sequence")[seqID];
                if(seq){
                    let waveObj = seq.querySelectorAll("wave")[imgID];
                    if(waveObj){
                        let state = seq.state > 1 ? 1 : 0;
                        let gain = waveObj.state > 1 ? waveObj.output.gain.value : 0;
                        let mixObj = waxml.querySelector(trackIDs[imgID])
                        let muteState = mixObj ? mixObj.output.gain.value : 0;
                        img.style.opacity = muteState * gain * 0.8 + 0.2;
                    }
                    
                }
            });
            
        }, 20);
        
    });
    
    

    // connect sliders with values
    document.querySelectorAll("input[type='range']").forEach(el => {
        let output = el.parentElement.querySelector(".value");
        if(output){
            output.innerHTML = el.value;

            el.addEventListener("input", e => {
                output.innerHTML = e.target.value;
            });
        }
       
    });

});

