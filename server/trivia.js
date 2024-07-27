const fs = require('fs');
const path = require('path');

let cardDecks = {};
let packName = "default";

let filteredCardDecks = {};

function loadCardDecks() {
    const packPath = path.join(__dirname, 'pack');
    cardDecks = {}; // Reset cardDecks

    function loadDecksRecursively(dir) {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dir, item.name);

            if (item.isDirectory()) {
                loadDecksRecursively(fullPath);
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
                            packPath: dir
                        };
                    });
                } catch (err) {
                    console.error(`Error loading card deck from ${fullPath}:`, err);
                }
            }
        }
    }

    loadDecksRecursively(packPath);
    console.log('Card decks loaded successfully');
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

    io.on('connection', (socket) => {
        console.log('New client connected');
        

        socket.on('joinGame', (playerName, sessionId) => {
            console.log(`Player ${playerName} joining session ${sessionId}`);
            if (!sessions[sessionId]) {
                sessions[sessionId] = { players: [], currentPlayerIndex: 0, currentCard: null, currentHintIndex: 0 };
            }
            const player = { name: playerName, socketId: socket.id, score: 0 };
            sessions[sessionId].players.push(player);
            socket.join(sessionId);

            console.log(`Updated player list:`, sessions[sessionId].players);
            io.to(sessionId).emit('updatePlayers', { players: sessions[sessionId].players });
        });

        socket.on('getCategories', (sessionId) => {
            console.log("Categories requested for Trivia Session", sessionId)
            loadCardDecks();
            const categories = getAvailableCategories(cardDecks);
            io.to(sessionId).emit('updateCategories', categories);
            console.log("Sent", categories, "as categories.")
        });

        socket.on('startGameTrivia', ({ sessionId, selectedCategories, allowStealing }) => {
            console.log(`Starting game for session ${sessionId}`);
        
            if (!sessions[sessionId] || sessions[sessionId].players.length === 0) {
                console.error(`Invalid session or no players for session ${sessionId}`);
                return;
            }
        
            filteredCardDecks = Object.keys(cardDecks)
                .filter(key => selectedCategories.includes(cardDecks[key].id))
                .reduce((obj, key) => {
                    obj[key] = cardDecks[key];
                    return obj;
                }, {});
        
            sessions[sessionId].currentPlayerIndex = 0;
            sessions[sessionId].allowStealing = allowStealing;
            sessions[sessionId].cardDecks = filteredCardDecks;
            const currentPlayer = sessions[sessionId].players[sessions[sessionId].currentPlayerIndex];
            const categories = getAvailableCategories(filteredCardDecks);
            const logos = getAvailableLogos(filteredCardDecks);
        
            io.to(sessionId).emit('gameStartedTrivia', categories, logos, allowStealing);
            io.to(sessionId).emit('nextPlayerTrivia', currentPlayer.name);
            io.to(currentPlayer.socketId).emit('yourTurnTrivia', categories);
        
            console.log(`It is ${currentPlayer.name}'s turn.`);
        });

        socket.on('guessingTrivia', (sessionId) => {
            io.to(sessionId).emit('makingGuessTrivia');
        });

        socket.on('passTrivia', (sessionId) => {
            if (!sessions[sessionId].hasOwnProperty('passers')) {
                sessions[sessionId].passers = 0;
            }
            sessions[sessionId].passers++;
            console.log(`${socket.id} has passed the trivia.`)
            if (sessions[sessionId].passers === sessions[sessionId].players.length - 1) {
                console.log("Everyone has passed.")
                io.to(sessionId).emit('broPassedTrivia');
                moveToNextPlayer(io, sessionId, sessions);
                sessions[sessionId].passers = 0;
            }
            else {
                console.log(`${sessions[sessionId].passers} peoople have passed. ${sessions[sessionId].players.length - 1} people need to pass. That means we need ${(sessions[sessionId].players.length - 1) - sessions[sessionId].passers} more.`)
            }
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
                const extractedColor = category.split('_')[1];
                io.to(sessionId).emit('newQuestionTrivia', {
                    hints: [currentCard.hints[0]],
                    options: options,
                    deckName: currentCard.deckName,
                    color: extractedColor,
                    key: category
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
                
                if ((sessions[sessionId].currentHintIndex === 2) && sessions[sessionId].allowStealing) {
                    io.to(sessionId).emit('allPlayersCanAnswer');
                }
            }
        });

        socket.on('submitAnswerTrivia', (answer, sessionId, steal) => {
            if (!sessions[sessionId] || !sessions[sessionId].currentCard) {
                console.error(`Invalid session or no current card for session ${sessionId}`);
                return;
            }

            const { players, currentPlayerIndex, currentCard, currentHintIndex } = sessions[sessionId];
            const player = players.find(p => p.socketId === socket.id);
            
            console.log(`Answer submitted by ${player.name}. ${currentHintIndex} hints are out. It is player ${currentPlayerIndex}'s turn.`)

            if (player) {
                let pointsEarned = 0;
                if (answer === currentCard.answer) {
                    if (!steal) {
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
                    }
                    else {
                        pointsEarned = 1;
                    }
                    player.score = (player.score || 0) + pointsEarned; 
                    io.to(sessionId).emit('correctAnswerTrivia', { answeringPlayer: player.name, pointsEarned, answer: currentCard.answer });
                    moveToNextPlayer(io, sessionId, sessions);
                } else {
                    io.to(sessionId).emit('incorrectAnswerTrivia', { answeringPlayer: player.name, answer: currentCard.answer });
                    if ((currentHintIndex === 2) || steal || !sessions[sessionId].allowStealing) {
                        moveToNextPlayer(io, sessionId, sessions);
                    }
                    if (steal) {
                        player.score = (player.score || 0) - 1; 
                    }
                }
                io.to(sessionId).emit('updateLeaderboardTrivia', players);
                io.to(sessionId).emit('updatePointsTrivia', { points: { [player.name]: player.score } });
                console.log(`Emitted that ${player.name} now has a score of ${player.score}!`)
            } else {
                console.error(`Player not found for socket ID: ${socket.id}`);
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
    io.to(nextPlayer.socketId).emit('yourTurnTrivia', getAvailableCategories(filteredCardDecks));
    console.log(`It is ${nextPlayer.name}'s turn.`);
}

function getAvailableCategories(decks) {
    return Object.keys(decks)
        .filter(key => decks[key].cards.length > 0)
        .map(key => {
            const [pack, color] = key.split('_'); 
            return {
                id: decks[key].id,
                name: decks[key].name,
                color: color,
                pack: pack,
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
    initializeTriviaGame
};