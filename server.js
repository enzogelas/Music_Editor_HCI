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

io.on('connection', (socket) => {
    // On connection, add the user to the list of users
    const defaultName = "User " + Math.floor(Math.random()*1000);
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    const newUser =
        {
            id: socket.id,
            name: defaultName,
            color: randomColor
        }
    users.push(newUser);
    
    // Send the actual sheet to the new user
    socket.emit('update-sheet', sheet);

    // Send the name the user
    socket.emit('confirm-perso', newUser);
    // Warn everyone that a new user has joined
    io.emit('update-users', users)

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
        sheet = newSheet;
        //console.log('Sheet updated:', sheet);
        socket.broadcast.emit('update-sheet', sheet);
    });

    // EVENTS FOR CHANGING THE NUMBER OF DIVISIONS
    socket.on('submit-divisions', (newDivisions) =>{
        const id = socket.id;
        usersToConfirm = users.map(user => user.id);
        console.log(usersToConfirm);
        usersToConfirm.splice(usersToConfirm.indexOf(id), 1);
        console.log(usersToConfirm);
        socket.broadcast.emit('ask-confirmation-divisions', newDivisions);
    }); 
    socket.on('confirm-divisions', (newDivisions)=>{
        const id = socket.id;
        usersToConfirm = usersToConfirm.splice(usersToConfirm.indexOf(id), 1);
        console.log(usersToConfirm);
        if(usersToConfirm.length <= 1){
            nbOfDivisions = newDivisions; 
            io.emit('update-divisions', nbOfDivisions);
        }
    });
    socket.on('infirm-divisions', ()=>{
        io.emit('update-divisions', nbOfDivisions);
        io.emit('update-sheet', sheet);
    })
    
});


const PORT = process.argv[2] || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});