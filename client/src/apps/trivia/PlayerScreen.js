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
  setGameStarted,
  players,
  kicked,
  titleTheme,
  BackgroundMusic,
}) => {
  const [gameState, setGameState] = useState({
    phase: 'waiting',
    categories: [],
    currentQuestion: null,
    isMyTurn: false
  });

  useEffect(() => {
    socket.emit('joinGame', playerName, sessionId);

    socket.on('gameStarted', (categories) => {
      setGameState(prevState => ({ ...prevState, phase: 'game', categories }));
    });

    socket.on('yourTurn', (categories) => {
      setGameState(prevState => ({ ...prevState, phase: 'category-selection', categories, isMyTurn: true }));
    });

    socket.on('newQuestion', (questionData) => {
      setGameState(prevState => ({ ...prevState, phase: 'question', currentQuestion: questionData }));
    });

    return () => {
      socket.off('gameStarted');
      socket.off('yourTurn');
      socket.off('newQuestion');
    };
  }, [socket, playerName]);

  const selectCategory = (category) => {
    socket.emit('selectCategory', category);
    setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false }));
  };

  const requestHint = () => {
    socket.emit('requestHint', gameState.currentQuestion.hints.length + 1);
  };

  const submitAnswer = (answer) => {
    socket.emit('submitAnswer', answer);
    setGameState(prevState => ({ ...prevState, phase: 'waiting' }));
  };

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'waiting':
        return <h2>Waiting for your turn...</h2>;
      case 'category-selection':
        return (
          <div>
            <h2>Select a category:</h2>
            {gameState.categories.map(category => (
              <button key={category.id} onClick={() => selectCategory(category.color)}>
                {category.name}
              </button>
            ))}
          </div>
        );
      case 'question':
        return (
          <div>
            <h2>Question:</h2>
            <h3>Category: {gameState.currentQuestion.deckName}</h3>
            <h4>Hints:</h4>
            <ul>
              {gameState.currentQuestion.hints.map((hint, index) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
            {gameState.isMyTurn && gameState.currentQuestion.hints.length < 3 && (
              <button onClick={requestHint}>Request Next Hint</button>
            )}
            <h4>Options:</h4>
            {gameState.currentQuestion.options.map((option, index) => (
              <button key={index} onClick={() => submitAnswer(option)}>
                {option}
              </button>
            ))}
          </div>
        );
      default:
        return <h2>Waiting for game to start...</h2>;
    }
  };

  return (
    <div className="player-screen">
      <h1>Welcome, {playerName}!</h1>
      {renderGameContent()}
    </div>
  );
};

export default PlayerScreen;