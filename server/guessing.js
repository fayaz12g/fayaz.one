const fs = require('fs');
const path = require('path');

let cardDecks = {};

function loadCardDecks() {
    const deckTypes = ['red', 'blue', 'green', 'yellow'];
    deckTypes.forEach(type => {
        try {
            const filePath = path.join(__dirname, 'deck',`${type}.json`);
            const data = fs.readFileSync(filePath, 'utf8');
            cardDecks[type] = JSON.parse(data);
            console.log(`${type} card deck loaded successfully`);
        } catch (err) {
            console.error(`Error loading ${type} card deck:`, err);
            cardDecks[type] = [];
        }
    });
}

function initializeGuessingGame(io, sessions) {
    loadCardDecks();

    io.on('connection', (socket) => {
        socket.on('startGameGuessing', ({ sessionId }) => {
            startGameGuessing(io, sessions, sessionId);
        });

        socket.on('spin', ({ sessionId }) => {
            handleSpin(io, sessions, sessionId, socket.id);
        });

        socket.on('submitAnswer', ({ sessionId, answer }) => {
            handleAnswer(io, sessions, sessionId, socket.id, answer);
        });

        socket.on('requestHint', ({ sessionId }) => {
            provideHint(io, sessions, sessionId, socket.id);
        });
    });
}

function startGameGuessing(io, sessions, sessionId) {
    const session = sessions[sessionId];
    if (!session || session.players.length < 2) {
        return console.error('Cannot start game: not enough players or session not found');
    }

    session.gameBoard = generateGameBoard();
    session.currentPlayerIndex = 0;
    session.playerPositions = session.players.reduce((acc, player) => {
        acc[player.socketId] = 0;
        return acc;
    }, {});

    io.to(sessionId).emit('gameStarted', {
        gameBoard: session.gameBoard,
        players: session.players,
        currentPlayer: session.players[session.currentPlayerIndex]
    });

    nextTurn(io, sessions, sessionId);
}

function generateGameBoard() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const board = [];
    for (let i = 0; i < 40; i++) {
        board.push(colors[i % 4]);
    }
    return board;
}

function handleSpin(io, sessions, sessionId, playerId) {
    const session = sessions[sessionId];
    const spinResult = Math.floor(Math.random() * 6) + 1;
    
    io.to(sessionId).emit('spinResult', { playerId, result: spinResult });
    
    session.playerPositions[playerId] += spinResult;
    if (session.playerPositions[playerId] >= session.gameBoard.length - 1) {
        endGame(io, sessions, sessionId, playerId);
    } else {
        askQuestion(io, sessions, sessionId, playerId);
    }
}

function askQuestion(io, sessions, sessionId, playerId) {
    const session = sessions[sessionId];
    const position = session.playerPositions[playerId];
    const color = session.gameBoard[position];
    const card = drawCard(color);

    session.currentCard = card;
    session.currentHintIndex = 0;

    const options = generateOptions(card.answer, color);

    io.to(sessionId).emit('questionAsked', {
        hint: card.hints[0],
        options: options
    });
    io.to(playerId).emit('yourTurn', {
        hint: card.hints[0],
        options: options
    });
}

function drawCard(color) {
    const deck = cardDecks[color];
    const index = Math.floor(Math.random() * deck.length);
    return deck[index];
}

function generateOptions(correctAnswer, color) {
    const options = [correctAnswer];
    while (options.length < 4) {
        const randomCard = drawCard(color);
        if (!options.includes(randomCard.answer)) {
            options.push(randomCard.answer);
        }
    }
    return shuffle(options);
}

function handleAnswer(io, sessions, sessionId, playerId, answer) {
    const session = sessions[sessionId];
    const card = session.currentCard;

    if (answer === card.answer) {
        const spacesToMove = 3 - session.currentHintIndex;
        session.playerPositions[playerId] += spacesToMove;

        if (session.playerPositions[playerId] >= session.gameBoard.length - 1) {
            endGame(io, sessions, sessionId, playerId);
        } else {
            io.to(sessionId).emit('correctAnswer', { playerId, spacesToMove });
            nextTurn(io, sessions, sessionId);
        }
    } else {
        io.to(sessionId).emit('incorrectAnswer', { playerId });
        if (session.currentHintIndex < 2) {
            provideHint(io, sessions, sessionId, playerId);
        } else {
            nextTurn(io, sessions, sessionId);
        }
    }
}

function provideHint(io, sessions, sessionId, playerId) {
    const session = sessions[sessionId];
    session.currentHintIndex++;

    if (session.currentHintIndex < 3) {
        const hint = session.currentCard.hints[session.currentHintIndex];
        io.to(sessionId).emit('newHint', { hint });
        io.to(playerId).emit('yourTurn', { hint });
    } else {
        nextTurn(io, sessions, sessionId);
    }
}

function nextTurn(io, sessions, sessionId) {
    const session = sessions[sessionId];
    session.currentPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;
    const nextPlayer = session.players[session.currentPlayerIndex];

    io.to(sessionId).emit('nextTurn', { playerId: nextPlayer.socketId });
    io.to(nextPlayer.socketId).emit('spinRequest');
}

function endGame(io, sessions, sessionId, winnerId) {
    io.to(sessionId).emit('gameEnded', { winnerId });
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = {
    initializeGuessingGame
};