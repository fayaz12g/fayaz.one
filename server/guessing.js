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
        socket.on('playerSpun', ({ sessionId, result }) => {
            handlePlayerSpin(io, sessions, sessionId, socket.id, result);
        });
        
        socket.on('submitAnswer', ({ sessionId, answer }) => {
            handleAnswer(io, sessions, sessionId, socket.id, answer);
  });
    });
}

function startGameGuessing(io, sessions, sessionId) {
    const session = sessions[sessionId];
    if (!session || session.players.length < 2) {
      return console.error('Cannot start game: not enough players or session not found');
    }
  
    session.gameBoard = generateGameBoard();
    session.gamePhase = 'determining-order';
    session.currentPlayerIndex = 0;
    session.playerOrder = [];
  
    io.to(sessionId).emit('gameStarted', {
      gameBoard: session.gameBoard,
      players: session.players,
    });
  
    askPlayerToSpin(io, session);
  }
  
  function askPlayerToSpin(io, session) {
    const currentPlayer = session.players[session.currentPlayerIndex];
    io.to(currentPlayer.socketId).emit('yourTurn', { action: 'spin' });
  }

  function handlePlayerSpin(io, sessions, sessionId, playerId, spinResult) {
    const session = sessions[sessionId];
    session.playerOrder.push({ playerId, spinResult });
  
    io.to(sessionId).emit('playerSpun', { playerId, spinResult });
  
    if (session.playerOrder.length === session.players.length) {
      determinePlayerOrder(io, session);
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
  
    io.to(session.id).emit('questionAsked', {
      question: card.hints[0],
      options: generateOptions(card.answer, cardColor),
    });
  
    io.to(currentPlayer.socketId).emit('yourTurn', { action: 'answer' });
  }

  function determinePlayerOrder(io, session) {
    session.playerOrder.sort((a, b) => b.spinResult - a.spinResult);
    session.players = session.playerOrder.map(p => 
      session.players.find(player => player.socketId === p.playerId)
    );
    session.gamePhase = 'playing';
    session.currentPlayerIndex = 0;
  
    io.to(session.id).emit('orderDetermined', { players: session.players });
  
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
  
  // Add this to your socket.on setup in initializeGuessingGame
  socket.on('playerSpun', ({ sessionId, playerId, result }) => {
    handleSpin(io, sessions, sessionId, playerId, result);
  });


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
  const currentPlayer = session.players[session.currentPlayerIndex];
  const currentPosition = currentPlayer.position;
  const cardColor = session.gameBoard[currentPosition];
  const card = drawCard(cardColor);

  if (answer === card.answer) {
    const newPosition = Math.min(currentPosition + 1, session.gameBoard.length - 1);
    currentPlayer.position = newPosition;

    io.to(sessionId).emit('playerMoved', { playerId, newPosition });

    if (newPosition === session.gameBoard.length - 1) {
      endGame(io, session, playerId);
    } else {
      nextTurn(io, session);
    }
  } else {
    nextTurn(io, session);
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