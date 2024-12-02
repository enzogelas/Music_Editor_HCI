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

const userIds = [];

let currentSheet = null;

io.on('connection', (socket) => {
    userIds.push(socket.id);
    console.log(userIds);
    socket.emit('test');
    socket.on('test-back', () => {
        console.log('Test back received from client:', socket.id);
    })
    socket.on('disconnect', () => {
        userIds.splice(userIds.indexOf(socket.id), 1);
        console.log('User disconnected', socket.id);
        console.log("Users left :", userIds);
    });
    socket.on('msg', (msg) => {
        console.log('Client', socket.id, 'sent message :', msg);
        socket.broadcast.emit('msg-back', msg);
    });
    socket.on('update-sheet', (sheet) => {
        currentSheet = sheet;
        console.log('Sheet updated:', sheet);
        socket.broadcast.emit('update-sheet', sheet);
    });
});


const PORT = process.argv[2] || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});