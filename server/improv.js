const fs = require('fs');
const path = require('path');

let scripts = [];
let scriptFileName = 'scripts';

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

function initializeImprovGame(io, sessions) {
    io.on('connection', (socket) => {
        socket.on('startGameImprov', ({ sessionId, rounds, gameMode, scriptFile }) => {
            startGameImprov(io, sessions, sessionId, rounds, gameMode, scriptFile);
        });

        socket.on('nextLine', ({ sessionId }) => {
            nextLine(io, sessions, sessionId);
        });

        socket.on('guessAdlibber', ({ sessionId, guess }) => {
            guessAdlibber(io, sessions, sessionId, socket.id, guess);
        });
    });
}

function startGameImprov(io, sessions, sessionId, rounds, gameMode, scriptFile) {
    console.log(`Starting game for session ${sessionId} with ${rounds} rounds in ${gameMode} mode, using script file: ${scriptFile}.json`);
    if (sessions[sessionId] && sessions[sessionId].players.length === 4) {
        sessions[sessionId].rounds = rounds;
        sessions[sessionId].currentRound = 0;
        sessions[sessionId].gameMode = gameMode;
        sessions[sessionId].guesses = 0;
        
        io.to(sessionId).emit('gameStarted', { 
            rounds: sessions[sessionId].rounds,
            players: sessions[sessionId].players,
            gameMode: sessions[sessionId].gameMode
        });
        
        startRound(io, sessions, sessionId);
    } else {
        console.error(`Cannot start game: not enough players or session not found. Session:`, sessions[sessionId]);
        return 'Cannot start game: not enough players or session not found';
    }
}

function startRound(io, sessions, sessionId) {
    const session = sessions[sessionId];
    session.currentRound++;
    console.log('Beginning round', session.currentRound, '/', session.rounds);
    session.guesses = 0;

    if (scripts.length === 0) {
        loadScripts();
    }

    let previousSpeaker1 = null;
    if (session.roles) {
        for (const [socketId, role] of Object.entries(session.roles)) {
            if (role === 'Speaker 1') {
                previousSpeaker1 = socketId;
                break;
            }
        }
    }

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
        const allRoles = ['Guesser', ...roles];
        const shuffledAllRoles = shuffle(allRoles);

        session.players.forEach((player, index) => {
            session.roles[player.socketId] = shuffledAllRoles[index];
        });
    }

    const randomScriptIndex = Math.floor(Math.random() * scripts.length);
    session.currentScript = scripts[randomScriptIndex];
    session.currentLineIndex = 0;

    scripts.splice(randomScriptIndex, 1);
    
    console.log(`Starting Round ${session.currentRound} for session ${sessionId}`);
    console.log('Roles assigned:', session.roles);
    console.log('Selected script:', session.currentScript);

    io.to(sessionId).emit('roundStarted', { 
        currentRound: session.currentRound,
        roles: session.roles
    });

    nextLine(io, sessions, sessionId);
}

function nextLine(io, sessions, sessionId) {
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

        session.players.forEach(player => {
            if (player.socketId !== speakerSocket && session.roles[player.socketId] !== 'Guesser') {
                io.to(player.socketId).emit('updateLine', { line: `${speakerName} is speaking...`, isAdlib: false, isSpeaker: false });
            }
        });

        const guesserSocket = Object.keys(session.roles).find(key => session.roles[key] === 'Guesser');
        if (guesserSocket) {
            io.to(guesserSocket).emit('updateLine', { line: `${speakerName} is speaking...`, isAdlib: false, isSpeaker: false });
        } else {
            console.error('No guesser found in the session');
        }

        if (session.hostSocket) {
            io.to(session.hostSocket).emit('updateLine', { line: `${speakerName} is speaking...`, isAdlib: false, isSpeaker: false });
        }

        session.currentLineIndex++;
    } else {
        endScene(io, sessions, sessionId);
    }
}

function endScene(io, sessions, sessionId) {
    const session = sessions[sessionId];
    
    if (session.gameMode === 'freeforall') {
        session.originalRoles = {...session.roles};

        for (const socketId in session.roles) {
            if (session.roles[socketId] !== 'Speaker 1') {
                session.roles[socketId] = 'Guesser';
            }
        }
        
        io.to(sessionId).emit('roundStarted', {
            currentRound: session.currentRound,
            roles: session.roles
        });
    }
    
    io.to(sessionId).emit('endScene');
}

function guessAdlibber(io, sessions, sessionId, guesserSocketId, guess) {
    const session = sessions[sessionId];
    const roles = session.gameMode === 'freeforall' ? session.originalRoles : session.roles;
    const guesser = session.players.find(player => player.socketId === guesserSocketId);
    const adlibber = session.players.find(player => roles[player.socketId] === 'Speaker 1');

    if (guesser.name != adlibber.name) {
        if (adlibber.name === guess) {
            guesser.points += 1;
            correctGuess = true;
            io.to(sessionId).emit('updatePoints', { points: { [guesser.name]: guesser.points } });
            console.log(`${guesser.name} has correctly guessed the Adlibber.`);
        } else {
            adlibber.points += 1;
            correctGuess = false;
            io.to(sessionId).emit('updatePoints', { points: { [adlibber.name]: adlibber.points } });
            console.log(`The Adlibber (${adlibber.name}) has fooled ${guesserSocketId}.`);
        }
    }

    let correctGuess;
    io.to(sessionId).emit('guessMade', { name: [guesser.name], guess, correct: correctGuess });

    if (session.gameMode === 'freeforall') {
        session.guesses++;
        if (session.guesses >= 3) {
            if (session.currentRound >= session.rounds) {
                console.log('Game has ended');
                io.to(sessionId).emit('endGame');
            } else {
                startRound(io, sessions, sessionId);
            }
        }
    } else {
        if (session.currentRound >= session.rounds) {
            console.log('Game has ended');
            io.to(sessionId).emit('endGame');
        } else {
            startRound(io, sessions, sessionId);
        }
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = {
    initializeImprovGame,
    loadScripts
};