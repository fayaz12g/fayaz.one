const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const serverVersion = '0.6 Sonic Alpha';
const os = require('os');

const app = express();

const server = http.createServer(app);

// Initialize Socket.IO for the server
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static('build'));

let sessions = {};
let currentSession = 0;
let guesses = 0;

// Initialize an empty array for scripts
let scripts = [];

// Initialize the script file name with a default value
let scriptFileName = 'scripts';

// Function to load scripts from JSON file
function loadScripts() {
    try {
        const filePath = path.join(__dirname, `${scriptFileName}.json`);
        const data = fs.readFileSync(filePath, 'utf8');
        scripts = JSON.parse(data);
        console.log(`Scripts reloaded successfully from ${scriptFileName}.json`);
    } catch (err) {
        console.error('Error loading scripts:', err);
        scripts = []; // Ensure scripts is an empty array if loading fails
    }
}

io.on('connection', (socket) => {
    const playerId = socket.handshake.query.playerId;
    const playerRole = socket.handshake.query.role;
    console.log('New client connected:', socket.id);

    if ((playerId !== null) && (playerRole == 'player')) {
        if (socket.id !== playerId) {
            console.log(`Attemping to reconnect ${socket.id} as ${playerId}`);
            for (const shortSessionId in sessions) {
                const session = sessions[shortSessionId];
                console.log('checking ' + shortSessionId);
                
                const player = session.players.find(player => playerId === player.socketId);
                if (player) {
                    const playerIdx = session.players.indexOf(player);
                    sessions[shortSessionId].players[playerIdx].socketId = socket.id;
                    // player.socketId = socket.id;
                    console.log(`New player array as follows:`);
                    // console.log(player);
                    socket.join(shortSessionId);
                    socket.emit('reconnect', {name: player.name, sessionId: shortSessionId, players: session.players});
                    for (const player in session) {
                        socket.emit('updatePoints', { points: { [player.name]: player.points } })
                    }
                }
            }
        }
    }
    else if ((playerId !== null) && (playerRole == 'host')) {
        console.log('The host is trying to reconnect!')
    }

    // Emit the server version to the client upon connection
    socket.emit('serverVersion', serverVersion); 

    // Emit the availale sessions to the client upon connection
    const sessionIds = Object.keys(sessions);
    socket.emit('availableSessions', sessionIds); 

    // Get the server's IP address
    const networkInterfaces = os.networkInterfaces();
    let serverIpAddress = null;

    // Find the first non-internal IPv4 address
    for (const [interfaceName, interfaceInfo] of Object.entries(networkInterfaces)) {
        for (const iface of interfaceInfo) {
            // Skip over internal (non-IPv4) and loopback addresses
            if (iface.family === 'IPv4' && !iface.internal && iface.address !== '127.0.0.1') {
                serverIpAddress = iface.address;
                break;
            }
        }
        if (serverIpAddress) {
            break;
        }
    }

    // Emit the server IP address to the client
    if (serverIpAddress) {
        let shortenedIP = serverIpAddress
        const octets = serverIpAddress.split('.'); // Split the IP address into octets
        if (octets[0] === '192' && octets[1] === '168') {
        if (octets[2] === '1') {
            shortenedIP = octets[3]; // Only the fourth octet
        } else {
            shortenedIP = `${octets[2]}.${octets[3]}`; // The last two octets
        }
    }
        socket.emit('serverIpAddress', shortenedIP);
    } else {
        console.warn('Server IP address not found.');
    }

    socket.on('reconnectHost', ({ sessionId }) => {
        if (sessions[sessionId]) {
            socket.join(sessionId);
            socket.emit('updatePlayers', { players: sessions[sessionId].players });
            for (const player in sessions[sessionId]) {
                socket.emit('updatePoints', { points: { [player.name]: player.points } })
            }
        }
    });

    socket.on('createSession', ( game ) => {
        // const sessionId = Math.random().toString(36).substring(2, 15).replace(/[0-9]/g, '');
        // const shortSessionId = sessionId.substring(0, 4).toUpperCase();
        const sessionId = ++currentSession;
        let shortSessionId;

        if (sessionId <= 26) {
          // Convert to letter A-Z
          shortSessionId = String.fromCharCode(64 + sessionId);
        } else {
          // Use the number directly
          shortSessionId = shortSessionId;
        }
        sessions[shortSessionId] = { 
            sessionId: shortSessionId, 
            game: game,
            players: [],
            currentScript: null,
            currentLineIndex: 0,
            roles: {},
            currentSpeaker: null,
            currentRound: 0,
            rounds: 0,
            gameMode: 'classic', // 'classic' or 'freeforall'
            originalRoles: {} // Store original roles for freeforall mode
        };
        sessions[shortSessionId].hostSocket = socket.id;
        socket.join(shortSessionId);
        socket.emit('sessionCreated', { sessionId: shortSessionId });
        console.log('Session created with ID:', shortSessionId);
        console.log(sessions[shortSessionId]);
    });

    socket.on('joinSession', ({ sessionId, playerName }) => {
        if (sessions[sessionId]) {
            sessions[sessionId].players.push({ name: playerName, socketId: socket.id, points: 0 });
            socket.join(sessionId);
            io.to(sessionId).emit('updatePlayers', { players: sessions[sessionId].players });
            console.log(sessions[sessionId].players);
            console.log('Player joined session:', sessionId, playerName);
        } else {
            socket.emit('error', 'Session not found');
        }
    });

    socket.on('removePlayer', ({ sessionId, playerToRemove, forceRemove }) => {
        console.log(`Received removePlayer request:`, { sessionId, playerToRemove, forceRemove });
        
        if (sessions[sessionId]) {
            const playerIndex = sessions[sessionId].players.findIndex(player => player.socketId === playerToRemove);
            
            if (playerIndex !== -1) {
                const removedPlayer = sessions[sessionId].players.splice(playerIndex, 1)[0];
                
                console.log(`${removedPlayer.name} has been removed from session ${sessionId}`);
                
                if (forceRemove) {
                    console.log("Removal was forced by host");
                } else {
                    console.log("Player left voluntarily");
                }
    
                // Notify other clients about the player removal
                io.to(sessionId).emit('playerRemoved', {  
                    removedPlayer: removedPlayer.socketId, 
                    kickPlayer: forceRemove
                });
                io.to(sessionId).emit('updatePlayers', { players: sessions[sessionId].players });
            } else {
                console.log(`Player with socket ID ${playerToRemove} not found in session ${sessionId}`);
            }
        } else {
            console.log(`Session ${sessionId} not found`);
        }
    });

      socket.on('startGame', ({ sessionId, rounds, gameMode, scriptFile }) => {
        console.log(`Starting game for session ${sessionId} with ${rounds} rounds in ${gameMode} mode, using script file: ${scriptFile}.json`);
        if (sessions[sessionId] && sessions[sessionId].players.length === 4) {
            sessions[sessionId].rounds = rounds;
            sessions[sessionId].currentRound = 0;
            sessions[sessionId].gameMode = gameMode;

            // Update the script file name if provided
            if (scriptFile) {
                scriptFileName = scriptFile;
                loadScripts(); // Reload scripts with the new file
            }
            
            io.to(sessionId).emit('gameStarted', { 
                rounds: sessions[sessionId].rounds,
                players: sessions[sessionId].players,
                gameMode: sessions[sessionId].gameMode
            });
            
            startRound(sessionId);
        } else {
            console.error(`Cannot start game: not enough players or session not found. Session:`, sessions[sessionId]);
            socket.emit('error', 'Cannot start game: not enough players or session not found');
        }
    });

    socket.on('nextLine', ({ sessionId }) => {
        nextLine(sessionId);
    });

    socket.on('guessAdlibber', ({ sessionId, guess }) => {
        const session = sessions[sessionId];
        const roles = session.gameMode === 'freeforall' ? session.originalRoles : session.roles;
        
        const adlibber = session.players.find(player => roles[player.socketId] === 'Speaker 1');
        
        if (adlibber.name === guess) {
            // Correct guess
            const guesser = session.players.find(player => player.socketId === socket.id);
            guesser.points += 1;
            io.to(sessionId).emit('updatePoints', { points: { [guesser.name]: guesser.points } });
            console.log(`${guesser.name} has correctly guessed the Adlibber.`);
        } else {
            // Adlibber wins
            adlibber.points += 1;
            io.to(sessionId).emit('updatePoints', { points: { [adlibber.name]: adlibber.points } });
            console.log(`The Adlibber (${adlibber.name}) has fooled ${socket.id}.`);
        }
        
        if (session.gameMode === 'freeforall') {
            guesses++;
            if (guesses >= 3) {
                // Check if all rounds are completed
                if (session.currentRound >= session.rounds) {
                    console.log('Game has ended');
                    io.to(sessionId).emit('endGame');
                } else {
                    // Start next round
                    startRound(sessionId);
                }
            }

        }
        else {
            // Check if all rounds are completed
            if (session.currentRound >= session.rounds) {
                console.log('Game has ended');
                io.to(sessionId).emit('endGame');
            } else {
                // Start next round
                startRound(sessionId);
            }
    }
    });
        

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Check if the disconnected socket was a host
        for (const sessionId in sessions) {
            if (sessions[sessionId].hostSocket === socket.id) {
                console.log('Host disconnected from session:', sessionId);
                
                // Notify all clients in the session that the host left
                io.to(sessionId).emit('hostLeft');
                
                // Close the session
                delete sessions[sessionId];
                
                console.log('Session closed:', sessionId);
                break;
            }
        }
        
        // Handle player disconnection (existing logic)
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

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startRound(sessionId) {
    guesses = 0;
    const session = sessions[sessionId];
    session.currentRound++;
    console.log('Beginning round', session.currentRound, '/', session.rounds);

    // Check if scripts array is empty and reload if necessary
    if (scripts.length === 0) {
        loadScripts();
    }

    // Check for the previous round's Speaker 1
    let previousSpeaker1 = null;
    if (session.roles) {
        for (const [socketId, role] of Object.entries(session.roles)) {
            if (role === 'Speaker 1') {
                previousSpeaker1 = socketId;
                break;
            }
        }
    }

    // Assign roles for this round
    const roles = ['Speaker 1', 'Speaker 2', 'Speaker 3'];
    const shuffledRoles = shuffle(roles);
    
    session.roles = {};
    
    if (previousSpeaker1) {
        session.roles[previousSpeaker1] = 'Guesser';
        const remainingPlayers = session.players.filter(player => player.socketId !== previousSpeaker1);

        remainingPlayers.forEach((player, index) => {
            session.roles[player.socketId] = shuffledRoles[index];
        });
    } else {
        // If no previous Speaker 1, shuffle all roles
        const allRoles = ['Guesser', ...roles];
        const shuffledAllRoles = shuffle(allRoles);

        session.players.forEach((player, index) => {
            session.roles[player.socketId] = shuffledAllRoles[index];
        });
    }

    // Choose a random script
    const randomScriptIndex = Math.floor(Math.random() * scripts.length);
    session.currentScript = scripts[randomScriptIndex];
    session.currentLineIndex = 0;

    // Remove the selected script from the pool of possible scripts
    scripts.splice(randomScriptIndex, 1);
    
    console.log(`Starting Round ${session.currentRound} for session ${sessionId}`);
    console.log('Roles assigned:', session.roles);
    console.log('Selected script:', session.currentScript);

    // Emit roundStarted event at the beginning of each round
    io.to(sessionId).emit('roundStarted', { 
        currentRound: session.currentRound,
        roles: session.roles
    });

    // Start the first line for this round
    nextLine(sessionId);
}

function nextLine(sessionId) {
    const session = sessions[sessionId];
    if (!session) {
        console.error(`Session ${sessionId} not found`);
        return;
    }

    console.log(`Current script:`, session.currentScript);
    console.log(`Current line index:`, session.currentLineIndex);

    if (session.currentLineIndex < session.currentScript.dialogue.length) {
        const currentLine = session.currentScript.dialogue[session.currentLineIndex];
        console.log(`Current line:`, currentLine);

        const speakerRole = `Speaker ${currentLine.speaker}`;
        console.log(`Looking for speaker with role:`, speakerRole);

        const speakerSocket = Object.keys(session.roles).find(key => session.roles[key] === speakerRole);
        console.log(`Speaker socket:`, speakerSocket);

        if (!speakerSocket) {
            console.error(`No player found with role ${speakerRole}`);
            return;
        }

        const speaker = session.players.find(player => player.socketId === speakerSocket);
        if (!speaker) {
            console.error(`No player found with socket ID ${speakerSocket}`);
            return;
        }

        const speakerName = speaker.name;
        session.currentSpeaker = speakerSocket;

        console.log(`Current speaker: ${speakerName}`);

        if (currentLine.text === "ADLIB") {
            io.to(speakerSocket).emit('updateLine', { line: "ADLIB", isAdlib: true, isSpeaker: true });
        } else {
            io.to(speakerSocket).emit('updateLine', { line: currentLine.text, isAdlib: false, isSpeaker: true });
        }

        // Tell other players who is speaking
        session.players.forEach(player => {
            if (player.socketId !== speakerSocket && session.roles[player.socketId] !== 'Guesser') {
                io.to(player.socketId).emit('updateLine', { line: `${speakerName} is speaking...`, isAdlib: false, isSpeaker: false });
            }
        });

        // Tell the guesser who is speaking
        const guesserSocket = Object.keys(session.roles).find(key => session.roles[key] === 'Guesser');
        if (guesserSocket) {
            io.to(guesserSocket).emit('updateLine', { line: `${speakerName} is speaking...`, isAdlib: false, isSpeaker: false });
        } else {
            console.error('No guesser found in the session');
        }

        // Send the current line to the host
        if (session.hostSocket) {
            io.to(session.hostSocket).emit('updateLine', { line: `${speakerName} is speaking...`, isAdlib: false, isSpeaker: false });
        }

        session.currentLineIndex++;
    } else {
        // End of script
        endScene(sessionId);
    }
}

function endScene(sessionId) {
    const session = sessions[sessionId];
    
    if (session.gameMode === 'freeforall') {
        // Store original roles before changing them
        session.originalRoles = {...session.roles};

        // Change all roles except for Speaker 1 to 'Guesser'
        for (const socketId in session.roles) {
            if (session.roles[socketId] !== 'Speaker 1') {
                session.roles[socketId] = 'Guesser';
            }
        }
        
        // Emit updated roles
        io.to(sessionId).emit('roundStarted', {
            currentRound: session.currentRound,
            roles: session.roles
        });
    }
    
    // Emit endScene event
    io.to(sessionId).emit('endScene');
}

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
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
        if (serverIpAddress) {
            break;
        }
    }

    if (serverIpAddress) {
        console.log(`Server is hosted at: http://${serverIpAddress}:${port}`);
        console.log(`WebSocket server is available at: ws://${serverIpAddress}:${port}`);
    } else {
        console.warn('Server IP address not found.');
    }
}