// Copyright (c) 2021 Picorims - MIT license

let canvas, ctx;
let mouseX = 0, mouseY = 0;

let instrument = {
    player: null,
    feedbackDelay: null,
    reverb: null,
    widener: null,
    semitone: 0,
    note: 0,
    active: false,
};

let config;
let defaultConfig = {
    minOutputOctave: -3, //A4 to G#5 = 0
    maxOutputOctave: 3,
    scale: [true,true,true,true,true,true,true,true,true,true,true,true], //a,a#,b,c,c#,d,d#,e,f,f#,g,g#
    instrument: {
        portamento: 0.06,
        volume: 0.5,
        envelope: {
            attack: 0.02, //0 to 2
            decay: 0.1, //0 to 2
            sustain: 0.8,
            release: 0.5, //0 to 5
        },
        oscillator: {
            type: "triangle",
        },
        effect: {
            feedbackDelay: {
                speed: 8, //4n = every beat
                feedback: 0.5, //0 to 1
                dryWet: 0.4, //0 = 100% dry; 1 = 100% effected
            },
            reverb: {
                preDelay: 0, //time before reverb ramp to full
                decay: 30,
                dryWet: 1,
            },
            widener: {
                width: 0.8, //0 = mid, 1 = side, 0.5 = nothing changes
            }
        }
    }
};

window.onload = function() {init()};

//setup tone js and canvas
function init() {
    config = JSON.parse(JSON.stringify(defaultConfig));

    //draw setup
    canvas = document.getElementById("sound_canvas");
    updateCanvasSize();
    ctx = canvas.getContext("2d");

    //init instrument
    //instrument.player = new Tone.Synth();
    instrument.player = new Tone.Synth().toDestination();
    instrument.feedbackDelay = new Tone.FeedbackDelay().toDestination();
    instrument.reverb = new Tone.Reverb().toDestination();
    instrument.widener = new Tone.StereoWidener().toDestination();
    instrument.player.connect(instrument.feedbackDelay);
    instrument.player.connect(instrument.reverb);
    instrument.player.connect(instrument.widener);
    updateInstrumentSettings();

    //coordinates updating
    canvas.onmousemove = function(e) {
        updateMouseCoords(e);
        updateNote();
    }

    //instrument sound toggle
    canvas.onmousedown = function(e) {
        toggleInstrument(true);
    }
    canvas.onmouseup = function(e) {
        toggleInstrument(false);
    }

    let isKeyActive = false;
    document.addEventListener("keydown", function(e) {
        if (e.key === " " && !isKeyActive) {
            toggleInstrument(true);
            isKeyActive = true;
        }
    });
    document.addEventListener("keyup", function(e) {
        if (e.key === " ") toggleInstrument(false);
        isKeyActive = false;
    });




    //range option events
    document.getElementById("min_semitone_input").value = config.minOutputOctave;
    document.getElementById("min_semitone_input").oninput = function() {
        if (!isNaN(parseInt(this.value))) config.minOutputOctave = parseInt(this.value);
    }

    document.getElementById("max_semitone_input").value = config.maxOutputOctave;
    document.getElementById("max_semitone_input").oninput = function() {
        if (!isNaN(parseInt(this.value))) config.maxOutputOctave = parseInt(this.value);
    }




    //enabled notes events
    for (let i = 0; i < 12; i++) {
        let checkbox = document.getElementById("note_toggler_checkbox"+i);
        checkbox.checked = true;
        checkbox.oninput = function() {
            config.scale[i] = this.checked;
        }
    }




    //portamento option event
    document.getElementById("portamento_input").value = config.instrument.portamento;
    document.getElementById("portamento_input").oninput = function() {
        if (!isNaN(parseFloat(this.value))) config.instrument.portamento = parseFloat(this.value);
    }




    //oscillation type
    document.getElementById("oscillator_type_select").value = config.instrument.oscillator.type;
    document.getElementById("oscillator_type_select").onchange = function() {
        config.instrument.oscillator.type = this.value;
        updateInstrumentSettings();
    }





    //ADSR envelope option events
    document.getElementById("attack_input").value = config.instrument.envelope.attack;
    document.getElementById("attack_input").oninput = function() {
        if (!isNaN(parseFloat(this.value))) config.instrument.envelope.attack = parseFloat(this.value);
        updateInstrumentSettings();
    }
    document.getElementById("decay_input").value = config.instrument.envelope.decay;
    document.getElementById("decay_input").oninput = function() {
        if (!isNaN(parseFloat(this.value))) config.instrument.envelope.decay = parseFloat(this.value);
        updateInstrumentSettings();
    }
    document.getElementById("sustain_input").value = config.instrument.envelope.sustain;
    document.getElementById("sustain_input").oninput = function() {
        if (!isNaN(parseFloat(this.value))) config.instrument.envelope.sustain = parseFloat(this.value);
        updateInstrumentSettings();
    }
    document.getElementById("release_input").value = config.instrument.envelope.release;
    document.getElementById("release_input").oninput = function() {
        if (!isNaN(parseFloat(this.value))) config.instrument.envelope.release = parseFloat(this.value);
        updateInstrumentSettings();
    }




    //feedback delay option events
    document.getElementById("feedback_delay_speed_input").value = config.instrument.effect.feedbackDelay.speed;
    document.getElementById("feedback_delay_speed_input").oninput = function() {
        if (!isNaN(parseInt(this.value))) config.instrument.effect.feedbackDelay.speed = parseInt(this.value);
        updateInstrumentSettings();
    }
    document.getElementById("feedback_delay_feedback_input").value = config.instrument.effect.feedbackDelay.feedback;
    document.getElementById("feedback_delay_feedback_input").oninput = function() {
        if (!isNaN(parseFloat(this.value))) config.instrument.effect.feedbackDelay.feedback = parseFloat(this.value);
        updateInstrumentSettings();
    }
    document.getElementById("feedback_delay_drywet_input").value = config.instrument.effect.feedbackDelay.dryWet;
    document.getElementById("feedback_delay_drywet_input").oninput = function() {
        if (!isNaN(parseFloat(this.value))) config.instrument.effect.feedbackDelay.dryWet = parseFloat(this.value);
        updateInstrumentSettings();
    }




    //reverb options events
    document.getElementById("reverb_predelay_input").value = config.instrument.effect.reverb.preDelay;
    document.getElementById("reverb_predelay_input").oninput = function() {
        if (!isNaN(parseFloat(this.value))) config.instrument.effect.reverb.preDelay = parseFloat(this.value);
        updateInstrumentSettings();
    }
    document.getElementById("reverb_decay_input").value = config.instrument.effect.reverb.decay;
    document.getElementById("reverb_decay_input").oninput = function() {
        if (!isNaN(parseFloat(this.value))) config.instrument.effect.reverb.decay = parseFloat(this.value);
        updateInstrumentSettings();
    }
    document.getElementById("reverb_drywet_input").value = config.instrument.effect.reverb.dryWet;
    document.getElementById("reverb_drywet_input").oninput = function() {
        if (!isNaN(parseFloat(this.value))) config.instrument.effect.reverb.dryWet = parseFloat(this.value);
        updateInstrumentSettings();
    }



    //start animation
    requestAnimationFrame(draw);
}

//update mouse coordinate variables
function updateMouseCoords(event) {
    //mouse coords
    let rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.x;
    mouseY = event.clientY - rect.y;
}

//change the played note based on mouse coordinates
function updateNote() {
    let rect = canvas.getBoundingClientRect();

    //note semitone
    let minInputPos = 0;
    let maxInputPos = rect.width;
    //semitone 0 = A4, range [min,max[ due to floor round
    let minOutputSemitone = config.minOutputOctave*12;
    let maxOutputSemitone = config.maxOutputOctave*12;
    let inputRange = maxInputPos - minInputPos;
    let outputRange = maxOutputSemitone - minOutputSemitone;
    //map mouse coordinate to semitone in an octave range
    //output =  outputOffsetFromZero + scaling * (input - inputOffsetFromZero)
    //the input is offset to [0,x], scaled to output range, and is offset back from 0 to ouptut range.
    instrument.semitone = Math.floor(minOutputSemitone + (outputRange/inputRange) * (mouseX - minInputPos));

    //adapt to selected scale
    instrument.semitone = findNearestInScale(instrument.semitone);

    //note frequency
    let tuning = 440;
    let older_note = instrument.note;
    instrument.note = tuning * Math.pow(2, instrument.semitone/12);
    if (instrument.active && instrument.note !== older_note) instrument.player.frequency.rampTo(instrument.note, config.instrument.portamento);
}

//find the nearest semitone matching the scale of the config.
function findNearestInScale(semitone) {
    //find basic semitone from 0 to 11
    let baseSemitone = (semitone % 12);
    //get rid of the negative notes issue
    if (baseSemitone < 0) baseSemitone += 12;

    //does the semitone exist in the scale ?
    if (config.scale[baseSemitone]) return semitone;
    else {
        let found = false;
        let i = 0;
        let distance = 0;
        let toLeft = true;

        //SEARCH: find the nearest semitone in [A,G#] range WITHOUT quitting the range.
        //look to left, if not ok look to right, if not ok increment distance and repeat
        while (!found && distance < 12) { //max reachable distance from an index is 11 (when at start/end)
            let offset;
            
            toLeft = (i%2 == 0);
            if (toLeft) {
                //look to left
                distance++;
                offset = -distance;
                
            } else {
                //look to right
                offset = distance;
            }

            //does the new semitone exist in the scale ?
            let newSemitone = baseSemitone + offset;
            if (newSemitone >= 0 && newSemitone <= 11 && config.scale[newSemitone]) {
                found = true;
            }

            i++;
        }
        //convert back to the full range
        let nearestSemitone = (toLeft)? (semitone - distance) : (semitone + distance);
        return (found)? nearestSemitone : semitone;
    }
}

//enable or disable the sound of the instrument
function toggleInstrument(isActive) {
    instrument.active = isActive;
    if (instrument.active) {
        instrument.player.triggerAttack(instrument.note);
    } else {
        instrument.player.triggerRelease();
    }
}

//update instrument settings on the synthetizer from the config
function updateInstrumentSettings() {
    
    instrument.player.set({
        volume: config.instrument.volume,
        envelope: { //ADSR envelope
            attack: config.instrument.envelope.attack,
            decay: config.instrument.envelope.decay,
            sustain: config.instrument.envelope.sustain,
            release: config.instrument.envelope.release,
        },
        oscillator: { //oscillator type
            type: config.instrument.oscillator.type,
        }
    });

    //feedback delay
    instrument.feedbackDelay.set({
        delayTime: config.instrument.effect.feedbackDelay.speed + "n",
        feedback: config.instrument.effect.feedbackDelay.feedback,
        wet: config.instrument.effect.feedbackDelay.dryWet,
    });

    //reverb
    instrument.reverb.set({
        preDelay: config.instrument.effect.reverb.preDelay,
        decay: config.instrument.effect.reverb.decay,
        wet: config.instrument.effect.reverb.dryWet,
    });

    //stereo widener
    instrument.widener.set({
        width: config.instrument.effect.widener.width,
    })
}




//animation
function draw() {
    updateCanvasSize();
    clear();

    drawNoteAreas();
    drawCursor();

    requestAnimationFrame(draw);
}

function updateCanvasSize() {
    canvas.width = Math.round(document.getElementById("sound_controller").offsetWidth);
    canvas.height = Math.round(document.getElementById("sound_controller").offsetHeight);
}

//clear canvas
function clear() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

//draw user cursor
function drawCursor() {
    ctx.beginPath();
    ctx.fillStyle = (instrument.active)? "#ff444499" : "#88888899";
    ctx.arc(mouseX, mouseY, 5, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fill();
}

//draw a keyboard like layout for the notes
function drawNoteAreas() {
    //ADAPTIVE DISPLAY TO NUMBER OF ENABLED NOTES ABBOUNDED
    // let numEnabledNotes = 0; //0 to 12
    // for (let i = 0; i < config.scale.length; i++)
    //    if (config.scale[i] == true) numEnabledNotes++;
    let numEnabledNotes = 12; //num drawn notes

    let numEnabledOctaves = config.maxOutputOctave - config.minOutputOctave;
    let numTotalSemitones = (numEnabledOctaves * 12) - ((12 - numEnabledNotes) * numEnabledOctaves);//[min, max[
    let rectSize = canvas.width/numTotalSemitones;

    for (let i = 0; i < numTotalSemitones; i++) {
        //retrieve note semitone by offseting the range based on the minimum semitone
        let indexSemitone = i + (config.minOutputOctave*12);
        let nearestEnabledIndexSemitone = findNearestInScale(indexSemitone);
        let isEnabledSemitone = indexSemitone == nearestEnabledIndexSemitone;

        //is it the currently played note ?
        let isActiveNote = (indexSemitone == instrument.semitone);



        //contrast 1/2 of the octaves from C to B.
        //as modulo do not behave the same in the positives and the negatives,
        //we need so split the condition in 2, and "read" the modulo in a different direction.
        let indexSemitoneFromC5 = nearestEnabledIndexSemitone - 3;
        let indexSemitoneFromB4 = nearestEnabledIndexSemitone - 2;
        
        //Contrast from B to C reading from right to left, as modulo grows from right to left in the negatives
        //Starting from B4 backwards.
        let isContrastedOctaveNeg = ( (indexSemitoneFromB4 <= 0) && (indexSemitoneFromB4 % (2*numEnabledNotes) <= (-numEnabledNotes)) ) //mid to max
        
        //Contrast from C to B reading from left to right, as modulo grows from left to right in the positives
        //Starting from C5 onwards.
        //Here, we must contrast the other side to not have a symetry effect around B4/C5!
        let isContrastedOctavePos = ( (indexSemitoneFromC5 >= 0) && (indexSemitoneFromC5 % (2*numEnabledNotes) <= (numEnabledNotes-1)) ) // 0 to mid
        
        let isContrastedOctave = (isContrastedOctaveNeg || isContrastedOctavePos);



        //define color
        if (isActiveNote) {
            ctx.fillStyle = "#44f";
        } else if (!isEnabledSemitone) {
            ctx.fillStyle = "#002";
        } else if (isContrastedOctave) { //alternating color from one octave to another
            ctx.fillStyle = (i%2 == 0)? "#557" : "#668"; //alternating color
        }  else {
            ctx.fillStyle = (i%2 == 0)? "#224" : "#335"; //alternating color
        }

        //draw area
        ctx.fillRect(i*rectSize, 0, rectSize, canvas.height);
    }
}