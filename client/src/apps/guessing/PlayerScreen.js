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
    phase: 'waiting', // 'waiting', 'spinning', 'answering'
    currentQuestion: null,
    canSpin: false,
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

      return () => {
        socket.off('yourTurn');
        socket.off('questionAsked');
      };
    }
  }, [gameStarted, socket]);

  const handleSpin = (result) => {
    socket.emit('playerSpun', { sessionId, result });
    setGameState(prev => ({ ...prev, canSpin: false }));
  };

  const handleAnswer = (answer) => {
    socket.emit('submitAnswer', { sessionId, answer });
    setGameState(prev => ({ ...prev, phase: 'waiting' }));
  };

  if (!gameStarted) {
    return (
      <div className="player-screen waiting">
        <h2>Waiting for game to start...</h2>
        <p>Your name: {playerName}</p>
        <p>Session ID: {sessionId}</p>
      </div>
    );
  }

  const handleRequestHint = () => {
    socket.emit('requestHint', { sessionId });
  };

  return (
    <div className="player-screen game">
      <h2>{playerName}'s Screen</h2>
      {gameState.phase === 'spinning' && (
        <div className="spin-container">
          <h3>It's your turn to spin!</h3>
          <Spinner onSpinComplete={handleSpin} disabled={!gameState.canSpin} />
        </div>
      )}
      {gameState.phase === 'answering' && gameState.currentQuestion && (
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
      )}
      {gameState.phase === 'waiting' && <p>Waiting for your turn...</p>}
    </div>
  );
};

export default PlayerScreen;