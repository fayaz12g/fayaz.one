import React, { useState, useEffect } from 'react';

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
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [currentHint, setCurrentHint] = useState('');
  const [answerOptions, setAnswerOptions] = useState([]);
  const [spinResult, setSpinResult] = useState(null);
  const [canSpin, setCanSpin] = useState(false);

  useEffect(() => {
    if (gameStarted) {
      socket.on('yourTurn', ({ hint, options }) => {
        setIsMyTurn(true);
        setCurrentHint(hint);
        setAnswerOptions(options);
        setCanSpin(true);
      });

      socket.on('spinResult', ({ playerId, result }) => {
        if (playerId === socket.id) {
          setSpinResult(result);
          setCanSpin(false);
        }
      });

      socket.on('newHint', ({ hint }) => {
        setCurrentHint(hint);
      });

      socket.on('spinRequest', () => {
        setIsMyTurn(true);
        setCanSpin(true);
      });

      socket.on('turnEnd', () => {
        setIsMyTurn(false);
        setCurrentHint('');
        setAnswerOptions([]);
        setSpinResult(null);
        setCanSpin(false);
      });

      return () => {
        socket.off('yourTurn');
        socket.off('spinResult');
        socket.off('newHint');
        socket.off('spinRequest');
        socket.off('turnEnd');
      };
    }
  }, [gameStarted, socket]);

  const handleSpin = () => {
    if (canSpin) {
      socket.emit('spin', { sessionId });
    }
  };

  const handleAnswer = (answer) => {
    socket.emit('submitAnswer', { sessionId, answer });
  };

  const handleRequestHint = () => {
    socket.emit('requestHint', { sessionId });
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

  return (
    <div className="player-screen game">
      <h2>{playerName}'s Screen</h2>
      {isMyTurn ? (
        <div className="turn-container">
          <h3>It's your turn!</h3>
          {canSpin ? (
            <button className="spin-button" onClick={handleSpin}>Spin</button>
          ) : (
            <>
              {spinResult && <p>You spun a {spinResult}!</p>}
              <div className="hint-container">
                <h4>Current Hint:</h4>
                <p>{currentHint}</p>
                <button className="hint-button" onClick={handleRequestHint}>Request Hint</button>
              </div>
              <div className="answer-options">
                {answerOptions.map((option, index) => (
                  <button key={index} className="answer-button" onClick={() => handleAnswer(option)}>
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <p>Waiting for your turn...</p>
      )}
    </div>
  );
};

export default PlayerScreen;