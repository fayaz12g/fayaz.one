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
  playerRole,
  isEndScene,
  currentLine,
  isSpeaker,
  nextLine,
  guessAdlibber,
  sessionList,
  leaderboard,
  kicked,
  titleTheme,
  BackgroundMusic,
  speakingTheme,
  guessingTheme,
  sentGuess,
}) => {
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [currentHint, setCurrentHint] = useState('');
  const [answerOptions, setAnswerOptions] = useState([]);
  const [spinResult, setSpinResult] = useState(null);

  useEffect(() => {
    if (gameStarted) {
      socket.on('yourTurn', ({ hint, options }) => {
        setIsMyTurn(true);
        setCurrentHint(hint);
        setAnswerOptions(options);
      });

      socket.on('spinResult', (result) => {
        setSpinResult(result);
        // Animate the spinner here
      });

      socket.on('turnEnd', () => {
        setIsMyTurn(false);
        setCurrentHint('');
        setAnswerOptions([]);
        setSpinResult(null);
      });

      return () => {
        socket.off('yourTurn');
        socket.off('spinResult');
        socket.off('turnEnd');
      };
    }
  }, [gameStarted, socket]);

  const handleSpin = () => {
    socket.emit('spin');
  };

  const handleAnswer = (answer) => {
    socket.emit('submitAnswer', { answer });
  };

  const handleRequestHint = () => {
    socket.emit('requestHint');
  };

  if (!gameStarted) {
    return (
      <div>
        <h2>Waiting for game to start...</h2>
        <p>Your name: {playerName}</p>
        <p>Session ID: {sessionId}</p>
      </div>
    );
  }

  return (
    <div className="player-screen">
    </div>
  );
};

export default PlayerScreen;