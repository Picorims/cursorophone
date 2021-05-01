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
    minOutputSemitone: (-3*12) -9, //*12 = octave to semitone, -9 = A -> C
    maxOutputSemitone: (3*12) -9,
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




    //option events
    document.getElementById("min_semitone_input").value = config.minOutputSemitone;
    document.getElementById("min_semitone_input").oninput = function() {
        if (!isNaN(parseInt(this.value))) config.minOutputSemitone = parseInt(this.value);
    }

    document.getElementById("max_semitone_input").value = config.maxOutputSemitone;
    document.getElementById("max_semitone_input").oninput = function() {
        if (!isNaN(parseInt(this.value))) config.maxOutputSemitone = parseInt(this.value);
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
    //semitone 0 = A4
    let minOutputSemitone = config.minOutputSemitone;
    let maxOutputSemitone = config.maxOutputSemitone;
    let inputRange = maxInputPos - minInputPos;
    let outputRange = maxOutputSemitone - minOutputSemitone;
    //map mouse coordinate to semitone in an octave range
    //output =  outputOffsetFromZero + scaling * (input - inputOffsetFromZero)
    //the input is offset to [0,x], scaled to output range, and is offset back from 0 to ouptut range.
    instrument.semitone = Math.floor(minOutputSemitone + (outputRange/inputRange) * (mouseX - minInputPos));

    //note frequency
    let tuning = 440;
    instrument.note = tuning * Math.pow(2, instrument.semitone/12);
    if (instrument.active) instrument.player.frequency.rampTo(instrument.note, 0.06);
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
    let areasCount = config.maxOutputSemitone - config.minOutputSemitone;
    let rectSize = canvas.width/areasCount;

    for (let i = 0; i < areasCount; i++) {
        //retrieve note semitone
        let indexSemitone = i + config.minOutputSemitone

        //it is the currently played note
        let isActiveNote = (indexSemitone == instrument.semitone);

        //contrast 1/2 of the octaves from C to B.
        //as modulo do not behave the same in the positives and the negatives,
        //we need so split the condition in 2, and "read" the modulo in a different direction.
        let indexSemitoneFromC5 = indexSemitone - 3;
        let indexSemitoneFromB4 = indexSemitone - 2;
        //Contrast from B to C reading from right to left, as modulo grows from right to left in the negatives
        //Starting from B4 backwards.
        let isContrastedOctaveNeg = ( (indexSemitoneFromB4 <= 0) && ((indexSemitoneFromB4) % 24 <= -12) )
        //Contrast from C to B reading from left to right, as modulo grows from left to right in the positives
        //Starting from C5 onwards.
        //Here, we must contrast the other side to not have a symetry effect around B4/C5!
        let isContrastedOctavePos = ( (indexSemitoneFromC5 >= 0) && (indexSemitoneFromC5 % 24 <= 11) )
        let isContrastedOctave = (isContrastedOctaveNeg || isContrastedOctavePos);

        //define color
        if (isActiveNote) {
            ctx.fillStyle = "#559";
        } else if (isContrastedOctave) { //alternating color from one octave to another
            ctx.fillStyle = (i%2 == 0)? "#444" : "#555"; //alternating color
        } else {
            ctx.fillStyle = (i%2 == 0)? "#111" : "#222"; //alternating color
        }

        //draw area
        ctx.fillRect(i*rectSize, 0, rectSize, canvas.height);
    }
}