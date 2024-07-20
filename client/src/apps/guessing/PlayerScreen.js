import React, { useState, useEffect } from 'react';
import Spinner from './HostScreen/Spinner';

const PlayerScreen = ({
  socket,
  isEndGame,
  joinedSession,
  sessionId,
  setSessionId,
  playerName,
  setPlayerName,
  joinSession,
  gameStarted,
  players,
  kicked,
  titleTheme,
  BackgroundMusic,
}) => {
  const [gameState, setGameState] = useState({
    phase: 'waiting',
    currentQuestion: null,
    canSpin: false,
    spinResult: null,
  });

  useEffect(() => {
    if (gameStarted) {
      socket.on('yourTurn', ({ action }) => {
        if (action === 'spin') {
          setGameState(prev => ({ ...prev, phase: 'spinning', canSpin: true }));
        } else if (action === 'answer') {
          setGameState(prev => ({ ...prev, phase: 'answering' }));
        }
      });

      socket.on('questionAsked', ({ question, options }) => {
        setGameState(prev => ({
          ...prev,
          phase: 'answering',
          currentQuestion: { question, options },
        }));
      });

      socket.on('gamePhaseChanged', ({ phase }) => {
        setGameState(prev => ({ ...prev, phase }));
      });

      return () => {
        socket.off('yourTurn');
        socket.off('questionAsked');
        socket.off('gamePhaseChanged');
      };
    }
  }, [gameStarted, socket]);

  const handleSpin = (result) => {
    setGameState(prev => ({ ...prev, spinResult: result, canSpin: false }));
    socket.emit('playerSpun', { sessionId, result });
  };

  const handleAnswer = (answer) => {
    socket.emit('submitAnswer', { sessionId, answer });
    setGameState(prev => ({ ...prev, phase: 'waiting' }));
  };

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'waiting':
        return <h2>Waiting for your turn...</h2>;
      case 'spinning':
        return (
          <div className="spin-container">
            <h3>It's your turn to spin!</h3>
            <Spinner onSpinComplete={handleSpin} disabled={!gameState.canSpin} />
            {gameState.spinResult && <p>You spun: {gameState.spinResult}</p>}
          </div>
        );
      case 'answering':
        return (
          <div className="question-container">
            <h3>Answer the question:</h3>
            <p>{gameState.currentQuestion.question}</p>
            <div className="answer-options">
              {gameState.currentQuestion.options.map((option, index) => (
                <button key={index} onClick={() => handleAnswer(option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!gameStarted) {
    return (
      <div className='App'>
      <div className="player-screen waiting">
        <h2>Welcome, {playerName}.</h2>
        <p>Session ID: {sessionId}</p>
        <p>Waiting for game to start...</p>
      </div>
      </div>
    );
  }

  return (
    <div className="player-screen game">
      <h2>{playerName}'s Screen</h2>
      {renderGameContent()}
    </div>
  );
};

export default PlayerScreen;