let divisions = 8;
let instruments = 3;

let bpm = 120;

// Canvas containing the music sheet
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

document.getElementById('bpm-input').addEventListener('input', (e)=>{
    bpm = e.target.value;
    console.log("New bpm is :", bpm);    
})

document.getElementById('divisions-input').addEventListener('input', (e)=>{
    divisions = e.target.value;
    updateSheet();
})

function updateSheet(){
    canvas.width = window.innerWidth*0.8;
    canvas.height = canvas.width*instruments/divisions;

    const unitLength = canvas.width/divisions;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the divisions
    ctx.fillStyle = 'lightgray';
    for (let i = 0; i < divisions; i++){
        for (let j = 0; j < instruments; j++){;
            ctx.beginPath();
            ctx.arc((i+0.5)*unitLength, (j+0.5)*unitLength, 5, 0, 2*Math.PI);
            ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo((i+0.5)*unitLength, 0);
        ctx.lineTo((i+0.5)*unitLength, canvas.height);
        ctx.stroke();
    }
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
