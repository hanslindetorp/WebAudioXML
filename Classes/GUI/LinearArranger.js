

class LinearArranger extends HTMLElement {

    constructor(waxml){
        super();
		this.inited = false;
        this.voiceTracks = {};
        this.classTracks = {};
        this.otherTracks = [];
        this.nrOfTracks = 0;
        this.waxml = waxml;
        this.timeFactor = 10;
        this.style.display = "none";
    }

    connectedCallback(){

    }

    init(structure){
        this.inited = true;
        this.style.display = "block";

        let trackList = document.createElement("div");
        trackList.classList.add("list");
        this.appendChild(trackList);

        let frame = document.createElement("div");
        this.frame = frame;
        frame.classList.add("main");
        
        frame.addEventListener("pointerenter", e => {
            this.scrolling = true;
        });
        frame.addEventListener("pointerleave", e => {
            this.scrolling = false;
        });

        let content = document.createElement("div");
        this.content = content;
        content.classList.add("content");
        content.dataset.width = 100;
        frame.appendChild(content);

        // zoom buttons
        let btn = document.createElement("button");
        btn.classList.add("zoom");
        btn.innerHTML = "+";
        btn.addEventListener("click", e => {
            this.zoomFactor(1.25);
        });
        this.appendChild(btn);

        btn = document.createElement("button");
        btn.classList.add("zoom");
        btn.innerHTML = "-";
        btn.addEventListener("click", e => {
            this.zoomFactor(0.8);
        });
        this.appendChild(btn);


        let positionPointer = document.createElement("div");
        positionPointer.classList.add("position-pointer");
        this.positionPointer = positionPointer;
        content.appendChild(positionPointer);

        this.grid = document.createElement("div");
        this.grid.classList.add("grid");
        content.appendChild(this.grid);

        structure.sections.forEach(section => {
            let otherTrackCounter = 0;
            section.tracks.forEach((track, i) => {

                let graphicalTrack;
                let tag;
                tag = track.tags.length ? track.tags[0] : 0;
                if(track.parameters.voice){
                    graphicalTrack = this.addVoice(track.parameters.voice);
                // }
                // else if(tag){
                //     graphicalTrack = this.addClass(tag);
                } else {
                    graphicalTrack = this.addOtherTrack(otherTrackCounter++);
                } 

                if(graphicalTrack){
                    track.graphicalTrack = graphicalTrack;
                } else {
                    console.log(track);
                }
                

            });


            section.leadIns.forEach(leadin => {
                let tag = leadin.tags.length ? leadin.tags[0] : 0;
                let graphicalTrack;
                if(leadin.parameters.voice){
                    graphicalTrack = this.addVoice(leadin.parameters.voice);
                } else if(tag){
                    graphicalTrack = this.addClass(tag);
                }      
                if(graphicalTrack){
                    leadin.graphicalTrack = graphicalTrack;
                } else {
                    console.log(leadin);
                }
            });
        });


        structure.motifs.forEach(motif => {

            let tag = motif.tags.length ? motif.tags[0] : 0;
            let graphicalTrack;
            if(motif.parameters.voice){
                graphicalTrack = this.addVoice(motif.parameters.voice);
            } else if(tag){
                graphicalTrack = this.addClass(tag);
            }
        
            if(graphicalTrack){
                motif.graphicalTrack = graphicalTrack;
            } else {
                console.log(motif);
            }
        });

        Object.entries(this.voiceTracks).forEach(([label, div]) => {
            let el = this.createTrackLabel(label)
            trackList.appendChild(el);
            content.appendChild(div)
        });
        Object.entries(this.classTracks).forEach(([label, div]) => {
            let el = this.createTrackLabel(label)
            trackList.appendChild(el);
            content.appendChild(div)
        });
        
        this.otherTracks.forEach((div, i) => {
            let el = this.createTrackLabel(`Track ${i+1}`)
            trackList.appendChild(el);
            content.appendChild(div)
        });

        this.querySelectorAll(".track").forEach(obj => {
            obj.style.height = `${100/this.nrOfTracks}%`;
        });

        // only append if music is used
        if(content.children){
            this.appendChild(frame);
        }

    }

    addVoice(name){
        if(!this.voiceTracks[name]){
            this.voiceTracks[name] = this.createTrack("voice");
        }
        return this.voiceTracks[name];
    }
    addClass(name){
        if(!this.classTracks[name]){
            this.classTracks[name] = this.createTrack("class");
        }
        return this.classTracks[name];
    }
    addOtherTrack(i){
        if(!this.otherTracks[i]){
            this.otherTracks[i] = this.createTrack("other");
        }
        return this.otherTracks[i];
    }

    createTrack(className){
        this.nrOfTracks++;
        let el = document.createElement("div");
        el.classList.add(className);
        el.classList.add("track");
        return el;
    }

    createTrackLabel(label){
        let el = document.createElement("div");
        el.classList.add("track");
        el.innerHTML = label;
        return el;
    }
        

    visualize(obj){

        let el = document.createElement("div");
        let container = obj.graphicalTrack || this.grid;
        el.innerHTML = obj.label || "";
        el.style.left = `${obj.pos*this.timeFactor}%`;
        if(obj.length){
            el.style.width = `${obj.length*this.timeFactor}%`;
        }
        el.classList.add(obj.class || "object");
        container.appendChild(el);
        return el;
    }
    
    visualFadeOut(data){
        let percent = this.timeToPercent(data.time);
        let left = parseFloat(data.element.style.left);
        let width = parseFloat(data.element.style.width);
        let newWidth = percent - left;
        if(newWidth < width){
            // console.log(`Change width: ${width} -> ${newWidth}`);
            data.element.style.width = `${newWidth}%`;
        }

    }

    scrollTo(time=this.waxml._ctx.currentTime){
        // this.content.style.left = `${80-(time*this.timeFactor)}%`;
        // let pix = this.timeToPix(time);
        this.positionPointer.style.left = `${this.timeToPercent(time)}%`;
        if(!this.scrolling){
            this.frame.scrollLeft = this.timeToPix(time) - this.content.clientWidth * 0.8;
        }
    }

    timeToPercent(time){
        return time*this.timeFactor;
    }

    timeToPix(time){
        return time*this.timeFactor * this.content.clientWidth * 0.01;
    }

    clear(){
        // remove all segments
    }

    zoomFactor(factor){
        let w = parseFloat(this.content.dataset.width) * factor;
        this.content.dataset.width = w;
        this.content.style.width = `${w}%`;
    }
}

module.exports = LinearArranger;