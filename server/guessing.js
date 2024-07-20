const fs = require('fs');
const path = require('path');

let cardDecks = {};

function loadCardDecks() {
    try {
        const filePath = path.join(__dirname, 'deck', 'starterDeck.json');
        const data = fs.readFileSync(filePath, 'utf8');
        const decks = JSON.parse(data).decks;
        decks.forEach(deck => {
            cardDecks[deck.color] = {
                id: deck.id,
                name: deck.name,
                cards: deck.cards
            };
        });
        console.log('Card decks loaded successfully');
    } catch (err) {
        console.error('Error loading card decks:', err);
        cardDecks = {};
    }
}

function handleInitialSpin(io, sessions, sessionId, playerId, spinResult) {
  const session = sessions[sessionId];
  if (!session) {
    console.error(`Session with ID ${sessionId} not found`);
    return;
  }

  session.initialSpins.push({ playerId, spinResult });
  
  io.to(sessionId).emit('playerSpun', { playerId, spinResult });
  
  if (session.initialSpins.length === session.players.length) {
    determinePlayerOrder(io, sessions, sessionId);
  }
}


function initializeGuessingGame(io, sessions) {
    loadCardDecks();

    io.on('connection', (socket) => {
      socket.on('startGameGuessing', ({ sessionId }) => {
            startGameGuessing(io, sessions, sessionId);
        });
        socket.on('initialSpin', ({ sessionId, spinResult }) => {
            handleInitialSpin(io, sessions, sessionId, socket.id, spinResult);
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
        socket.on('playerSpun', ({ sessionId, result }) => {
            handlePlayerSpin(io, sessions, sessionId, socket.id, result);
        });
        
        socket.on('submitAnswer', ({ sessionId, answer }) => {
            handleAnswer(io, sessions, sessionId, socket.id, answer);
  });
  
    });
}

function generateGameBoard() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const board = [];
    for (let i = 0; i < 40; i++) {
        board.push(colors[i % 4]);
    }
    return board;
}
function startGameGuessing(io, sessions, sessionId) {
  const session = sessions[sessionId];
  if (session.players.length < 2) {
    return console.error('Cannot start game: not enough players!');
  }
  
  session.gameBoard = generateGameBoard();
  session.gamePhase = 'initial-spin';
  session.initialSpins = [];
  
  // Ensure each player has a valid object structure
  session.players = session.players.map(player => ({
    id: player.id,
    name: player.name,
    socketId: player.socketId,
    position: 0
  }));
  
  io.to(sessionId).emit('gameStarted', {
    gameBoard: session.gameBoard,
    players: session.players,
    gamePhase: session.gamePhase,
  });
}
  
  function askPlayerToSpin(io, session) {
    const currentPlayer = session.players[session.currentPlayerIndex];
    io.to(currentPlayer.socketId).emit('yourTurn', { action: 'spin' });
  }

  function handlePlayerSpin(io, sessions, sessionId, playerId, spinResult) {

    const session = sessions[sessionId];
    session.playerSpinResults.push({ playerId, spinResult });
  
    console.log(`${playerId} has spun.`)

    io.to(sessionId).emit('playerSpun', { playerId, spinResult });
  
    if (session.playerSpinResults.length === session.players.length) {
      console.log(`All players have spun.`)
      determinePlayerOrder(io, sessions, sessionId);
    } else {
      session.currentPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;
      askPlayerToSpin(io, session);
    }
  }
  function askQuestion(io, session) {
    const currentPlayer = session.players[session.currentPlayerIndex];
    const currentPosition = currentPlayer.position;
    const cardColor = session.gameBoard[currentPosition];
    const card = drawCard(cardColor);
  
    if (!card) {
        console.error(`Failed to draw card for color: ${cardColor}`);
        nextTurn(io, session);
        return;
    }
  
    session.currentCard = card;
    session.currentHintIndex = 0;
  
    const questionData = {
        question: card.hints[0],
        options: generateOptions(card.answer, cardColor),
        deckId: card.deckId,
        deckName: card.deckName
    };
  
    io.to(session.id).emit('questionAsked', {
        ...questionData,
        currentPlayer: currentPlayer.id
    });
  
    io.to(currentPlayer.id).emit('yourTurn', { 
      action: 'answer',
      ...questionData
    });
  }

  function determinePlayerOrder(io, sessions, sessionId) {
    const session = sessions[sessionId];
    
    console.log('Initial state:', JSON.stringify(session.initialSpins), JSON.stringify(session.players));
  
    // Sort the initial spins
    session.initialSpins.sort((a, b) => b.spinResult - a.spinResult);
  
    // Create new player objects with initial positions
    session.players = session.initialSpins.map((spin, index) => {
      const player = session.players.find(p => p.socketId === spin.playerId);
      if (!player) {
        console.error(`Player with socket ID ${spin.playerId} not found`);
        return null;
      }
      return {
        ...player,
        id: player.socketId, // Add an id field that matches the socketId
        position: 0, // Start all players at position 0
        order: index // Set the player's turn order
      };
    }).filter(player => player !== null); // Remove any null entries
  
    console.log('After mapping:', JSON.stringify(session.players));
  
    if (session.players.length === 0) {
      console.error('No valid players found after determining order');
      return;
    }
  
    session.gamePhase = 'playing';
    session.currentPlayerIndex = 0;
    
    io.to(session.id).emit('gamePhaseChanged', { 
      phase: 'playing', 
      players: session.players,
      currentPlayer: session.players[session.currentPlayerIndex]
    });
    
    askQuestion(io, session);
  }

  function handleSpin(io, sessions, sessionId, playerId, spinResult) {
    const session = sessions[sessionId];
    const playerIndex = session.players.findIndex(p => p.socketId === playerId);
  
    if (session.gamePhase === 'determining-order') {
      session.playerOrder.push({ playerId, spinResult });
  
      if (session.playerOrder.length === session.players.length) {
        // All players have spun, determine the final order
        session.playerOrder.sort((a, b) => b.spinResult - a.spinResult);
        session.players = session.playerOrder.map(p => 
          session.players.find(player => player.socketId === p.playerId)
        );
        session.gamePhase = 'playing';
        session.currentPlayerIndex = 0;
  
        // Move all players to the first space
        session.players.forEach(player => player.position = 0);
  
        io.to(sessionId).emit('gamePhaseChanged', { 
          phase: 'playing', 
          players: session.players,
          currentPlayer: session.players[session.currentPlayerIndex]
        });
      } else {
        // Move to the next player for spinning
        session.currentPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;
        io.to(sessionId).emit('nextPlayerSpin', { 
          currentPlayer: session.players[session.currentPlayerIndex] 
        });
      }
    } else if (session.gamePhase === 'playing') {
      // Handle normal gameplay spinning
      const newPosition = Math.min(session.players[playerIndex].position + spinResult, 39); // 39 is the last space
      session.players[playerIndex].position = newPosition;
  
      io.to(sessionId).emit('playerMoved', { 
        playerId, 
        newPosition,
        nextPlayer: session.players[(playerIndex + 1) % session.players.length]
      });
  
      // Check if the game has ended
      if (newPosition === 39) {
        session.gamePhase = 'finished';
        io.to(sessionId).emit('gameEnded', { winner: session.players[playerIndex] });
      } else {
        // Move to the next player
        session.currentPlayerIndex = (playerIndex + 1) % session.players.length;
      }
    }
  }

  function drawCard(color) {
    const deck = cardDecks[color];
    if (!deck || deck.cards.length === 0) {
        console.error(`No cards available for color: ${color}`);
        return null;
    }
    const index = Math.floor(Math.random() * deck.cards.length);
    return {
        ...deck.cards[index],
        deckId: deck.id,
        deckName: deck.name
    };
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



function handleAnswer(io, sessions, sessionId, playerId, answer) {
    const session = sessions[sessionId];
    const currentPlayer = session.players[session.currentPlayerIndex];
    const currentPosition = currentPlayer.position;
    const card = session.currentCard;

    if (answer === card.answer) {
        let spacesToMove;
        switch (session.currentHintIndex) {
            case 0:
                spacesToMove = 3;
                break;
            case 1:
                spacesToMove = 2;
                break;
            case 2:
                spacesToMove = 1;
                break;
            default:
                spacesToMove = 0;
        }

        const newPosition = Math.min(currentPosition + spacesToMove, session.gameBoard.length - 1);
        currentPlayer.position = newPosition;

        io.to(sessionId).emit('playerMoved', { playerId, newPosition, spacesToMove });

        if (newPosition === session.gameBoard.length - 1) {
            endGame(io, session, playerId);
        } else {
            nextTurn(io, session);
        }
    } else {
        if (session.currentHintIndex < 2) {
            provideHint(io, sessions, sessionId, playerId);
        } else {
            nextTurn(io, session);
        }
    }
}

function provideHint(io, sessions, sessionId, playerId) {
    const session = sessions[sessionId];
    session.currentHintIndex++;

    if (session.currentHintIndex < 3) {
        const hint = session.currentCard.hints[session.currentHintIndex];
        io.to(sessionId).emit('newHint', { hint });
        io.to(playerId).emit('yourTurn', { action: 'answer' });
    } else {
        nextTurn(io, session);
    }
}

function nextTurn(io, session) {
    session.currentPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;
    askQuestion(io, session);
  }
  
  function endGame(io, session, winnerId) {
    session.gamePhase = 'ended';
    io.to(session.id).emit('gameEnded', { winnerId });
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