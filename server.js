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

const usersId = [];

io.on('connection', (socket) => {
    console.log('New usr connected :', socket.id);
    io.emit('test');
    socket.on('test-back', () => {
        console.log('Test back received');
    })
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
    socket.on('msg', (msg) => {
        console.log('Message received from client:', socket.id);
        socket.emit('msg-back', msg);
    });
});


const PORT = process.argv[2] || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});