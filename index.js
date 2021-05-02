// Copyright (c) 2021 Picorims - MIT license

let canvas, ctx;
let mouseX = 0, mouseY = 0;

let instrument = {
    player: null,
    semitone: 0,
    note: 0,
    active: false,
};

let config;
let defaultConfig = {
    minOutputOctave: -3, //A4 to G#5 = 0
    maxOutputOctave: 3,
    scale: [true,true,true,true,true,true,true,true,true,true,true,true], //a,a#,b,c,c#,d,d#,e,f,f#,g,g#
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
    instrument.player = new Tone.Synth().toDestination();

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
    instrument.note = tuning * Math.pow(2, instrument.semitone/12);
    if (instrument.active) instrument.player.frequency.rampTo(instrument.note, 0.06);
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