const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const serverVersion = '0.8 Super';
const os = require('os');
const improv = require('./improv');
const guessing = require('./guessing');
const trivia = require('./trivia');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('build'));

let sessions = {};
let currentSession = 0;

const numberToLetter = (num) => {
    const parsedNum = parseInt(num);
    if (isNaN(parsedNum) || parsedNum < 0 || parsedNum > 9) {
        return 'X';
    }
    return String.fromCharCode(65 + parsedNum);
};

const ipToLetters = (ip) => {
    if (ip === 'localhost') return 'localhost';
    return ip.split('')
             .map(char => char === '.' ? 'X' : numberToLetter(char))
             .join('');
};

io.on('connection', (socket) => {
    const playerId = socket.handshake.query.playerId;
    const playerRole = socket.handshake.query.role;
    console.log('New client connected:', socket.id);

    // Emit the server version to the client upon connection
    socket.emit('serverVersion', serverVersion); 

    // Emit the available sessions to the client upon connection
    const sessionIds = Object.keys(sessions);
    socket.emit('availableSessions', sessionIds); 

    // Get and emit the server's IP address
    emitServerIpAddress(socket);

    socket.on('reconnectHost', ({ sessionId }) => {
        if (sessions[sessionId]) {
            socket.join(sessionId);
            socket.emit('updatePlayers', { players: sessions[sessionId].players });
            for (const player of sessions[sessionId].players) {
                socket.emit('updatePoints', { points: { [player.name]: player.points } });
            }
        }
    });

    socket.on('createSession', (game) => {
        if (Object.keys(sessions).length === 0) {
            currentSession = 0; 
        }
        const sessionId = ++currentSession;
        let shortSessionId = String.fromCharCode(64 + (sessionId <= 26 ? sessionId : sessionId % 26));
        sessions[shortSessionId] = { 
            sessionId: shortSessionId, 
            game: game,
            players: [],
            hostSocket: socket.id
        };
        socket.join(shortSessionId);
        socket.emit('sessionCreated', { sessionId: shortSessionId });
        console.log('Session created with ID:', shortSessionId);
    });

    socket.on('joinSession', ({ sessionId, playerName }) => {
        if (sessions[sessionId]) {
            sessions[sessionId].players.push({ name: playerName, socketId: socket.id, points: 0 });
            socket.join(sessionId);
            io.to(sessionId).emit('updatePlayers', { players: sessions[sessionId].players });
            console.log('Player joined session:', sessionId, playerName);
            socket.emit('setGame', { game: sessions[sessionId].game });
        } else {
            socket.emit('error', 'Session not found');
        }
    });

    socket.on('removePlayer', ({ sessionId, playerToRemove, forceRemove }) => {
        if (sessions[sessionId]) {
            const playerIndex = sessions[sessionId].players.findIndex(player => player.socketId === playerToRemove);
            if (playerIndex !== -1) {
                const removedPlayer = sessions[sessionId].players.splice(playerIndex, 1)[0];
                io.to(sessionId).emit('playerRemoved', {  
                    removedPlayer: removedPlayer.socketId, 
                    kickPlayer: forceRemove
                });
                io.to(sessionId).emit('updatePlayers', { players: sessions[sessionId].players });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Check if the disconnected socket was a host
        for (const sessionId in sessions) {
            if (sessions[sessionId].hostSocket === socket.id) {
                console.log('Host disconnected from session:', sessionId);
                io.to(sessionId).emit('hostLeft');
                delete sessions[sessionId];
                console.log('Session closed:', sessionId);
                break;
            }
        }
        
        // Handle player disconnection
        for (const sessionId in sessions) {
            const playerIndex = sessions[sessionId].players.findIndex(player => player.socketId === socket.id);
            if (playerIndex !== -1) {
                const removedPlayer = sessions[sessionId].players.splice(playerIndex, 1)[0];
                console.log(`${removedPlayer.name} has disconnected from session ${sessionId}`);
                io.to(sessionId).emit('playerRemoved', { removedPlayer: socket.id, kickPlayer: false });
                io.to(sessionId).emit('updatePlayers', { players: sessions[sessionId].players });
                break;
            }
        }
    });
});

function emitServerIpAddress(socket) {
    const networkInterfaces = os.networkInterfaces();
    let serverIpAddress = null;

    for (const [interfaceName, interfaceInfo] of Object.entries(networkInterfaces)) {
        for (const iface of interfaceInfo) {
            if (iface.family === 'IPv4' && !iface.internal && iface.address !== '127.0.0.1') {
                serverIpAddress = iface.address;
                break;
            }
        }
        if (serverIpAddress) break;
    }

    if (serverIpAddress) {
        let shortenedIP = serverIpAddress;
        const octets = serverIpAddress.split('.');
        if (octets[0] === '192' && octets[1] === '168') {
            shortenedIP = octets[2] === '1' ? octets[3] : `${octets[2]}.${octets[3]}`;
        }
        const letterIP = ipToLetters(shortenedIP);
        socket.emit('serverIpAddress', letterIP);
        console.log('Emitted Short IP', shortenedIP, 'into', letterIP, 'to', socket.id);
    } else {
        console.warn('Server IP address not found.');
    }
}

// Initialize the improv game
improv.initializeImprovGame(io, sessions);

// Initialize the guessing game
guessing.initializeGuessingGame(io, sessions);

// Initialize the trivia game
trivia.initializeTriviaGame(io, sessions);

const PORT = process.env.PORT || 443;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  logServerAddress(PORT);
});

function logServerAddress(port) {
    const networkInterfaces = os.networkInterfaces();
    let serverIpAddress = null;

    for (const [interfaceName, interfaceInfo] of Object.entries(networkInterfaces)) {
        for (const iface of interfaceInfo) {
            if (iface.family === 'IPv4' && !iface.internal && iface.address !== '127.0.0.1') {
                serverIpAddress = iface.address;
                break;
            }
        }
        if (serverIpAddress) break;
    }

    if (serverIpAddress) {
        console.log(`HTTP server is hosted at: http://${serverIpAddress}:${port}`);
        console.log(`WebSocket server is available at: ws://${serverIpAddress}:${port}`);
    } else {
        console.warn('Server IP address not found.');
    }
}