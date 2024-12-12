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

let nbOfDivisions = 8;
let instruments = 3;
let sheet = Array.from({length: instruments}, ()=>Array.from({length: nbOfDivisions}, ()=>false));
sheet[0][0] = true;

io.on('connection', (socket) => {
    users.push(
        {
            id: socket.id,
            name: "Unknown"
        }
    );
    console.log('New user : ', socket.id);
    console.log(users);
    socket.emit('update-sheet', sheet);

    socket.emit('confirm-name', "Unknown");
    io.emit('update-users', users)

    socket.on('disconnect', () => {
        const indexToRemove = users.map(user => user.id).indexOf(socket.id);
        console.log('User disconnected : ', users[indexToRemove]);
        users.splice(indexToRemove, 1);
        console.log("Users left :", users);
    });

    socket.on('update-name', (newName) => {
        const indexToUpdate = users.map(user => user.id).indexOf(socket.id);
        users[indexToUpdate].name = newName;
        console.log('Name updated in server : ', users[indexToUpdate]);
        socket.emit('confirm-name', newName);
        io.emit('update-users', users);
    })

    socket.on('update-sheet', (newSheet) => {
        sheet = newSheet;
        //console.log('Sheet updated:', sheet);
        socket.broadcast.emit('update-sheet', sheet);
    });

    socket.on('submit-divisions', (newDivisions) =>{
        socket.broadcast.emit('ask-confirmation-divisions', newDivisions);
    }); 
    socket.on('confirm-divisions', (newDivisions)=>{
        console.log("Good validation, but nothing happened. HAHA !!!")
    });
    
});


const PORT = process.argv[2] || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});