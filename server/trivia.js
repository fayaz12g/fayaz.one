
const fs = require('fs');
const path = require('path');

let cardDecks = {};
let currentPlayerIndex = 0;
let players = [];
let usedCards = new Set();
let currentCard = null;
let currentHintIndex = 0;
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

function drawCard(color) {
    const deck = cardDecks[color];
    if (!deck || deck.cards.length === 0) {
        console.error(`No cards available for color: ${color}`);
        return null;
    }

    let availableCards = deck.cards.filter(card => !usedCards.has(card.answer));
    if (availableCards.length === 0) {
        console.error(`All cards have been used for color: ${color}`);
        return null;
    }

    const index = Math.floor(Math.random() * availableCards.length);
    const selectedCard = availableCards[index];
    usedCards.add(selectedCard.answer);

    return {
        ...selectedCard,
        deckId: deck.id,
        deckName: deck.name
    };
}

function initializeTriviaGame(io, sessions) {
    loadCardDecks();

    io.on('connection', (socket) => {
        socket.on('joinGame', (playerName, sessionId) => {
            // Ensure players array is initialized for the session
            if (!sessions[sessionId]) {
                sessions[sessionId] = { players: [] };
            }
            sessions[sessionId].players.push({ id: socket.id, name: playerName, score: 0 });
            console.log(`Someone joined. Updated list is: `, sessions[sessionId].players)
            io.to(sessionId).emit('updatePlayers', { players: sessions[sessionId].players });
        });

        socket.on('startGameTrivia', (sessionId, gameMode) => {
            currentPlayerIndex = 0;
            io.to(sessionId).emit('gameStartedTrivia', getAvailableCategories());
            io.to(players[currentPlayerIndex].socketId).emit('yourTurnTrivia', getAvailableCategories());
            console.log(`It is ${(players[currentPlayerIndex].socketId)}'s turn.`)
        });

        socket.on('selectCategoryTrivia', (category) => {
            currentCard = drawCard(category);
            if (currentCard) {
                currentHintIndex = 0;
                const options = generateOptions(currentCard.answer, category);
                io.emit('newQuestionTrivia', {
                    hints: [currentCard.hints[0]],
                    options: options,
                    deckName: currentCard.deckName
                });
            }
        });

        socket.on('requestHintTrivia', () => {
            if (currentCard && currentHintIndex < 2) {
                currentHintIndex++;
                io.emit('newHint', {
                    hints: currentCard.hints.slice(0, currentHintIndex + 1),
                    hintNumber: currentHintIndex + 1
                });
                
                if (currentHintIndex === 2) {
                    io.emit('allPlayersCanAnswer');
                }
            }
        });

        socket.on('submitAnswerTrivia', (answer) => {
            const player = players.find(p => p.id === socket.id);
            if (player && currentCard) {
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
                    io.emit('correctAnswerTrivia', { playerName: player.name, pointsEarned, answer: currentCard.answer });
                    moveToNextPlayer(io);
                } else {
                    io.emit('incorrectAnswerTrivia', { playerName: player.name, answer });
                    if (currentHintIndex === 2) {
                        moveToNextPlayer(io);
                    }
                }
                io.emit('updateLeaderboardTrivia', players);
            }
        });

        socket.on('disconnectTrivia', () => {
            players = players.filter(player => player.id !== socket.id);
            io.emit('updatePlayers', players);
        });
    });
}

function moveToNextPlayer(io) {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    currentCard = null;
    currentHintIndex = 0;
    io.emit('nextPlayerTrivia', players[currentPlayerIndex].name);
    io.to(players[currentPlayerIndex].id).emit('yourTurnTrivia', getAvailableCategories());
}

function getAvailableCategories() {
    return Object.keys(cardDecks).map(color => ({
        id: cardDecks[color].id,
        name: cardDecks[color].name,
        color: color
    }));
}

module.exports = {
    initializeTriviaGame
};