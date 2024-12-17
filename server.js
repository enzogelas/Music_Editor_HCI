const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile('index.html');
});

const users = [];
let usersToConfirm = [];

let nbOfDivisions = 8;
let instruments = 3;
let sheet = Array.from({length: instruments}, ()=>Array.from({length: nbOfDivisions}, ()=>false));
sheet[0][0] = true;

function resizeSheet(newNbOfDivisions){
    const newNotes = Array.from({length: instruments}, ()=>Array.from({length: newNbOfDivisions}, ()=>false));
    for(let i=0; i<Math.min(nbOfDivisions, newNbOfDivisions); i++){
        for(let j=0; j<instruments; j++){
            newNotes[j][i] = sheet[j][i];
        }
    }
    for(let i=nbOfDivisions; i<newNbOfDivisions; i++){
        for(let j=0; j<instruments; j++){
            newNotes[j][i] = false;
        }
    }
    nbOfDivisions = newNbOfDivisions;
    sheet = newNotes;
}

io.on('connection', (socket) => {
    // On connection, add the user to the list of users
    const defaultName = "User " + Math.floor(Math.random()*1000);
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    const newUser =
        {
            id: socket.id,
            name: defaultName,
            color: randomColor,
            cursorPosition: null
        }
    users.push(newUser);

    // Send the name the user
    socket.emit('confirm-perso', newUser);
    // Warn everyone that a new user has joined
    io.emit('update-users', users)

    // Send the actual sheet to the new user
    socket.emit('update-sheet', {nbOfDivisions: nbOfDivisions, instruments: instruments, notes: sheet});

    // DISCONNECTION
    socket.on('disconnect', () => {
        // Remove the user from the list of users
        const indexToRemove = users.map(user => user.id).indexOf(socket.id);
        users.splice(indexToRemove, 1);
        io.emit('update-users', users);
    });

    // EVENTS FOR CHANGING A NAME
    socket.on('update-perso', (newPerso) => {
        const indexToUpdate = users.map(user => user.id).indexOf(socket.id);
        users[indexToUpdate].name = newPerso.name;
        users[indexToUpdate].color = newPerso.color;
        console.log('Perso updated:', users[indexToUpdate]);
        // Confirm the change to the user
        socket.emit('confirm-perso', newPerso); 
        // Inform everyone of the change
        io.emit('update-users', users); 
    })

    // EVENTS FOR CHANGING THE SHEET
    socket.on('update-sheet', (newSheet) => {
        console.log("Sheet received :", newSheet);
        nbOfDivisions = newSheet.nbOfDivisions;
        instruments = newSheet.instruments;
        sheet = newSheet.sheet;
        const sheetToSend = 
            {nbOfDivisions: nbOfDivisions, 
            instruments: instruments, 
            notes: sheet};
        console.log("Sending sheet :", sheetToSend);
        socket.broadcast.emit('update-sheet', sheetToSend);
    });

    socket.on('ask-current-sheet', () => {
        const sheetToSend = 
            {nbOfDivisions: nbOfDivisions, 
            instruments: instruments, 
            notes: sheet};
        socket.emit('update-sheet', sheetToSend);
    })

    // EVENTS TO UPDATE CURSORS
    socket.on('update-cursor', (cursorPosition) => {
        const indexToUpdate = users.map(user => user.id).indexOf(socket.id);
        users[indexToUpdate].cursorPosition = cursorPosition;
        io.emit('update-cursor', users);
    });

    // EVENTS FOR CHANGING THE NUMBER OF DIVISIONS
    socket.on('submit-divisions', (newDivisions) =>{
        if(users.length > 1) {
            const id = socket.id;
            usersToConfirm = users.map(user => user.id);
            usersToConfirm.splice(usersToConfirm.indexOf(id), 1);
            console.log("Among the users", users);
            console.log("User", id, "has submitted", newDivisions);
            console.log("Users", usersToConfirm, "have to confirm");
            socket.broadcast.emit('ask-confirmation-divisions', newDivisions);
        }
    }); 
    socket.on('confirm-divisions', (newNbOfDivisions)=>{
        const id = socket.id;
        console.log("User", id, "has confirmed", newNbOfDivisions);
        usersToConfirm.splice(usersToConfirm.indexOf(id), 1);
        console.log("Users", usersToConfirm, "have to confirm");
        if(usersToConfirm.length == 0){
            console.log("All users have confirmed");
            console.log("The new nb of divisions is", newNbOfDivisions);
            resizeSheet(newNbOfDivisions);
            console.log("Nb of divisions updated:", nbOfDivisions);
            console.log("Sheet updated:", sheet);
            io.emit('update-divisions', {nbOfDivisions: nbOfDivisions, instruments: instruments, notes: sheet});
        }
    });
    socket.on('infirm-divisions', ()=>{
        io.emit('update-divisions', {nbOfDivisions: nbOfDivisions, instruments: instruments, notes: sheet});
    })
});


const PORT = process.argv[2] || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});