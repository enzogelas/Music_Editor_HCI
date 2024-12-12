// Initialization of the client (To communicate with the server)
const client = io();

// Global variables
let nbOfDivision = 8;
let instruments = 3;
let notes = Array.from({length: instruments}, ()=>Array.from({length: nbOfDivision}, ()=>false)); 

let bpm = 120;

// Variables for placing notes
let mouseIn = false; // True if the mouse is in the sheet
let currentNote = {x:0, y:0}; // Current note being placed
let mousePressed = false; // True if the mouse is pressed
let mode = 'add'; // 'add' or 'remove' (for the mouse dragging)

// Variables for playing the audio
let playingInterval = null;
let playing = false;
let currentDivision = 0;
let audios = Array.from({length: instruments}, ()=>Array.from({length: nbOfDivision}, ()=>new Audio()));

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

let unitLength = canvas.width/nbOfDivision;

function updateUnitLength(){
    unitLength = canvas.width/nbOfDivision;
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
let divisionsInput = document.getElementById('divisions-input');

document.getElementById('submit-divisions').addEventListener('click', ()=>{
    //client.emit('submit-divisions', parseInt(nbOfDivision))
    // TO CHANGE
    // TO CHANGE
    // TO CHANGE
    // TO CHANGE
    // TO CHANGE
    // TO CHANGE
    // TO CHANGE
    changeNbOfDivisions(parseInt(divisionsInput.value));
})

client.on('ask-confirmation-divisions', (newDivisions) =>{
    alert("The divisions will be set to "+ newDivisions);
    client.emit('confirm-divisions', newDivisions);
})

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
    update();
})

canvas.addEventListener('mousemove', (e)=>{
    const x = Math.floor(e.offsetX/unitLength);
    const y = Math.floor(e.offsetY/unitLength);
    const tempNote = {x:x, y:y};
    if(tempNote.x != currentNote.x || tempNote.y != currentNote.y){
        currentNote = tempNote;
        if (mousePressed && mouseIn){
            mousePressedOn(x, y);
            update();
        }
        updateSheet();
    } 
})

window.addEventListener('mouseup', (e)=>{
    mousePressed = false;
    console.log("Updating the sheet for everyone");
    client.emit('update-sheet', notes);
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
    canvas.height = canvas.width*instruments/nbOfDivision;

    updateUnitLength();

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'lightblue';
    ctx.fillRect(currentNote.x*unitLength, currentNote.y*unitLength, unitLength, unitLength);

    // Draw the divisions
    ctx.fillStyle = 'darkgray';
    for (let i = 0; i < nbOfDivision; i++){
        for (let j = 0; j < instruments; j++){
            instrumentsIcons[j].width = unitLength;
            instrumentsIcons[j].height = unitLength;
            if(!notes[j][i]){
                ctx.beginPath();
                ctx.arc((i+0.5)*unitLength, (j+0.5)*unitLength, 5, 0, 2*Math.PI);
                ctx.fill();
            } else {
                ctx.drawImage(instrumentsIcons[j], i*unitLength, j*unitLength, unitLength, unitLength);
            }
        }
    }
    // Draw the vertical line when the audio is playing
    if(playing){
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.moveTo((currentDivision+0.5)*unitLength, 0);
        ctx.lineTo((currentDivision+0.5)*unitLength, canvas.height);
        ctx.stroke();
    }
}

function updateAudio(){
    for (let j = 0; j < instruments; j++){
        for (let i = 0; i < nbOfDivision; i++){
            if (notes[j][i]){
                audios[j][i].src = "audio/"+audioSources[j];
            }
        }
    }
}

function playAudio(){
    console.log("Playing audio");
    currentDivision = 0;
    playingInterval = setInterval(()=>{
        for (let j = 0; j < instruments; j++){
            if (notes[j][currentDivision]){
                audios[j][currentDivision].play();
            }
        }
        updateSheet();
        // Shift to the next division
        currentDivision++;
        if(currentDivision == nbOfDivision) currentDivision = 0;
        
    }, 60000/bpm);
}

function changeNbOfDivisions(newNbOfDivisions){
    newNotes = Array.from({length: instruments}, ()=>Array.from({length: newNbOfDivisions}, ()=>false));
    for(let i=0; i<Math.min(nbOfDivision, newNbOfDivisions); i++){
        for(let j=0; j<instruments; j++){
            newNotes[j][i] = notes[j][i];
        }
    }
    for(let i=nbOfDivision; i<newNbOfDivisions; i++){
        for(let j=0; j<instruments; j++){
            newNotes[j][i] = false;
        }
    }
    nbOfDivision = newNbOfDivisions;
    notes = newNotes;
    
    updateSheet();

}

function update(){
    updateSheet();
    updateAudio();
}

update();

window.addEventListener('resize', updateSheet);

// Part to change the name
const nameDialog = document.getElementById('NAME_DIALOG');
console.log(nameDialog);
const openNameDialogButton = document.getElementById('CHANGE_NAME');
const submitNameButton = document.getElementById('SUBMIT_NAME');
const closeNameDialogButton = document.getElementById('CLOSE_NAME_DIALOG');

openNameDialogButton.addEventListener('click', (e)=>{
    nameDialog.showModal();
})

submitNameButton.addEventListener('click', (e)=>{
    const newName = document.getElementById('NEW_NAME').value;
    nameDialog.close();
    document.getElementById('NAME').textContent = newName;
    client.emit('update-name', newName);
})

closeNameDialogButton.addEventListener('click', (e)=>{
    nameDialog.close();
})

client.on('confirm-name', (newName) => {
    document.getElementById('NAME').textContent = newName;
})

client.on('update-users', (users) =>{
    const participantsList = document.getElementById("PARTICIPANTS_LIST_DIV");
    while(participantsList.firstChild) participantsList.removeChild(participantsList.firstChild);
    for (user of users){
        const participant = document.createElement("button");
        participant.textContent = user.name;
        participantsList.appendChild(participant);
    }
})
////////////////////

client.on('update-sheet', (sheet)=>{
    notes = sheet;
    update();
})

// Test
window.addEventListener('keydown', (e)=>{
    if (e.key == 'p'){
        if(!playing){
            playing=true;
            playAudio();
        } else {
            clearInterval(playingInterval);
            playing = false;
            updateSheet();
        }
    } else if (e.key == 't'){
        client.emit('msg', 'Hello');
    }
})