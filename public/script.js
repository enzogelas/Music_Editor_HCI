// Initialization of the client (To communicate with the server)
const client = io();

// Global variables
let globalNbOfDivisions = 8;
let suggestedDivisions = 8;

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
hihat.src = 'instrument_icons/hihat.png';
const snare = new Image();
snare.src = 'instrument_icons/snare.png';
const kick = new Image();
kick.src = 'instrument_icons/kick.png';

const instrumentsIcons = [hihat, snare, kick];

// Load the audio files
let audioSources = ['hihat.wav', 'snare.wav', 'kick.wav'];

// Canvas containing the music sheet
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
// The unit length of the canvas
let unitLength = canvas.width/nbOfDivision;

function updateUnitLength(){
    unitLength = canvas.width/nbOfDivision;
}

// Handle BPM changes
document.getElementById("BPM_INPUT").addEventListener('input', (e)=>{
    bpm = e.target.value;    
})

// All mouse events (to modify the sheet)
canvas.addEventListener('mouseenter', (e)=>{
    mouseIn = true;
    updateSheet();
})

canvas.addEventListener('mouseleave', (e)=>{
    mouseIn = false;
    updateSheet();
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
            return;
        }
        updateSheet();
    } 
})

window.addEventListener('mouseup', (e)=>{
    if(mousePressed){
        mousePressed = false;
        console.log("Updating the sheet for everyone");
        client.emit('update-sheet', notes);
    }
})

function mousePressedOn(x, y){
    if (mode == 'add'){
        notes[y][x] = true;
    } else {
        notes[y][x] = false;
    }
}

// To update the sheet locally
function updateSheet(){
    // Update the canvas size
    canvas.width = window.innerWidth*0.8;
    canvas.height = canvas.width*instruments/nbOfDivision;

    updateUnitLength();

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the hovered note
    if (mouseIn){
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(currentNote.x*unitLength, currentNote.y*unitLength, unitLength, unitLength);
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
}
// To update the audio locally
function updateAudio(){
    for (let j = 0; j < instruments; j++){
        for (let i = 0; i < nbOfDivision; i++){
            if (notes[j][i]){
                audios[j][i].src = "audio/"+audioSources[j];
            }
        }
    }
}


// To update the number of divisions
//
//
const divisionsDisplay = document.getElementById('DIVISIONS');
const increaseDivisionsButton = document.getElementById('INCREASE_DIVISIONS');
const decreaseDivisionsButton = document.getElementById('DECREASE_DIVISIONS');

increaseDivisionsButton.addEventListener('click', ()=>{
    changeNbOfDivisions(nbOfDivision+1);
});

decreaseDivisionsButton.addEventListener('click', ()=>{
    changeNbOfDivisions(nbOfDivision-1);
});


document.getElementById('SUBMIT_DIVISIONS').addEventListener('click', ()=>{
    if(nbOfDivision == globalNbOfDivisions) alert("The divisions are already set to "+nbOfDivision);
    else {
        client.emit('submit-divisions', nbOfDivision);
    }
    
})

const confirmDivisionsDialog = document.getElementById('CONFIRM_DIVISIONS_DIALOG');
const suggestedDivisionsDisplay = document.getElementById('SUGGESTED_DIVISIONS');
const confirmDivisionsButton = document.getElementById('CONFIRM_DIVISIONS');
const cancelDivisionsButton = document.getElementById('CANCEL_DIVISIONS');


client.on('ask-confirmation-divisions', (newDivisions) =>{
    suggestedDivisions = newDivisions;
    suggestedDivisionsDisplay.textContent = suggestedDivisions;
    confirmDivisionsDialog.showModal();
})

confirmDivisionsButton.addEventListener('click', (e)=>{
    client.emit('confirm-divisions', suggestedDivisions);
})

cancelDivisionsButton.addEventListener('click', (e)=>{
    client.emit('infirm-divisions');
})

client.on('update-divisions', (newDivisions) => {
    console.log("Updating the number of divisions to", newDivisions);
    globalNbOfDivisions = newDivisions;
    changeNbOfDivisions(newDivisions);
    client.emit('update-sheet', {
        nbOfDivisions: nbOfDivision,
        instruments: instruments,
        notes: notes        
    });
    confirmDivisionsDialog.close();
})

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
    divisionsDisplay.textContent = nbOfDivision;
    notes = newNotes;
    
    update();
}
//
//
//

function update(){
    updateSheet();
    updateAudio();
}

update();

window.addEventListener('resize', updateSheet);

// Part to personalize name and color
//
//
const persoDialog = document.getElementById('PERSO_DIALOG');

const openPersoDialogButton = document.getElementById('CHANGE_PERSO');
const submitPersoButton = document.getElementById('SUBMIT_PERSO');
const closePersoDialogButton = document.getElementById('CLOSE_PERSO_DIALOG');

openPersoDialogButton.addEventListener('click', (e)=>{
    persoDialog.showModal();
})

submitPersoButton.addEventListener('click', (e)=>{
    const newName = document.getElementById('NEW_NAME').value;
    const newColor = document.getElementById('NEW_COLOR').value;
    persoDialog.close();
    client.emit('update-perso', {name: newName, color: newColor});
})

closePersoDialogButton.addEventListener('click', (e)=>{
    persoDialog.close();
})

client.on('confirm-perso', (newPerso) => {
    console.log(newPerso);
    document.getElementById('NAME').textContent = newPerso.name;
    document.getElementById('COLOR').style.backgroundColor = newPerso.color;
})

client.on('update-users', (users) =>{
    const participantsList = document.getElementById("PARTICIPANTS_LIST_DIV");
    while(participantsList.firstChild) participantsList.removeChild(participantsList.firstChild);
    for (const user of users){
        const participant = document.createElement("span");
        participant.className = "participant-name";
        participant.textContent = user.name;
        participant.style.border = "4px solid "+user.color;
        participantsList.appendChild(participant);
    }
})
//
//
////////////////////

client.on('update-sheet', (sheet)=>{
    notes = sheet;
    update();
})

// To play the audio
const playButton = document.getElementById('PLAY');
playButton.style.backgroundImage = `url(icons/play.png)`;

document.getElementById('PLAY').addEventListener('click', ()=>{
    if(playing){
        playing = false;
        playButton.style.backgroundImage = `url(icons/play.png)`;
    } else {
        playAudio();
        playing = true;
        playButton.style.backgroundImage = `url(icons/pause.png)`;
    }
});

function playAudio(){
    setTimeout(()=>{
        for (let j = 0; j < instruments; j++){
            if (notes[j][currentDivision]){
                audios[j][currentDivision].play();
            }
        }
        updateSheet();
        // Shift to the next division
        currentDivision++;
        if(currentDivision == nbOfDivision) currentDivision = 0;
        if(playing) playAudio();
    }, 60000/bpm);
}