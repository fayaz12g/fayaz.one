import React, { useState, useEffect } from 'react';
import LeaderboardOverlay from './HostScreen/LeaderboardOverlay';

const PlayerScreen = ({
  socket,
  sessionId,
  playerName,
  setLeaderboard,
  leaderboard,
  players,
}) => {
  const [gameState, setGameState] = useState({
    phase: 'lobby',
    categories: [],
    currentQuestion: null,
    isMyTurn: false,
    color: null 
  });
  const [showOptions, setShowOptions] = useState(false);
  const [steal, setSteal] = useState(false);
  const [canSteal, setCanSteal] = useState(false);

  const handleMakeGuessClick = () => {
    setShowOptions(true);
    socket.emit('guessingTrivia', sessionId);
  };

  const handleStealClick = () => {
    setSteal(true);
  };

  const handlePassClick = () => {
    socket.emit('passTrivia', sessionId);
    setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false }));
    setShowOptions(false);
    setSteal(false);
    setCanSteal(false);
  };

  useEffect(() => {
    console.log('PlayerScreen mounted');

    socket.on('gameStartedTrivia', (categories) => {
      console.log('Game started event received', categories);
      setGameState(prevState => ({ ...prevState, phase: 'game', categories }));
    });

    socket.on('yourTurnTrivia', (categories) => {
      console.log('Your turn event received', categories);
      setGameState(prevState => ({ ...prevState, phase: 'category-selection', categories, isMyTurn: true }));
    });

    socket.on('newQuestionTrivia', (questionData) => {
      console.log('New question event received', questionData);
      setGameState(prevState => ({ 
        ...prevState, 
        phase: 'question', 
        currentQuestion: questionData, 
        color: questionData.color
      }));
    });
    socket.on('updatePointsTrivia', ({ points }) => {
      setLeaderboard(prevLeaderboard => ({
          ...prevLeaderboard,
          ...points
      }));
      console.log("Updating leaderboard to be", points);
  });
    socket.on('correctAnswerTrivia', ({ answeringPlayer, pointsEarned, answer }) => {
      console.log(`${answeringPlayer} answered correctly! They earned ${pointsEarned} points. The answer was: ${answer}`);
      setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false }));
      setShowOptions(false);
      setSteal(false);
      setCanSteal(false);
    });

    socket.on('incorrectAnswerTrivia', ({ answeringPlayer, answer }) => {
      console.log(`${answeringPlayer} answered incorrectly with: ${answer}`);
      if (playerName !== answeringPlayer) {
        console.log(`${playerName} can steal from ${answeringPlayer}!`);
        setGameState(prevState => ({ ...prevState, phase: 'question', isMyTurn: true }));
        setShowOptions(true);
        setCanSteal(true);
      } else {
        setShowOptions(false);
        setSteal(false);
        setCanSteal(false);
        setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false }));
      }
    })

    socket.on('newHint', ({ hints }) => {
      console.log('New hint event received', hints);
      setGameState(prevState => ({
        ...prevState,
        currentQuestion: { ...prevState.currentQuestion, hints }
      }));
    });

    socket.on('allPlayersCanAnswer', () => {
      console.log('All players can answer event received');
      setGameState(prevState => ({ ...prevState, isMyTurn: true }));
    });

    return () => {
      console.log('PlayerScreen unmounting');
    };
  }, [socket, playerName]);

  const selectCategory = (category) => {
    console.log('Selecting category', category);
    socket.emit('selectCategoryTrivia', category, sessionId);
    setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: true }));
  };

  const requestHint = () => {
    console.log('Requesting hint');
    socket.emit('requestHintTrivia', sessionId);
  };

  const submitAnswer = (answer) => {
    console.log('Submitting answer', answer, 'stolen?', canSteal);
    socket.emit('submitAnswerTrivia', answer, sessionId, canSteal);
    setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false }));
  };

  const renderGameContent = () => {
    console.log('Rendering game content, current state:', gameState);
    switch (gameState.phase) {
      case 'waiting':
        return <h2>Waiting for your turn...</h2>;
      case 'game':
        return <h2>Game has started. Waiting for your turn...</h2>;
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
          {/* <h2>Category:</h2> */}
          <h3>{gameState.currentQuestion.deckName}</h3>
          <h4>Hints:</h4>
          <ul>
            {gameState.currentQuestion.hints.map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
          {!showOptions && gameState.isMyTurn && gameState.currentQuestion.hints.length < 3 && (
            <button onClick={requestHint}>Request Next Hint</button>
          )}
          {!showOptions && gameState.isMyTurn && (
            <button onClick={handleMakeGuessClick}>Make a Guess</button>
          )}
          {canSteal && <h4>This is your chance to steal!</h4>}
          {canSteal && gameState.isMyTurn && (
            <button onClick={handleStealClick}>STEAL</button>
          )}
          {canSteal && gameState.isMyTurn && (
            <button onClick={handlePassClick}>PASS</button>
          )}
          {showOptions && (
            <div>
              {!canSteal && <h4>Guess an Answer:</h4>}
              {(steal || !canSteal) && (
                gameState.currentQuestion.options.map((option, index) => (
                  <button key={index} onClick={() => submitAnswer(option)} disabled={!gameState.isMyTurn}>
                    {option}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        );
      default:
        return (
        <div>
        <h1>Welcome, {playerName}!</h1>
        <h2>Waiting for the host to start the game...</h2>;
        </div>
      );
    };
  };

  return (
    <div className="App" style={{ backgroundColor: gameState.color }}> 
      {renderGameContent()}
      <LeaderboardOverlay 
      gameState={gameState}
      leaderboard={leaderboard}
      players={players}
    />
    </div>
  );
};

export default PlayerScreen;