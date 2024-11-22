window.initIMUS = (musicStructure) => {


	var defaultSectionName = "default";

	var SECTION = "sc";
	var TRACK = "tr";
	var MOTIF = "mt";
	var LEADIN = "ld";
	var SOUND = "sn";
	var POSITION = "p";
	var VARIANT = "v";
	var UPBEAT = "up";
	var QUANTIZE = "q";
	var LENGTH = "l";

	var self;


	class Selection{
         
		constructor(selector, container){

            this.objects = [];
            this.sections = [];
            this.tracks = [];
            this.motifs = [];
			this.leadIns = [];
			this.string = "";

			if(selector){
				this.searchAll(selector, container);
			}
		}

		selectForPlayback(selector){
			// find motifs and leadins in current section
			selector = this.stringToArray(selector);
			defaultInstance.motifs.forEach(obj => {
				if(obj.section == defaultInstance.currentSection && inArray(selector, obj.parameters.classList)){
					this.motifs.push(obj);
					this.objects.push(obj);
				}
			});
			
			// find next section
			defaultInstance.sections.forEach(obj => {
				if(inArray(selector, obj.parameters.classList)){
					this.sections.push(obj);
					this.objects.push(obj);
					this.string = selector[0];
				}
			});
			return this;
		}

		stringToArray(str){
			let arr;
			switch(typeof str){

				case "string":
				arr = str.split(" ");
				break;

				case "object":
				arr = str;
				break;

			} 
			return arr;
		}


        searchAll(selector, container){


            var allObjects = [];

			// this is the old original selector

            switch(typeof selector){

                case "string":
                break;

                case "object":
                selector = selector.join(" ");
                break;

                default:
                return this;
                break;
            }

            if(!selector.length){return}

            var type;
            switch(typeof selector){

                case "string":
                this.selector = selector;
                selector = selector.split(" ").shift();
                var firstChar = selector.substr(0, 1);

                switch(firstChar){

                    case "#":
                    type = "id";
                    selector = selector.substr(1);
                    break;

                    case ".":
                    type = "class";
                    selector = selector.substr(1);
                    break;

                    default:
                    type = "class";
                    selector = this.selector;
                    break;

                }

                break;

                default:
                return;
                break;

            }


            this.string = selector;
            this.type = type;

            // limit search range to container
            var targetInstances;
            if(container instanceof iMus) {

                targetInstances = [container];

            } else {
                targetInstances = iMus.instances;
            }



            if(container instanceof Selection){

                // sub selection of selection
                allObjects = container.objects;

            } else if(container instanceof Array){

                // sub selection of tracks in a section
                allObjects = container;

            } else {


                // selection in all or one instance

                targetInstances.forEach(function(instance){


                    instance.motifs.forEach(function(motif){

                        allObjects.push(motif);
                    });

                    instance.sections.forEach(function(section){

                        allObjects.push(section);
                        section.tracks.forEach(function(track){

                            allObjects.push(track);
                        });
                    });

                    instance.actions.forEach(function(action){

                        allObjects.push(action);
                    });

                });

            }




            var objects = [];
            var targetSection;


            allObjects.some(obj => {

                switch(type){

                    case "id":
                    if(obj.idName == selector){
                        objects.push(obj);
                    }

                    break;

                    case "class":
                    var matchedClass = inArray(selector, obj.tags);

                    // check if this is a section. If so just add this section to objects
                    // Why? I think it is better to also select motifs, leadins and tracks
                    // if matching
                    if(matchedClass){

                        switch(obj.type){
                            case "section":
                            objects = [obj];
                            this.sections = [obj];
                            targetSection = obj;
                            break;

                            case "track":
                            objects.push(obj);
                            this.motifs.push(obj);
                            break;

                            case "motif":
                            objects.push(obj);
                            this.motifs.push(obj);
                            break;

                            case "leadIn":
                            objects.push(obj);
                            this.leadIns.push(obj);
                            break;

                        }
                    }
                    break;

                    case "objectType":
                    //change to make it possible to select different types of objects !!!
                    switch(selector){

                        case "track":
                        case "stem":
                        if(obj instanceof Track){objects.push(obj)}
                        break;

                        case "motif":
                        if(obj instanceof Motif){objects.push(obj)}
                        break;
                    }


                    break;

                }


            });


            this.objects = objects;
		}


        createDefaultSectionIfNeeded(){

            // generate section if no matches
            if(!this.objects.length){
                var newSection = defaultInstance.addSection({tags: this.selector});
                if(!defaultInstance.currentSection){
                    defaultInstance.currentSection = newSection;
                }
                this.objects.push(newSection);    
            }
        }

        addLoopTrack(urls){

            var newObj;
            this.createDefaultSectionIfNeeded();
            if(!urls){urls = [];}
            this.objects.forEach(obj => {
                if(!obj.addLoopTrack){return}
                newObj = obj.addLoopTrack(urls);
            });
            this.objects = [newObj];
            return this;
        }

        addLFO(prop, frequency, range, offset, object){

            this.objects.forEach(obj => {
                if(!obj.addLFO){return}
                obj.addLFO(prop, frequency, range, offset, object);
            });
            return this;
        }

        addDelay(params){

            this.objects.forEach(obj => {
                if(!obj.bus){return}
                obj.bus.addSerialDelay(params);
            });
            return this;
        }

        addReverb(params){

            this.objects.forEach(obj => {
                if(!obj.bus){return}
                obj.bus.addReverb(params);
            });
            return this;
        }

        addMotif(urls, q, upbeat){

            if(typeof urls === "string"){
                urls = [urls];
            }
            this.createDefaultSectionIfNeeded();
            var tags = urlsToTags(urls);
            if(this.objects.length){
                // add sections tags to motif
                tags = mergeArrays(tags, this.objects[0].tags);
            }
            var targetObj = this.objects.find(obj => {
                // connect Motif to Section
                return typeof obj.addMotif === "function";
            }) || defaultInstance;
            var params = typeof q == "object" ? q : {};
            params.tags =  params.tags || tags;
            params.quantize =  params.quantize || q;
            params.upbeat =  params.upbeat || upbeat;
            var newObj = targetObj.addMotif(params, urls);
            this.objects = [newObj];
            return this;
        }

        addLeadIn(urls, params){
            params = typeof params == "object" ? params : {quantize: "bar", type: "leadIn", upbeat: "bar"}
            this.addMotif(urls, params);
            return this;
        }

        loadFile(urls){
            this.addMotif(urls, "off");
            return this;
        }

        setSoloGroup(grp, val){

            this.objects.forEach(obj => {
                if(!obj.setSoloGroup){return}
                obj.setSoloGroup(grp, val);
            });
        }

	    // funkar den här och i sånt fall, hur?
        solo(selector){

            this.stop();
            this.find(selector).play();
            return this;

        }
		
		togglePlay(){

            this.objects.forEach(obj => {
                if(!obj.togglePlay){return}
                obj.togglePlay();
            });
            return this;
        }

        play(arg1, arg2, arg3){


            var returnVal = {};
			let delays = [];
            this.objects.forEach(obj => {
                if(!obj.play){return}
                let delay = obj.play(arg1, arg2, arg3);
				delays.push(delay);
            });
			returnVal.delay = Math.min(...delays);
            this.returnVal = returnVal;
            return this;
        }

        trig(arg1, arg2, arg3){
            return this.play(arg1, arg2, arg3);
        }

        replay(){

            this.objects.forEach(obj => {
                if(!obj.replay){return}
                return obj.replay();
            });
            return this;
        }

        stop(params){
            params = params || {};
            this.objects.forEach(obj => {
                if(!obj.stop){return}
                // to mute other tracks in a group
                if(obj == params.omit){return}
                return obj.stop();
            });
            return this;
        }

        stopAllSounds(){
            this.objects.forEach(obj => {
                if(!obj.stopAllSounds){return}
                obj.stopAllSounds();
            });
            return this;
        }

        isPlaying(){

            var isPlaying = false;
            this.objects.forEach(obj => {
                var curObjIsPlaying = obj.isPlaying ? obj.isPlaying() : obj.playing;
                isPlaying = isPlaying || curObjIsPlaying;
            });
            return isPlaying;
        }

        setActive(active){

            this.objects.forEach(obj => {
                if(!obj.setActive){return}
                return obj.setActive(active);
            });
            return this;
        }

        setActive(active){

            this.objects.forEach(obj => {
                if(!obj.setActive){return}
                return obj.setActive(active);
            });
            return this;
        }

        setVolume(arg1, arg2){


            this.objects.forEach(obj => {
                if(!obj.setVolume){return}
                return obj.setVolume(arg1, arg2);
            });
            return this;
        }

        getVolume(){

            var vol = -1;
            this.objects.forEach(obj => {
                if(!obj.getVolume){return -1}
                vol = Math.max(vol, obj.getVolume());
            });
            return vol;
        }

        fade(val, delay, duration){

            delay = delay || 0;
            duration = duration || 250;
            duration /= 1000;
            this.objects.forEach(obj => {
                if(!obj.fade){return}
                return obj.fade(val, delay, duration);
            });
            return this;
        }

        fadeIn(){
            this.objects.forEach(obj => {
                if(!obj.fadeIn){return}
                return obj.fadeIn();
            });
            return this;
        }

        fadeOut(duration, delay){

            if(duration){duration = duration / 1000}
            if(delay){delay = delay / 1000}
            this.objects.forEach(obj => {
                if(!obj.fadeOut){return}
                return obj.fadeOut(delay, duration);
            });
            return this;
        }

        setVariation(val, val2){

            this.objects.forEach(obj => {
                if(typeof obj.setVariation === "function"){
                    obj.setVariation(val, val2);
                } else {
                    obj.variation = val;
                }
            });
            return this;
        }

        setActiveVariations(activeVariations){

            this.objects.forEach(obj => {
                if(!obj.setActiveVariations){return}
                return obj.setActiveVariations(activeVariations);
            });
            return this;
        }
        get(param1, param2){
            var value;
            this.objects.forEach(obj => {
                if(!obj.get){return}
                value = obj.get(param1, param2);
            });
            return value;
        }

        setParams(params){

            this.objects.forEach(obj => {
                if(!obj.setParams){return}
                return obj.setParams(params);
            });
            return this;
        }

        set(param, value, value2){

            this.createDefaultSectionIfNeeded();
            this.objects.forEach(obj => {
                if(!obj.set){return}
                return obj.set(param, value, value2);
            });
            return this;
        }

        map(param, valIn, minIn, maxIn, minOut, maxOut, exp){

            this.objects.forEach(obj => {
                if(!obj.map){return}
                return obj.map(param, valIn, minIn, maxIn, minOut, maxOut, exp);
            });
            return this;
        }

        group(){

            var thisSelection = this;
            this.objects.forEach(obj => {
                if(obj.groups){
                    obj.groups.push(thisSelection);
                }
            });
            return this;
        }

        addTrackGroup(selection){
            this.objects.forEach(obj => {
                if(obj.addTrackGroup){
                    obj.addTrackGroup(selection);
                }
            });
            return this;
        }

        getPosition(pos, flags){

            var positionObj;
            if(!this.objects.length){
                this.objects = [defaultInstance];
            }
            this.objects.forEach(obj => {
                if(obj.getPosition){
                    positionObj = obj.getPosition(pos, flags);
                }
            });
            return positionObj;
        }

        on(event, fn, delay){

            this.objects.forEach(obj => {
                if(obj.eventHandler){
                    obj.eventHandler.addEvent(event, fn, delay);
                }
            });
        }

        update(arg1){

            this.objects.forEach(obj => {
                if(obj.update){
                    obj.update(arg1);
                }
            });
            return this;
        }

        find(selector){
            return new Selection(selector, this);
        }

	}


	class VoiceController {

		constructor(){
			this.counter = 0;
			this.voices = [];
			this.fadeTime = 0.001;
		}

		addVoiceObject(name, priority, gainObject, fadeTime = this.fadeTime){
			let voiceNames = name.split(" ").map(str => str.trim());
			this.voices.push(new VoiceObject(this.counter, voiceNames, priority, gainObject, fadeTime));
			return this.counter++;
		}

		removeVoiceObject(id){
			this.voices = this.voices.filter(voice.id !== id);
		}

		getVoiceObject(id){
			return this.voices.find(voice => voice.id == id);
		}

		getVoiceGroup(targetGroups, id){
			return this.voices.filter(voice => {
				// let include = voice.name == name;
				let include = voice.groups.find(group => targetGroups.includes(group)) ? true : false;
				if(typeof id !== "undefined"){
					// omit one voiceObject if specified
					include = include && voice.id != id;
				}
				return include;
			});
		}

		getVoicePriorityGroup(name, priority){
			return this.voices.filter(voice => voice.groups.find(str => str == name) && voice.priority == priority);
		}

		getLowerVoicePriorityGroups(priority){
			return this.voices.filter(voice => voice.groups.find(str => str == name) && voice.priority < priority);
		}

		playVoiceObject(id, startTime, endTime, voiceGroups){
			let voiceObject = this.getVoiceObject(id);
			if(voiceObject){
				voiceObject.play(startTime, endTime);
				this.getVoiceGroup(voiceGroups || voiceObject.groups, id).forEach(obj => {
					obj.mute(startTime, endTime, voiceObject.priority);
				}); 
			}
		}

	}


	class VoiceObject {
		constructor(id, groups, priority, gainObject, fadeTime){
			this.id = id;
			this.groups = groups;
			this.priority = priority;
			this.gainObject = gainObject;
			this.fadeTime = fadeTime;

			this.startMuteTime = 0;
			this.endMuteTime = 0;
		}
		play(startTime, endTime){
			this.gainObject.gain.cancelScheduledValues(startTime);

			// delay startTime if fadeTime requires it
			if(startTime-this.fadeTime < audioContext.currentTime){
				startTime = audioContext.currentTime + this.fadeTime;
			}
			this.gainObject.gain.setTargetAtTime(1, startTime-this.fadeTime, this.fadeTime);
			this.startTime = startTime;
			this.endTime = endTime;
			console.log(`Voice(${this.id}).start(${(startTime-audioContext.currentTime).toFixed(2)}, ${(endTime-audioContext.currentTime).toFixed(2)}, ${this.fadeTime.toFixed(2)})`)

			if(endTime == startTime){
			}

		}

		mute(startTime, endTime, priority){
			let currentTime = this.gainObject.context.currentTime;

			if(this.endTime && this.endTime > currentTime || priority > this.priority){
				// endTime is only set for motifs and leadins
				// Don't touch them if the stored endTime has already passed.
				// This preserves the audio tail in recently pleayed objects.

				this.gainObject.gain.cancelScheduledValues(0);
				
				// find earliest startTime (if several triggers interfers) 
				this.startMuteTime = this.startMuteTime < currentTime ? startTime : Math.min(startTime, this.startMuteTime);
				this.endMuteTime = this.endMuteTime < currentTime ? endTime : Math.max(endTime, this.endMuteTime);


				// delay startMuteTime if fadeTime requires it
				let startMuteTime;
				if(this.startMuteTime-this.fadeTime < audioContext.currentTime){
					startMuteTime = audioContext.currentTime - this.fadeTime;
				} else {
					startMuteTime = this.startMuteTime;
				}
				// delay endMuteTime if fadeTime requires it
				let endMuteTime;
				if(this.endMuteTime-this.fadeTime < audioContext.currentTime){
					endMuteTime = audioContext.currentTime - this.fadeTime;
				} else {
					endMuteTime = this.endMuteTime;
				}
				
				this.gainObject.gain.setTargetAtTime(0, startMuteTime-this.fadeTime, this.fadeTime);
				this.gainObject.gain.setTargetAtTime(1, endMuteTime-this.fadeTime, this.fadeTime);
				console.log(`Voice(${this.id}).mute(${(startMuteTime-this.fadeTime-audioContext.currentTime).toFixed(2)}, ${(endMuteTime-this.fadeTime-audioContext.currentTime).toFixed(2)})`);
			}

		}
	}



	// ******************************************************
	// GUI


	class GUI {

		constructor(target = document.body){

			var instID = 1;

			let shadowElement, el;
			let container = document.createElement("div");
			container.id = "iMusic-GUI";


			if(window.webAudioXML){
				shadowElement = window.webAudioXML.GUI.HTML;
			} else {
				let shadowContainer = document.createElement("div");
				shadowContainer.style.width = "0%";
				shadowContainer.style.height = "0%";
				shadowContainer.style.display = "none";
				shadowContainer.style.overflow = "visible";
				target.appendChild(shadowContainer);


				shadowElement = shadowContainer.attachShadow({mode: 'open'});
				// shadowElement.appendChild(style);

				
				var iMusBtn;
				if(iMus.getDefaultInstance().parameters.showGUI == "true"){
					iMusBtn = document.createElement("button");
					iMusBtn.innerHTML = "iMusic";
					iMusBtn.style.position = "absolute";
					target.appendChild(iMusBtn);
					iMusBtn.addEventListener("click", e => {
						e.target.style.display = "none";
						shadowContainer.style.width = "100%";
						shadowContainer.style.height = "100%";
						shadowContainer.style.display = "block";
					});
				}

				el = document.createElement("button");
				el.innerHTML = "X";
				el.classList.add("close");
				container.appendChild(el);
				el.addEventListener("click", e => {
					iMusBtn.style.display = "block";
					shadowContainer.style.width = "0%";
					shadowContainer.style.height = "0%";
					shadowContainer.style.display = "none";
				});
			}
			shadowElement.prepend(container);


			el = document.createElement("h1");
			el.innerHTML = "Play controls";
			if(container.childNodes.length){
				container.insertBefore(el, container.lastElementChild);
			} else {
				container.appendChild(el);
			}
			

			// el = document.createElement("button");
			// el.innerHTML = "PLAY";
			// el.classList.add("control");
			// container.appendChild(el);
			// el.addEventListener("click", e => iMusic.play());


			iMus.instances.forEach(inst => {
				instID++;
				let sectionTags = [];
				let motifTags = [];
				let selectGroups = {};
				let el, row, span;

				inst.sections.forEach(section => {

					section.tags.forEach(tag => {
							if(!inArray(tag, sectionTags) && tag.length){sectionTags.push(tag)}
					});

					let selectGroup = section.parameters["select-group"] || section.parameters["select-variable"];
					let selectValues = section.parameters["select-value"];
					let values;
					if(selectGroup){
						if(!selectGroups[selectGroup]){
							selectGroups[selectGroup] = [];
						}
						values = selectGroups[selectGroup];
						selectValues.forEach(val => {
							if(!inArray(val, values)){
								values.push(val);
							}
						});
					}

					section.tracks.forEach(track => {
						track.soloGroups.forEach(group => {
							if(!selectGroups[group.name]){
								selectGroups[group.name] = [];
							}
							let values = selectGroups[group.name];
							group.value.forEach(val => {
								if(!inArray(val, values)){
									values.push(val);
								}
							});
						});
					});


					section.motifs.forEach(motif => {
						if(motif.parameters.class){
							motif.parameters.class.split(" ").forEach(className => {
								className = className.trim();
								if(className.length && !inArray(className, motifTags) && !inArray(className, sectionTags)){
									motifTags.push(className);
								}
							});
						}
						motif.soloGroups.forEach(group => {
							if(!selectGroups[group.name]){
								selectGroups[group.name] = [];
							}
							let values = selectGroups[group.name];
							group.value.forEach(val => {
								if(!inArray(val, values)){
									values.push(val);
								}
							});
						});
					
					});

				});

				inst.motifs.forEach(motif => {
					if(motif.parameters.class){
						motif.parameters.class.split(" ").forEach(className => {
							className = className.trim();
							if(className.length && !inArray(className, motifTags) && !inArray(className, sectionTags)){
								motifTags.push(className);
							}
						});
					}
					motif.soloGroups.forEach(group => {
						if(!selectGroups[group.name]){
							selectGroups[group.name] = [];
						}
						let values = selectGroups[group.name];
						group.value.forEach(val => {
							if(!inArray(val, values)){
								values.push(val);
							}
						});
					});
				});


				// PLAY BUTTONS
				let buttons = [];
				this.sectionTriggerButtons = buttons;

				row = document.createElement("div");
				container.appendChild(row);

				if(sectionTags.length){
					// el = document.createElement("h3");
					// el.innerHTML = "Class names";
					// container.appendChild(el);
	
	
					sectionTags.forEach(tag => {
						el = document.createElement("button");
						el.innerHTML = tag;
						el.setAttribute("class", "tag sectionTrigger");
						el.setAttribute("selector", tag);
						row.appendChild(el);
						buttons.push(el);
	
						el.addEventListener("click", e => {
							let returnVal = waxml.trig(tag);
							let delay = returnVal ? returnVal.delay : 0;
							let targetBtn = e.target;
							targetBtn.classList.add("pending");
							
							// setTimeout(() => {
							// 	buttons.forEach(btn => btn.classList.remove("active"));
							// 	buttons.forEach(btn => btn.classList.remove("pending"));
							// 	targetBtn.classList.add("active");
							// }, delay*1000);
						});
					});
				}


				el = document.createElement("button");
				el.innerHTML = "STOP";
				el.classList.add("control");
				row.appendChild(el);
				el.addEventListener("click", e => {
					buttons.forEach(btn => btn.classList.remove("active"));
					waxml.stop();
				});

				// click
				let label = document.createElement("label");
				label.innerHTML = "Click";
				el = document.createElement("input");
				el.setAttribute("type", "checkbox");
				
				row.appendChild(label);
				label.appendChild(el);
				el.addEventListener("change", e => {
					waxml.setVariable("click", e.target.checked ? 1 : 0);
				});


				// tillfällig regel
				// el = document.createElement("input");
				// el.setAttribute("type", "range");
				// el.setAttribute("min", "0");
				// el.setAttribute("max", "100");
				// el.addEventListener("input", e => {
				// 	["BD-SN", "HH", "Fill", "Bass", "Sine", "Chord"].forEach(tr => {
				// 		iMusic(tr).setActive(e.target.value / 100);
				// 	});
				// });
				// row.appendChild(el);
				

				if(motifTags.length){
					el = document.createElement("h3");
					el.innerHTML = "Motifs";
					container.appendChild(el);
	
					row = document.createElement("div");
					container.appendChild(row);
	
					motifTags.forEach(tag => {
						el = document.createElement("button");
						el.innerHTML = tag;
						el.classList.add("tag");
						row.appendChild(el);
	
						el.addEventListener("click", e => {
							waxml.start(tag);
						});
					});
				}


				
				if(Object.keys(selectGroups).length){
					// el = document.createElement("h3");
					// el.innerHTML = "Variables";
					// container.appendChild(el);


					// el = document.createElement("p");
					// el.innerHTML = `Give the tracks different select-group and select-values to
					// make a variable control the dynamics by muting and unmuting them.
					// Use the slider (for numeric values) or menu (string values) to select
					// different tracks depending on their select-group and select-value settings.`;
					// container.appendChild(el);

					// selection sliders and radio buttons
					let filter = [];
					Object.keys(selectGroups).forEach(key => {

						let value = selectGroups[key];
						let range = new Range(value);
						row = document.createElement("div");
						// container.appendChild(row);

						el = document.createElement("span");
						el.innerHTML = key;
						el.classList.add("label");
						row.appendChild(el);


						switch (range.type) {
							case "number":
								// slider
								//let minVal = Math.min(0, range.min);
								let minVal = range.min;

								el = document.createElement("input");
								el.setAttribute("type", "range");
								el.setAttribute("min", minVal);
								el.setAttribute("max", range.max);
								el.setAttribute("value", minVal);
								el.setAttribute("class", "slider");
								row.appendChild(el);
								let numOutput = document.createElement("span");
								numOutput.classList.add("numOutput");
								row.appendChild(numOutput);

								numOutput.innerHTML = minVal;
								filter.push({name: key, value: minVal});
								

								el.addEventListener("input", e => {
									numOutput.innerHTML = e.target.value;
									iMusic.select(key, parseFloat(e.target.value).toFixed(2));
								});
								break;
							case "string":
								// radio
								let popMenu = document.createElement("select");
								value.forEach(str => {

									//
									// el = document.createElement("input");
									// el.value = str;
									//
									// let id = key + "-" + str;
									// el.id = id;
									// el.name = key;
									// el.type = "radio";
									// row.appendChild(el);
									//
									// el.addEventListener("change", e => {
									// 	iMusic.select(key, e.target.value);
									// });
									//
									// el = document.createElement("label");
									// el.innerHTML = str;
									// el.for = id;

									el = document.createElement("option");
									el.value = str;
									el.innerHTML = str;
									popMenu.appendChild(el);

								});
								popMenu.addEventListener("change", e => {
									iMusic.select(key, e.target.value);
								});
								filter.push({name: key, value: value[0]});
								row.appendChild(popMenu);
								break;
							default:

						}

					});
					iMusic.initSelection(filter);
				}
				
				instID++;
				inst.missingFiles.forEach(file => {
					waxml.log({
						type: "error",
						data: ["Missing file:", file]
					});
				});

				// if(inst.missingFiles.length){
				// 	let errorBox = document.createElement("div");
				// 	container.appendChild(errorBox);
				// 	errorBox.innerHTML = "<h3>Missing files:</h3>";
				// 	errorBox.className = "errorBox";				
				// 	let ul = document.createElement("ul");
				// 	errorBox.appendChild(ul);
				// 	inst.missingFiles.forEach(file => {
				// 		let li = document.createElement("li");
				// 		li.innerHTML = file;
				// 		ul.appendChild(li);
				// 	});
				// }
				

			});


		}

		indicateTriggerButtons(tag){
			let buttons = this.sectionTriggerButtons;
			let targetBtn = buttons.find(btn => btn.attributes.selector.value == tag);
			if(targetBtn){
				buttons.forEach(btn => btn.classList.remove("active"));
				buttons.forEach(btn => btn.classList.remove("pending"));
				targetBtn.classList.add("active");
			}
		}


		setCurrentSection(currentSection){

		}

	}





	// ******************************************************
	// HELPERS


	function getTimeSign(ts, defTimeSign){

		if(ts == "off"){return ts}

		var timeSign = {};


		// convert string to an object
		if(typeof ts === "string"){

			switch(ts){


				case "bar":
				return {nominator: defTimeSign.nominator, denominator: defTimeSign.denominator};
				break;


				case "beat":
				return {nominator: 1, denominator: defTimeSign.denominator};
				break;

				default:

				tsArr = ts.split("/");
				if(tsArr.length < 2){
					tsArr[1] = 1;
				}

				return {nominator: eval(tsArr[0]), denominator: eval(tsArr[1])};
				break;
			}

		}

		// if timeSign is already converted to an object
		if(typeof ts === "object"){
			if(ts.nominator && ts.denominator) {
				return ts;
			}
		}

		// return 4/4 if not specified
		return {nominator:4, denominator:4};

	}

	function stringIsTimeSign(str){
		return str.split("/").length == 2;
	}


	function divisionToTime(div, ts, beatDuration){

		if(!div){return 0;}
		if(typeof div == "number"){return div}

		if(div == "off"){
			// One year ;-)
			// good for non-looped tracks
			return 60 * 60 * 24 * 365;
		} else {
			ts = ts || this.parameters.timeSign;
			beatDuration = beatDuration || this.getBeatDuration();
			// barDuration = this.getBarDuration();
			var div = getTimeSign(div, ts);
			//return div.nominator * beatDuration * ts.denominator / div.denominator; // detta verkar fel?!? Hur kan jag missat under alla år??
			// return div.nominator * beatDuration * ts.nominator / div.denominator;
			
			// Unbelievable!! Even the second try was wrong! 
			// The idea is to take the provided musical length expression 
			// eg. 3/8 and find the time of this expression by finding the
			// relation to the length of a beat.
			return div.nominator * beatDuration / (div.denominator / ts.denominator);
		}


	}


	function getMaxUpbeatOffset(tracks){
		tracks = tracks || this.tracks;
		var offs = 0;
		for(var trackID in tracks){
			var track = tracks[trackID];
			if(track.parts.length){
				var parts = track.parts;
				var firstPart = parts[0];
				offs = Math.min(offs, firstPart.offset);
			}

		}
		return -offs;
	}


	function getMaxFadeTime(tracks){
		tracks = tracks || this.tracks;

		var time = 0;

		tracks.forEach(function(track){
			time = Math.max(time, track.parameters.fadeTime);
		});

		return time;
	}




	function arrayWithValue(length, value){

		var arr = [];
		for(var i=0; i<length; i++){
			arr[i] = value;
		}
		return arr;
	}


	function createGainNode(){
		// different methods to support different browsers
		if(typeof audioContext.createGain === 'undefined'){
			return audioContext.createGainNode();
		}else{
			return audioContext.createGain();
		}
	}


	function initAudioContextTimer(iMusInstance){
		//console.log("initAudioContextTimer", iMusInstance);

		if(audioContext.currentTime == 0){

			// on iOS the timer needs to be inited
			// by triggering a sound from a touch interaction
			// Therefore, make sure you call section::play() from
			// a touch event the first time or
			// make a direct call to iMusInstance::init() from
			// a touch event before playing anything.


			// Update 20191128
			// This workaround doesn't work any more


	 		audioContext.resume();
	 		return;

			var osc = audioContext.createOscillator();
			// play
			if (typeof osc.start === 'undefined'){
				osc.noteOn(0);
			}else{
				osc.start(0);
	 		}

	 		//osc.connect(audioContext.destination);

		}


	}





	function addLFO(prop, frequency, range, offset, object){

		if(typeof prop != "string"){return}



			var bus;

			if(typeof object === "undefined"){
			var musicObject = this instanceof Section || this instanceof Track || this instanceof Motif || this instanceof Sequence;
			if(musicObject){
				bus = this.bus;
			} else if(this instanceof Bus){
				bus = this;
			}

			if(bus){
				switch(prop){
					case "filter":
					object = bus.filter.detune;
					break;

					case "volume":
					object = bus.output.gain;
					break;
				}
			}
		} else {
			object = object;
		}

		if(typeof object != "object"){return}

		frequency = frequency || 1;
		range = range || 1;
		offset = offset || 0;

		var osc = audioContext.createOscillator();
		var amp = createGain();
		amp.gain.value = range;

		osc.frequency.value = frequency;
		osc.connect(amp);
		amp.connect(object);
		osc.start();

		/*
		var x = 0;
		var y;
		var range = max - min;

		var intervalTime = 10;
		var stepAmount = 2 / cycleTime * intervalTime;

		var intervalID = setInterval(function(){

			x += stepAmount;
			y = Math.sin(Math.PI*x)/2+0.5;

			object[prop] = min + y * range;

		}, intervalTime);

		*/
	}




	// ******************************************************

	// setup the audio context
	var audioContext;
	var maxChannelCount;

	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	if(window.webAudioXML){
		audioContext = window.webAudioXML._ctx;
	} else if (AudioContext){
		audioContext = new AudioContext();
	} else {
	  // Web Audio API is not available. Ask the user to use a supported browser.
	  alert('Web Audio API not supported. Please use another browser');
	  return;
	}


	maxChannelCount = audioContext.destination.maxChannelCount || 2;
	//maxChannelCount = Math.min(maxChannelCount, 32);

	console.log("Max audio channels: " + maxChannelCount);

	if (audioContext.destination.maxChannelCount) {
		audioContext.destination.channelCount = maxChannelCount;
	} else if (audioContext.destination.webkitMaxChannelCount) {
		audioContext.destination.webkitChannelCount = maxChannelCount;
	}


	//audioContext.destination.channelCountMode = "explicit";
	//audioContext.destination.channelInterpretation = "discrete";


	var channelCount = audioContext.destination.channelCount || audioContext.destination.webkitChannelCount;
	console.log("Number of channels: " + channelCount);



	var buffers = {};
	var timeWindow = 0.3; // s
	var checkQueueTime = 20; // ms




	function playSound(obj, time, callBackOnStart, callBackOnFinish, track, crop = 0) {

		// console.log(audioContext.currentTime);
		// check if source is already played
		// if so, disconnect
		time = time || 0;
		

		if(track){
	 		if(track.parameters.randomOffset){
		 		time += Math.random()*track.parameters.randomOffset - track.parameters.randomOffset/2;
	 		}
		}


		time = Math.max(audioContext.currentTime, time);

		// randomize if several urls
		var url;

		if(typeof obj.url === "object"){

			// support array with multiple files for random selection


			// if activeVariations is used, then use just those files, else use all
			var nrOfOptions;

			if(obj.parameters.retrig == "repeat" && (obj.counter % obj.parameters.repeat)) {

				// keep on repeating the same file obj.parameters.repeat times
				if(iMus.debug){console.log(obj.counter, obj.parameters.repeat)}

			} else {

				// generate a new randomly selected file
				if(obj.parameters.activeVariations){
					nrOfOptions = obj.parameters.activeVariations.length;
				} else if(obj.parameters.retrig == "next"){
					nrOfOptions = 0;

				} else {
					// default obj.parameters.retrig == "other". Add maybe support for "any"

					// use all urls first time or if there are less than 3 options or if obj.variation is used
					nrOfOptions = (typeof obj.rndID === "undefined" || obj.url.length < 3 || obj.parameters.retrig == "shuffle") ? obj.url.length : obj.url.length - 1;
				}

				var rnd;

				if(typeof obj.variation == "number"){
					// obj.variation can be set globally to syncronize random variation between objects
					// change to use parameters!!!
					rnd = obj.variation;
					rnd = Math.max(0,rnd);
					rnd = Math.min(0.9999999999,rnd);
				} else if(typeof obj.variation == "string"){
					if(obj.variationMaster == true){
						rnd = Math.random();
						iMus.setVariation(obj.variation, rnd);
					} else {
						rnd = iMus.getVariation(obj.variation);
					}
				} else {
					// create a new random value
					rnd = Math.random();
				}
				obj.rndID = Math.floor(rnd*nrOfOptions);


			}

			// pick file

			if(obj.parameters.activeVariations){
				// pick ID from active IDs
				url = obj.url[obj.parameters.activeVariations[obj.rndID]];
				if(!url){url = obj.url[0];}

			} else {
				url = obj.url[obj.rndID];
			}




		} else {
			url = obj.url;
		}

		var length = obj.length;
		var urlObj = url;

		if(typeof urlObj === "object"){
			// support objects with unique values for each url i.e. different musical length

			url = urlObj.url;
			length = urlObj.length || length;
		}



	 	var msToStart = Math.floor((time-audioContext.currentTime)*1000);
	 	var msToFinish = 0;

		if(buffers[url]){

			// create new source if file is loaded
			var source = audioContext.createBufferSource();

			
			if(iMus.debug){
				//console.log(obj.id, obj.playingSources);
			}
			obj.playingSources = obj.playingSources || [];

			// if not loaded. Error.
			if(buffers[url] == -1){return}

			// connect
			source.buffer = buffers[url];

			var destination = obj.bus.input || iMus.master.input;
			source.connect(destination);


			// play

	 		obj.playing = true;
	 		obj.trigging = true;
	 		obj.playingSources.push(source);

	 		if(typeof obj.active === "undefined"){
	 			obj.active = 1;
	 		}



	 		msToFinish = msToStart + Math.floor(source.buffer.duration*1000);


	 		var rnd = Math.random();
	 		if(rnd < obj.active || obj.parameters.fadeTime){

		 		// play
				if (typeof source.start === 'undefined'){
					// obsolete. Used in Safari ages ago.
					source.noteOn(time, crop);
				}else{
					source.start(time, crop);
		 		}

		 		obj.counter = ++obj.counter || 1;
		 		if(iMus.debug){
					console.log(url, time, audioContext.currentTime);
				}


				if(obj && obj.eventHandler){
					// for regions (parts) and motifs
					setTimeout(function(){
				 		obj.eventHandler.execute("playFile", url);
			 		}, msToStart);
				}


		 		if(track){
					// for tracks
					setTimeout(function(){
						track.eventHandler.execute("playFile", url);
					}, msToStart);
		 		}


		 		var e = new CustomEvent('iMusic', {
					 detail: {
						 command: "playFile",
						 url: url
					}
				});

				setTimeout(function(){
			 		window.dispatchEvent(e, msToStart);
			 	});


				var e2 = new CustomEvent('playFile', {
					detail: {
						url: url,
						id: track ? track.idName : obj.idName,
						classList: track ? track.tags : obj.tags
					}
			   	});

				setTimeout(e => defaultInstance.dispatchEvent(e2), msToStart);



		 		// call function if set when a sound is about to play
		 		// bad sync with JS
		 		if(typeof callBackOnStart === "function"){
		 			setTimeout(function(){
			 			callBackOnStart("playFile", url);
		 			}, msToStart);
		 		}

				// visualize in linear arranger
				// the code is a bit scattered at the moment. WAXML is attaching 
				// a graphical target container for each track, motif and leadin
				// poorly written... 
				let graphicalTrack = track ? track.graphicalTrack : obj.graphicalTrack
				let visualElements = track ? track.visualElements : obj.visualElements;
				if(graphicalTrack){
					let element = waxml.visualize({
						graphicalTrack: graphicalTrack,
						pos: time,
						length: source.buffer.duration - crop,
						label: waxml.pathToFileName(url)
					});
					visualElements.push(element);
				}


	 		} else {

		 		// don't play
		 		if(iMus.debug){console.log("Not playing: " + url + ", Math.random = " + rnd);}

	 		}

	 		// reset playing to allow object to be trigged again
	 		setTimeout(function(){
	 			obj.trigging = false;
	 			//console.log(obj.url, obj.playing, timeWindow * 1000 + msToStart);
	 		}, timeWindow * 2 * 1000);




	 		if(typeof length === "number"){

	 			// if a Part or Motif has a defined length then make callback before tail
	 			setTimeout(function(){
	 				if(typeof callBackOnFinish === "function"){callBackOnFinish();}
	 				obj.playing = false;

	 			}, msToStart + length * 1000 - timeWindow * 1000);
	 		}


	 		// disconnect and delete source object when played

			obj.timeouts = obj.timeOuts || [];
	 		let timeout = setTimeout(function(){
				// this function  will be called for parts or motifs after specified time
				// There have been some confusion when the part length is not specified
				// and I therefore skip the disconnection . It doesn't seem necessary

				// Hela den här funktionen är scary. Den är kvar efter tiden innan fadeTime och 
				// verkar kunna ställa till med alla möjliga problem.
				// Det viktigaste är att inte playingSources töms när den innehåller buffers som 
				// spelar vilket kan ske med dessa rader som de står. En avslutad ljudfil tömmer 
				// partens alla playingSources inkl. nytriggade filer. Inte bra.

	 			// obj.playing = false; // denna rad var bortkommenterad men jag kan inte komma på varför
	 			// //if(source){source.disconnect(0);}
	 			// if(obj.playingSources) {
		 		// 	while(obj.playingSources.length){
		 		// 		let oldSource = obj.playingSources.shift();

		 		// 		// oldSource.disconnect(0);
		 		// 		// oldSource = 0;

		 		// 	}
	 			// }

	 			// source = null;
	 			if(typeof callBackOnFinish === "function" && typeof length === "undefined"){
	 				callBackOnFinish();
	 			} else {

	 			}
	 			//console.log(obj.url + ".stop() " + audioContext.currentTime);
	 		}, msToFinish);
			obj.timeouts.push(timeout);

	 		//if(iMus.debug){console.log("msToFinish: " + msToFinish);}

 		} else {
	 		if(iMus.debug){console.log("Buffer not found: " + url);}
 		}

 		return urlObj;
	}



	function loadFile(obj, callBack, errorCallback){

		
		if(typeof obj.url != "string"){
			// this is not a file
			return;
		} 

		let body = document.querySelector("body");
		body.classList.add("imusic-loading");
		
		callBack = callBack || loadComplete;
		var url = this.addSuffix(obj.url);


		if(obj.url in buffers){
			// if already loaded

		} else {
			// else load URL
			buffers[obj.url] = 0;
			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.responseType = 'arraybuffer';

			var returnObj = {};
			returnObj.url = url;

			request.onload = function() {

				if(request.status != 200) { // analyze HTTP status of the response
					//alert(`Error ${request.status}: ${request.statusText}`); // e.g. 404: Not Found
					defaultInstance.missingFiles.push(request.responseURL);
					buffers[obj.url] = -1;
					if(errorCallback){errorCallback()}
				} else {
					// decode the buffer into an audio source
					audioContext.decodeAudioData(request.response, function(buffer) {
						if (buffer) {
							// store all buffers in buffers
						  buffers[obj.url] = buffer;
						  returnObj.duration = buffer.duration;
						  // store reference in this object
						  // obj.buffer = buffer;
						  //console.log(obj.url + " loaded. offset: " + obj.offset);
						  callBack(returnObj);
	  
						}
					  }, function(){
						  console.error('File "' + url + '" could not be decoded');
						  buffers[obj.url] = -1;
						  callBack();
					});
				}
		     };
		     request.onerror = function() {
		          console.error('File "' + url + '" could not be loaded');
		          buffers[obj.url] = -1;
		          callBack();
		     };

			request.send();
		}
	}

	function loadComplete(){


		for(var url in buffers){

			if(buffers[url] == 0){
				return false;
			}
		}

		console.log("LoadComplete");
		for(var obj in iMus.instances){

			iMus.instances[obj].loadComplete();
		}
		
		return true;
	}


	var Bus = function(o){


		o = o || {};

		this.parameters = this.initParameters(o);

		let webAudioDest;
		var destination = webAudioDest || o.destination || audioContext.destination;

		this.output = createGainNode();
		this.output.gain.value = (typeof o.volume == "number") ? o.volume : 1;
		

	  	this.input = createGainNode();
	  	this.voiceGain = createGainNode();
		this.input.connect(this.voiceGain).connect(this.output).connect(destination);


		return this;
	}


	Bus.prototype.initParameters = initParameters;
	Bus.prototype.addDefaultParameters = addDefaultParameters;
	Bus.prototype.getBeatDuration = getBeatDuration;
	Bus.prototype.getBarDuration = getBarDuration;
	Bus.prototype.getTime = getTime;


	Bus.prototype.setOutput = function(ch, targetCh){

		this.output.disconnect(0);
		this.splitter.disconnect(0);
		this.output.connect(this.splitter, 0, 0);
		this.outputGainList = [];


		if(typeof ch === "number"){
			ch = [ch]
		};

		if(targetCh){

			// source and target specified
			if(typeof targetCh === "number"){targetCh = [targetCh]};

		} else {

			// only target specified
			targetCh = ch;
			ch = [];
			for(var i = 0; i < this.output.channelCount; i++){
				ch.push(i);
			}
		}


		var lpCnt = Math.max(ch.length, targetCh.length);
		for(var i = 0; i < lpCnt; i++){

			var srcCh = ch[i % ch.length];
			srcCh = Math.min(srcCh, maxChannelCount-1);

			var trgCh = targetCh[i % targetCh.length];
			trgCh = Math.min(trgCh, maxChannelCount-1);

			var outputGain = createGainNode();
			this.outputGainList[trgCh] = outputGain;
			this.splitter.connect(outputGain, srcCh, 0);
			outputGain.connect(this.channelMerger, 0, trgCh);

		}


	}


	Bus.prototype.connect = function(dest){

		let destination;
		if(typeof dest == "string"){

			if(window.webAudioXML){
				destination = window.webAudioXML.getInputBus(dest);
			}
			if(!destination){
				destination = iMus.objects[dest];
			}

		} else if(dest instanceof AudioObject || dest instanceof Bus || dest instanceof Bus2){
			destination = dest;
		}
		if(!destination){console.warn("No destination");return}
		if(!destination.input){console.log("No input on destination");return}

		this.output.disconnect(0);
		this.output.connect(destination.input);
	}



	Bus.prototype.volume = function(vol){
		if(typeof vol == "undefined"){
			return this.input.gain.value;
		} else {
			this.input.gain.linearRampToValueAtTime(vol, audioContext.currentTime + 0.001);
		}
	}
	Bus.prototype.setVolume = Bus.prototype.volume;


	Bus.prototype.compression = function(params){
		if(typeof params == "undefined"){
			return this.compressor;
		} else {


			if(params == false){
				// disconnect

			} else {

				for(var param in params){
					this.compressor[param].value = params[param];
				}
			}
		}
	}

	Bus.prototype.animate = function(parameter, targetVal, time){


		time = time || 0;
		switch(parameter){

			case "pan":

			if(!this.outputGainList){
				// default to stereo if not routed yet
				if(this.channelMerger){
					this.setOutput([0,1], [0,1]);
				}
			}

			var dist = targetVal - this.parameters.pan;
			var nrOfOutputs = this.outputGainList.length;

			// step through animation with 50 states per second
			var fps = 10;

			// at least two steps if time is too short
			var steps = Math.max(2, time * fps);

			for(var i = 0; i <= steps; i++){

				var curVal = this.parameters.pan + dist * i/steps;

				var trgOut = (nrOfOutputs-1)*curVal;
				var targetOutput1 = Math.floor(trgOut);
				var offs = trgOut % 1;

				var t = audioContext.currentTime + time * i/steps;

				// Loop through all speakers for each step
				this.outputGainList.forEach(function(output, id){
					var val;
					switch(id){
						case targetOutput1:
						val = 1 - offs;
						break;

						case targetOutput1+1:
						val = offs;
						break;

						default:
						val = 0;
						break;
					}
					output.gain.linearRampToValueAtTime(val, t);
				});
			}
			this.parameters.pan = targetVal;
			break;



			default:
			var send = this.sends[parameter];
			if(!send){return;}
			var t = audioContext.currentTime + time;
			send.gain.linearRampToValueAtTime(targetVal, time);
			break;
		}

	}


	Bus.prototype.setFilter = function(val){
		var t = audioContext.currentTime + 0.01;
		this.filter.frequency.linearRampToValueAtTime(val, t);
	}

	Bus.prototype.addPingPongDelay = function(params){

		params = params || {};
		var feedBack = params.feedBack || 10;                    // nr of bounces

		var delay; // time between bounces
		if(typeof params.delay === "string"){
			delay = this.getTime(params.delay);
		} else {
			delay = params.delay ? params.delay / 1000 : 0.25;
		}

		var outputs = params.outputs || [0,1];                   // array with output numbers
		var volume = params.volume || 0.5;                       // volume for first delay

		var delayObj;
		var gainObj;

		this.pingPongDelay = createGainNode();

		// signal is routed in a parallell chain
		this.output.connect(this.pingPongDelay, 0, 0);

		// create one delay node for each feedback
		for(var i=1; i<=feedBack; i++){

			delayObj = audioContext.createDelay(feedBack*delay);
			this.pingPongDelay.connect(delayObj, 0);
			delayObj.delayTime.value = delay*i;
			gainObj = createGainNode();
			gainObj.gain.value = volume;
			volume *= 0.5;
			gainObj.channelCount = 1;
			gainObj.channelCountMode = "explicit";
			gainObj.channelInterpretation = "discrete";
			delayObj.connect(gainObj, 0, 0);

			// get random output channel (exclude last to avoid repeated bounces in the same)
			var id = Math.floor(Math.random()*outputs.length-1);
			var chNum = outputs.splice(id, 1)[0];
			outputs.push(chNum);

			gainObj.connect(this.channelMerger, 0, chNum);


		}

	}

	Bus.prototype.addSerialDelay = function(params){

		params = params || {};
		var feedBack = params.feedBack || 10;                    // nr of bounces
		if(Array.isArray(params.delayTimes)){
			if(params.delayTimes.length){this.delayTimes = params.delayTimes;}
		}
		this.delayTaps = [];

		var delay; // time between bounces
		if(typeof params.delay === "string"){
			delay = this.getTime(params.delay);
		} else if(typeof params.delay === "number"){
			if(this.delayTimes){
				var d = params.delay < this.delayTimes.length ? params.delay : 0;
				delay = this.delayTimes[d];
			} else {
				delay = params.delay / 1000;
			}

		} else {
			delay =  0.25;
		}

		var outputs = params.outputs || [0,1];                   // array with output numbers
		var volume = params.volume || 0.5;                       // volume for first delay
		var decrease = params.decrease || 0.5;
		this.delayDecrease = decrease;
		this.delayVolume = volume;
		this.delayMaxDelay = 10;
		var delay = 10;

		var delayObj;
		var gainObj;

		this.pingPongDelay = createGainNode();

		// signal is routed in a parallell chain
		this.output.connect(this.pingPongDelay, 0, 0);

		// create one delay node for each feedback
		for(var i=1; i<=feedBack; i++){

			delayObj = audioContext.createDelay(this.delayMaxDelay);
			this.pingPongDelay.connect(delayObj, 0);
			delayObj.delayTime.value = delay*i;
			gainObj = createGainNode();
			gainObj.gain.value = volume;
			volume *= decrease;
			gainObj.channelCount = 1;
			gainObj.channelCountMode = "explicit";
			gainObj.channelInterpretation = "discrete";
			delayObj.connect(gainObj, 0, 0);

			var chNum = outputs[i % outputs.length];
			chNum = Math.min(chNum, maxChannelCount-1);
			gainObj.connect(this.channelMerger, 0, chNum);

			this.delayTaps.push({delay: delayObj, gainObj: gainObj, id: i});

		}

	}


	Bus.prototype.setDelay = function(params){
		if(!this.delayTaps){
			this.addSerialDelay(params);
		} else {
			params = typeof params === "object" ? params : {delay: params};

			var delay; // time between bounces
			if(typeof params.delay === "string"){
				delay = this.getTime(params.delay);
			} else if(typeof params.delay === "number"){
				if(this.delayTimes){
					var d = Math.floor(params.delay * this.delayTimes.length);
					d = Math.max(0, Math.min(d, this.delayTimes.length-1));
					var delayStr = this.delayTimes[d];
					delay = this.getTime(delayStr);
				} else {
					delay = params.delay / 1000;
				}

			}

			if(params.decrease){
				this.delayDecrease = params.decrease;
			}

			var volume = this.delayVolume;
			this.delayTaps.forEach((tap)=>{
				if(delay){
					tap.delay.delayTime.linearRampToValueAtTime(tap.id * delay, audioContext.currentTime + 0.0000001);
				}

				if(params.volume){
					volume *= this.delayDecrease;
					tap.gainObj.gain.linearRampToValueAtTime(params.volume * volume, audioContext.currentTime + 0.001);
				}
			});

		}
	}

	Bus.prototype.addReverb = function(params){

		if(!params){return}
		if(typeof params === "string"){
			params = {url: params}
		}

		if(!params.url){return}

		if(typeof params.value === "undefined"){params.value = 1}

		var send = this.sends[params.url];
		if(!send){
			send = createGainNode();
			this.sends[params.url] = send;
		}
		send.gain.value = params.value;
		this.output.connect(send);

		params.src = send;
		var convolve = defaultInstance.addReverb(params);
		return {convolve: convolve, send: send};
	}



	Bus.prototype.insertEffect = function(type, initParams){

		var newFX = audioContext.createBiquadFilter();

		// last added FX will be first in inserts array
		var lastFXinChain = this.inserts[0];

		// disconnect last FX in chain
		lastFXinChain.disconnect(0);



		this.inserts.shift(newFX);

	}

	Bus.prototype.setPosition = function(newX, newY, newZ){

		if(!this.panner.active){
			this.filter.disconnect(0);
			this.filter.connect(this.panner);
			this.panner.active = true;
		}

		this.panner.setPosition(newX, newY, newZ);
		//audioContext.listener.setPosition(-newX, -newY, -newZ);
	}


	Bus.prototype.addAnalyser = function(fn, interval, fftSize){

		interval = interval || 100;
		var analyser = audioContext.createAnalyser();
		this.input.connect(analyser);
		analyser.fftSize = fftSize || 2048;
		var bufferLength = analyser.frequencyBinCount;

		var dataArray = new Uint8Array(bufferLength);
		//var dataArray = new Float32Array(bufferLength);


		setInterval(function(){

			//analyser.getFloatTimeDomainData(dataArray)
			analyser.getByteTimeDomainData(dataArray);
			fn(dataArray, bufferLength);

		}, interval);


	}



	var Sequence = function(data){

		this.iMusInstance = data.iMusInstance;
		this.objects = data.objects || [];
		this.firstOffset = data.firstOffset || 0;
		this.loopEnd = data.loopEnd;
		this.timerIDs = [];

	}


	Sequence.prototype.maxUpbeatOffset = function(){

	}

	Sequence.prototype.play = function(){

		var me = this;
		var delay = 1000;
		var runEachLoop = function(){

		}

		this.timerIDs.push(setTimeout(function(){

			//me.timerIDs.push(); VAd är detta?

		}, delay));

	}


	/*
	Sequence.prototype.stop = function(){

		this.timerIDs.forEach() = function(timerID){
			clearTimeout(timerID);
		}
		this.timerIDs = [];
	}
	*/

	var Envelope = function(_entries, _target){


		if(!Array.isArray(_entries)){
			console.log("Error: Envelope requires an array with values - ", _entries);
			return;
		}
		if(!typeof _target === "object"){
			console.log("Error: Envelope requires a Web Audio target object - ", _target);
			return;
		}

		this.entries = [];
		this.target = _target;

		_entries.forEach((entry)=>{

			if(!typeof point === "object"){
				console.log("Error: Envelope entires must be specified as objects - ", entry);
				return;
			}

			this.entries.push(entry);
		});
	}

	Envelope.prototype.play = function(){

		this.target.cancelScheduledValues(0);
		var val = this.target.value;
		var time = audioContext.currentTime;
		var zero = time;

		this.entries.forEach((entry)=>{

			val = (typeof entry.value === "number") ? entry.value : val;
			if(entry.delay){
				// relative to last entry
				time += entry.delay;
			} else if(entry.time){
				// relative to play event
				time = zero + entry.time;
			}

			this.target.linearRampToValueAtTime(val, time);

		});


	}

	Envelope.prototype.stop = function(){
		this.target.cancelScheduledValues(0);
	}



	var iMus = function(o, b) {

		o = o || {};

		if(typeof o === "string" || Array.isArray(o)){

			// Selection
			return new Selection(o, b);
		} else {

			// new iMusic instance
			o.onLoadComplete = o.onLoadComplete || b;
			self = this;
		}

		this._listeners = {};
		this.triggerIntervals = [];
		this.missingFiles = [];

		// Music instance
		this.loadFile = loadFile;


		this.init = function(){
			initAudioContextTimer(this);
			let body = document.querySelector("body");
			body.classList.add("imusic-running");
			body.classList.remove("imusic-pending");
		}

		this.getBus = function(id){

			switch(id){

				case "sfx":
				return this.sfxBus;
				break;

				case "motif":
				return this.motifBus;
				break;

				default:
				if(id <= self.busses.length){
					return self.busses[id-1];
				}else{
					this.parameters.destination = this.master.input;
					this.parameters.channelMerger = this.channelMerger;
					var bus = new Bus(this.parameters);
					self.busses[id] = bus;
					return bus;
				}
				break;
			}
		}

		this.addSection = function(){


			var params;

			//if(arguments.length){
				var args = Array.prototype.slice.call(arguments, 0) || [];
				if(typeof args[0] === "object"){

					// if first value is a Section params object
					if(!args[0].url){
						params = args.shift();
					}
				}

			//}
			params = params || {};
			if(!params.urls){
				if(args.length){params.urls = args}
			}

			if(typeof params.upbeat === "undefined"){params.upbeat = self.upbeat;}

			params.index = self.sections.length;
			var newSection = new Section(params);
			self.sections.push(newSection);
			return newSection;
		}




		this.stop = function(){
			clearInterval(self.queueID);
			self.queueID = null;
			self.playing = false;
			/*self.currentSection;
			self.currentTransition;
			self.transitionParts = [];*/
		}

		self.loadComplete = function(){
			switch(typeof self.parameters.onLoadComplete){

				case "function":
				self.parameters.onLoadComplete()
				break;

				case "string":
				iMus.play(self.parameters.onLoadComplete);
				break;
			}

			iMus.onload();
			let body = document.querySelector("body");
			body.classList.add("imusic-pending");
			body.classList.remove("imusic-loading");
		}

		/*

		this.getBeatDuration = function(){
			return 60.0 / this.tempo;
		}

		this.getBarDuration = function(){
			return this.getBeatDuration() * this.timeSign.nominator;
		}



		if (typeof o === 'function') {
		  callback = o;
		}

		*/


		// a collection of Sections, Transitions, Motifs and SFXs

		params = o || {};
		// why "this"?
		this.parameters = this.initParameters(o);
		
		self.volume = params.volume || 1;
		self.parameters.tempo = params.tempo || 120;
		self.parameters.timeSign = params.timeSign || "4/4";
		self.parameters.timeSign = getTimeSign(self.parameters.timeSign);

		self.upbeat = typeof params.upbeat === "string" ? this.getTime(params.upbeat) : params.upbeat;
		self.upbeat = self.upbeat || 0;

		self.externalOffset = params.offset;
		self.creationTime = new Date().getTime();


		// Styr upp denna härva av self och self.parameters...
		self.parameters = this.initParameters(params);
		self.parameters.onLoadComplete = params.onLoadComplete; // varför kopieras inte denna funktion i initParameters??
		self.parameters.destination = iMus.master.output;
		self.parameters.volume = self.volume;


		self.master = new Bus(this.parameters);
		self.bus = self.master;

		self.master.output.channelCount = maxChannelCount;

		// Create a Bus for mono sounds to be routed to a specific output channel
		self.channelMerger = audioContext.createChannelMerger(Math.max(32, maxChannelCount));
		self.channelMerger.channelCount = 1;
		self.channelMerger.channelCountMode = "explicit";
		self.channelMerger.channelInterpretation = "discrete";
		self.channelMerger.connect(self.master.output); //self.master.input);

		self.sendEffects = {};

		self.selectFilter = [];

		// Activate all inputs by creating dumb source objects and
		// preconnecting them to channelMerger

		for(var i=0; i<maxChannelCount; i++){
			var snd = audioContext.createBufferSource();
			snd.connect(self.channelMerger, 0, i);
		}



		//self.currentBarIDs = [];                // counters
		//self.nextTime = 0;

		self.transitionParts = [];
		self.sections = [];
		self.actions = [];
		self.currentSection;
		self.currentTransition;
		self.playing = false;
		self.sectionStart = 0;
		self.musicalStart = 0;

		self.motifs = [];
		self.busses = [];
		self.intervalIDs = [];

		this.parameters.destination = self.master.input;
		this.parameters.channelMerger = self.channelMerger;

		self.sfxBus = new Bus(this.parameters);
		self.motifBus = new Bus(this.parameters);



		iMus.instances.push(this);













		this.checkQueue = function(){



			if(!self.playing){return;}


			var currentTime = audioContext.currentTime;
			var musicTime = currentTime - self.sectionStart;
			self.musicTime = musicTime; // store the current music position pointer
			//if(musicTime < -timeWindow){return;} // what is this? It messed up the upbeats...


			
			// que parts on tracks in sections
			if(self.currentSection){
				tracks = self.currentSection.tracks;

				// click
				let barLength = self.currentSection.getBarDuration();
				let beatLength = self.currentSection.getBeatDuration();
				let timeInBeat = (musicTime + beatLength) % beatLength;
				let curBar = Math.floor(musicTime / barLength);
				let curBeat = Math.floor(musicTime / beatLength);

				if(beatLength-timeInBeat <= timeWindow){
					if(self.currentSection.curBeat != curBeat){
						self.currentSection.curBeat = curBeat;
						let nextClickTime = (curBeat + 1) * beatLength;
						let nextBarTime = (curBar + 1) * barLength;
						// console.log(`curBeat: ${curBeat}`);

						if(nextBarTime == nextClickTime){
							let barTime = nextClickTime + self.sectionStart; 
							waxml.start("#click_bar", {time:barTime});
							waxml.visualize({
								class: "barline",
								pos: barTime
							});
							self.currentBar++;
							// waxml.log(`Bar, ${self.currentBar}`);
						} else {
							let beatTime = nextClickTime + self.sectionStart; 
							waxml.start("#click_beat", {time:beatTime});
							waxml.visualize({
								class: "beatline",
								pos: beatTime
							})
						}

					} else {
						// console.log("self.currentSection.curBeat == curBeat");
					}

				} else {
					// console.log(musicTime.toFixed(2) , beatLength.toFixed(2), timeInBeat.toFixed(2), (beatLength-timeInBeat).toFixed(2), timeWindow);
				}

				
				tracks.forEach(track => {

					var trackWasNotPlaying = track.playing;
					var newLoop = false;

					//var trackTime = track.getTime(musicTime);
					var loopEnd = track.musicalPositionToTime(track.parameters.loopEnd);
					var loopID = Math.floor(musicTime / loopEnd);
					var loopStart = loopID * loopEnd;
					var timeInLoop = (musicTime + loopEnd*1000) % loopEnd;

					//mt = [musicTime, timeInLoop]; just for bug fix

					// do not loop tracks that should not be looped
					// needs testing!!



					if(loopID != track.loopID){

						// On every loop
						if(!track.active && track.parameters.fadeTime){
							// set volume to 0 if not active but in fade mode
							// to play silently until track recieves a play() command
							// track.bus.setVolume(0, true); -- already controlled by newTrack.setVolume()
							track.fadeOut();
						}

						// control the likeness for this loop to play
						var rnd = Math.random();
						track.playing = track.loopActive > rnd;
						//track.loopID = loopID;
						//console.log("LoopActive: " + track.loopActive + " > " + rnd);
						newLoop = true;

						setTimeout(function(){
							track.eventHandler.execute("loopEnd");
						}, loopEnd*1000);

						if(track.commands.length){
							track.loopID = loopID;
							if(loopID >= 0){
								console.log(`newLoop: ${track.id}: ${loopID}}`);
								track.commands.forEach(cmd => {
									let time = cmd.pos + loopStart + self.sectionStart;
									cmd.trig(time);
								});
							}
							
						}
						
					}

					// track.active is the parameter set by Track.setActive(), Track.play() and Track.stop()
					// track.playing is set on each trackloop depending on loopActive and random()
					// track.parameters.fadeTime is set to a value bigger than 0 if the track is supposed to
					// fade in/out on play/stop (like Ableton, Elias etc) rather than playing full audio files with audio tails

					if(track.active){
						//console.log(track.playing);
					}


					if((track.active > 0 && track.playing && !track.parameters.fadeTime) || track.parameters.fadeTime){

						//(track.parameters.fadeTime && (newLoop || musicTime < loopStart)
						// get local time inside this stem/track loop



						if(track.parameters.fadeTime && track.active > 0 && track.playing == false){
							//track.fadeIn();
							//console.log(track.id, "no fadeIn");
						}




						for(partID in track.parts){

							var targetPart = track.parts[partID];
							//if(iMus.debug){console.log(currentTime)};

							if(!(targetPart.playing || targetPart.trigging) || newLoop){




								// store randomness from track in part
								targetPart.active = track.active;
								targetPart.lastTriggedTime = targetPart.lastTriggedTime || 0;

								// store tracks fadeTime in part
								targetPart.parameters.fadeTime = track.parameters.fadeTime;

								var posInLoop = (targetPart.pos + targetPart.offset + loopEnd) % loopEnd;
								var posInNextLoop = posInLoop + loopEnd;
								var hit = timeInLoop <= posInLoop && (timeInLoop + timeWindow) > posInLoop;

								// check if loop is before bar 1 and part has not got upbeat
								//var partShouldNotPlay;// = (loopID < 0 && targetPart.offset >= 0) || loopID < -1;

								var hitInNextLoop = timeInLoop <= posInNextLoop && (timeInLoop + timeWindow) > posInNextLoop;
								var fadeTrackNeedsTrigging = track.parameters.fadeTime && !trackWasNotPlaying;
								fadeTrackNeedsTrigging = false; // do I really need fadeTrackNeedsTrigging any more??

								//if(iMus.debug){console.log("hit?", timeInLoop, loopEnd, loopID)};
								// terrible, terrible line to cope with all possible exceptions...
								if((hit || hitInNextLoop || fadeTrackNeedsTrigging) && loopID >= -1){


									// if targetPart is within timeWindow
									//var time = self.sectionStart + relPos; //+relPos;
									var time = self.sectionStart + loopStart + posInLoop + (hitInNextLoop ? loopEnd : 0);

									// make sure faded tracks are triggered correctly
									// if(track.parameters.fadeTime){
									//
									// 	while(time < currentTime){
									// 		time += loopEnd;
									// 	}
									//
									// }

									track.loopID = loopID;
									//if(hitInNextLoop){track.loopID++}

									var timeDiff = Math.abs(targetPart.lastTriggedTime - time);
									//console.log(hit, hitInNextLoop, newLoop, loopID, timeInLoop, timeDiff);

									if(time < currentTime){
									//if(false){

										// to prevent trig errors (I encountered logical problems with faded tracks)
										//console.log("Negative time: " + (time - currentTime));
									} else {



										if(timeDiff > 0){
											if(!track.playingParts.find(part => part == targetPart)){
												track.playingParts.push(targetPart);
											}
											

											targetPart.lastTriggedTime = time;
											targetPart.parameters.retrig = track.parameters.retrig;



											var chosenURL = playSound(targetPart, time, null, null, track);
											if(iMus.debug){console.log("newLoop", newLoop, track.loopID)}
											//console.log(hit, hitInNextLoop, time, newLoop, track.loopID);


											var spliceID;
											switch(track.parameters.retrig){

												case "next":
												case "other":
												case "shuffle":
												case "repeat":

												// det här måste fixas! OBS! Inte genomtänkt för alla case
												// fixen för activeVariations är gjort för att RTG inte ska gå åt pipan
												// Dumt att playSound returnerar chosenURL

												if(targetPart.parameters.activeVariations){

													if(targetPart.counter % targetPart.parameters.repeat){
														// don't shuffle
													} else {
														var ID = targetPart.parameters.activeVariations.splice(targetPart.rndID, 1)[0];
														targetPart.parameters.activeVariations.push(ID);
													}


												} else {

													var i = targetPart.url.indexOf(chosenURL);
													// pick target URL
													chosenURL = targetPart.url.splice(i, 1)[0];
													// move selected file last
													targetPart.url.push(chosenURL);
												}
												break;


											}


										} else {
											//console.log("timeDiff", timeDiff);
										}


									}

								} else {

									//console.log("no hit", timeInLoop, posInLoop, track.loopID, newLoop);
									//console.log("no hit", hit, hitInNextLoop, fadeTrackNeedsTrigging, newLoop, track.loopID);

								}


							} else {
								//console.log("playing:", targetPart.playing, targetPart.trigging, newLoop);
							}

						}

					}
				});
			}
		}




		function queueNextPartOnTrack(track, currentPart){
			var currentTime = audioContext.currentTime;
			var targetPart = track.parts[currentPart % track.parts.length];
			var nt;
			if(track.id < self.busses.length){var bus = self.busses[track.id];}


			if(track.id == 1){
				//console.log("track2");
			}
			if(currentTime + timeWindow >= track.nextTime + targetPart.offset){

				// trig next part if start (inkl offset/upbeat) happens less than timeWindow seconds
				// from now.

				var time;
				var startOffset;

				if(!track.nextTime){
					// first time

					time = audioContext.currentTime;
					self.sectionStart = time-targetPart.offset;
					//this.sectionStart = self.sectionStart;
					startOffset = self.sectionStart;
				} else {
					// all other times
					time = track.nextTime + targetPart.offset;
					startOffset = 0;
				}
				playSound(targetPart, time);
				return track.nextTime + targetPart.length + startOffset;
			}

		}















		var Section = function(o){

			// a (multi)track arrangement
			// concists of (at least) one track
			// console.log("new Section() id " + o.id);
			this.id = o.index;

			this.volume = o.volume || 1;
			if(typeof o.upbeat === "undefined"){
				this.upbeat = self.upbeat;
			}else{
				this.upbeat = this.divisionToTime(o.upbeat);
			}

			this.motifs  = [];
			this.tracks = [];
			this.transitions = [];
			this.leadIns = [];

			this.idName = o.id || "";


			this.tags = o.tags || o.class || urlsToTags(o.urls);
			if(typeof this.tags === "string"){this.tags = this.tags.split(" ")};



			this.parameters = this.initParameters(o, self.parameters);

			o.loopEnd = o.loopEnd || o.end || defaultParams.loopEnd;
			this.parameters.loopEnd = this.getPosition(o.loopEnd).time;
			this.parameters.length = this.divisionToTime(o.length);
			this.parameters.changeOnNextQ = this.divisionToTime(this.parameters.changeOnNext || self.parameters.changeOnNext);


			if(this.parameters.length && !o.changeOnNexts){
				// set this.parameters.changeOnNext by length if not specified separately 
				this.parameters.changeOnNext = this.parameters.length;
			}

			this.type = "section";


			this.getLength = function(){
				return this.parameters.length || this.getBarDuration(); 
			}

			this.addStem = function(urls){

				// create track object
				//console.log(urls);
				if(urls instanceof Array){
					//console.log("ulrs instanceof Array");
					// called from new Section where urls are specified with an array
					if(!urls[0].url && typeof urls[0] != "string"){
						//console.log("!urls[0].url", urls);

						o = urls.shift();

					}
				}else{

					var args = Array.prototype.slice.call(arguments, 0);

					if(typeof args[0] === "object"){
						if(!args[0].urls){
							o = args.shift();
						}
					}
					if(args.length){
						if(args[0] instanceof Array){
							urls = args[0];
						} else if(args[0] instanceof Object){
							urls = args[0].urls || [];
						} else {
							urls = args;
						}
					}
				}



				var params = (typeof o === "object") ? o : {};
				var id = this.tracks.length;
				params.loopActive = typeof params.loopActive === "number" ? params.loopActive : 1;
				params.active = typeof params.active === "number" ? params.active : 1;
				params.destination = params.destination || self.master.input;
				params.channelMerger = params.channelMerger || self.channelMerger;
				params.timeSign = params.timeSign || this.parameters.timeSign;
				params.tempo = params.tempo || this.parameters.tempo;
				params.upbeat = params.upbeat || this.parameters.upbeat;
				params.audioPath = params.audioPath || this.parameters.audioPath;
				//params.upbeat = (typeof params.upbeat == "number") ? params.upbeat : this.parameters.upbeat;
				params.partLength = params.partLength || this.parameters.partLength;
				
				if(params.loopLength){
					params.loopEnd = this.divisionToTime(String(params.loopLength));
				}
				params.loopEnd = params.loopEnd || this.parameters.loopEnd;


				params.volume = (typeof params.volume == "number") ? params.volume : this.parameters.volume;

				var bus;

				/*
					// skip the idea of sharing busses between sections
				if(self.busses.length == this.tracks.length){
					// create a new bus if needed
					bus = new Bus(params);
					self.busses.push(bus);
				}else{
					bus = self.busses[id];
				}
				*/

				bus = new Bus(params);
				self.busses.push(bus);

				if(params.output){
					bus.connect(params.output);
				}


				var parts = this.createParts(urls, params, bus, this);

				params.index = id;
				// if(parts.length){
					params.parts = parts;
					params.bus = bus;


					var newTrack = new Track(params, this);

					if(params.fadeTime){
						// This line does not seem to be needed any more. And it creates a conflict for tracks 
						// with both fadeTime and follow-variable set.
						// newTrack.setVolume(0, true); // true == dontStoreInParameters
						// console.log("fade out crossFaded track")
					}

					this.tracks.push(newTrack);
					return newTrack;

				// }

				// return;

			}


			// add stem on init track if urls are provided
			if(o){
				if(o.urls){
					if(o.urls.length){
						this.addStem(o);
					}
				}
			}


			this.addTransition = function(o){

				var args = Array.prototype.slice.call(arguments, 0);
				// treat first argument as targetPart
				var targetSection = args.shift();

				var firstObject = args[0];
				if(firstObject instanceof Object){

					// if object is the first part data
					if(firstObject.url){

					}else{
					// if object is default parameters for transition
						var params = args.shift();
					}
				}

				params = params || {};
				if(typeof params.upbeat === "undefined"){params.upbeat = self.upbeat;}
				params.urls = args;
				params.index = self.sections.length;
				this.transitions[targetSection.id] = new Section(params);


			}

			var triggedRecently = false;



			this.setOffset = function(offset){


				var oldMusicalStart = self.sectionStart;

				if(typeof offset === 'number'){
					self.sectionStart = audioContext.currentTime - offset / 1000;

				} else if(self.parameters.sync == 'true'){

					// sync to eternal clock

					let timeSince1970 = new Date().getTime() / 1000;
					self.sectionStart = audioContext.currentTime - timeSince1970;

				} else if(typeof self.externalOffset !== 'undefined'){
					var now = new Date().getTime();
					var timeSinceExternalOffset = (now - self.creationTime + externalOffset) / 1000;
					self.sectionStart = audioContext.currentTime - timeSinceExternalOffset;

				} else {

					// find the earliest start on any Stem and sets musicalStart accordingly

					var maxUpbeatOffset = getMaxUpbeatOffset(this.tracks);
					self.sectionStart = audioContext.currentTime + maxUpbeatOffset + timeWindow * 2;


				}
				//this.sectionStart = self.sectionStart;
				return self.sectionStart;


			}





			this.stop = function(callBack){
				triggedRecently = false;
				if(self.queueID){clearInterval(self.queueID)}
				self.queueID = null;



				if(self.playing && self.currentSection == this){


					if(this.postSection){

						this.postSection.play(1);

					} else {
						self.stop();
					}

				}


				self.playing = false;

				// reset all part counters
				this.tracks.forEach(function(track){
					//track.stop();
					track.parts.forEach(function(part){
						part.counter = 0;
					});



				});
			}


			this.queue = function(){


				this.play(1);

			}


			this.replay = function(){
				this.stop();


				this.play();
			}


			this.play = function(nrOfLoops, nextTime, selector){


				// exit if trigged recently or if this section is already playing
				if(triggedRecently || ((self.currentSection == this) && self.playing)){return;}


				// set all track states correctly
				// RangeError: Maximum call stack size exceeded. Fix bug!
				//variableWatcher.update(true);


				// reset if instance is not playing
	 			if(!self.playing){

	 				initAudioContextTimer(self);


					if(!self.queueID){

						self.queueID = setInterval(self.checkQueue, checkQueueTime);
						// There are timing problems with first event on track. Is this a solution?
						self.checkQueue();
					}
					self.currentBar = 1;
	 			}


	 			var barDuration = this.getBarDuration();
	 			var thisSection = this;

				if(self.currentSection && self.playing) {
					// set transition if it exists

					// var maxUpbeatInThis = this.getMaxUpbeatOffset();
					// var maxFadeTimeInThis = this.getMaxFadeTime();
					// var maxLeadInOffset = self.currentSection.getMaxLeadInUpbeatOffset(selector);
					// let maxUpbeat = Math.max(maxUpbeatInThis, maxLeadInOffset, maxFadeTimeInThis);

					// var nextTime = self.currentSection.getNextLegalBreak(maxUpbeat);
		 			
					nextTime = nextTime || getNextTime(self.currentSection, this, selector);

		 			var timeToLegalBreak = nextTime - audioContext.currentTime;
					// console.log(`timeToLegalBreak: ${timeToLegalBreak.toFixed(2)}, maxUpbeatInThis: ${maxUpbeatInThis.toFixed(2)}, maxLeadInOffset: ${maxLeadInOffset.toFixed(2)}`);


		 			self.currentSection.finishPlaying(timeToLegalBreak);
		 			// self.sectionStart = nextTime;


				} else {

					var nextTime = this.setOffset(); // sets musicalStart depending on max upbeat

					if(!self.playing){
						self.musicalStart = nextTime;
						self.sectionStart = nextTime;
					}

				}

				self.playing = true;

				var currentPartID;

				//console.log("play(section " + this.id + ", " + Math.floor(self.sectionStart*100)/100 + ")");

	 			if(nrOfLoops > 0){

	 				// queue a section in its full length
	 				// this way should probably merge into transtion playback
	 				self.sectionStart = nextTime;
	 				this.schedule(nrOfLoops);
	 				self.sectionStart += this.length * nrOfLoops;


	 			} else {

	 				// normal looped playback
	 				currentPartID = currentPartID || 0;

	 				for(var trackID in this.tracks){
	 					var track = this.tracks[trackID];
	 					track.currentPartID = currentPartID;
	 					track.nextTime = nextTime;
	 				}

					// These lines were added to cope with missing files with upbeat
					// if they are the first start of playback
					// maxOffset = maxOffset || this.getMaxUpbeatOffset();
					let maxOffset = this.getMaxUpbeatOffset();
					timeToLegalBreak = timeToLegalBreak || 0;
					
					let preroll = timeWindow * 1.5;
					let delay = timeToLegalBreak - maxOffset;
					// delay = delay > preroll ? delay - preroll: 0;
					delay = delay > preroll ? delay - preroll: 0;
					

					// activate event triggers for each listener
					setTimeout(e => {
						// stop current trigger intervals
						self.clearTriggerIntervals();
						self.sectionStart = nextTime;

						Object.keys(self._listeners).forEach(key => {

							switch(key){
								case "playFile":
									break;

								default:
									let time = this.divisionToTime(key);
									let event = new CustomEvent(key);

									self.dispatchEvent(event);
									let id = setInterval(() => self.dispatchEvent(event), time * 1000);
									self.triggerIntervals.push(id);
									break;
							}
						});
					}, timeToLegalBreak * 1000);
					
					setTimeout(() => {
						let tag = this.tags[0];
						iMus.GUI.indicateTriggerButtons(tag);
						let pos = this.getPosition(nextTime-self.musicalStart);
						// pos.bar = self.currentBar;
						waxml.log(`SECTION, ${tag}, 
							tempo: ${this.parameters.tempo}, 
							timeSign: ${this.parameters.timeSign.nominator}/${this.parameters.timeSign.denominator},
							${posObjectToString(pos)}`);
						waxml.dispatchEvent(new CustomEvent(tag));
					}, timeToLegalBreak * 1000);


					setTimeout(() => {
						// this will make the queue change to this section after
						// timeToLegalBreak

						self.currentSection = this;
						self.sectionStart = nextTime;
						let tag = this.tags[0];
						console.log("currentSection = " + tag);
						
						this.resetFades();

						// reset track fades and loopIDs
						this.tracks.forEach(function(track){

							track.nextTime = 0;
							// if(track.parameters.fadeTime){
							// 	if(track.active > 0){track.fadeIn(0,0)}
							//
							// }
							delete track.loopID;


						});

					}, delay * 1000);


				}


				this.timeToLegalBreak = timeToLegalBreak;
				triggedRecently = true;
				setTimeout(function(){triggedRecently = false;},200);
				return timeToLegalBreak;
			}

		}

		Section.prototype.getTimeToLegalBreak = function(){
			return this.timeToLegalBreak|| 0;
		}

		Section.prototype.stopAllSounds = function(){
			this.stop();
			this.tracks.forEach(function(track){
				track.stopAllSounds();
			});
		}

		Section.prototype.addLoopTrack = function(urls){

			if(typeof urls === "string"){urls = [urls];}
			let tags = [];
			if(!this.tags.length){
				tags = urlsToTags(urls);
			}
			// let tags = mergeArrays(urlsToTags(urls), this.tags);
			//var tags = urlsToTags(urls).concat(this.tags);
			return this.addStem({tags: tags}, urls);

		}

		Section.prototype.addMotif = function(params, urls){
			return defaultInstance.addMotif(params, urls, this);
		}


		Section.prototype.addStingerTrack = function(urls){

			var tags = urlsToTags(urls); // .concat(this.parameters.tags);
			return self.addMotif({tags: tags}, urls);

		}

		Section.prototype.addTrackGroup = function(selector){
			var selection = new Selection(selector, this.tracks);
			selection.group();

			selection.objects.forEach(function(track, id){
				var activeVal = (id == 0 ? 1 : 0);
				track.setActive(activeVal);
			});
		}

		Section.prototype.resetFades = function(){

			this.tracks.forEach(track => {
				let state = track.getFilterState(defaultInstance.selectFilter) != false;
				
				if(track.parameters.fadeTime){
					track.fade(state ? 1 : 0, 0, 0);
				}
			});
		}


		Section.prototype.schedule = function(nrOfLoops){

			var end = this.parameters.loopEnd * nrOfLoops;

			for(trackID in this.tracks){

				var nt = self.sectionStart;

				var track = this.tracks[trackID];

				for(var loopID = 0; nt < end; loopID++){
					var trackStart = loopID * track.parameters.loopEnd;
					for(partID in track.parts){

						var targetPart = track.parts[partID];

						// store randomness from track in part
						targetPart.active = track.active;
						var relPos = targetPart.pos + targetPart.offset;

						// if targetPart is within timeWindow
						var time = self.sectionStart + trackStart + relPos;
						playSound(targetPart, time);

					}
				}
			}
		}








		function getNextLegalBreak(targetTime, compareObjArr){


			// den här koden innehåller en del fel som gör att övergångar sker direkt när man använder fadeTime


			targetTime = targetTime || audioContext.currentTime;
			var musicTime = targetTime - self.sectionStart;
			this.musicTime = musicTime;


			var segmentDuration = this.divisionToTime(this.parameters.changeOnNext);

			//segmentDuration = this.getBarDuration();	
			let nextMusicTime = Math.ceil(musicTime / segmentDuration) * segmentDuration;
			if(nextMusicTime-musicTime < timeWindow * 2){
				// if current musicTime is before nextMusicTime but within timeWindow
				// skip to next segment
				nextMusicTime += segmentDuration;
			}

			var returnObj;
			returnObj = {};
			returnObj.time = self.sectionStart + nextMusicTime;
			returnObj.timeLeft = returnObj.time - audioContext.currentTime;
			returnObj.fadeTime = this.parameters.fadeTime || 0.01;
			returnObj.fadeTime = Math.min(returnObj.fadeTime, returnObj.timeLeft);
			//console.log(returnObj);
			return returnObj;



			// getTime() är inte stabil. Det jag behöver här är tiden sedan musiken startade
			//var localTime = this.getTime();


			var legalBreakPoints = this.parameters.legalBreakPoints || [{pos: "2.1"}];
			var loopEnd = this.musicalPositionToTime(this.get("loopEnd") || "2.1");

			targetTime = targetTime || audioContext.currentTime;
			var musicTime = targetTime - self.sectionStart;
			var localTime = musicTime % loopEnd;
			var loopID = Math.floor(musicTime / loopEnd);

			var targetBreakPoint = legalBreakPoints.find(function(breakPoint){
				var pos;

				switch(typeof breakPoint){

					case "object":
					pos = this.musicalPositionToTime(breakPoint.pos);
					break;

					case "number":
					pos = breakPoint;
					break;
				}



				var avoidPoint = false;
				/*
				if(compareObjArr){
					compareObjArr.forEach(function(compareObj){
						switch(compareObj.comp){
							case "equal":
							case "=":
							case "==":
							if(breakPoint[compareObj.prop] != compareObj.val){avoidPoint = avoidPoint || true}
							break;

							case "greaterThan":
							case ">":
							if(breakPoint[compareObj.prop] <= compareObj.val){avoidPoint = avoidPoint || true}
							break;

							case "lessThan":
							case "<":
							if(breakPoint[compareObj.prop] >= compareObj.val){avoidPoint = avoidPoint || true}
							break;

						}
					});
				}
				*/
				if(!avoidPoint){
					return pos > localTime;
				}

			}, this);

			if(!targetBreakPoint){
				targetBreakPoint = legalBreakPoints[legalBreakPoints.length-1];
			}

			console.log(loopID, loopEnd, targetBreakPoint);

			var returnObj;
			returnObj = {};
			returnObj.time = self.sectionStart + loopID * loopEnd + this.musicalPositionToTime(targetBreakPoint.pos);
			returnObj.fadeTime = targetBreakPoint.fadeTime || this.parameters.fadeTime || 0.01;
			returnObj.timeLeft = returnObj.time - audioContext.currentTime;

			if(returnObj.timeLeft < 0){
				console.log(returnObj);
				returnObj.timeLeft = 0;
			}


			// den här koden innehåller en del fel som gör att övergångar sker direkt när man använder fadeTime
			// därför har jag blockerat logiken för tillfället och använder jämna takter så länge



			return returnObj;
		}



		Section.prototype.getNextLegalBreak = function(offsets){

			let currentTime = audioContext.currentTime;
			let Q = this.divisionToTime(this.parameters.changeOnNext);
			let localTime = currentTime - self.sectionStart;
			let lastLegalBreak = Math.floor(localTime / Q) * Q;
			let b = Q;
			// while(b < offsets){
			// 	b += Q;
			// }
			while(self.sectionStart + lastLegalBreak + b < currentTime + offsets){
				b += Q;
			}
			return self.sectionStart + lastLegalBreak + b;

			while((nextMusicTime - offsets - timeWindow*1.5) <= nextMusicTime + Q){
				nextMusicTime += Q;
			}
			return nextMusicTime;
		}

		Section.prototype.finishPlaying = function(timeToLegalBreak){

			this.tracks.forEach(function(track){

				track.finishPlaying(timeToLegalBreak);

			});
		}


		Section.prototype.addLeadIn = function(params, urls){

			// används dessa rader alls? kolla addMotif
			params.quantize = params.quantize || "bar";
			var leadin = self.addLeadIn(params, urls, this);
			leadin.parameters.type = "leadIn";
			this.leadIns.push(leadin);
			return leadin;
		}

		// Section.prototype.getMaxLeadInUpbeatOffset = function(){
		// 	var maxOffset = 0;
		// 	if(this.leadIns){
		// 		this.leadIns.forEach(function(leadIn){
		// 			maxOffset = Math.max(maxOffset, leadIn.getMaxUpbeatOffset());
		// 		});
		// 	}
		// 	return maxOffset;
		// }

		Section.prototype.getMaxLeadInUpbeatOffset = function(selector){
			var minOffset = 0;
			let targetLeadins = this.leadIns.filter(leadIn => leadIn.tags.includes(selector));
			if(targetLeadins.length){
				targetLeadins.forEach(leadIn => {
					minOffset = Math.min(minOffset, leadIn.getMinUpbeatOffset());
			   	});
			} 
			
			return -minOffset;
		}

		Section.prototype.setTempo = function(value){

			this.parameters.tempo = value;

			this.tracks.forEach(function(track){
				track.parameters.tempo = value;

				track.parts.forEach(function(part){
					part.parameters.tempo = value;
				});
			});
		}


		Section.prototype.initParameters = initParameters;
		Section.prototype.addDefaultParameters = addDefaultParameters;
		Section.prototype.getBeatDuration = getBeatDuration;
		Section.prototype.getBarDuration = getBarDuration;
		Section.prototype.getPosition = getPosition;
		Section.prototype.getAbsolutePosition = getAbsolutePosition;
		Section.prototype.createParts = createParts;
		Section.prototype.getTime = getTime;
		Section.prototype.set = set;
		Section.prototype.setParams = setParams;
		Section.prototype.get = get;
		Section.prototype.map = map;
		Section.prototype.getMaxUpbeatOffset = getMaxUpbeatOffset;
		Section.prototype.getMaxFadeTime = getMaxFadeTime;
		Section.prototype.musicalPositionToTime = musicalPositionToTime;
		Section.prototype.divisionToTime = divisionToTime;









		var Track = function(o, section){

			// A collection of parts
			// Always playes in looped mode
			// Exists within a Section and Transition
			params = o || {}

			this.id = params.index;
			this.parts = params.parts;
			this.nextTime = 0;
			this.currentPartID = 0;
			this.tags = params.tags || params.class || "";
			if(typeof this.tags === "string"){this.tags = this.tags.split(" ")};
			this.idName = params.id || "";
			this.playingParts = [];
			this.groups = [];
			this.section = section;
			this.commands = [];

			this.type = "track";

			this.liveValues = {};
			this.soloGroups = [];
			this.envelopes = [];

			this.visualElements = [];


			this.bus = o.bus || self.getBus(this.id);
			this.volume = typeof o.volume === "number" ? o.volume : 1;
			this.bus.output.gain.value = this.volume;

			this.loopID;
			this.loopActive = typeof o.loopActive === "number" ? o.loopActive : 1;
			this.playing = false;



			// active is a number value between 0 and 1 that controls the the random factor
			// to play or not to play a part on an active track
			// 0 = muted = no parts will play
			// 0.5 = 50% of the parts will play controlled by random()
			// 1 = unmuted = all parts will play

			if(typeof params.active === "boolean"){
				this.active = params.active ? 1 : 0;
			}else if(typeof params.active === "number"){
				this.active = params.active > 1 ? 1 : (params.active < -1 ? -1 : params.active);
			}else{
				this.active = 1;
			}


			if(params.fadeTime){
				params.fadeTime = params.fadeTime / 1000;
			}

			this.parameters = this.initParameters(params, section.parameters);



			if(this.parameters.voice){
				this.parameters.voiceObjectID = iMus.voiceController.addVoiceObject(this.parameters.voice, 0, this.bus.voiceGain, this.parameters.fadeTime);
			}

			var beatDuration = self.getBeatDuration(); // !!
			var barDuration = self.getBarDuration();


			// this is a confusing section caused by the intention to provide both loopLength and loopEnd as valid input
			// parameters. If loopLength is used, the value is recalculated to a position and stored as loopEnd
			// If both are set, then loopLength take precidence over loopEnd

			var loopEnd;
			if(params.loopLength){
				loopEnd = this.divisionToTime(String(params.loopLength));
			}

			this.parameters.loopEnd = loopEnd || params.loopEnd || section.parameters.loopEnd || self.parameters.loopEnd || defaultParams.loopEnd;

			switch(typeof params.loopEnd){

				case "string":
				// get track length (for looping) from specified value
				// one year is currently enough to pretend it's off
				this.parameters.loopEnd = this.musicalPositionToTime(o.loopEnd);
				break;

				case "number":
				break;

				default:

				// use position and length of last part to define track length
				if(this.parts.length){
					var lastPart = this.parts[this.parts.length-1];
					lastPart.length = lastPart.length || barDuration;
					this.parameters.loopEnd = lastPart.pos + lastPart.length;
				} else {
					// to avoid errors
					this.parameters.loopEnd = barDuration;
				}
				break;
			}


			this.eventHandler = new EventHandler();


		}

		Track.prototype.togglePlay = function(){
			if(this.active > 0){
				this.stop();
			} else {
				this.play();
			}
		}


		Track.prototype.play = function(nextLegalBreakTimeLeft){

			// auto play the section of this track if iMusic is not playing
			if(!self.playing){
				// I took this line back in nov 2022...and removed it in 2023...
				// this.section.play(); //this is confusing in the new structure
			}

			initAudioContextTimer(self);

			var thisTrack = this;

			// Mute all tracks in group if track is part of a group
			/* This was removed after a more flexible select-function was introduced 2019
			this.groups.forEach(function(group){
				group.stop({omit:thisTrack});
			});
			*/

			/* The following lines are probably a confusion after
			adding fadeTime and keep on to the active setting.
			It seem to interfer with keeping active setting
			between arrangements */

			// if(this.active > 0){
			// 	if(this.parameters.fadeTime){
			// 		this.fadeIn();
			// 	}
			// 	return;
			// } else if(this.active == 0){
			// 	this.active = 1;
			// } else {
			// 	this.active = -this.active;
			// }
			this.active = Math.abs(this.active) || 1;

			//console.log(this, "play");

			if(self.playing){

				// make sure a track in fade mode is fading in
				if(this.parameters.fadeTime){

					// 2023-10-07
					// This is OK for switching between tracks but will it also
					// affect fading between different arrangements? If so, it would be 
					// wrong to use the nextLegalBreak() for the current track

					// add a track output before common bus input
					// or add a bus for each track

					var nextLegalBreak = this.getNextLegalBreak();
					if(!nextLegalBreak){
						nextLegalBreak = this.section.getNextLegalBreak();
						nextLegalBreak.fadeTime = this.parameters.fadeTime;
					}
					// if(nextLegalBreakTimeLeft != nextLegalBreak.timeLeft){
					// 	console.log("legalTimeOverride", nextLegalBreakTimeLeft);
					// }
					nextLegalBreak.timeLeft = nextLegalBreakTimeLeft || nextLegalBreak.timeLeft;
					//var timeToLegalBreak = nextLegalBreak.time - audioContext.currentTime;
					this.fade(1, nextLegalBreak.timeLeft, nextLegalBreak.fadeTime);
				}
			}
		}


		Track.prototype.stop = function(nextLegalBreakTimeLeft){

			// delete this.loopID;

			if(this.active <= 0){
				return;
			}
			this.active = -Math.abs(this.active);
			console.log(`track${this.id}.stop()`);

			if(this.parameters.fadeTime){
				if(self.playing){
					// make sure a track in fade mode is fading in

					// add a track output before common bus input
					// or add a bus for each track

					var nextLegalBreak = this.getNextLegalBreak(); // [{prop:"out", comp:"=", val:true}]

					nextLegalBreak.timeLeft = nextLegalBreakTimeLeft || nextLegalBreak.timeLeft;
					this.fade(0, nextLegalBreak.timeLeft, nextLegalBreak.fadeTime);
					this.playing = false;

				} else {
					this.fade(0, 0, 0);
				}

			}


		}

		Track.prototype.stopAllSounds = function(){

			this.finishPlaying(0);
		}

		Track.prototype.finishPlaying = function(timeToLegalBreak){

			var fadeTime = this.parameters.fadeTime;
			// delete this.loopID;


			// move this to the previous section instead!
			this.commands.forEach(cmd => {
				cmd.clear(timeToLegalBreak + self.sectionStart);
			});

			let disconnectAllObjects = (e => {
				while (this.playingParts.length) {
					let part = this.playingParts.pop();
					if(part.playingSources){
						if(iMus.debug){
							console.log(`playingSources.length: ${part.playingSources.length}`);
						}
						while (part.playingSources.length) {
							if(part.timeouts){
								let timeout = part.timeouts.pop();
								clearInterval(timeout);
								//clearTimeout(timeout);
							}
							let source = part.playingSources.pop();
							source.disconnect(0);
							

							// this does not handle the forced fade caused by
							// short regions triggered within loop before
							// nextLegalBreak
							// if(fadeTime){
							// 	source.disconnect(0);
							// }

						}
					}

				}
				// Is this really neeed? Is it enough to reset fades
				// When a section starts to play?
				//if(this.active > 0){this.fadeIn()}
			});

			/*
			var me = this;
			var disconnectAllObjects = function(){
				me.parts.forEach(function(part){
					if(part.playingSources){
			 			while(part.playingSources.length){
			 				var oldSource = part.playingSources.shift();
			 				oldSource.disconnect(0);
			 				oldSource = 0;
			 			}
					}
				});
			}
			*/

			if(fadeTime){
				this.playing = false;
				this.fade(0, timeToLegalBreak, fadeTime, disconnectAllObjects);
			} else {
				// not fading objects shall play their whole tail
				// and not be disconnected
				// BUT if timeToLegalBreak is shorter than the remaining part of the region
				// (set by partLength) it will be faded and disconnected anyway
				return;
				let remainingTime = 0;
				this.playingParts.forEach(part => {
					let remainingPartTime = (part.lastTriggedTime + part.length) - (audioContext.currentTime + timeToLegalBreak);
					remainingTime = Math.max(remainingTime, remainingPartTime);
				});
				if(remainingTime){
					fadeTime = 0.001;
					this.fade(0, timeToLegalBreak, fadeTime, disconnectAllObjects);
				} else {
					disconnectAllObjects();
				}
			}


		}

		Track.prototype.addEnvelopes = function(envelopes){
			this.envelopes = envelopes;
		}

		Track.prototype.setVariation = function(val, val2){
			this.parts.forEach(function(part){
				part.variation = val;
				part.variationMaster = (val2 == "master");
			});

		}


		Track.prototype.setSoloState = function(_param1, _param2, nextLegalBreakTimeLeft){
			if(!this.getSoloGroup(_param1)){return}

			var state = getSoloState(this.soloGroups, _param1, _param2);

			//console.log(`${this.section.id} - ${this.id} - ${state}`);

			// get longest nextLegalBreak time for involved tracks

			if(state === true){
				this.play(nextLegalBreakTimeLeft);
			} else if(state === false){
				this.stop(nextLegalBreakTimeLeft);
			}
		}

		Track.prototype.getSoloState = function(_param1, _param2){
			return getSoloState(this.soloGroups, _param1, _param2);
		}
		Track.prototype.getFilterState = getFilterState;

		Track.prototype.filter = function(globalFilter){
			let state = this.getFilterState(globalFilter);
			if(state == true){
				this.play();
			} else if (state == false){
				this.stop();
			}
		}


		Track.prototype.getSoloGroup = getSoloGroup;

		Track.prototype.setPartLength = function(value){

			value = this.divisionToTime(value);
			this.parts.forEach(function(part){
				part.length = value;
			});

		}


		Track.prototype.setUpbeat = function(value){

			value = this.divisionToTime(value);
			this.parts.forEach(function(part){
				part.offset = -value;
			});

		}

		Track.prototype.setRepeat = function(val){
			this.parts.forEach(function(part){
				part.parameters.repeat = val;
				part.counter = 0;
			});
		}

		Track.prototype.update = function(sequence){

			this.parts = this.createParts(sequence, this.parameters, this.bus, this);

		}



		Track.prototype.getNextLegalBreak = getNextLegalBreak;
		Track.prototype.initParameters = initParameters;
		Track.prototype.addDefaultParameters = addDefaultParameters;
		Track.prototype.getBeatDuration = getBeatDuration;
		Track.prototype.getBarDuration = getBarDuration;
		Track.prototype.getPosition = getPosition;
		Track.prototype.setActive = setActive;
		Track.prototype.createParts = createParts;
		Track.prototype.getTime = getTime;
		Track.prototype.setVolume = setVolume;
		Track.prototype.getVolume = getVolume;
		Track.prototype.fade = fade;
		Track.prototype.fadeIn = fadeIn;
		Track.prototype.fadeOut = fadeOut;
		Track.prototype.musicalPositionToTime = musicalPositionToTime;
		Track.prototype.setParams = setParams;
		Track.prototype.set = set;
		Track.prototype.map = map;
		Track.prototype.divisionToTime = divisionToTime;
		Track.prototype.get = get;

		Track.prototype.setSoloGroup = setSoloGroup;

		Track.prototype.urlToUpbeat = urlToUpbeat;

		Track.prototype.setActiveVariations = function(activeVariations){

			this.parameters.activeVariations = activeVariations;
			this.parts.forEach(function(part){
				part.parameters.activeVariations = activeVariations;
			});
		}




		var Part = function(o, defaultData, bus, curPos){
			// a (typically) one bar of music including (optional) upbeat and (recommended) release tag

			var thisPart = this;
			if(o instanceof Array){

				// if array with urls
				o = {url:o};

			} else if(typeof o === "string"){
				// if single url
				o = {url:o};
			}

			o = o || {};
			defaultData = defaultData || {};
			this.parameters = this.initParameters(defaultData);

			var beatDuration = getBeatDuration(defaultData);
			var barDuration = getBarDuration(defaultData);

			if(typeof defaultData.timeSign === "string"){
				defaultData.timeSign = getTimeSign(defaultData.timeSign);
				//defaultData.length = defaultData.timeSign.nominator * beatDuration * self.parameters.timeSign.denominator / defaultData.timeSign.denominator;
			}
			var timeSign = defaultData.timeSign || self.parameters.timeSign;


			// ******* UPBEAT ******* //
			/*
			var upbeat;
			if(typeof o.upbeat === "undefined"){
				upbeat = defaultData.upbeat;
			} else {
				upbeat = o.upbeat;
			}
			*/

			let upbeat = o.upbeat || self.parameters.upbeat || 0;

			if(typeof upbeat === "string"){
				upbeat = getTimeSign(upbeat);
				upbeat = upbeat.nominator * beatDuration * self.parameters.timeSign.denominator / upbeat.denominator;
			} else if(typeof upbeat === "number"){
				upbeat /= 1000;
			}
			this.offset = -upbeat || 0.0;



			// ******* POSITION ******* //
			if(typeof o.pos === "string"){
				// use specified pos if available, else calculated value from previous part
				// format has to be "bar.beat" ie "10.3" for beat 3 in bar 10
				curPos = this.musicalPositionToTime(o.pos);
			} else if(typeof o.pos === "number"){
				curPos = o.pos;
			}
			this.pos = curPos;




			// ******* LENGTH ******* //

			var length;
			if(typeof o.length === "number"){
				length = o.length;
			} else {
				length = o.length || defaultData.partLength;
				length = divisionToTime(length, defaultData.timeSign, beatDuration);
				/*
				if(typeof length === "string"){
					length = getTimeSign(length);
				}

				length = length.nominator * beatDuration; // * self.parameters.timeSign.denominator / length.denominator;
				*/
			}

			// maybe move this to parameters
			this.length = length;




			// store urls in array
			var urls = typeof o.url === "string" ? [o.url] : o.url;

			var urlsCopy = [];
			this.files = [];
			// make a fresh copy of urls (so we don't mess with incoming array)
			urls.forEach(function(url){
				urlsCopy.push(url);
			});
			this.url = urlsCopy;

			for(var urlID in this.url){

				if(typeof this.url[urlID] === "string"){
					if(this.url[urlID].length){
						var fullPath = addAudioPath(defaultData.audioPath, this.url[urlID]);
						this.url[urlID] = fullPath;

						self.loadFile({url: this.url[urlID]}, function(fileData){

							// double structure for future use
							thisPart.files.push(fileData);
							loadComplete();
						}, function(){
							// error 
							loadComplete();
						});

						//console.log(this.url[urlID] + ": pos: " + this.pos + "; offset: " + this.offset + "; length: " + this.length);
					}
				}
			}

			this.id = o.index;

			this.parameters.destination = bus.input;
			this.parameters.channelMerger = self.channelMerger;

			this.bus = new Bus(this.parameters);
		}

		Part.prototype.fade = fade;
		Part.prototype.initParameters = initParameters;
		Part.prototype.addDefaultParameters = addDefaultParameters;
		Part.prototype.getBeatDuration = getBeatDuration;
		Part.prototype.getBarDuration = getBarDuration;
		Part.prototype.getPosition = getPosition;
		Part.prototype.setActive = setActive;
		Part.prototype.musicalPositionToTime = musicalPositionToTime;










		var Motif = function(o, section){

			// A short, single track, single part, phrase to be played in addition
			// to a section. It can trigger quantized to a specific note value


			this.id = self.motifs.length;
			this.section = section;
			this.envelopes = [];
			this.commands = [];
			this.soloGroups = [];

			this.type = "motif";
			this.visualElements = [];

			var me = this;

			this.parentObj = section || defaultInstance;
			var beatDuration = this.parentObj.getBeatDuration();
			o.quantize = getTimeSign(o.quantize || this.parentObj.parameters.quantize || self.parameters.quantize, this.parentObj.parameters.timeSign);

			this.volume = o.volume || 1;

			// a terrible solution where urls CAN be an Array with Command objects
			// is passed to JSON.parse which is illegal. Terrible.
			let urls = o.urls;
			o.urls = undefined;

			this.parameters = this.initParameters(o, self.parameters);

			o.urls = urls;

			this.loop = o.loop || 0;
			this.loop = this.loop == "off" ?  0 : this.loop;
			this.loopCnt = 0;
			this.idName = o.id || "";

			this.tags = o.tags || o.class || [];
			if(typeof this.tags === "string"){this.tags = this.tags.split(" ")};
			this.tags = this.tags.concat(urlsToTags(o.urls));

			this.parameters.destination = self.motifBus.input;
			this.parameters.channelMerger = self.channelMerger;
			this.bus = new Bus(this.parameters);

			if(this.parameters.voice){
				this.parameters.voiceObjectID = iMus.voiceController.addVoiceObject(this.parameters.voice, 1, this.bus.voiceGain, this.parameters.fadeTime/1000);
			}

			if(this.parameters.output){
				this.bus.connect(this.parameters.output);
			}

			this.eventHandler = new EventHandler();


			this.active = typeof o.active === "number" ? o.active : 1;
			this.sounds = [];
			
			
			if(this.parameters.pos){
				// if specified with negative pos value
				this.offset = this.parentObj.divisionToTime(this.parameters.pos);
			} else {
				// old syntax with positive upbeat value
				this.offset = -this.parentObj.divisionToTime(this.parameters.upbeat);
			}
			
			// use setting from parent section if not set for the leadin
			this.changeOnNext = this.parentObj.divisionToTime(this.parameters.changeOnNext || this.parentObj.parameters.changeOnNext);
			this.parameters.length = this.parentObj.divisionToTime(this.parameters.length);

			// this.parameters.length

			var obj;
			var url;

			for(var urlID in o.urls){
				url = o.urls[urlID];


				if(typeof url === "string"){

					// url without parameters
					obj = {};
					obj.url = addAudioPath(self.parameters.audioPath, url);


					obj.offset = -this.urlToUpbeat(url) || this.offset;

					//obj.offset = this.offset || 0;
				} else if(typeof url === "object"){

					// url with parameters
					obj = url;

					let src = obj.url || obj.src;
					if(src){
						obj.url = addAudioPath(self.parameters.audioPath, obj.url || obj.src);
					}
					// length
					if(obj.length){
						obj.length = this.parentObj.divisionToTime(obj.length);

						// var length = getTimeSign(obj.length);
						// obj.length = length.nominator * beatDuration * this.parentObj.parameters.timeSign.denominator / length.denominator;
					} else {
						// default one beat
						// obj.length = beatDuration;
					}

					if(obj.voice){
						obj.voice = obj.voice.split(" ").map(str => str.trim());
					}

					obj.offset = obj.pos ? this.parentObj.divisionToTime(obj.pos) : (-this.parentObj.divisionToTime(obj.upbeat) || this.offset || 0);
					if(!obj.offset){
						obj.changeOnNext = this.parentObj.divisionToTime(this.parameters.changeOnNext);
					}
				} else {

					console.error("Motif url is not correct: " + url);
				}
				self.loadFile(obj);

				this.sounds.push(obj);
			}



			me.triggedRecently = false;

			this.play = function(arg1, nextTime){

				// only play if parent section is playing or if Motif is
				// not connected to a section

				// 2022-09-15
				// This is now controlled in the global function iMus.play() instead. The old way of triggering
				// all motifs and leadins and then check if they were a part of the currentSection caused problems
				// when triggered after the currentSection had changed to the new one (i.e. if triggered after 
				// timerWindow)
				
				// if(this.section){
				// 	if(!(this.section.parameters.tags == defaultSectionName || this.section == self.currentSection)){
				// 		return;
				// 	}
				// }

				if(this.active <= 0){return}

				let currentTime = audioContext.currentTime;

				// console.log(`currentTime: ${currentTime.toFixed(2)}, nextTime: ${nextTime.toFixed(2)}`);

				// I'm not sure what this is for. It seems to case problems, making the motifs
				// staying at zero volume
				if(this.parameters.fadeTime){
						//this.fadeOut(0, this.parameters.fadeTime);
				}


				// avoid cracy double trigging

				var blockRetrig = this.parameters.blockRetrig || 0;

				if(arguments.length){
					var args = Array.prototype.slice.call(arguments, 0);
					if(typeof args[0] === "number"){
						blockRetrig = args.shift();
					}

					if(typeof args[0] === "string"){
						var playFunction = args.shift();
						switch(playFunction) {

							// causes the motif to retrigger when played
							case "loop":
							this.loop = -1;
							break;
						}
					}


					if(typeof args[0] === "function"){
						this.callBackOnFinish = args.shift();
					}
				}

				if(me.triggedRecently){
					console.log("trigged recently");
					return;
				}

				me.playing = true;
				//console.log("Play Motif: " + this.parameters.classList);

				if(self.currentSection && this.parameters.quantize != "off"){

					let controllingSection = this.section || self.currentSection;


					var beatDuration = controllingSection.getBeatDuration();
					var Q;
					if(this.parameters.type == "leadIn"){
						Q = this.parentObj.parameters.changeOnNextQ;
					} else {
						Q  = this.parameters.quantize.nominator * beatDuration * controllingSection.parameters.timeSign.denominator / this.parameters.quantize.denominator;
					}

					time = controllingSection.getTime();

					var Qtime, localTime, timeToQ, t;

					if(nextTime){
						// predefined. merge with the sorting of sounds. this is not enough
						Qtime = nextTime;
						localTime = Qtime - self.sectionStart;
						timeToQ = Qtime - audioContext.currentTime;

					} else {
						// calculated
						Qtime = Math.ceil(time / Q) * Q + self.sectionStart;
						localTime = (time+Q) % Q;
						timeToQ = Q - localTime;
					}
					

					// sort all sounds with the one to be played nearest in the future first
					this.sounds.sort(function(a, b){
						var diffA = Q + a.offset - localTime;
						diffA = diffA < 0 ? diffA + Q : diffA;
						var diffB = Q + b.offset - localTime;
						diffB = diffB < 0 ? diffB + Q : diffB;
						return diffA - diffB;
					});
				} else {
					timeToQ = 0;
				}


				var targetSounds = [];

				// pick the url that best suits the time from now to Qtime
				for(var i = 0; i < this.sounds.length; i++) {


					var curSound = this.sounds[i];
					//console.log(`offset = ${curSound.offset}`);

					if(targetSounds.length) {

						// add sound if it has the same offset (then randomize)
						if(curSound.offset == targetSounds[0].offset){
							targetSounds.push(curSound);
						}
					} else {

						// add at least one sound
						targetSounds.push(curSound);
					}

				}

				//console.log(`offset = ${targetSounds[0].offset}`);

				// put all possible files in url-list
				this.url = [];
				for(var sndID in targetSounds){
					var targetSound = targetSounds[sndID]
					this.url.push(targetSound);
				}
				//var targetSound = targetSounds[Math.floor(Math.random()*targetSounds.length)];
				let crop = 0;
				let offset = targetSound ? targetSound.offset : this.offset;

				if(this.parameters.quantize != "off"){

					// move to next legal Q if time is to early
					let offset = (targetSound ? targetSound.offset : 0);
					t = (nextTime ? nextTime : Qtime) + offset;

					if(this.parameters.type != "leadIn"){

						// Motifs are always synchronized with the next section change.
						// Leadins are only played if they fit BEFORE the 
						// next Q-time
						while(t < currentTime) {
							t+=Q;
						}
					} else {
						if(!self.playing){
							// only play leadins if music is playing
							return;
						}

						if(t < currentTime){ //} - timeWindow){ 2023-10-17
							
							
							// If a leadin has changeOnNext set, then make a cut-in
							// t += Q; // next Q-point i.e. bar
							let ChOn = targetSound.changeOnNext || this.changeOnNext;
							if(ChOn){
								t += this.getMaxUpbeatOffset();
								let nrOfChOn = parseInt(timeToQ / ChOn);
								if(!nrOfChOn){
									// wait an extra bar
									if(!nextTime){t += Q}							
								} else {
									crop = Math.abs(offset) - nrOfChOn * ChOn;
									t -= nrOfChOn * ChOn;
									// timeToQ -= Q;
									// console.log({now:currentTime.toFixed(2), next: t.toFixed(2), Q: Q, nrOfChOn: nrOfChOn, crop: crop})	
								
								}
								
							} else {
								// don't play a leadin if it's too late
								console.log(`Too late: ${t, audioContext.currentTime, targetSound.offset}`);
								// return;

								// 2023-10-06 update. Play in next bar
								t += Q;
							}
						}
					}
				} else {
					t = currentTime;
				}
				//this.url = targetSound.url;

				var that = this;
				var doOnFinishPlaying = function(){

					// retrigg if eternal loop

					switch(me.loop) {

						case -1:
						if(me.playing){
							me.play();
						}

						break;

						case 0:
						me.playing = false;
						break;

						default:
						me.loopCnt++;
						if(me.loopCnt <= me.loop){
							me.play();
						} else {
							me.playing = false;
							me.loopCnt = 0;
						}
						break;

					}
					if(that.callBackOnFinish){that.callBackOnFinish();}
				}


				// This is problematic for various reasons. This.url is set to (potentially) multiple 
				// sound objects and the random selection is done in the playSound() method. This means 
				// that the Motif object needs to retrieve which one was set to do clever things depending on it. 
				
				// if(nextTime){
				// 	t = nextTime; // + offset;
				// }
				var chosenURL = playSound(this, t, this.callBackOnStart, doOnFinishPlaying, undefined, crop);

				let pos = this.getAbsolutePosition(t);

				let description;
				if(chosenURL && chosenURL.url){
					description = waxml.pathToFileName(chosenURL.url);
				} else {
					description = this.tags[0];
				}
				 
				let label = this.parameters.type == "leadIn" ? "LEAD-IN" : "MOTIF";
				
					
				waxml.log([label, 
					description, 
					"changeOnNext: " + this.parameters.changeOnNext,
					posObjectToString(pos)
				]);


				let barDuration = this.getBarDuration();

				// ENVELOPES
				this.envelopes.forEach(env => {
					let origTimes = env.getParameter("orig-times");
					let times = origTimes.split(",").map(time => {
						time = parseFloat(time);
						if(time <= 100){
							time = time * timeToQ / 100;
						} else {
							time -= 100;
							time = timeToQ + time * barDuration / 100;
						}
						//time += beatDuration;
						return time;
					});

					
					console.log(times);
					env.setTimes(times);
					env.start();
				});

				// COMMANDS
				this.commands.forEach(cmd => {
					cmd.trig(t);
					// cmd.trig(timeToQ);
				});

				if(chosenURL && chosenURL.commands){
					chosenURL.commands.forEach(cmd => {
						cmd.trig(t);
					});
				}



				if(this.parameters.voiceObjectID){
					let endTime;
					if(this.parameters.type == "leadIn"){
						endTime = Qtime;
					} else {
						let length = chosenURL.length || this.parameters.length || this.parentObj.getBeatDuration();
						endTime = t + length;
						if(!length){
							console.log(`No length:`, this);
						}
					}
					iMus.voiceController.playVoiceObject(this.parameters.voiceObjectID, t, endTime, chosenURL.voice);
				}

				switch(this.parameters.retrig){

					case "next":
					case "shuffle":
					case "repeat":
					case "other":
					var i = this.sounds.indexOf(chosenURL);
					// pick target URL
					chosenURL = this.sounds.splice(i, 1)[0];
					// move selected file last
					this.sounds.push(chosenURL);
					break;

				}


				// make sure it does not double trig on the same Q value
				blockRetrig = blockRetrig || timeToQ;

				if(blockRetrig){
					me.triggedRecently = true;
					setTimeout(function(){
						me.triggedRecently = false;
					},blockRetrig*1000);
				}

				return timeToQ;
			}


			this.stop = function(){

				me.playing = false;
				me.triggedRecently = false;
				var gainNode = this.bus.output;

				fadeAudioNode(gainNode, 1, 0, 0.01);

				if(me.playingSources){
					setTimeout(function(){
						me.playingSources.forEach(function(source){
							source.disconnect(0);
						});
						fadeAudioNode(gainNode, 0, 1, 0);
					}, 20);
				}


			}

		}



		this.addMotif = function(){

			var params = {};
			var q, upbeat;

			if(arguments.length){
				var args = Array.prototype.slice.call(arguments, 0);
				if(args[0] instanceof Object){
					if(!args[0].url){

						// Motif properties found
						params = args.shift();

					}

				}

/*
				while(!args[args.length-1]){
					args.pop();
				}
*/


				// check if urls was set with array
				if(Array.isArray(args[0])){
					params.urls = args[0];
				} else {
					params.urls = args;
				}


				// store reference to section
				var section = args[1];


			} else {

				return -1;
			}

			var newMotif = new Motif(params, section);
			self.motifs.push(newMotif);


			return newMotif;
		}

		Motif.prototype.getMaxUpbeatOffset = function(){

			var maxOffset = 0;
			if(this.sounds){
				this.sounds.forEach(function(sound){
					if(sound){
						maxOffset = Math.min(maxOffset, sound.offset);
					}
				});
			}

			return -maxOffset;
		}

		Motif.prototype.getMinUpbeatOffset = function(){

			var minOffset = -this.changeOnNext; // || sound.offset; // -this.getBarDuration();
			
			this.sounds.forEach(sound => {
				if(sound){
					// let thisOffset = -this.changeOnNext || sound.offset;
					minOffset = Math.max(minOffset, sound.offset);
				}
			});

			// console.log(`${this.tags[0]}.minUpbeatOffset = ${minOffset}`);
			return minOffset;
		}


		Motif.prototype.setSoloState = function(_param1, _param2){

			var state = getSoloState(this.soloGroups, _param1, _param2);
			if(state === true || state === false){this.active = state}
		}

		Motif.prototype.getFilterState = getFilterState;
		Motif.prototype.filter = function(globalFilter){
			let state = this.getFilterState(globalFilter);

			if(typeof state != "undefined"){
				let activeFactor = Math.abs(this.active);
				this.active = state ? activeFactor: -activeFactor;
			}
		}


		this.addLeadIn = this.addMotif;



		Motif.prototype.initParameters = initParameters;
		Motif.prototype.addDefaultParameters = addDefaultParameters;
		Motif.prototype.getBeatDuration = getBeatDuration;
		Motif.prototype.getBarDuration = getBarDuration;
		Motif.prototype.getPosition = getPosition;
		Motif.prototype.getAbsolutePosition = getAbsolutePosition;

		Motif.prototype.setActive = setActive;
		Motif.prototype.setVolume = setVolume;
		Motif.prototype.getVolume = getVolume;
		Motif.prototype.setParams = setParams;
		Motif.prototype.set = set;
		Motif.prototype.map = map;

		Motif.prototype.fade = fade;
		Motif.prototype.fadeIn = fadeIn;
		Motif.prototype.fadeOut = fadeOut;
		Motif.prototype.setActiveVariations = setActiveVariations;
		Motif.prototype.get = get;

		Motif.prototype.urlToUpbeat = urlToUpbeat;
		Motif.prototype.setSoloGroup = setSoloGroup;
		Motif.prototype.musicalPositionToTime = musicalPositionToTime;



		Motif.prototype.addEnvelopes = function(envelopes){
			this.envelopes = envelopes;
		}







		var SFX = function(){

			// a SFX object
			this.url = Array.prototype.slice.call(arguments, 0);

			this.bus = new Bus({destination: self.sfxBus.input, channelMerger: self.channelMerger});


			for(var urlID in this.url){
				this.url[urlID] = addAudioPath(self.parameters.audioPath, this.url[urlID]);
				self.loadFile({url: this.url[urlID]});
			}


			var triggedRecently = false;

			this.play = function(){

				var blockRetrig = this.parameters.blockRetrig;

				if(arguments.length){
					var args = Array.prototype.slice.call(arguments, 0);
					if(typeof args[0] === "number"){
						blockRetrig = args.shift();
					}

					if(typeof args[0] === "function"){
						var callBackOnFinish = args.shift();
					}
				}


				if(!triggedRecently){
					blockRetrig = blockRetrig || 500;

					playSound(this, audioContext.currentTime, null, callBackOnFinish);
					triggedRecently = true;
					setTimeout(function(){triggedRecently = false;},blockRetrig);
				}
			}

			return this;

		}


		SFX.prototype.setVolume = setVolume;
		SFX.prototype.getVolume = getVolume;
		SFX.prototype.get = get;


		//this.addSFX = SFX;
		this.addSFX = (function() {
		    function tempSFX(args) {
		        return SFX.apply(this, args);
		    }
		    tempSFX.prototype = SFX.prototype;

		    return function() {
		        return new tempSFX(arguments);
		    }
		})();








		function posStringToObject(pos) {
			obj = {}
			obj.bar = 1;
			obj.beat = 1;
			obj.offBeat = 0;


			if(typeof pos === "string"){
				var delimiter = pos.indexOf(",") != -1 ? "," : ".";
				pos = pos.split(delimiter);
				if(pos.length){obj.bar = eval(pos[0])};
				if(pos.length > 1){obj.beat = eval(pos[1])};
				if(pos.length > 2){obj.offBeat = eval("."+pos[2])};
			}
			return obj;
		}

		function posObjectToString(obj){
			let bar = obj.bar || 1;
			let beat = obj.beat || 1;
			let offbeat = obj.offbeat || 0;
			let offsetString = offbeat.toFixed(2).split(".").pop();
			return `${bar}.${beat}.${offsetString}`;
		}


		function musicalPositionToTime(pos){
			var time = 0;
			switch(typeof pos) {

				case "string":
				if(pos == "off"){
					// this is to give non-looped track a VERY long loop length
					 time = 60 * 60 * 24 * 365;
				} else {
					var obj = posStringToObject(pos);
					var beatDuration = this.getBeatDuration();
					time = this.getBarDuration() * (obj.bar-1) + beatDuration * (obj.beat-1) + beatDuration * obj.offBeat;
				}
				break;


				case "number":
				time = pos;
				break;

			}
			return time;
		}



		function createParts(urls, defaultData, bus){

			// create Part objects
			var parts = [];
			var curPos = 0;
			for(var i=0; i<urls.length; i++){
				if(urls[i]){
					var part = new Part(urls[i], defaultData, bus, curPos);
					parts.push(part);
					curPos = part.pos + part.length;
				}
			}
			return parts;
		}




	}


	function addSuffix(url){

		// check suffix
		var s = url.substr(-4);
		switch(s){

			case ".wav":
			case ".mp3":
			case ".ogg":
			return url;
			break;


			default:
			return url + "." + this.parameters.suffix;
			break;

		}


	}



	function setVolume(val, dontStore){

		if(!this.bus){return}
		// this.bus.input.gain.linearRampToValueAtTime(val, audioContext.currentTime + 0.1);
		this.bus.input.gain.setTargetAtTime(val, audioContext.currentTime, 0.01);

		if(!this.parameters || dontStore){return}
		this.parameters.volume = val;
	}


	function getVolume(){

		if(!this.bus){return -1}
		return this.bus.output.gain.value;
	}


	function setSoloGroup(_param1, _param2){


		//
		var grp, valStr;

		if(_param2){
			grp = _param1;
			valStr = _param2;
		} else {
			grp = "default";
			valStr = _param1;
		}


		if(!this.soloGroups){
			this.soloGroups = [];
		}

		var values = new Range(valStr).values;

		this.soloGroups.push({name:grp, value: values});

	}

	function getSoloGroup(grp){
		if(!this.soloGroups){return}
		if(!this.soloGroups.length){return}
		var group = this.soloGroups.find(obj => {return obj.name == grp});
		return group;
	}

	function getFilterState(globalFilter = []){
		
		if(!this.soloGroups || !this.soloGroups.length){return} // super safe

		let state = true; 
		globalFilter.forEach(filter => {
			let group = this.soloGroups.find(group => group.name == filter.name);
			if(group){
				let val = filter.value;
				let groupState = false;
				// if there are specified groups and ALL of them are matching
				// then the filter state is true and the track/motif shall play
				group.value.forEach(curVal => {
					if(val == curVal){
						groupState = true;
					} else {
						if(curVal instanceof MinMax){
							if(typeof curVal.min == "number"){
								if(val >= curVal.min && val <= curVal.max){
									groupState = true;
								}
							}
						}
					}
				});
				state = state && groupState;
			}
		});
		return state;
	}


	function getSoloState(_soloGroups, _param1, _param2){

		if(!_soloGroups){return}
		if(!_soloGroups.length){return}

		var grp, val;

		if(typeof _param2 !== "undefined"){
			grp = _param1;
			val = _param2;
		} else {
			grp = "default";
			val = _param1;
		}


		var group = _soloGroups.find(obj => {return obj.name == grp});
		if(!group){return}

		var state = false;
		group.value.forEach(function(curVal){
			if(val == curVal){
				state = true;
			} else {
				if(curVal instanceof MinMax){
					if(typeof curVal.min == "number"){
						if(val >= curVal.min && val <= curVal.max){
							state = true;
						}
					}
				}
			}
		});
		return state;
	}




	iMus.prototype.initParameters = initParameters;
	iMus.prototype.addDefaultParameters = addDefaultParameters;
	iMus.prototype.getBeatDuration = getBeatDuration;
	iMus.prototype.getBarDuration = getBarDuration;

	iMus.prototype.getTime = getTime;
	iMus.prototype.addSuffix = addSuffix;
	iMus.prototype.getPosition = getPosition;
	iMus.prototype.divisionToTime = divisionToTime;
	iMus.prototype.fade = fade;
	iMus.prototype.fadeOut = fadeOut;
	iMus.prototype.fadeIn = fadeIn;

	iMus.prototype.clearTriggerIntervals = function(){
		while(this.triggerIntervals.length){
			clearInterval(this.triggerIntervals.pop());
		}
	}
	

	iMus.prototype.setOffset = function(offset){

		var nextTime;
		for(var sectionID in this.sections){

			var section = this.sections[sectionID];
			nextTime = section.setOffset(offset);
		}
		return nextTime;
	}



	iMus.prototype.find = find;


	iMus.prototype.play = function(selector){

		if(!this.sections.length){return;}
		this.sections[0].play();
	}


	iMus.prototype.call = function(selector, options){

		var selection = new Selection(selector, this);
		selection.play(options);

	}
	iMus.prototype.addAction = addAction;




	iMus.prototype.addReverb = function(params){

		if(!params){return}
		if(!params.url){return}
		if(!params.src){return}

		var url = addAudioPath(this.parameters.audioPath, params.url);

		var targetSFX = this.sendEffects[url];
		// var self = this;

		if(!targetSFX){

			targetSFX = audioContext.createConvolver();
			this.sendEffects[url] = targetSFX;

			this.loadFile({url:url}, function(){
				var buffer = buffers[url];
				var bufferSource = audioContext.createBufferSource();
				bufferSource.buffer = buffer;

				targetSFX.buffer = buffer;
				targetSFX.loop = true;
				targetSFX.normalize = true;
				targetSFX.connect(params.output || self.master.output);

			}, function(){
				// error
				buffers[url] = -1;
			});


		}

		params.src.connect(targetSFX);
		return targetSFX;
	}

	iMus.addLFO = addLFO;

	iMus.addEnvelope = function(_entries, _target){

		return new Envelope(_entries, _target);
	}


	iMus.prototype.setTempo = function(value){


		this.sections.forEach(function(section){

			section.setTempo(value);
		});
	}



	iMus.setTempo = function(value){


		this.instances.forEach(function(instance){

			instance.setTempo(value);
		});
	}




	iMus.timeToNext = function(val){
		return defaultInstance.timeToNext(val);
	}
	iMus.prototype.timeToNext = function(val){

		return this.divisionToTime(val)*1000;
	}




	iMus.solo = function(grp, val){


		this.instances.forEach(instance => {
			instance.sections.forEach(section => {

				let groupMatch = section.parameters["select-group"] == grp || section.parameters["select-variable"] == grp;
				let valueMatch = section.parameters["select-value"] ? section.parameters["select-value"].find(_val => _val == val) : false;

				if(groupMatch && valueMatch) {
					if(instance.playing){
						section.play();
					} else {
						instance.currentSection = section;
					}

				}

				let  nlbtl = 0;
				// find furtherst nextLegalBreak for affected tracks

				let affectedTracks = [];
				section.tracks.forEach(track => {
					let curState = track.active > 0;
					let newState = track.getSoloState(grp, val);
					if(newState != curState){
						affectedTracks.push(track);
						let nlb = track.getNextLegalBreak();
						if(nlb){
							nlbtl = Math.max(nlbtl, nlb.timeLeft);
						}
					}
				});


				affectedTracks.forEach(trackObj => {
					if(trackObj.state){
						trackObj.track.play(nlbtl);
					} else {
						trackObj.track.stop(nlbtl);
					}
				});

			});

			instance.motifs.forEach(motif => motif.setSoloState(grp, val));

		});


	}


	iMus.prototype.on = function on(int, fn, offset, repeat){


		if(!fn){return}
		offset = offset || 0;
		offset /= 1000;

		repeat = repeat || -1;
		// var self = this;
		var interval;
		var intervalID = 0;
		var counter = 1;

		switch(typeof int){

			case "string":
			interval = this.divisionToTime(int);
			break;

			case "number":
			interval = int/1000;
			break;

			default:
			return;
			break;

		}



		var delay;
		if(self.playing){

			var musicTime = Math.max(0, audioContext.currentTime - self.musicalStart);
			var nextTrig = Math.ceil(musicTime / interval) * interval + self.musicalStart + offset;
			delay = nextTrig - audioContext.currentTime;

		} else {
			delay = interval;
		}


		if(repeat == 1){
			if(delay < timeWindow*2 || musicTime < 0){delay += interval}
			return setTimeout(() => fn(), delay*1000);
		} else {
			if(musicTime < 0){delay += interval}
			var timerID = setInterval(() => {
				// this function will drift out of sync!!!
				setTimeout( () => fn(), delay*1000);
				counter++;

				if(counter >= repeat && repeat != -1){clearInterval(timerID)}
			}, interval*1000);
			return timerID;
		}


		return interval;

	}



	function addAction(id, fn){
		this.actions.push( new Action(id, fn) );
	}



	var Action = function(id, fn){

		this.idName = id;

		this.tags = id.split(" ");
		this.play = fn;

		return this;
	}



	// SELECTION OPERATIONS

	function find(selector){

		return new Selection(selector, this);

	}


	


	// EVENT HANDLER

	var Event = function(fn, delay){

		this.fn = fn;
		this.delay = delay || 0;
	}

	var EventHandler = function(){

		return this;
	}

	EventHandler.prototype.addEvent = function(event, fn, delay){

		if(typeof fn !== "function"){return}
		this[event] = this[event] || [];
		this[event].push( new Event(fn, delay) );

	}

	EventHandler.prototype.execute = function(event, param1){

		var events = this[event];
		if(!events){return}

		events.forEach(function(event){
			setTimeout(function(){
				event.fn(param1);
			}, event.delay);
		});

	}


	// HELPERS


	function widthEndingSlash(str){
		return str.substring(str.length-1) == "/" ? str : str + "/";
	}

	function addAudioPath(path, fileName){
		if(!fileName){
			console.log("no file")
		}
		if(fileName.includes("//")){
			return fileName;
		}
		var pathLength = path.length;
		path = path == fileName.substr(0, pathLength) ? "" : widthEndingSlash(path);
		return path + fileName;
	}


	// embryo till strToParamValue. Ännu inte ersatt 2019-03-17
	function urlToUpbeat(url){


		var patt = /up-(\d+)/;
		var result = url.match(patt);
		if(!result){
			return 0;
		}
		var nrOfBeats = Number(result.pop()) || 0;

		return this.getBeatDuration() * nrOfBeats;

	}



	function strToParamValue(str, param){


		str = removeSuffix(str);

		param = param || "";
		var patt = new RegExp(param+"-([A-Za-z0-9-.]+)");
		var result = str.match(patt);
		if(!result){
			return;
		}
		var val = result.pop();


		switch(param){
			case QUANTIZE:
			case LENGTH:
			case UPBEAT:
			val = val.replace("-", "/");
			break;

			default:
			break;
		}

		return val;

	}





	function urlsToFileNames(urls){

		var fileNames = [];
		if(typeof urls == "string"){urls = [urls]}
		urls = urls || [];

		urls.forEach(function(file){

			if(typeof file === "object"){

				// if part is defined by object with parameters
				if(file.url){
					if(file.url instanceof Array) {
						// if url is array with random alternatives
						var fileNamesFromVariations = urlsToFileNames(file.url);
						fileNames = fileNames.concat(fileNamesFromVariations);
					} else {
						fileNames.push(file.url);
					}

				} else if(file instanceof Array) {

					// if file is array with random alternatives
					var fileNamesFromVariations = urlsToFileNames(file);
					fileNames = fileNames.concat(fileNamesFromVariations);
				}

			} else if (typeof file === "string"){
				fileNames.push(file);
			}
		});

		return fileNames;

	}

	function removeSuffix(str){

		switch(str.substr(-4)){
			case ".mp3":
			case ".wav":
			case ".ogg":
			case ".aac":
			return str.substr(0, str.length-4);
			break;

			default:
			return str;
			break;
		}

	}

	function urlsToTags(urls){

		var tags = [];
		var allNames = {};

		var fileNames = urlsToFileNames(urls);


		fileNames.forEach(function(str){
			// add full file name
			tags.push(str);

			// remove suffix
			if(str.substr(-4, 1) == "."){
				str = str.substr(0, str.length-4);
			}

			// remove audioPath
			var lastSlash = str.lastIndexOf("/");
			if(lastSlash != -1){
				str = str.substr(lastSlash+1);
			}

			// get tags

			var curTags = str.split("_");
			curTags.forEach(function(curTag){
				allNames[curTag] = allNames[curTag] || 0;
				allNames[curTag]++;
			});


		});


		Object.keys(allNames).forEach(function (tag) {
			// add tag when all files share a tag
			if(allNames[tag] == fileNames.length){
				tags.push(tag);

				// strip variable prefix like "sc-", "tr-" etc
				var varVal = strToParamValue(tag);
				if(varVal){tags.push(varVal)}
			}

		});


		/*
		fileNames.forEach(function(str){
			var curTags = str.split("_");
			curTags.forEach(function(curTag){
				tags.push(curTag);
			});
		});
		*/

		return tags;
	}

	function round(val, decimals){
		decimals = decimals || 2;
		var factor = Math.pow(10, decimals);
		return Math.floor(val*factor)/factor;
	}

	function setActiveVariations(activeVariations){
		this.parameters.activeVariations = activeVariations;
	}

	function getBellCurveY(x, stdD, scale){
		// It returns values along a bell curve from 0 - 1 - 0 with an input of 0 - 1.
		scale = scale || false;
		stdD = stdD || 0.125;
		x = Math.min(1, Math.max(x, 0));
		var mean = 0.5;
		if(scale){
			return  1 / (( 1/( stdD * Math.sqrt(2 * Math.PI) ) ) * Math.pow(Math.E , -1 * Math.pow(x - mean, 2) / (2 * Math.pow(stdD,2))));
		}else{
			return (( 1/( stdD * Math.sqrt(2 * Math.PI) ) ) * Math.pow(Math.E , -1 * Math.pow(x - mean, 2) / (2 * Math.pow(stdD,2)))) * getBellCurveY(0.5, stdD, true);
		}
	}

	function getAbsolutePosition(t = audioContext.currentTime){
		return this.getPosition(t - self.musicalStart);
	}

	function getPosition(pos, flags){

		if(typeof pos == "undefined"){
			pos = this.musicTime || audioContext.currentTime - this.sectionStart || audioContext.currentTime - self.sectionStart;
		}

		obj = {};
		obj.bar = 1;
		obj.beat = 1;

		flags = flags || {};

		var params = this.parameters;
		var beatDuration = this.getBeatDuration();
		var barDuration = this.getBarDuration();

		switch(typeof pos){

			case "string":
			var delimiter = pos.indexOf(",") != -1 ? "," : ".";
			pos = pos.split(delimiter);
			if(pos.length){obj.bar = eval(pos[0])};
			if(pos.length > 1){obj.beat = eval(pos[1])};
			obj.time = barDuration * (obj.bar-1) + beatDuration * (obj.beat-1);
			break;

			case "number":
			switch(flags.roundTo){

				case "bar":
				pos = pos + barDuration / 2;
				break;

				case "beat":
				pos = pos + beatDuration / 2;
				break;

				default:
				break;
			}
			var bar = Math.floor(pos / barDuration);
			obj.beat = Math.floor(pos / beatDuration) % params.timeSign.nominator + 1;
			obj.bar = bar + 1;
			obj.offbeat = (pos / beatDuration) % 1;

			obj.distToBeat  = (pos + beatDuration/2) % beatDuration - beatDuration/2;
			obj.barDuration = barDuration;
			obj.beatDuration = beatDuration;
			obj.time = pos;
			break;


		}

		return obj;

	}



	function onEvent(event, fn, delay){

		this.eventHandler = this.eventHandler || new EventHandler();
		this.eventHandler.addEvent(event, fn, delay);
	}



	function getBeatDuration (params){
		params = params || this.parameters;
		return 60.0 / params.tempo;
	}

	function getBarDuration(params){
		params = params || this.parameters;
		var beatDuration = getBeatDuration(params);
		return beatDuration * params.timeSign.nominator;
	}

	function setActive(activeVal){

		var ar = this.parameters.activeRange;

		if(activeVal < 0) {

			// predefined passive val
			this.active = activeVal;

		} else if(activeVal >= ar.min && activeVal <= ar.max) {

			// this is a predecessor to the filter attribute.
			// sort it out and choose sollution. This is confusing.
			var range = ar.max - ar.min;
			var valInRange = activeVal - ar.min;

			var valueRange = ar.maxVal - ar.minVal;

			if(range == 0){
				this.active = ar.maxVal;
			} else {
				this.active = ar.minVal + valInRange / range * valueRange;
			}

		} else {
			this.active = 0;
		}

		if(this.parts){
			this.parts.forEach(part => {
				part.active = this.active;
			});
		}


		if(this.parameters.fadeTime){

			if(this.active > 0){
				this.fadeIn();
			} else {
				this.fadeOut();
			}

		}

	}


	function getTime(time){

		var timeSign = (this.parameters || defaultParams).timeSign;
		var tempo = (this.parameters || defaultParams).tempo;

		if(!timeSign){
			console.log(timeSign);
		}
		if(typeof time === "undefined"){

			time = audioContext.currentTime - (self.sectionStart || defaultInstance.sectionStart);
		} else if(typeof time === "string"){
			// if specified by "bar/beat"
			var posArr = time.split("/");
			if(posArr.length < 1){
				posArr = [0,timeSign.denominator];
			} else if(posArr.length < 2) {
				posArr[1] = timeSign.denominator;
			}

			var beat = posArr[0] * timeSign.denominator / posArr[1];
			time = beat * 60 / tempo;

		}
		time = time || 0;
		return time;
	}

	function inArray(needle, haystack){

		if(!(haystack instanceof Array)){return false}
		if(!haystack.length){return false}

		let needles = [];
		if(typeof needle == "string"){
			needles = needle.split(" ");
		} else if(typeof needle == "number"){
			needles.push(needle);
		} else if(needle instanceof Array){
			// all is well with my soul
			needles = needle;
		}
		if(!needles.length){return false}

		var matches = 0;

		needles.forEach(n => {

			let needle = String(n);
			let thisNeedelIsMatched = false;

			let matchPattern = needle.substr(0, 1) == "*";
			if(matchPattern){
				needle = needle.substr(1);
			}



			haystack.forEach(str => {
				if(matchPattern){
					if(str.substr(str.length-needle.length) == needle){
						thisNeedelIsMatched = true;
					}
				} else {
					if(str == needle){
						thisNeedelIsMatched = true;
					}
				}
			});

			if(thisNeedelIsMatched){matches++}
		});


		return matches >= needles.length;
	}


	function mergeArrays(targetArray, sourceArray){

		sourceArray.forEach(function(val){
			if(!inArray(val, targetArray)){
				targetArray.push(val);
			}
		});

		return targetArray;
	}


	function findAndReplace(originalString, needle, rplc){

		// remove init char if # or .
		var firstChar = needle.substr(0, 1);
		if(firstChar == "#" || firstChar == "."){
			needle = needle.substr(1);
		}


		var matchPattern = needle.substr(0, 1) == "*";
		if(matchPattern){
			needle = needle.substr(1);
			rplc = rplc.substr(1);
			return originalString.replace(needle, rplc);
		} else {
			return originalString;
		}
	}



	function initParameters(values, inheritedValues){

		// values = Object.create(values);
		inheritedValues = typeof inheritedValues === "undefined" ? {} : (JSON.parse(JSON.stringify(inheritedValues)));

		// overwrite with local values
		if(typeof values === "object"){
			values = (JSON.parse(JSON.stringify(values)));
			for(attr in values){
				inheritedValues[attr] = values[attr];
			}
		}

		// add classList
		if(values.class && values.class.length){
			inheritedValues.classList = values.class.split(" ");
		} else {
			inheritedValues.classList = [];
		}
		


		this.addDefaultParameters(inheritedValues);

		return inheritedValues;

	}



	var defaultParams = {};
	defaultParams.volume = 1;
	defaultParams.pan = 0.5;
	defaultParams.tempo = 120;
	defaultParams.audioPath = "audio";
	defaultParams.upbeat = 0;
	defaultParams.partLength = "1/1";
	defaultParams.changeOnNext = "1/1";
	defaultParams.timeSign = {nominator: 4, denominator: 4};
	defaultParams.fadeTime = 0.01;
	defaultParams.offset = 0;
	defaultParams.suffix = "mp3";
	defaultParams.loopActive = 1;
	defaultParams.loopEnd = "5.1";
	defaultParams.activeRange = {};
	defaultParams.activeRange.min = 0;
	defaultParams.activeRange.max = 1;
	defaultParams.activeRange.minVal = 0;
	defaultParams.activeRange.maxVal = 1;
	defaultParams.blockRetrig = 0;
	defaultParams.repeat = 1;
	defaultParams.retrig = "shuffle";
	defaultParams.release = 0;



	defaultParams.quantize = "1/8";

	function addDefaultParameters(params){


		params.volume = params.volume || defaultParams.volume;
		params.pan = typeof params.pan === "number" ? params.pan : defaultParams.pan;
		params.tempo = params.tempo || defaultParams.tempo;
		params.timeSign = getTimeSign(params.timeSign || defaultParams.timeSign);
		params.upbeat = params.upbeat || defaultParams.upbeat;
		params.quantize = params.quantize || defaultParams.quantize;
		params.fadeTime = typeof params.fadeTime === "undefined" ? defaultParams.fadeTime : params.fadeTime;
		params.partLength = params.partLength || defaultParams.partLength;
		params.changeOnNext = params.changeOnNext || defaultParams.changeOnNext;
		params.retrig = params.retrig || defaultParams.retrig;
		params.release = params.release || defaultParams.release;

		params.externalOffset = params.offset || defaultParams.offset;
		params.creationTime = params.creationTime  || new Date().getTime();
		params.suffix = params.suffix || defaultParams.suffix;

		params.audioPath = params.audioPath || defaultParams.audioPath;
		params.loopActive = typeof params.loopActive === "number" ? params.loopActive : defaultParams.loopActive;
		params.loopEnd = params.loopEnd || defaultParams.loopEnd;

		params.activeRange = params.activeRange || defaultParams.activeRange;
		params.activeRange.min = params.activeRange.min || defaultParams.activeRange.min;
		params.activeRange.max = params.activeRange.max || defaultParams.activeRange.max;
		params.activeRange.minVal = typeof params.activeRange.minVal === "undefined" ? defaultParams.activeRange.minVal : params.activeRange.minVal;
		params.activeRange.maxVal = typeof params.activeRange.maxVal === "undefined" ? defaultParams.activeRange.maxVal : params.activeRange.maxVal;


	}

	function fade(val, delay, duration, callBack){

		var gainNode = this.bus.output;
		if(this.fadeCallbackID){clearTimeout(this.fadeCallbackID);}

		var myObj = this;

		if(typeof duration === "undefined"){
			duration = this.parameters.fadeTime || 0.001;
		}
		duration = duration || 0.001;

		// make sure fade is finished at delay time
		// delay -= duration;
		delay = delay > 0 ? delay : 0;


		var fadeEndTime = audioContext.currentTime+delay+duration/2;
		var fadeStartTime = Math.max(audioContext.currentTime, fadeEndTime-duration);
		gainNode.gain.cancelScheduledValues(fadeStartTime);

		if(this.parameters){
			var defaultVal = this.parameters.volume;
		}
		// user either defined value, stored value or 1
		val = (typeof val === "undefined") ? (defaultVal || 1) : val;
		val = Math.max(val, 0);

		gainNode.gain.setTargetAtTime(val, fadeStartTime, duration);

		if(typeof callBack === "function"){
			this.fadeCallbackID = setTimeout(callBack, (delay+duration*3)*1000);
		}

		if(this.visualElements){

			while(this.visualElements.length){
				let el = this.visualElements.pop();
				waxml.visualFadeOut({
					element: el,
					time: fadeStartTime + duration,
					fadeTime: duration
				});
			}
			
		}

	}


	function fadeAudioNode(node, from, to, delay){

		node.gain.cancelScheduledValues(0);
		node.gain.setValueAtTime(from, 0);
		//node.gain.exponentialRampToValueAtTime(to, audioContext.currentTime+delay);
		node.gain.linearRampToValueAtTime(to, audioContext.currentTime+delay);

	}

	function fadeIn(delay, duration){

		this.fade(1, delay, duration);
	}

	function fadeOut(delay, duration){
		this.fade(0, delay, duration);
	}

	function get(param1, param2){

		var targetParams = this.parameters;
		switch(param1){

			case "bus":
			return this.bus;
			break;

			case "send":
			return this.bus.sends[param2];
			break;

			case "randomOffset":
			return targetParams[param1] * 1000;
			break;

			default:
			return targetParams[param1];
			break;


		}
	}

	function setParams(keyValues){

		if(!keyValues){return}
		if(!keyValues.length){return}

		for (let i in keyValues){
			if(keyValues.hasOwnProperty(i)){
				this.set(keyValues[i].name, keyValues[i].value);
			}

		}

	}


	function attributesToObject(attributes){

		var obj = {};

		if(!attributes){return obj}
		if(!attributes.length){return obj}



		// for (let i in attributes){
		// 	if(attributes.hasOwnProperty(i)){
		// 		let param = attributes[i].name;
		// 		let value = typeFixParam(param, attributes[i].value);
		// 		obj[param] = value;
		// 	}
		// }
		[...attributes].forEach(attr => {
			if(attr.name){
				let value = typeFixParam(attr.name, attr.value);
				obj[attr.name] = value;
			}
		});

		return obj;
	}

	function getFollowAttributes(attributes){
		let selectAttributes = [];
		Array.from(attributes).forEach(attribute => {
			if(attribute.name.includes("follow-")){
				let arr = attribute.name.split("-");
				arr.shift();
				let key = arr.join("-");
				selectAttributes.push({key: key, value: attribute.value});
			}
		});
		return selectAttributes;
	}

	function getFollowRules(str){

		let selectAttributes = [];
		if(str){
			if(str.includes("=")){
				// logical expression i.e. "intensity=1;mood=happy"
				selectAttributes = str.split(";").map(expression => {
					let arr = expression.split("=").map(s => s.trim());
					let rule;
					if(arr[0]){
						rule = {key: arr[0], value: arr[1]};
					} else {
						rule = -1; // syntax error
					}
					return rule;
				}).filter(rule => rule != -1);
			} 
		}
		return selectAttributes;
	}


	function typeFixParam(param, value){

		switch(param){

			case "volume":
			case "gain":
			if(value.includes("dB")){
				value = Math.pow(2, Number(value.split("dB")[0]) / 3);
			} else {
				value = Number(value);
			}
			break;

			case "normalize":
			value = value == "true";
			break;

			// iMusic objects
			case "pan":
			case "tempo":
			case "fadeTime":
			case "loopActive":
			case "blockRetrig":
			case "repeat":
			case "release":
			case "active":

			// AudioNodes

			//filter
			case "frequency":
			case "detune":
			case "Q":

			// delay
			case "delayTime":

			// compressor
			case "threshold":
			case "knee":
			case "ratio":
			case "reduction":
			case "attack":
			case "release":

			value = Number(value);
			break;

			default:

			break;

		}
		return value;

	}


	function set(param, value, value2){

		var targetParams = this.parameters || defaultInstance.parameters;

		switch(param){

			case "volume":


			if(this.setVolume){
				this.setVolume(value);
			}
			break;

			case "timeSign":
			value = getTimeSign(value);
			break;

			case "loopEnd":
			value = this.musicalPositionToTime(value);
			break;

			case "loopLength":
			value = this.divisionToTime(String(value));
			param = "loopEnd";
			break;


			case "partLength":
			if(typeof value === "number"){
				value /= 1000;
			}
			if(this.setPartLength){
				this.setPartLength(value);
			}
			break;


			case "changeOnNext":
			if(typeof value === "number"){
				value /= 1000;
			}
			break;


			case "randomOffset":
			value /= 1000;
			break;

			case "repeat":
			if(this.setRepeat){
				this.setRepeat(value);
			}
			break;

			case "upbeat":
			if(typeof value === "number"){
				value /= 1000;
			}
			if(this.setUpbeat){
				this.setUpbeat(value);
			}
			break;

			case "active":
			if(this.setActive){
				this.setActive(value);
			}
			break;


			case "fadeTime":
			value /= 1000;
			break;

			case "tags":
			if(typeof value === "string"){
				value = value.split(" ");
			}
			targetParams = this;
			break;


			case "blockRetrig":
			if(typeof value === "string"){
				value = (this.getTime || getTime)(value);
			} else {
				value /= 1000;
			}
			break;


			case "release":
			value /= 1000;
			break;

			case "tempo":
			if(this.setTempo){
				this.setTempo(value);
			}
			break;


			case "variation":
			if(this.setVariation){
				this.setVariation(value, value2);
			}
			break;

			case "solo":
			case "select-group":
			if(this.setSoloGroup){
				this.setSoloGroup(value, value2);
			}
			break;

			case "select-variable":
			if(this.setSoloGroup){

		  		let win = "window.";
			  	if(value.substr(0, 7) != win){value = win + value}

				this.setSoloGroup(value, value2);
			}
			break;

			case "output":
			if(this.bus){
				this.bus.setOutput(value, value2);
			}
			break;

			case "pan":
			if(this.bus){
				value2 = value2 || 1;
				this.bus.animate("pan", value, value2/1000);
			}
			break;

			case "filter":
			if(this.bus){
				this.bus.setFilter(value);
			}
			break;

			case "delay":
			if(this.bus){
				this.bus.setDelay(value);
			}

			default:
			if(this.bus){
				value2 = value2 || 1;
				this.bus.animate(value, value2);
			}
			break;
		}

		targetParams[param] = value;
		if(iMus.debug){console.log(param, value)}
		return {param: param, val: value};
	}



	function map(param, valIn, minIn, maxIn, minOut, maxOut, exp){

		exp = exp || 1;

		valIn = Math.max(valIn, minIn);
		valIn = Math.min(valIn, maxIn);

		var rangeIn = maxIn - minIn;
		var relVal = (valIn - minIn)/rangeIn;

		var rangeOut = maxOut - minOut;
		var valOut = Math.pow(relVal, exp) * rangeOut + minOut;

		this.set(param, valOut);
	}


	function strToParameters(str){


		var params = {};
		params.sectionID = strToParamValue(str, SECTION);
		params.trackID = strToParamValue(str, TRACK);
		params.motifID = strToParamValue(str, MOTIF);
		params.leadinID = strToParamValue(str, LEADIN);
		params.soundID = strToParamValue(str, SOUND);
		params.pos = strToParamValue(str, POSITION);
		params.variantID = strToParamValue(str, VARIANT);
		params.upbeat = strToParamValue(str, UPBEAT);
		params.quantize = strToParamValue(str, QUANTIZE);
		params.length = strToParamValue(str, LENGTH);

		return params;
	}


	var masterBus = new Bus();
	masterBus.output.channelCount = maxChannelCount;

	iMus.master = masterBus;

	iMus.audioContext = audioContext;
	iMus.instances = [];


	iMus.objects = {}
	iMus.setOffset = function(offset){


		var nextTime;
		for(var i=0; i<this.instances.length; i++){
			console.log("diff - " + new Date() + " : " + i);
			var curInstance = this.instances[i];
			nextTime = curInstance.setOffset(offset);
		}

		console.log("nextTime: " + nextTime);

	}


	iMus.setParams = setParams;

	iMus.set = function(param, val){
		var sectionID = defaultInstance.sections.length - 1;
		var obj = defaultInstance.sections[sectionID].set(param, val);
		defaultInstance.parameters[obj.param] = obj.val;
		defaultParams[obj.param] = obj.val;

		switch(param){

			case "osc":
			// Jag fick aldrig osc.WebSocketPort att funka, så nu fick det bli socket.io istället
			// if(osc){
			// 	// activate OSC communication if available
			// 	var oscPort = new osc.WebSocketPort({
			// 		url: val, // val shall contain the URL to your Web Socket server.
			// 		metadata: true
			// 	});
			// 	oscPort.open();
			// 	oscPort.on("message", oscMsg => {
			// 		console.log("OSC", oscMsg);
			// 	});
			// }

			if(io){
				socket = io(val);
				socket.on('serverToClient', msg => {
					let address = msg.address.split("/");
					let args = msg.args;
					if(address[1] == "waxml"){

						switch(address[2]){

							case "play":
							if(msg.args[0])window.waxml.trig(address[3]);
							break;

							case "stop":
							if(msg.args[0])window.waxml.stop(address[3]);
							break;

							case "set":
							// det här är ju ett dumt upplägg men det blir bra när waxml och imusic gifter sig ;-)
							window.waxml.setVariable(address[3], msg.args[0]);
							break;
						}

					}

				});
			}
			break;

			default:
			iMus.select(param, val);
			break;
		}
	}

	iMus.get = function(param){

		return defaultParams[param];
	}

	iMus.initSelection = function(filter){
		defaultInstance.selectFilter = filter;
		iMus.select();

	}

	iMus.select = function(key, value){

		
		if(key){
			// set new value
			var targetFilter = defaultInstance.selectFilter.find(curFilter => curFilter.name == key);
			if(targetFilter){
				targetFilter.value = value;
			} else {
				defaultInstance.selectFilter.push({name: key, value: value});
			}
		}
		
		// update filter for all tracks and motifs
		defaultInstance.sections.forEach(section => {
			section.tracks.forEach(track => track.filter(defaultInstance.selectFilter));
		});
		defaultInstance.motifs.forEach(motif => motif.filter(defaultInstance.selectFilter));


	}

	iMus.isPlaying = function(){
		return iMus.getDefaultInstance().playing;
	}

	iMus.play = function(selector, options, arg2, arg3){
		// play objects matched by selector or play defaultInstance
		let returnValues;

		if(selector){
			
			// get new selection
			var selection = new Selection().selectForPlayback(selector);

			if(iMus.playAfterInterlude && selection.sections.length){
				clearTimeout(iMus.playAfterInterlude);
			}

			if(selection.objects.length){
				// check if the selection includes a section
				if(selection.sections.length){
					let newSection = selection.sections[0];
					// Note: sections can have multiple classes. Find the one that matches this selector.
					
					let interludeSection, interludeSelection, interludeSelector;
					if(selection.string && iMus.lastSelectedSectionString){
						// make interlude selection (i.e. A-B)
						console.log(iMus.lastSelectedSectionString, "->", selection.string);
						interludeSelector = `${iMus.lastSelectedSectionString}-${selection.string}`;
						
						interludeSelection = new Selection().selectForPlayback(interludeSelector);
						interludeSection = interludeSelection.sections.pop();
					}
					if(interludeSection && iMus.isPlaying()){
						// if there is a match, first trig leadIns and Motifs now
						[...interludeSelection.motifs,...interludeSelection.leadIns].forEach(obj => obj.play(options, arg2, arg3));

						// then play interlude and store time until it changes
						returnValues = {};
						returnValues.delay = interludeSection.play(options, arg2, arg3);
						let timeToLegalBreak = interludeSection.getTimeToLegalBreak();
						let interludeLength = interludeSection.getLength();

						// delay call to play target selection until interlude is done
						let delay = timeToLegalBreak + interludeLength -timeWindow;
						iMus.playAfterInterlude = setTimeout(() => {
							iMus.lastSelectedSectionString = selection.string;
							returnValues = selection.play(options, arg2, selector).returnVal;

							let delay = waxml.toSignificant(returnValues.delay);
							waxml.log(`AUTO-TRIG->${selector}, delay: ${delay}`);
						}, delay * 1000);
						
					} else {
						// If no interlude is found, then play all matches now
						// This DOES NOT WORK!! xxx
						// Make sure the real distance to nextLegalBreak is calculated first
						// then, trigger the leadins and lastly the arrangement.
						iMus.lastSelectedSectionString = selection.string;

						let time = getNextTime(self.currentSection, newSection, selector);
						// returnValues = newSection.play(options, time, selector);
						returnValues = selection.play(options, time, selector).returnVal;
						
					}
				} else {
					// play only motifs in current section
					returnValues = selection.play(options, arg2, arg3).returnVal;
				}
			}

			
			
		} else {
			// No selector (i.e. iMus.play())

			// don't play anything - to be consistent with WAXML
			// if(defaultInstance.currentSection){
			// 	iMus.lastSelectedSectionString = defaultInstance.currentSection.parameters.classList[0];
			// 	defaultInstance.currentSection.play();
			// } else {
			// 	defaultInstance.currentSection = "default";
			// 	var selection = new Selection("default", defaultInstance);
			// 	return selection.play(options, arg2, arg3);
			// }
		}

		if(returnValues){
			// let delay = waxml.toSignificant(returnValues.delay);
			// waxml.log(`TRIG->${selector}, delay: ${delay}`);
			return returnValues;
		}

	}

	iMus.start = iMus.play;
	iMus.trig = iMus.play;

	iMus.next = function(){
		console.log("next");
		if(!defaultInstance.currentSection){
			iMus.play();
		} else {
			let i = defaultInstance.sections.indexOf(defaultInstance.currentSection);
			i = ++i % defaultInstance.sections.length;
			defaultInstance.sections[i].play();
		}

	}

	iMus.stop = function(selector){
		// stop objects matched by selector or play defaultInstance
		if(!defaultInstance.currentSection){return}

		if(iMus.playAfterInterlude){
			clearTimeout(iMus.playAfterInterlude);
		}

		if(selector && selector){
			var selection = new Selection(selector, defaultInstance);
			selection.stopAllSounds();
		} else {
			defaultInstance.currentSection.stopAllSounds();
		}
		defaultInstance.clearTriggerIntervals();
		
		//defaultInstance.playing = false;


		//defaultInstance.currentSection = null;

	}

	iMus.isPlaying = function(){
		var isPlaying = false;
		this.instances.forEach(function(instance){
			isPlaying = instance.playing || isPlaying;
		});
		return isPlaying;
	}


	iMus.prototype.addEventListener = function(name, fn) {
		if(typeof name !== "string"){return}
		if(typeof fn !== "function"){return}
		this._listeners[name] = this._listeners[name] || [];
		this._listeners[name].push(fn);
	}

	iMus.prototype.dispatchEvent = function(e) {
		this._listeners[e.type] = this._listeners[e.type] || [];
		this._listeners[e.type].forEach(fn => fn(e));
	}

	iMus.setInterval = function(fn, interval, offset, counter){
		counter = counter || -1;
		return defaultInstance.on(interval, fn, offset, counter);
	}


	iMus.setTimeout = function(fn, interval, offset){
		return defaultInstance.on(interval, fn, offset, 1);
	}

	iMus.getPosition = function(pos, flags){
		return defaultInstance.getPosition(pos, flags);
	}

	iMus.clearTimeouts = function(){

		while(defaultInstance.intervalIDs.length){
			var intervalID = defaultInstance.intervalIDs.pop();
			clearTimeout(intervalID);
		}

	}

	iMus.getDefaultInstance = function(){
		return defaultInstance;
	}

	

	iMus.fade = function(val, delay, duration){
		defaultInstance.fade(val, delay, duration);
	}

	iMus.fadeIn = function(delay, duration){
		defaultInstance.fadeIn(delay, duration);
	}

	iMus.fadeOut = function(delay, duration){
		defaultInstance.fadeOut(delay, duration);
	}


	iMus.createBus = function(){
		return defaultInstance.getBus();
	};

	//audioContext.createBufferSource(); //??
	window.audioContext = audioContext;


	iMus.addLoopTrack = function(urls){
		return iMus(defaultSectionName).addLoopTrack(urls);
	}

	iMus.addTrackGroup = function(selection){
		return iMus(defaultSectionName).addTrackGroup(selection);
	}


	iMus.addMotif = function(urls, q, upbeat){
		return iMus.getDefaultInstance().addMotif(urls, q, upbeat);
		//return iMus(defaultSectionName).addMotif(urls, q, upbeat);
	}


	iMus.loadJSON = function(jsonData){
		var data = JSON.parse(jsonData);
		this.loadData(data);
	}

	iMus.loadData = function(data){

		if(data.sections){

			data.sections.forEach(function(section){

				if(section.tracks){
					section.tracks.forEach(function(track){
						iMus(section.id).addLoopTrack(track.parts);
					});
				}

				if(section.motifs){
					section.motifs.forEach(function(motif){
						iMus(section.id).addMotif(motif.urls, motif.quantize);
					});
				}

				if(section.leadins){
					section.leadins.forEach(function(leadin){
						iMus(section.id).addLeadIn(leadin.urls);
					});
				}

				if(section.sounds){
					section.sounds.forEach(function(sound){
						iMus(section.id).addMotif(sound.urls, "off");
					});
				}
			});

		}



		if(data.tracks){
			data.tracks.forEach(function(track){
				iMus(defaultSectionName).addLoopTrack(track.parts);
			});
		}

		if(data.motifs){
			data.motifs.forEach(function(motif){
				defaultInstance.addMotif({quantize: motif.quantize}, motif.urls);
			});
		}

		if(data.leadins){
			data.gs.forEach(function(leadin){
				defaultInstance.addLeadIn({quantize: "bar"}, leadin.urls);
			});
		}

		if(data.sounds){
			data.sounds.forEach(function(sound){
				defaultInstance.addMotif({quantize: "off"}, sound.urls);
			});
		}
	}

	iMus.loadFiles = function(urls){

		var obj = filesNamesTodata(urls);
		this.loadData(obj);
	}


	iMus.filesNamesTodata = filesNamesTodata;

	function filesNamesTodata(urls){

		var obj = {};

/*
		obj.motifs = [];
		obj.leadins = [];
		obj.sounds = [];
*/


		urls.forEach(function(url){

			var params = strToParameters(url);
			var targetObj;

			if(params.sectionID){

				obj.sections = obj.sections || [];
				var section = getObjectFromParam(obj.sections, "id", params.sectionID);
				if(!section){
					section = {};
					obj.sections.push(section);
				}

				section.id = params.sectionID;
				section.tracks = section.tracks || [];

				if(params.trackID){
					var track = getObjectFromParam(section.tracks, "id", params.trackID);
					if(!track){
						track = {};
						section.tracks.push(track);
					}

					var curPos = "1";

					track.id = params.trackID;
					track.parts = track.parts || [];

					params.pos = params.pos || (params.variantID ? "1" : String(track.parts.length+1));
					var part = getObjectFromParam(track.parts, "pos", params.pos);
					if(!part){
						part = {};
						track.parts.push(part);
					}

					part.pos = params.pos;
					part.url = part.url || [];
					if(typeof params.upbeat !== "undefined"){part.upbeat = params.upbeat}
					part.url.push(url);
					if(typeof params.length !== "undefined"){part.length = params.length}

				}
			}

			targetObj = section ? section : obj;

			if(params.motifID){
				if(!targetObj.motifs){
					targetObj.motifs = [];
				}
				var motif = getObjectFromParam(targetObj.motifs, "id", params.motifID);
				if(!motif){
					motif = {};
					targetObj.motifs.push(motif);
				}

				motif.id = params.motifID;
				motif.urls = motif.urls || [];
				motif.urls.push(url);
				if(params.quantize){
					motif.quantize = params.quantize;
				}
			}


			if(params.leadinID){
				if(!targetObj.leadin){
					targetObj.leadin = [];
				}
				var leadin = getObjectFromParam(targetObj.leadins, "id", params.leadinID);
				if(!leadin){
					leadin = {};
					targetObj.leadins.push(leadin);
				}
				leadin.id = params.motifID;
				leadin.urls = motif.urls || [];
				leadin.urls.push(url);
				leadin.quantize = "bar";
			}

			if(params.soundID){
				if(!targetObj.sounds){
					targetObj.sounds = [];
				}
				var sound = getObjectFromParam(targetObj.sounds, "id", params.soundID) || {};
				sound.id = sound.soundID;
				sound.urls = sound.urls || [];
				sound.urls.push(url);
			}

		});

		return obj;

	}


	function getObjectFromParam(arr, param, val){
		return arr.find(function(params){
			return params[param] == val;
		});
	}





	// embryo for loadFiles. Used for single files only

	iMus.loadFile = function(urls){

		//if(typeof urls === "string")){urls = urls.split(",")}

		// to prevent same file to be added several times
		var existing = iMus(urls);
		if(existing.objects.length){return existing}

		var sectionID, trackID, motifID, leadinID, soundID;


		//urls.forEach(function(url){
			// detect section
			sectionID = strToParamValue(urls, SECTION);

			// detect track
			trackID = strToParamValue(urls, TRACK);

			// detect motif
			motifID = strToParamValue(urls, MOTIF);

			// detect leadIn
			leadinID = strToParamValue(urls, LEADIN);

			// detect sound
			soundID = strToParamValue(urls, SOUND);

		//});


		if(sectionID == undefined){
			if(trackID != undefined){
				return iMus(defaultSectionName).addLoopTrack(urls);
			} else if(motifID != undefined){
				var motif = defaultInstance.addMotif({url:urls});
				return new Selection(MOTIF + "-" + motifID);
			} else if(leadinID != undefined){
				var leadin = defaultInstance.addLeadIn({url:urls});
				return new Selection(LEADIN + "-" + leadinID);
			} else if(soundID != undefined){
				var sound = defaultInstance.addMotif({quantize:"off"}, urls);
				return new Selection(SOUND + "-" + soundID);
			}

		} else {

			//sectionID = SECTION + "-" + sectionID;
			var tags = urlsToTags(urls);
			var section = defaultInstance.addSection({tags: tags});
			if(motifID != undefined){
				return iMus(tags[0]).addMotif(urls);
			}  else if(leadinID != undefined){
				return iMus(tags[0]).addLeadIn(urls);
			} else if(soundID != undefined){
				return iMus(tags[0]).addMotif(urls, "off");
			} else if(trackID != undefined){
				return iMus(tags[0]).addLoopTrack(urls);
			} else {
				var selection = iMus(tags[0]);
				// if we not make a new selection, the old will be overwritten...
				iMus(tags[0]).addLoopTrack(urls);
				return selection;
			}

		}

	}






	iMus.addLeadIn = iMus.addMotif;
	iMus.addStingerTrack = iMus.addMotif;


	if(window.module){
		// support nodeJS
		module.exports = iMus;
	} else {
		// stand alone
		window.iMus = iMus;
		window.iMusic = iMus;
		//iMus.instances.push(defaultInstance);
	}

	var defaultInstance = new iMus();
	iMus.instance = defaultInstance;
	//defaultInstance.addSection({tags: defaultSectionName});
	// Ta bort denna tomma instans. Men det kräver också att kod
	// som beror på den måste fixas som t.ex. iMus.set()


	defaultInstance.addSection();
	iMus.addSection = defaultInstance.addSection;



	iMus.variations = {};

	iMus.voiceController = new VoiceController();


	iMus.setVariation = function(groupID, val){
		iMus.variations[groupID] = val;
	}

	iMus.getVariation = function(groupID){
		var val = iMus.variations[groupID];
		if(!val){val = 0};
		val = Math.min(val, Math.max(val, 0));
		return val;
	}



	iMus.onload = function(){
		// better to make this a dispatch a custom event
		iMus.GUI = new GUI();
	};


	document.addEventListener("click", function(){
		// to init Web Audio on first click
		initAudioContextTimer();
	});


	iMus.connectToHTML = e => {
		
		[...document.querySelectorAll("*")].forEach( el => {

			[...el.attributes].forEach( attr => {

				if(attr.localName.startsWith("data-waxml-")){
					let fn;
					let attrNameArr = attr.localName.split("-");

					let sustain;
					let animationData = attr.value.split(",");
					switch(attrNameArr[2]){

						// i.e. "beat, 0, 100, red, 0, 300"
						case "style":
							let Q = (animationData[0] || "beat").trim();
							let offset = (animationData[1] || "0").trim();
							sustain = (animationData[2] || "").trim();
							let className = (animationData[3] || "waxml-trigger").trim();
							let attack = (animationData[4] || "").trim();
							let decay = (animationData[5] || "").trim();
							defaultInstance.addEventListener(Q, e => {
								let delay = 0;
								if(offset.includes("ms")){
									delay = parseFloat(offset);
								} else {
									delay = defaultInstance.currentSection.divisionToTime(offset) * 1000;
								}
								
								let A = parseFloat(attack || el.style.transitionDuration || 0);
								let S = defaultInstance.currentSection.divisionToTime(sustain || Q) * 1000 / (sustain ? 1 : 2);
								el.style.transitionDuration = A + "ms";

								setTimeout(() => el.classList.add(className), delay);

								setTimeout(() => {
									if(decay){
										el.style.transitionDuration = decay + "ms";
									}
									el.classList.remove(className);
								}, delay + A + S);

							});
							break;

						
							case "trigger":
							sustain = 200;
							let url = animationData[0];
							defaultInstance.addEventListener("playFile", musicEvent => {
								if(musicEvent.detail.url == url){
									if(el.timeout){clearTimeout(el.timeout)}
									el.classList.add("waxml-trigger");
									el.timeout = setTimeout(e => el.classList.remove("waxml-trigger"), sustain);
								}
							});
							break;

						default:
							break;
					}
				}
			});
		});

		// add imusic commands to click on links
		[...document.querySelectorAll("*")].forEach( el => {

			[...el.attributes].forEach( attr => {
				if(attr.localName.startsWith("data-imusic")){

					// Create empty link for <a> elements
					if(el.localName == "a"){
						var deadLink = "javascript:void(0)";
						if(!el.attributes.href){
							el.setAttribute("href", deadLink);
						} else if(el.attributes.href.nodeValue == "#"){
							el.attributes.href.nodeValue = deadLink;
						}
					}

					let val = attr.nodeValue;
					let floatVal = parseFloat(val);
					if(!Number.isNaN(floatVal)){
						val = floatVal;
					}

					let fn = () => {}; // empty function
					let attrNameArr = attr.localName.split("-");

					if(attrNameArr.length == 2){
						// insert default click event
						attrNameArr.splice(2, 0, "click", val);
					} else if(attrNameArr.length == 3){
						// insert default click event and value as commandname
						attrNameArr.splice(3, 0, val);
						val = "";
					}

					let eventName = attrNameArr[2];
					let commandName = attrNameArr[3];
					let variableName = commandName; // duplet for clarity ;-) - it can be either or...

					switch(commandName){
						case "start":
						case "play":
						case "trig":
						case "select":
							fn = e => {
								val.split(",").forEach(v => iMusic.play(v.trim()));
							}
						break;

						case "toggle":
							fn = e => {
								let state = el.classList.contains("active");
								if(state){
									el.classList.remove("active");
								} else {
									el.classList.add("active");
								}
								val.split(",").forEach(v => iMusic(v.trim()).togglePlay());
							}
						break;

						case "stop":
							fn = e => iMusic.stop();
						break;


						case "set":
							// New syntax 2022-09-15. Target variable is now not be a part of 
							// the attribute name, but as a part of the expression
							// in the value
							// i.e. data-imusic-click="intensity=5"
							if(val.includes("=")){
								let values = [];
								// allow for multiple values
								let rules = val.split(";").forEach(expression => {
									let arr = expression.split("=").map(v => v.trim());
									let key = arr[0];
									let value = arr[1];
									if(key){
										if(value.includes("this.")){
											// allow for dynamic values from slider, switches etc.
											let targetProperty = value.replace("this", "el");
											value = {
												valueOf: () => {
													return eval(targetProperty);
												}
											}
										} 

										values.push({key: key, value: value});
									}
								});
								fn = e => {
									values.forEach(entry => iMusic.select(entry.key, entry.value.valueOf()));
								}
								
							} 
							break;

						case "trigger":
						case "style":
							// this is a bit weird
							// just added to avoid doing something wrong for attributes
							// that shall attach eventListeners to iMusic (above)
						break;

						default:
							if(variableName){
								if(eventName == "input"){
									fn = e => {
										iMusic.select(variableName, e.target.value);
									}
								} else {
									fn = e => {
										iMusic.select(variableName, val);
									}
								}		
							}
							break;
					}
					el.addEventListener(eventName, fn);


				}
			});

		});


  	}



  	class VariableWatcher {


	  	constructor(_instance){

		  	this.variables = [];
		  	this.instance = _instance;


		  	setInterval(() => this.update(), timeWindow/2);


	  	}

	  	update(force){

		  	this.variables.forEach(varObj => {

			  	let curVal;

			  	if(varObj.target){
				  	curVal = varObj.target[varObj.property];
			  	}
			  	//let curVal = eval(varObj.name);
			  	if((curVal != varObj.val  || force == true) && typeof curVal !== "undefined"){


				  	varObj.val = curVal;

				  	varObj.listeners.forEach(listener => {
					  	if(listener.variable == varObj.name){
						  	listener.target.map(listener.parameter, curVal);
					  	}
				  	});

				  	// this line seems to crash in the solo-function
				  	// that's why I keep it last. Fix bug!
				  	this.instance.select(varObj.name, curVal);



			  	}


		  	});
	  	}

	  	addVariable(_variable, obj, mapper){

		  	let win = "window.";
		  	if(_variable.substr(0, 7) != win){
			  	_variable = win + _variable;
		  	}


		  	let varObj = this.variables.find(obj => {
			  	return _variable == obj.name;
		  	});

		  	if(!varObj){
			  	varObj = {};
			  	varObj.name = _variable;
			  	varObj.listeners = [];


			  	let o = Data.fetchObject(_variable);
			  	varObj.property = o.property;
			  	varObj.target = o.target;

			  	this.variables.push(varObj);
		  	}

		  	if(obj){
			  	let listObj = {}
			  	listObj.target = obj;
			  	listObj.variable = _variable;
			  	listObj.parameter = mapper.parameter;
			  	varObj.listeners.push(listObj);
			}


	  	}


	  	// add reccursive function to get object


  	}

  	var variableWatcher = new VariableWatcher(iMus);


  	function addReferenceObject(tag, obj, parent){
	  	if(!tag){return}
	  	if(!obj){return}
	  	iMus.objects[tag] = obj;
	  	if(parent instanceof Object){parent[tag] = obj};
  	}

	function getNextTime(fromSection, toSection, selector){
		let maxUpbeatInThis = toSection.getMaxUpbeatOffset();
		let maxFadeTimeInThis = toSection.getMaxFadeTime();
		let maxLeadInOffset = fromSection ? fromSection.getMaxLeadInUpbeatOffset(selector) : 0;
		let maxUpbeat = Math.max(maxUpbeatInThis, maxLeadInOffset, maxFadeTimeInThis);
		let nextTime = fromSection ? fromSection.getNextLegalBreak(maxUpbeat) : 0;
		return nextTime;
	}



  	class Data {

  	}

  	Data.fetchObject = function(path){

	  	let returnObj = {};
	  	var obj = window;

	  	let l = path.split(".");
	  	returnObj.property = l.pop();

	  	l.forEach(str => {
		  	if(str != "window"){
			  	let curObj = obj[str];
			  	if(curObj){
				  	obj = curObj;
			  	} else {
				  	console.log("can't find variable reference: " + path);
			  	}

		  	}
	  	});

	  	returnObj.target = obj;
	  	return returnObj;
  	}

  	Data.loadXML = function(src, el){

	  	if(src){
		  	fetch(src)
		  	.then(response => response.text())
		  	.then(xml => {
			  	let parser = new DOMParser();
			  	let xmlDoc = parser.parseFromString(xml,"text/xml");
					let imusicData = xmlDoc.querySelector("imusic");
			  	this.parseXML(imusicData, el);
				if(waxml){
					waxml.initLinearArranger(self);
					// xxx better to connect to frame update
					setInterval(() => {
						waxml.scrollArrangeWindow();
					}, 1000/60);
				}
			})
		}

  	}

  	Data.parseXML = function(root){


	  	if(root){
		  	iMus.setParams(root.attributes);

			let schemaLocation = root.attributes["xsi:schemaLocation"];
			if(schemaLocation){
				let schemaFile = schemaLocation.value.split(" ").pop();
				if(schemaFile != expectedSchemaFile){
					console.warn(`Wrong iMusic XML Schema File. ${expectedSchemaFile} is expected`);
					waxml.log({
						type: "error",
						data: `Wrong iMusic XML Schema File, ${expectedSchemaFile} is expected`
					});
				}
			}
		  	var defInst = defaultInstance;
		  	var url, params, part;
		  	var selectKeys = [];

			this.tags = [];

		  	var arrangements = root.querySelectorAll("arrangement");
		  	arrangements.forEach((arr, _index) => {

			  	var id = arr.getAttribute("select-value"); // change in the future XXX
			  	url = arr.getAttribute("src");
			  	if(url == null){url = undefined}

			  	let params = attributesToObject(arr.attributes);
			  	params.tags = params.tags || id; // this is to make select-value work. Not stable.
				if(params["select-variable"]){
					if(params["select-variable"].substr(0, 7) != "window."){params["select-variable"] = "window." + params["select-variable"]}
			  	}
			  	if(params["select-value"]){
				  	params["select-value"] = params["select-value"].split(",").map(str => str.trim());
			  	}

			  	var section = defInst.addSection(params, url);
			  	//section.setParams(arr.attributes); Is this needed when params are passed on creation of section?

			  	// check selected
			  	if(arr.getAttribute("selected") == "true" || _index == 0){
				  	defInst.currentSection = section;
			  	}


				var tracks = arr.querySelectorAll("track");
				tracks.forEach((track) => {

					var urls = [];
					url = track.getAttribute("src");
					if(url){urls.push(url)}

					var regions = track.querySelectorAll("region");

					params = attributesToObject(track.attributes);

					regions.forEach((region) => {
						part = attributesToObject(region.attributes);
						url = region.getAttribute("src");

						if(!url){
							url = [];
							var sources = region.querySelectorAll("source, option");
							sources.forEach((source) => {
								var src = source.getAttribute("src");
								if(src){url.push(src)}
							});
						}

						part.url = url;

						urls.push(part);
					});
					var stem = section.addStem(params, urls);

					if(stem){
						// WAXML nodes
						if(window.webAudioXML){
							let envelopeNodes = track.querySelectorAll("envelope");
							let envelopes = [];
							envelopeNodes.forEach(xmlNode => {
								let env = window.webAudioXML.createObject(xmlNode);
								envelopes.push(env);
							});
							stem.addEnvelopes(envelopes);


							let commandNodes = track.querySelectorAll("command");
							let commands = [];
							commandNodes.forEach(xmlNode => {
								let command = waxml.createObject(xmlNode);
								// stupid conversion from string value = "-1/4"
								command.pos = section.musicalPositionToTime(command.pos);
								commands.push(command);
							});
							stem.commands = commands;
							
						}
					}
					


					// the solo-function needs to be reworked xxx
					if(track.hasAttribute("select-group")){
						var key = track.getAttribute("select-group");
						var value = track.getAttribute("select-value");
						// store solo values
						stem.setSoloGroup(key, value);
					}
					if(track.hasAttribute("select-variable")){
						var key = track.getAttribute("select-variable");
						var value = track.getAttribute("select-value");

						let win = "window.";
						if(key.substr(0, 7) != win){key = win + key}

						// store solo values
						stem.setSoloGroup(key, value);
					}


					// new XML syntax where group name is part of the attribute name
					// and value is the value of the old select-value attribute.
					// This allows for a system with multiple select-groups for one track
					// i.e. select-intensity="0...25"

					// getFollowAttributes(track.attributes).forEach(entry => {
					// 	stem.setSoloGroup(entry.key, entry.value);
					// });

					// 2022-09-15 update
					// It's NOT a good way of including variable-names as part of the attribute name
					// We should instead allow for multiple variables to be specified in the attribute value
					// separated with semicolon. And it should not be 'follow'. I'll try "filter"
					// i.e. filter="intensity=1; mood=happy; place=1,2..4,8"

					getFollowRules(track.getAttribute("filter")).forEach(entry => {
						stem.setSoloGroup(entry.key, entry.value);
					});

				});


				var motifs = arr.querySelectorAll("motif, leadin");
				motifs.forEach(motif => {

					let urls = [];

					let params = attributesToObject(motif.attributes);
					let url = motif.getAttribute("src");
					if(url){urls.push(url)}
					let sources = motif.querySelectorAll("source, option");
					sources.forEach(source => {
						var src = attributesToObject(source.attributes);
						src.commands = [];

						source.querySelectorAll("command").forEach(xmlNode => {
							let command = waxml.createObject(xmlNode);
							// xxx stupid conversion from string value = "-1/4"
							command.offset = section.divisionToTime(command.pos);
							src.commands.push(command);
						});
						//var src = source.getAttribute("src");
						if(src){urls.push(src)}
					});

					let motifObj;
					if(motif.nodeName == "motif"){
						motifObj = section.addMotif(params, urls);
					} else {

						// leadin default values
						if(typeof params.upbeat == "undefined" && typeof params.pos == "undefined"){
							// set leadin default to one bar
							// and changeOnNext to 1/8 so default
							// behaviour will be to auto crop leadin at next Q value
							params.upbeat = "bar";
							params.quantize = params.quantize || "bar";
							params.changeOnNext = params.changeOnNext || "1/8";
						}
						motifObj = section.addLeadIn(params, urls);
					}


					// the solo-function needs to be reworked xxx
			  		if(motif.hasAttribute("select-group")){
				  		var key = motif.getAttribute("select-group");
				  		var value = motif.getAttribute("select-value");
				  		// store solo values
				  		motifObj.setSoloGroup(key, value);
			  		}
			  		if(motif.hasAttribute("select-variable")){
				  		var key = motif.getAttribute("select-variable");
				  		var value = motif.getAttribute("select-value");

				  		let win = "window.";
					  	if(key.substr(0, 7) != win){key = win + key}

				  		// store solo values
				  		motifObj.setSoloGroup(key, value);
			  		}


					getFollowRules(motif.getAttribute("filter")).forEach(entry => {
						motifObj.setSoloGroup(entry.key, entry.value);
					});

					// WAXML nodes
					if(window.webAudioXML){
						let envelopeNodes = motif.querySelectorAll("envelope");
						let envelopes = [];
						envelopeNodes.forEach(xmlNode => {
							let musicalTimes = xmlNode.getAttribute("times");
							xmlNode.setAttribute("orig-times", musicalTimes);
							let env = window.webAudioXML.createObject(xmlNode);
							envelopes.push(env);
						});
						motifObj.addEnvelopes(envelopes);


						commands = [];
						[...motif.children].forEach(childNode => {
							if(childNode.localName.toLowerCase() == "command"){

								let command = waxml.createObject(childNode);
								// stupid conversion from string value = "-1/4"
								command.offset = section.divisionToTime(command.pos);
								commands.push(command);
							}
						});
						motifObj.commands = commands;

					}
				});
			});

			root.querySelectorAll("*[selected='true']").forEach((obj) => {

				let key = obj.getAttribute("select-group");
				if(!key){
					key = obj.getAttribute("select-variable");
			  		let win = "window.";
				  	if(key.substr(0, 7) != win){key = win + key}
				}
				if(!key){return}
				let value = obj.getAttribute("select-value");
				if(!value){return}
				iMus.select(key, value);
			});

			// add variable watchers for all objects with defined values
			root.querySelectorAll("*[select-variable]").forEach((obj) => {
				variableWatcher.addVariable(obj.getAttribute("select-variable"));
			});

			console.log("XML parse time: " + (Date.now() - XMLtimeStamp));

			iMus.connectToHTML();

	  	}



  	}




	var XMLtimeStamp;
	// var musicStructure = document.currentScript.dataset.musicStructure;



	function parseImusicXML(){

		XMLtimeStamp = Date.now();


		if(musicStructure){
			let xmlDoc = document.querySelector(musicStructure);

			if(xmlDoc){
				Data.parseXML(xmlDoc);
			} else {
				Data.loadXML(musicStructure);
			}
		}

	}

	if(window.webAudioXML){

		// register and wait for callback from webAudioXML before parsing
		// (and especially connecting) iMusic environment
		window.webAudioXML.registerPlugin({
			name: "iMusic",
			variables: {},
			init:  parseImusicXML,
			setVariable: (key, val) => iMusic.select(key, val),
			connect: (destination) => {
				iMus.master.output.disconnect(0);
				iMus.master.output.connect(destination);
			},
			call: (fn, arg1, arg2, arg3) => {
				callFunction = iMusic[fn];
				if(callFunction){
					return callFunction(arg1, arg2, arg3);
				}
			},
			musicalStructure: self
		});
	} else {
		// else, just parse iMusic when window is loaded
		window.addEventListener("load", parseImusicXML);
	}






  	class AnalyserObject {

	  	constructor(ctx, target){
		  	this.ctx = ctx;
		  	this.target = target;
	  	}


	  	update(e){

	  	}
  	}

	

  	// class Bus2 {

	//   	constructor(ctx, el){
	// 	  	this.ctx = ctx;
	// 	  	this._input = new AudioNode("gain", {}, ctx, el);
	// 	  	this.nodes = [];
	// 	  	this._output = new AudioNode("gain", {}, ctx, el);
	// 	  	this._output.connect(this.ctx.destination);
	// 	  	this.sends = {};

	// 	  	this.parentEl = el;

	//   	}

	//   	get connection(){
	// 	  	return this._input.node;
	//   	}

	//   	get input(){
	// 	  	return this._input.node;
	//   	}

	//   	get output(){
	// 	  	return this._output.node;
	//   	}


	//   	addNode(nodeType, params){

	// 	  	let audioNode = new AudioNode(nodeType, params, this.ctx, this.el);

	// 	  	switch(nodeType){
	// 		  	case "send":
	// 		  	this.output.connect(audioNode.node);
	// 		  	if(params.output){
	// 		  		let destination = iMus.objects[params.output];
	// 		  		audioNode.connect(destination.input);
	// 		  	}
	// 		  	break;

	// 		  	case "oscillator":
	// 		  	audioNode.node.connect(this.output);
	// 		  	this.nodes.push(audioNode);
	// 		  	break;


	// 		  	default:
	// 		  	this.connect(audioNode.node);
	// 		  	audioNode.node.connect(this.output);
	// 		  	this.nodes.push(audioNode);
	// 		  	break;
	// 	  	}


	// 	  	return audioNode;

	//   	}


	//   	connect(destination){
	// 	  	destination = destination || this.output;
	// 	  	let last = this.nodes.slice(-1).pop() || this;
	// 	  	last.connection.disconnect(0);
	// 	  	last.connection.connect(destination);
	//   	}

	//   	addSend(classList, bus){
	// 	  	let gainObj = new AudioNode("gain", {}, this.ctx, this.el);
	// 	  	classList.forEach(tag => addReferenceObject(tag, gainObj, this.sends));
	// 	  	gainObj.connect(bus);
	//   	}


	//   	start(){
	// 	  	this.nodes.forEach(node => {node.start()});
	//   	}

	//   	stop(){
	// 	  	this.nodes.forEach(node => {node.stop()});
	//   	}


  	// }



  	class AudioNode{

	  	constructor(nodeType, params = {}, ctx, el){

		  	nodeType = nodeType.toLowerCase();
		  	if(nodeType.substr(-4) == "node"){
			  	nodeType = nodeType.substr(0, nodeType.length-4);
		  	}
		  	this.ctx = ctx || audioContext;
		  	let fn, src;
		  	let path = params.path || "audio";;
		  	this.nodeType = nodeType;

		  	switch(nodeType){

			  	case "audioBuffer":
			  	this.node = this.ctx.createAudioBuffer();
			  	src = addAudioPath(path, params.src);
			  	fetch(src)
			        .then(response => response.arrayBuffer())
			        .then(arrayBuffer => this.ctx.decodeAudioData(arrayBuffer,
			        	audioBuffer => this.node.buffer = audioBuffer,
			        	e => reject(e)
			        ));
			  	break;


			  	case "oscillator":
			  	this.node = this.ctx.createOscillator();
			  	if(params.autoPlay != "false"){
					this.node.start();
			  	}
			  	break;


			  	case "biquadfilter":
			  	this.node = this.ctx.createBiquadFilter();
			  	break;

			  	case "convolver":
			  	if(!params.src){return}
			  	src = addAudioPath(path, params.src);
			  	this.node = this.ctx.createConvolver();
			  	fetch(src)
			        .then(response => response.arrayBuffer())
			        .then(arrayBuffer => this.ctx.decodeAudioData(arrayBuffer,
			        	audioBuffer => this.node.buffer = audioBuffer,
			        	e => reject(e)
			        ));
			  	break;

			  	case "delay":
			  	this.node = this.ctx.createDelay();
			  	break;

			  	case "dynamicscompressor":
			  	break;

			  	case "waveshaper":
			  	break;

			  	case "periodicwave":
			  	break;

			  	case "iirfilter":
			  	break;

			  	case "gain":
			  	case "send":
			  	this.node = createGainNode();
			  	break;

			  	default:
			  	return false;
			  	break;

		  	}


		  	// mappers
		  	this.mappers = {};

		  	// set parameters
		  	if(params){Object.keys(params).forEach(key => this[key] = params[key])};



	  	}


	  	addController(type, params = {}){
		  	if(!type){return}



		  	switch(params.parameter){

			  	case "frequency":
			  	params.min = params.min || 0;
			  	params.max = params.max || 3;
			  	params.step = params.step || 0.01;
			  	params.conv = params.conv || "Math.pow(10,x)*20";
			  	break;

			  	case "detune":
			  	params.min = params.min || -153600;
			  	params.max = params.max || 53600;
			  	params.conv = params.conv || "";
			  	params.step = params.step || 1;
			  	break;

			  	default:
			  	params.min = params.min || 0;
			  	params.max = params.max || 1;
			  	params.step = params.step || 0.01;
			  	params.conv = params.conv || "Math.pow(x,3)";
			  	break;
		  	}

		  	params.valuetip = 1;

			type = type == "true" ? "slider" : type;
			let el = document.createElement("webaudio-" + type, params);
			this.el.appendChild(el);
			Object.keys(params).forEach(key => el.setAttribute(key, params[key]));

			el.addEventListener("input", e => {
				let paramObj = this.node[params.parameter];
				if(paramObj){
					paramObj.setTargetAtTime(e.target.convValue, 0, 0.001);
				}

			});



	  	}

	  	addMapper(paramName, follow, mapString){
		  	if(!paramName){return}
		  	//if(!mapString){return}

		  	let arr = mapString ? mapString.split(",") : null;

		  	let obj = {};

		  	if(arr){
			  	obj.minIn = Number(arr.shift());
			  	obj.maxIn = Number(arr.shift());
			  	obj.minOut = Number(arr.shift());
			  	obj.maxOut = Number(arr.shift());
			  	obj.exp = arr.shift();
		  	} else {

			  	switch(paramName){

				  	case "frequency":
				  	obj.minIn = -24000;
				  	obj.maxIn = 24000;
				  	obj.minOut = -24000;
				  	obj.maxOut = 24000;
				  	obj.exp = 1;
				  	break;

				  	case "detune":
				  	obj.minIn = -153600;
				  	obj.maxIn = 153600;
				  	obj.minOut = -153600;
				  	obj.maxOut = 153600;
				  	obj.exp = 1;
				  	break;

				  	default:
				  	obj.minIn = 0;
				  	obj.maxIn = 1;
				  	obj.minOut = 0;
				  	obj.maxOut = 1;
				  	obj.exp = 1;
				  	break;
			  	}
		  	}


		  	obj.target = this;
			obj.parameter= paramName;

		  	obj.follow = follow;

		  	let mapper = new Mapper(obj);

		  	this.mappers[paramName] = mapper;
		  	return mapper;
	  	}

	  	get connection(){
		  	return this.node;
	  	}

	  	get input(){
		  	return this.node;
	  	}

	  	disconnect(ch){
		  	ch = ch || 0;
		  	this.node.disconnect(ch);
	  	}

	  	connect(destination){
		  	destination = destination || this.ctx.destination;
		  	this.node.connect(destination);
	  	}

	  	start(){
		  	switch(this.nodeType){

			  	case "oscillator":
		  		if (typeof this.node.start === 'undefined'){
			  		this.node.noteOn(0);
			  	} else {
				  	this.node.start(0);
			  	}
			  	break;

			  	case "envelope":
			  	break;
		  	}
	  	}

	  	stop(){

		  	switch(this.nodeType){

			  	case "oscillator":
			  	break;

			  	case "envelope":
			  	break;
		  	}
	  	}




	  	setTargetAtTime(param, value, delay, transitionTime){

		  	let startTime = this.ctx.currentTime + (delay || 0);
		  	transitionTime = transitionTime || 0;
		  	//console.log(param, value);
		  	this.node[param].setTargetAtTime(value, startTime, transitionTime);
	  	}

	  	map(param, val, delay, transitionTime){


	  		let mapper = this.mappers[param];
	  		if(!mapper){return}

			val = mapper.getValue(val);
			this[mapper.parameter] = val;


	  	}


	  	set gain(val){
		  	this.setTargetAtTime("gain", val);
	  	}

	  	get gain(){
		  	return this.gain.value;
	  	}

	  	set frequency(val){
	  		this.setTargetAtTime("frequency", val);
	  	}

	  	get frequency(){
		  	return this.frequency.value;
	  	}

	  	set detune(val){
		  	this.setTargetAtTime("detune", val);
	  	}

	  	get detune(){
		  	return this.detune.value;
	  	}

	  	set Q(val){
		  	this.setTargetAtTime("Q", val);
	  	}

	  	get Q(){
		  	return this.Q.value;
	  	}

	  	set type(val){
		  	this.node.type = val;
	  	}

	  	get type(){
		  	return this.node.type;
	  	}

	  	set(key, value){
		  	if(typeof this.node[key] !== "undefined"){
			  	this[key] = value;
		  	}
	  	}


  	}


  	class Mapper{


		constructor(obj){

			this.minIn = obj.minIn || 0;
			this.maxIn = obj.maxIn || 1;
			this.rangeIn = obj.maxIn - obj.minIn;


			this.minOut = obj.minOut || 0;
			this.maxOut = obj.maxOut || 1;
			this.rangeOut = obj.maxOut - obj.minOut;

			this.exp = obj.exp || "x";

			this.follow = obj.follow;
			this.parameter = obj.parameter;
			if(Number(this.exp) == this.exp){this.exp = "Math.pow(x, " + this.exp + ")"};

		}


		getValue(x){

			x = Math.max(x, this.minIn);
			x = Math.min(x, this.maxIn);

			let valIn = eval(this.exp);

			let relVal = (valIn - this.minIn)/this.rangeIn;
			let valOut = relVal * this.rangeOut + this.minOut;

			return valOut;
		}


	}


  	class Range {

		constructor(_values){

			this.values = [];
			this._valueType = "number";
			if(_values){
				let arr;
				if(_values instanceof Array){
					arr = _values;
				} else {
					arr = _values.split(",");
				}
				arr.forEach(val => {

					if(typeof val != "object"){

						let v = Number(val);

						if(isNaN(v)){
	
							if(val.includes("...")){
								var minMaxStrings = val.split("...");
								var numValMin = eval(minMaxStrings[0]);
								var numValMax = eval(minMaxStrings[1]);
								this.values.push(numValMin);
								this.values.push(numValMax);
								val = new MinMax(numValMin, numValMax);
							}
	
							this._valueType = "string";
						} else {
							val = v;
						}
						this.values.push(val);
					}

				});

				this.values.sort();

				if(!this.values.length){
					this.values.push({min:0,max:1});
				}

			}

		}

		sort(){
			this.values = this.values.sort((a, b) => a - b);
			return this;
		}

		get value(){

			return Range.getRandomVal(this.values);

		}

		getRandomVal(dec, fn){
			return Range.getRandomVal(this.values, dec, fn);
		}

		get sortedValues() {
			let allValues = [];
			this.values.forEach(val => {
				if(val instanceof MinMax){
					allValues.push(val.min);
					allValues.push(val.max);
				} else {
					allValues.push(val);
				}
			});
			return allValues.sort((a, b) => a - b);
		}

		get min(){
			return this.sortedValues.shift();
		}
		get max(){
			return this.sortedValues.pop();
		}

		get type(){
			return this._valueType;
		}

		get isNumber(){
			return this._valueType == "number";
		}


	}

	Range.getRandomVal = function(arr, dec, fn){

		if(!arr){return 0}
		if(!arr.length){return 0}


		var ln = fn == "other" ? arr.length - 1 : arr.length;
		var rnd = Math.floor(Math.random()*ln);
		var val;
		dec = dec || 0;

		// pick from array
		switch(fn){
			case "remove":
			val = arr.splice(rnd, 1).pop();
			break;

			case "other":
			val = arr.splice(rnd, 1).pop();
			arr.push(val);
			break;

			case "sequence":
			val = arr.shift();
			arr.push(val);
			break;

			case "shuffle":
			default:
			val = arr[rnd];
			break;
		}

		if(val instanceof MinMax){

			// random between two values

			var range = val.max-val.min+1;
			var num = val.min + Math.random()*range;

			var factor = Math.pow(10, dec);
			num*=factor;
			num = Math.floor(num);
			num/=factor;
			val = num;

		}
		return val;

	}


	class MinMax {

		constructor(min, max){
			this.min = Math.min(min, max);
			this.max = Math.max(min, max);
		}

	}

	// console.log("iMusicXML is installed. Version 0.91.14");
	// var expectedSchemaFile = "https://momdev.se/lindetorp/imusic/scheme_1.1.21.xsd";



};




/*

To do:



Add support for preSection and postSection


Establish a params-property for all objects that is easily inherited and overwrited with local parameters

Try to merge Part/Motif/SFX (at least the Motif/SFX. SFX ought to be a Motif with quantize set to "off")



Implement channelSplitter and channelMerger into Bus

Make sure a masterbus is always working in multi channel mode.

Clean up the addSection, addStem, createParts - structure

remove parts from Track.playingParts when they stop playing.


Check the Action object. Does it work?

playSound triggers a setTimeout if length is typeof "number". This makes it possible to retrigg before tail but
also makes parts longer than default partLength retrig before finished.

Delay: Skapa möjlighet att skicka studsar till utgångar i en viss ordning



BUGS:
Loopade Motifs loopar inte i evighet. Kolla rad 507. me.playing blir false. Vad får det för konsekvenser att
ta bort kollen för -1-loopar.


getTime() - kolla igenom alla ställen den används. Hur ska den relatera till audiocontext.currentTime och self.sectionStart?
NU är det förvirring och det stör t.ex. getNextLegalBreak()









DONE:

OK Inför events som triggas av olika musikaliska händelser. Bar, beat etc
PROBLEM: 1925 krock mellan self och default
Reducera getPosition()
Byt ut classes till tags. Make sure Selection.find() works with multiple tags.
Skapa slumpgrupper
LegalBreakPoints verkar inte funka exakt som jag tänkt (men fixa multipla)
setInterval slutar efter ett tag (när man byter section?)
Work through inheritence of parameters
Motif slumpar inte totalt. Splice-funktionen fungerar inte eftersom url-listan sorteras om hela tiden.
fadeTime-tracks kickar inte igång mitt i en loop

Fixa klart Motifs så att de knyts till en Section och att Quantize-värdet sitter i Motif.parameters
Gör set tempo och set timeSign säker så att det går att byta för en viss section
Städa upp mellan musicalStart och sectionStart



*/

/*

Jonas ideas:

Add possibility to loop part for a certain number of times within a track
gör partposition oberoende av beatDuration etc.

2022-09-02

changeOnNext="12/4" ger tre takter om globala taktarten är 3/4 men changeOnNext="4" funkar
*/
