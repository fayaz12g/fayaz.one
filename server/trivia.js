const fs = require('fs');
const path = require('path');

let cardDecks = {};
let packName = "default";

function loadCardDecks() {
    try {
        const packPath = path.join(__dirname, 'pack', packName);
        const infoPath = path.join(packPath, 'info.json');
        const infoData = fs.readFileSync(infoPath, 'utf8');
        const info = JSON.parse(infoData);

        info.cards.forEach(colorInfo => {
            const color = Object.keys(colorInfo)[0];
            const deckInfo = colorInfo[color];

            const cardsPath = path.join(packPath, 'deck', `${deckInfo.id}.json`);
            const cardsData = fs.readFileSync(cardsPath, 'utf8');
            const cardsJson = JSON.parse(cardsData);

            const imagePath = path.join(packPath, 'image', `${deckInfo.id}.png`);

            cardDecks[color] = {
                id: deckInfo.id,
                name: deckInfo.name,
                cards: cardsJson.cards,
                imagePath: imagePath
            };
        });

        console.log('Card decks loaded successfully');
    } catch (err) {
        console.error('Error loading card decks:', err);
        cardDecks = {};
    }
}

function generateOptions(correctAnswer, color) {
    const options = [correctAnswer];
    const deck = cardDecks[color];
    if (!deck || deck.cards.length < 4) {
        console.error(`Not enough cards in ${color} deck to generate options`);
        return options;
    }
    while (options.length < 4) {
        const randomCard = deck.cards[Math.floor(Math.random() * deck.cards.length)];
        if (!options.includes(randomCard.answer)) {
            options.push(randomCard.answer);
        }
    }
    return shuffle(options);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function drawCard(color) {
    const deck = cardDecks[color];
    if (!deck || deck.cards.length === 0) {
        console.error(`No cards available for color: ${color}`);
        return null;
    }

    const index = Math.floor(Math.random() * deck.cards.length);
    const selectedCard = deck.cards[index];

    // Remove the selected card from the deck
    deck.cards.splice(index, 1);

    return {
        ...selectedCard,
        deckId: deck.id,
        deckName: deck.name
    };
}

function initializeTriviaGame(io, sessions) {
    loadCardDecks();

    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('joinGame', (playerName, sessionId) => {
            console.log(`Player ${playerName} joining session ${sessionId}`);
            if (!sessions[sessionId]) {
                sessions[sessionId] = { players: [], currentPlayerIndex: 0, currentCard: null, currentHintIndex: 0 };
            }
            sessions[sessionId].players.push({ id: socket.id, name: playerName, score: 0 });
            console.log(`Updated player list:`, sessions[sessionId].players);
            io.to(sessionId).emit('updatePlayers', { players: sessions[sessionId].players });
        });

        socket.on('startGameTrivia', ({sessionId, gameMode}) => {
            console.log(`Starting game for session ${sessionId}`);
            if (!sessions[sessionId] || sessions[sessionId].players.length === 0) {
                console.error(`Invalid session or no players for session ${sessionId}`);
                return;
            }

            sessions[sessionId].currentPlayerIndex = 0;
            sessions[sessionId].gameMode = gameMode;
            const currentPlayer = sessions[sessionId].players[sessions[sessionId].currentPlayerIndex];
            const categories = getAvailableCategories();
            
            console.log(`Emitting gameStartedTrivia to all players in session ${sessionId}`);
            io.to(sessionId).emit('gameStartedTrivia', categories);
            
            console.log(`Emitting nextPlayerTrivia to all players in session ${sessionId}`);
            io.to(sessionId).emit('nextPlayerTrivia', currentPlayer.name);
            
            console.log(`Emitting yourTurnTrivia to player ${currentPlayer.name}`);
            io.to(currentPlayer.socketId).emit('yourTurnTrivia', categories);
            
            console.log(`It is ${currentPlayer.name}'s turn.`);
        });

        socket.on('selectCategoryTrivia', (category, sessionId) => {
            if (!sessions[sessionId]) {
                console.error(`Invalid session ${sessionId}`);
                return;
            }

            const currentCard = drawCard(category);
            if (currentCard) {
                sessions[sessionId].currentCard = currentCard;
                sessions[sessionId].currentHintIndex = 0;
                const options = generateOptions(currentCard.answer, category);
                io.to(sessionId).emit('newQuestionTrivia', {
                    hints: [currentCard.hints[0]],
                    options: options,
                    deckName: currentCard.deckName
                });
            }
        });

        socket.on('requestHintTrivia', (sessionId) => {
            if (!sessions[sessionId] || !sessions[sessionId].currentCard) {
                console.error(`Invalid session or no current card for session ${sessionId}`);
                return;
            }

            const { currentCard, currentHintIndex } = sessions[sessionId];
            if (currentHintIndex < 2) {
                sessions[sessionId].currentHintIndex++;
                io.to(sessionId).emit('newHint', {
                    hints: currentCard.hints.slice(0, sessions[sessionId].currentHintIndex + 1),
                    hintNumber: sessions[sessionId].currentHintIndex + 1
                });
                
                if (sessions[sessionId].currentHintIndex === 2) {
                    io.to(sessionId).emit('allPlayersCanAnswer');
                }
            }
        });

        socket.on('submitAnswerTrivia', (answer, sessionId) => {
            if (!sessions[sessionId] || !sessions[sessionId].currentCard) {
                console.error(`Invalid session or no current card for session ${sessionId}`);
                return;
            }

            const { players, currentPlayerIndex, currentCard, currentHintIndex } = sessions[sessionId];
            const player = players.find(p => p.socketId === socket.id);
            
            if (player) {
                let pointsEarned = 0;
                if (answer === currentCard.answer) {
                    switch (currentHintIndex) {
                        case 0:
                            pointsEarned = 3;
                            break;
                        case 1:
                            pointsEarned = 2;
                            break;
                        case 2:
                            pointsEarned = 1;
                            break;
                    }
                    player.score += pointsEarned;
                    io.to(sessionId).emit('correctAnswerTrivia', { playerName: player.name, pointsEarned, answer: currentCard.answer });
                    io.to(sessionId).emit('updatePointsTrivia', { points: { [player.name]: player.score } });
                    moveToNextPlayer(io, sessionId, sessions);
                } else {
                    io.to(sessionId).emit('incorrectAnswerTrivia', { playerName: player.name, answer });
                    if (currentHintIndex === 2) {
                        moveToNextPlayer(io, sessionId, sessions);
                    }
                }
                io.to(sessionId).emit('updateLeaderboardTrivia', players);
            }
        });

        socket.on('disconnectTrivia', (sessionId) => {
            console.log(`Player disconnected from session ${sessionId}`);
            if (sessions[sessionId]) {
                sessions[sessionId].players = sessions[sessionId].players.filter(player => player.socketId !== socket.id);
                console.log(`Updated player list:`, sessions[sessionId].players);
                io.to(sessionId).emit('updatePlayers', { players: sessions[sessionId].players });
            }
        });
    });
}

function moveToNextPlayer(io, sessionId, sessions) {
    if (!sessions[sessionId]) {
        console.error(`Invalid session ${sessionId}`);
        return;
    }

    sessions[sessionId].currentPlayerIndex = (sessions[sessionId].currentPlayerIndex + 1) % sessions[sessionId].players.length;
    sessions[sessionId].currentCard = null;
    sessions[sessionId].currentHintIndex = 0;
    
    const nextPlayer = sessions[sessionId].players[sessions[sessionId].currentPlayerIndex];
    io.to(sessionId).emit('nextPlayerTrivia', nextPlayer.name);
    io.to(nextPlayer.socketId).emit('yourTurnTrivia', getAvailableCategories());
    console.log(`It is ${nextPlayer.name}'s turn.`);
}

function getAvailableCategories() {
    return Object.keys(cardDecks)
        .filter(color => cardDecks[color].cards.length > 0)
        .map(color => ({
            id: cardDecks[color].id,
            name: cardDecks[color].name,
            color: color
        }));
}


module.exports = {
    initializeTriviaGame
};