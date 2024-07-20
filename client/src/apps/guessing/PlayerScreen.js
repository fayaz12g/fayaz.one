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
  setGameStarted,
  players,
  kicked,
  titleTheme,
  BackgroundMusic,
}) => {
  const [gameState, setGameState] = useState({
    phase: 'waiting',
    canSpin: false,
    spinResult: null,
  });

  useEffect(() => {
      socket.on('gameStarted', () => {
        setGameState(prev => ({ ...prev, phase: 'initial-spin', canSpin: true }));
        setGameStarted(true);
      });

      socket.on('gamePhaseChanged', ({ phase, players, currentPlayer }) => {
        console.log('Received gamePhaseChanged:', { phase, players, currentPlayer });
        setGameState(prev => ({
          ...prev,
          phase,
          players,
          currentPlayerIndex: players.findIndex(p => p.id === currentPlayer.id),
        }));
      });

      socket.on('yourTurn', ({ action }) => {
        if (action === 'answer') {
          setGameState(prev => ({ ...prev, phase: 'answering' }));
        }
      });

      socket.on('questionAsked', ({ question, options, deckId, deckName, currentPlayer }) => {
        setGameState(prev => ({
          ...prev,
          phase: prev.playerName === currentPlayer ? 'answering' : 'waiting',
          currentQuestion: { question, options, deckId, deckName },
        }));
      });

      return () => {
        socket.off('gameStarted');
        socket.off('gamePhaseChanged');
        socket.off('yourTurn');
        socket.off('questionAsked');
      };
  }, [gameStarted, socket]);

  const handleInitialSpin = (result) => {
    setGameState(prev => ({ ...prev, spinResult: result, canSpin: false }));
    socket.emit('initialSpin', { sessionId, spinResult: result });
  };

  const handleSpin = (result) => {
    setGameState(prev => ({ ...prev, spinResult: result, canSpin: false }));
    socket.emit('playerSpun', { sessionId, result });
  };

  const handleAnswer = (answer) => {
    socket.emit('submitAnswer', { sessionId, answer });
    setGameState(prev => ({ ...prev, phase: 'waiting' }));
  };

  const requestHint = () => {
    socket.emit('requestHint', { sessionId });
  };

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'initial-spin':
        return (
          <div className="App">
          <div className="initial-spin-container">
            <h2>Spin the wheel to determine your starting position!</h2>
            <Spinner onSpinComplete={handleInitialSpin} disabled={!gameState.canSpin} />
            {gameState.spinResult && <h5>You spun: {gameState.spinResult}</h5>}
          </div>
          </div>
        );
        case 'playing':
        case 'waiting':
          return <h2>Waiting for your turn...</h2>;
      case 'spinning':
        return (
          <div className="spin-container">
            <h3>It's your turn to spin!</h3>
            <Spinner onSpinComplete={handleSpin} disabled={!gameState.canSpin} />
            {gameState.spinResult && <h5>You spun: {gameState.spinResult}</h5>}
          </div>
        );
        case 'answering':
          return (
            <div className="question-container">
              <h3>Answer the question:</h3>
              <h5>{gameState.currentQuestion?.question}</h5>
              <div className="answer-options">
                {gameState.currentQuestion?.options.map((option, index) => (
                  <button key={index} onClick={() => handleAnswer(option)}>
                    {option}
                  </button>
                ))}
              </div>
              <button onClick={requestHint}>Request Hint</button>
            </div>
          );
      default:
        return null;
    }
  };

  if (!gameStarted) {
    return (
      <div>
        <div className="title-bar">
        <div className="join-message">
          <h2>Join at <span className="red-text">Fayaz.One</span> in your browser!</h2>
        </div>
        <div className="room-info">
          <h4>Session: {sessionId}</h4>
        </div>
        </div>
        <div className='App'>
          <div className="player-screen waiting">
            <h2>Welcome, {playerName}.</h2>
            <h5>Waiting for game to start...</h5>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player-screen game">
      {renderGameContent()}
    </div>
  );
};

export default PlayerScreen;