const fs = require('fs');
const path = require('path');

let cardDecks = {};
let filteredCardDecks = {};

function loadLearnCardDecks() {
    const packPath = path.join(__dirname, 'pack');
    cardDecks = {};

    function loadLearnDecksRecursively(dir) {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dir, item.name);

            if (item.isDirectory()) {
                loadLearnDecksRecursively(fullPath);
            } else if (item.name === 'info.json') {
                try {
                    const infoData = fs.readFileSync(fullPath, 'utf8');
                    const info = JSON.parse(infoData);

                    info.cards.forEach(colorInfo => {
                        const color = Object.keys(colorInfo)[0];
                        const deckInfo = colorInfo[color];

                        const cardsPath = path.join(dir, 'deck', `${deckInfo.id}.json`);
                        const cardsData = fs.readFileSync(cardsPath, 'utf8');
                        const cardsJson = JSON.parse(cardsData);

                        const imagePath = path.join(dir, 'image', `${deckInfo.id}.png`);

                        cardDecks[`${dir}_${color}`] = {
                            id: deckInfo.id,
                            name: deckInfo.name,
                            cards: cardsJson.cards,
                            imagePath: imagePath,
                            packPath: dir,
                            packName: info.name,
                            packId: info.id
                        };
                    });
                } catch (err) {
                    console.error(`Error loading card deck from ${fullPath}:`, err);
                }
            }
        }
    }

    loadLearnDecksRecursively(packPath);
    console.log('Card decks loaded successfully');
}

function drawCardLearn() {
    const colors = Object.keys(filteredCardDecks);
    if (colors.length === 0) {
        console.error('No card decks available.');
        return null;
    }
    const color = colors[Math.floor(Math.random() * colors.length)];
    const deck = filteredCardDecks[color];

    if (!deck || deck.cards.length === 0) {
        console.error(`No cards available for color: ${color}`);
        return null;
    }

    const index = Math.floor(Math.random() * deck.cards.length);
    const selectedCard = deck.cards[index];

    deck.cards.splice(index, 1);

    return {
        ...selectedCard,
        deckId: deck.id,
        deckName: deck.name
    };
}

function initializeLearnGame(io, sessions) {
    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('joinGame', (playerName, sessionId) => {
            console.log(`Player ${playerName} joining session ${sessionId}`);
            if (!sessions[sessionId]) {
                sessions[sessionId] = { players: [], currentPlayerIndex: 0, currentCard: null };
            }
            const player = { name: playerName, socketId: socket.id, score: 0 };
            sessions[sessionId].players.push(player);
            socket.join(sessionId);

            console.log(`Updated player list:`, sessions[sessionId].players);
            io.to(sessionId).emit('updatePlayers', { players: sessions[sessionId].players });
        });

        socket.on('getCategoriesLearn', (sessionId) => {
            console.log("Categories requested for Learning Session", sessionId)
            loadLearnCardDecks();
            const categories = getAvailableCategoriesLearn(cardDecks);
            io.to(sessionId).emit('updateCategoriesLearn', categories);
        });

        socket.on('startGameLearn', ({ sessionId, selectedCategories }) => {
            console.log(`Starting game for session ${sessionId}`);

            if (!sessions[sessionId] || sessions[sessionId].players.length < 2) {
                console.error(`Invalid session or not enough players for session ${sessionId}`);
                return;
            }

            filteredCardDecks = Object.keys(cardDecks)
            .filter(key => selectedCategories.includes(cardDecks[key].id))
            .reduce((obj, key) => {
                obj[key] = cardDecks[key];
                return obj;
            }, {});

            sessions[sessionId].currentPlayerIndex = 0;
            sessions[sessionId].judgeIndex = null;
            sessions[sessionId].gameStarted = true;
            sessions[sessionId].cardDecks = filteredCardDecks;
            const categories = getAvailableCategoriesLearn(filteredCardDecks);
            const logos = getAvailableLogos(filteredCardDecks);

            io.to(sessionId).emit('gameStartedLearn', categories, logos);
            console.log("test one: ", sessions[sessionId].currentPlayerIndex)
            moveToNextTurn(io, sessionId, sessions);
        });

        socket.on('buzzInLearn', (sessionId) => {
            if (!sessions[sessionId] || !sessions[sessionId].gameStarted) {
                console.error(`Invalid session or game not started for session ${sessionId}`);
                return;
            }

            const currentPlayer = sessions[sessionId].players.find(p => p.socketId === socket.id);
            if (!currentPlayer) {
                console.error(`Player not found for socket ID: ${socket.id}`);
                return;
            }

            console.log(`${currentPlayer.name} buzzed in!`);
            io.to(sessionId).emit('playerBuzzedInLearn', {name: currentPlayer.name, id: currentPlayer.socketId});
        });

        socket.on('submitAnswerLearn', (answer, sessionId) => {
            if (!sessions[sessionId] || !sessions[sessionId].currentCard) {
                console.error(`Invalid session or no current card for session ${sessionId}`);
                return;
            }

            const currentCard = sessions[sessionId].currentCard;
            const currentPlayer = sessions[sessionId].players.find(p => p.socketId === socket.id);
            const judgeIndex = sessions[sessionId].judgeIndex;
            const judgePlayer = sessions[sessionId].players[judgeIndex];

            console.log(`Answer submitted by ${currentPlayer.name}`);

            if (currentPlayer && judgePlayer) {
                io.to(judgePlayer.socketId).emit('judgeAnswerLearn', {
                    answeringPlayer: currentPlayer.name,
                    submittedAnswer: answer,
                    correctAnswer: currentCard.answer
                });
            }
        });

        socket.on('judgeDecisionLearn', (correct, sessionId) => {
            if (!sessions[sessionId] || !sessions[sessionId].currentCard) {
                console.error(`Invalid session or no current card for session ${sessionId}`);
                return;
            }

            const judgePlayer = sessions[sessionId].players.find(p => p.socketId === socket.id);
            const currentPlayerIndex = sessions[sessionId].currentPlayerIndex;
            const currentPlayer = sessions[sessionId].players[currentPlayerIndex];

            if (correct) {
                currentPlayer.score += 1;
            } else {
                currentPlayer.score += -1;
            }
            io.to(sessionId).emit('updatePointsLearn', { points: { [currentPlayer.name]: currentPlayer.score } });

            const players = sessions[sessionId].players;
            io.to(sessionId).emit('updateLeaderboardLearn', players);
            moveToNextTurn(io, sessionId, sessions);
        });

        socket.on('disconnectLearn', (sessionId) => {
            console.log(`Player disconnected from session ${sessionId}`);
            if (sessions[sessionId]) {
                sessions[sessionId].players = sessions[sessionId].players.filter(player => player.socketId !== socket.id);
                console.log(`Updated player list:`, sessions[sessionId].players);
                io.to(sessionId).emit('updatePlayers', { players: sessions[sessionId].players });
            }
        });
    });
}

function moveToNextTurn(io, sessionId, sessions) {
    const session = sessions[sessionId];
    
    console.log("Test two: ", session.currentPlayerIndex)

    if (!session) {
        console.error(`Invalid session ${sessionId}`);
        return;
    }

    const players = session.players;
    const numPlayers = players.length;

    if (numPlayers < 2) {
        console.error(`Not enough players to continue the game in session ${sessionId}`);
        return;
    }

    // If no judge is set, and there are more than 2 players, set the judge to a static person (e.g., the first player)
    if (numPlayers === 2) {
        if (session.judgeIndex === null) { // First round
            session.judgeIndex = 0; // Assign the first player as the judge
            session.currentPlayerIndex = 1; // Assign the second player as the currentPlayer
        }
        else {
            [session.judgeIndex, session.currentPlayerIndex] = [session.currentPlayerIndex, session.judgeIndex]; // Swap them
        }
    }

    session.currentCard = drawCardLearn();

    const nextPlayer = players[session.currentPlayerIndex];
    const judgePlayer = players[session.judgeIndex];

    console.log("next player is:", nextPlayer)
    console.log("judge is:", judgePlayer)

    // Emit events based on the number of players
    if (numPlayers > 2) {
        io.to(sessionId).emit('nextPlayerLearn', nextPlayer.name, judgePlayer.name);
        io.to(nextPlayer.socketId).emit('yourTurnLearn', {
            hint: session.currentCard.hints[0],
            deckName: session.currentCard.deckName
        });
        io.to(sessionId).emit('youCanBuzzLearn', {
            hint: session.currentCard.hints[0],
            deckName: session.currentCard.deckName
        });
        io.to(judgePlayer.socketId).emit('waitingLearn');
    } else {
        io.to(judgePlayer.socketId).emit('judgingLearn', {
            hint: session.currentCard.hints[0],
            deckName: session.currentCard.deckName,
            answer: session.currentCard.answer,
            needBuzz: false
        });
        
        io.to(nextPlayer.socketId).emit('yourTurnLearn', {
            hint: session.currentCard.hints[0],
            deckName: session.currentCard.deckName,
            answer: session.currentCard.answer
        });
        
    }

    console.log(`It is ${nextPlayer.name}'s turn with ${judgePlayer.name} as the judge.`);
}


function getAvailableCategoriesLearn(decks) {
    return Object.keys(decks)
        .filter(key => decks[key].cards.length > 0)
        .map(key => {
            const [packPath, color] = key.split('_');
            return {
                id: decks[key].id,
                name: decks[key].name,
                color: color,
                pack: packPath,
                packName: decks[key].packName,  
                packId: decks[key].packId, 
                imagePath: decks[key].imagePath,
                key: key
            };
        });
}

function getAvailableLogos(decks) {
    return Object.keys(decks)
        .filter(key => decks[key].cards.length > 0)
        .map(key => ({
            color: key,
            name: decks[key].name,
            imagePath: decks[key].imagePath
        }));
}

module.exports = {
    initializeLearnGame
};
