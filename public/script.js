// Global variables
let divisions = 8;
let instruments = 3;
let notes = Array.from({length: instruments}, ()=>Array.from({length: divisions}, ()=>false)); 

let bpm = 120;

// Variables for placing notes
let mouseIn = false; // True if the mouse is in the sheet
let currentNote = {x:0, y:0}; // Current note being placed
let mousePressed = false; // True if the mouse is pressed
let mode = 'add'; // 'add' or 'remove' (for the mouse dragging)

// Array containing the audio objects
let audios = Array.from({length: instruments}, ()=>Array.from({length: divisions}, ()=>new Audio()));

// STATIC FILES (AUDIOS AND IMAGES)
// Load the icons used for the instruments
const hihat = new Image();
hihat.src = 'icons/hihat.png';
const snare = new Image();
snare.src = 'icons/snare.png';
const kick = new Image();
kick.src = 'icons/kick.png';
const instrumentsIcons = [hihat, snare, kick];

// Load the audio files
let audioSources = ['hihat.wav', 'snare.wav', 'kick.wav'];

// Canvas containing the music sheet
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let unitLength = canvas.width/divisions;

function updateUnitLength(){
    unitLength = canvas.width/divisions;
}

// Handle changes in the inputsrs
document.getElementById('bpm-input').addEventListener('input', (e)=>{
    bpm = e.target.value;
    console.log("New bpm is :", bpm);    
})

/*
document.getElementById('divisions-input').addEventListener('input', (e)=>{
    divisions = e.target.value;
    update();
})
*/
canvas.addEventListener('mouseenter', (e)=>{
    mouseIn = true;
})

canvas.addEventListener('mouseleave', (e)=>{
    mouseIn = false;
})

canvas.addEventListener('mousedown', (e)=>{
    mousePressed = true;
    const x = Math.floor(e.offsetX/unitLength);
    const y = Math.floor(e.offsetY/unitLength);
    if(!notes[y][x]) mode = 'add';
    else mode = 'remove';
    mousePressedOn(x, y);
    updateSheet();
})

canvas.addEventListener('mousemove', (e)=>{
    const x = Math.floor(e.offsetX/unitLength);
    const y = Math.floor(e.offsetY/unitLength);
    const tempNote = {x:x, y:y};
    if(tempNote.x != currentNote.x || tempNote.y != currentNote.y){
        currentNote = tempNote;
        if (mousePressed && mouseIn){
            mousePressedOn(x, y);
        }
    } 
    updateSheet();
})

window.addEventListener('mouseup', (e)=>{
    mousePressed = false;
})

function mousePressedOn(x, y){
    if (mode == 'add'){
        notes[y][x] = true;
    } else {
        notes[y][x] = false;
    }
}

function updateSheet(){
    // Update the canvas size
    canvas.width = window.innerWidth*0.8;
    canvas.height = canvas.width*instruments/divisions;

    updateUnitLength();

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'lightblue';
    ctx.fillRect(currentNote.x*unitLength, currentNote.y*unitLength, unitLength, unitLength);

    // Draw the divisions
    ctx.fillStyle = 'darkgray';
    for (let i = 0; i < divisions; i++){
        for (let j = 0; j < instruments; j++){
            if(!notes[j][i]){
                ctx.beginPath();
                ctx.arc((i+0.5)*unitLength, (j+0.5)*unitLength, 5, 0, 2*Math.PI);
                ctx.fill();
            } else {
                ctx.drawImage(instrumentsIcons[j], i*unitLength, j*unitLength, unitLength, unitLength);
            }
        }
        ctx.beginPath();
        ctx.moveTo((i+0.5)*unitLength, 0);
        ctx.lineTo((i+0.5)*unitLength, canvas.height);
        ctx.stroke();
    }
}

function updateAudio(){
    console.log("Updating audio");
    for (let j = 0; j < instruments; j++){
        for (let i = 0; i < divisions; i++){
            if (notes[j][i]){
                audios[j][i].src = "audio/"+audioSources[j];
            }
        }
    }
}

function playAudio(){
    updateAudio();
    console.log("Playing audio");
    let currentDivision = 0;
    let intervalId = setInterval(()=>{
        for (let j = 0; j < instruments; j++){
            if (notes[j][currentDivision]){
                audios[j][currentDivision].play();
            }
        }
        currentDivision++;
        if (currentDivision == divisions){
            console.log("Audio played");
            clearInterval(intervalId);
        }
    }, 60000/bpm);
}

function update(){
    updateSheet();
    updateAudio();
}

update();

window.addEventListener('resize', updateSheet);

const client = io();

client.on('test', ()=>{
    console.log("Test received.");
    client.emit('test-back');
});

client.on('msg-back', (msg)=>{
    console.log("Message received: ", msg);
})

// Test
window.addEventListener('keydown', (e)=>{
    if (e.key == 'p'){
        playAudio();
    } else if (e.key == 't'){
        client.emit('msg', 'Hello');
    }
})