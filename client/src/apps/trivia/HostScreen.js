import React, { useState, useEffect } from 'react';
import Leaderboard from './HostScreen/Leaderboard';
import Lobby from './HostScreen/Lobby';

const HostScreen = ({
  socket,
  sessionId,
  players,
  removePlayer,
  gameMode,
  setGameMode,
  setForceRemove,
}) => {
  const [gameState, setGameState] = useState({
    phase: 'lobby',
    players: [],
    currentQuestion: null,
    leaderboard: {},
    currentPlayer: null
  });

  useEffect(() => {
    socket.on('gameStartedTrivia', (categories) => {
      setGameState(prevState => ({ ...prevState, phase: 'category-selection', categories }));
    });

    socket.on('newQuestionTrivia', (questionData) => {
      setGameState(prevState => ({ ...prevState, phase: 'question', currentQuestion: questionData }));
    });

    socket.on('updateLeaderboardTrivia', (leaderboard) => {
      setGameState(prevState => ({ ...prevState, leaderboard }));
    });

    socket.on('nextPlayerTrivia', (playerName) => {
      setGameState(prevState => ({ ...prevState, currentPlayer: playerName, phase: 'category-selection' }));
    });

    return () => {
    };
  }, [socket]);

  const startGame = () => {
    socket.emit('startGameTrivia', sessionId);
  };

  const renderLobby = () => (
    <Lobby
      socket={socket}
      sessionId={sessionId}
      players={players}
      removePlayer={removePlayer}
      gameMode={gameMode}
      setGameMode={setGameMode}
      setForceRemove={setForceRemove}
      startGame={startGame}
    />
  );

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'lobby':
        return renderLobby();
      case 'category-selection':
        return (
          <div className='App'>
            <h2>Waiting for {gameState.currentPlayer} to select a category...</h2>
          </div>
        );
      case 'question':
        return (
          <div>
            <h2>Current Question</h2>
            <h3>Category: {gameState.currentQuestion.deckName}</h3>
            <h4>Hints:</h4>
            <ul>
              {gameState.currentQuestion.hints.map((hint, index) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
            <h4>Options:</h4>
            <ul>
              {gameState.currentQuestion.options.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="host-screen">
      {renderGameContent()}
      {(gameState.phase !== 'lobby') && <Leaderboard leaderboard={gameState.leaderboard} players={players} />}
    </div>
  );
};

export default HostScreen;