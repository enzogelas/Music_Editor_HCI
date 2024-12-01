let divisions = 8;
let instruments = 3;
let notes = Array.from({length: instruments}, ()=>Array.from({length: divisions}, ()=>false)); 
console.log(notes);
let audios = Array.from({length: instruments}, ()=>Array.from({length: divisions}, ()=>new Audio()));
console.log(audios);

// BPM of the music to listen to
let bpm = 120;

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
let hoveredNote = {x:0, y:0};

function updateUnitLength(){
    unitLength = canvas.width/divisions;
}

// Handle changes in the inputsrs
document.getElementById('bpm-input').addEventListener('input', (e)=>{
    bpm = e.target.value;
    console.log("New bpm is :", bpm);    
})

document.getElementById('divisions-input').addEventListener('input', (e)=>{
    divisions = e.target.value;
    updateSheet();
})

canvas.addEventListener('click', (e)=>{
    const x = Math.floor(e.offsetX/unitLength);
    const y = Math.floor(e.offsetY/unitLength);
    notes[y][x] = !notes[y][x];
    updateSheet();
})

canvas.addEventListener('mousemove', (e)=>{
    const x = Math.floor(e.offsetX/unitLength);
    const y = Math.floor(e.offsetY/unitLength);
    hoveredNote = {x:x, y:y};
    updateSheet();
})

function updateSheet(){
    // Update the canvas size
    canvas.width = window.innerWidth*0.8;
    canvas.height = canvas.width*instruments/divisions;

    updateUnitLength();

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'lightblue';
    ctx.fillRect(hoveredNote.x*unitLength, hoveredNote.y*unitLength, unitLength, unitLength);

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
    // Prints the sources of the audios
    for (let j = 0; j < instruments; j++){
        for (let i = 0; i < divisions; i++){
            console.log(audios[j][i].src);
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

window.addEventListener('resize', updateSheet);

updateSheet();

const client = io();

client.on('test', ()=>{
    console.log("Test received.");
    client.emit('test-back');
});

function disconnect(){
    client.disconnect();
}

// Test
window.addEventListener('keydown', (e)=>{
    if (e.key == ' '){
        const audio = new Audio('A4.mp3');
        audio.play();
    } else if (e.key == 'u'){
        updateAudio();
    } else if (e.key == 'p'){
        playAudio();
    }
})