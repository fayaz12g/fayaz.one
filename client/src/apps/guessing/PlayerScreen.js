import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button } from '@/components/ui/card';

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
      <Card>
        <CardContent>
          <Typography variant="h5">Guessing Game</Typography>
          {isMyTurn ? (
            <>
              {spinResult === null ? (
                <Button onClick={handleSpin}>Spin</Button>
              ) : (
                <>
                  <Typography variant="h6">Current Hint:</Typography>
                  <Typography variant="body1">{currentHint}</Typography>
                  <Button onClick={handleRequestHint}>Request Next Hint</Button>
                  <Typography variant="h6">Choose your answer:</Typography>
                  {answerOptions.map((option, index) => (
                    <Button key={index} onClick={() => handleAnswer(option)} fullWidth variant="outlined" style={{ margin: '5px 0' }}>
                      {option}
                    </Button>
                  ))}
                </>
              )}
            </>
          ) : (
            <Typography variant="h6">Waiting for your turn...</Typography>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerScreen;