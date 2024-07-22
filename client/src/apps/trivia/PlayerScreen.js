import React, { useState, useEffect } from 'react';

const PlayerScreen = ({
  socket,
  sessionId,
  playerName,
}) => {
  const [gameState, setGameState] = useState({
    phase: 'waiting',
    categories: [],
    currentQuestion: null,
    isMyTurn: false
  });

  useEffect(() => {
    socket.on('gameStartedTrivia', (categories) => {
      setGameState(prevState => ({ ...prevState, phase: 'game', categories }));
    });

    socket.on('yourTurnTrivia', (categories) => {
      setGameState(prevState => ({ ...prevState, phase: 'category-selection', categories, isMyTurn: true }));
    });

    socket.on('newQuestionTrivia', (questionData) => {
      setGameState(prevState => ({ ...prevState, phase: 'question', currentQuestion: questionData, isMyTurn: true }));
    });

    socket.on('correctAnswerTrivia', ({ playerName, pointsEarned, answer }) => {
      alert(`${playerName} answered correctly! They earned ${pointsEarned} points. The answer was: ${answer}`);
      setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false }));
    });

    socket.on('incorrectAnswerTrivia', ({ playerName, answer }) => {
      alert(`${playerName} answered incorrectly with: ${answer}`);
      if (playerName === playerName) {
        setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false }));
      }
    });

    socket.on('newHint', ({ hints }) => {
      setGameState(prevState => ({
        ...prevState,
        currentQuestion: { ...prevState.currentQuestion, hints }
      }));
    });

    socket.on('allPlayersCanAnswer', () => {
      setGameState(prevState => ({ ...prevState, isMyTurn: true }));
    });

    return () => {
    };
  }, [socket, playerName]);

  const selectCategory = (category) => {
    socket.emit('selectCategoryTrivia', category, sessionId);
    setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false }));
  };

  const requestHint = () => {
    socket.emit('requestHintTrivia', sessionId);
  };

  const submitAnswer = (answer) => {
    socket.emit('submitAnswerTrivia', answer, sessionId);
    setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false }));
  };

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'waiting':
        return <h2>Waiting for your turn...</h2>;
      case 'category-selection':
        return (
          <div>
            <h2>It's your turn! Select a category:</h2>
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
              <button key={index} onClick={() => submitAnswer(option)} disabled={!gameState.isMyTurn}>
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
    <div className="App">
      <h1>Welcome, {playerName}!</h1>
      {renderGameContent()}
    </div>
  );
};

export default PlayerScreen;