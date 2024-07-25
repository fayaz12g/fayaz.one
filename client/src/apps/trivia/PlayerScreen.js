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
    currentPlayer: null,
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
    socket.on('gameStartedTrivia', (categories, logos) => {
      console.log('Game started event received', categories);
      const logosMap = logos.reduce((acc, logo) => {
          acc[logo.name] = logo.imagePath;
          return acc;
      }, {});

      setGameState(prevState => ({
          ...prevState,
          phase: 'game',
          categories: categories,
          logos: logosMap
      }));
  });

    socket.on('yourTurnTrivia', (categories) => {
      console.log('Your turn event received', categories);
      setGameState(prevState => ({ ...prevState, phase: 'category-selection', categories, isMyTurn: true }));
      setShowOptions(false);
      setSteal(false);
      setCanSteal(false);
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
      setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false, color: 'white' }));
      setShowOptions(false);
      setSteal(false);
      setCanSteal(false);
    });

    socket.on('incorrectAnswerTrivia', ({ answeringPlayer, answer }) => {
      console.log(`${answeringPlayer} answered incorrectly with: ${answer}`);
      if (playerName !== answeringPlayer) {
        console.log(`${playerName} can steal from ${answeringPlayer}!`);
        setGameState(prevState => ({ ...prevState, phase: 'question', isMyTurn: true, color: 'white' }));
        setShowOptions(true);
        setCanSteal(true);
      } else {
        setShowOptions(false);
        setSteal(false);
        setCanSteal(false);
        setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false, color: 'white' }));
      }
    })

    socket.on('nextPlayerTrivia', (playerName) => {
      setGameState(prevState => ({ ...prevState, currentPlayer: playerName }));
    });

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
        return <h2>Waiting for {gameState.currentPlayer} to select a category...</h2>
      case 'game':
        return <h2>Waiting for {gameState.currentPlayer} to select a category...</h2>
      case 'category-selection':
        return (
          <div>
            <h2>It's your turn! Select a category:</h2>
            {gameState.categories.map(category => (
              <button key={category.id} onClick={() => selectCategory(category.color)}>
                <img 
                  src={gameState.logos[category.name]} 
                  alt={`${category.name} logo`}
                  style={{ maxWidth: '100px', maxHeight: '100px' }}
                />
              </button>
            ))}
          </div>
        );
      case 'question':
        return (
          <div>
            <img 
              src={gameState.logos[gameState.currentQuestion.deckName]} 
              alt={`${gameState.currentQuestion.deckName} logo`}
              style={{ maxWidth: '200px', maxHeight: '200px' }}
            />
          {/* <h2>Category:</h2> */}
          {/* <h3>{gameState.currentQuestion.deckName}</h3> */}
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
          {canSteal && !steal && gameState.isMyTurn && (
            <button onClick={handleStealClick}>STEAL</button>
          )}
          {canSteal && !steal && gameState.isMyTurn && (
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
        <h2>Waiting for the host to start the game...</h2>
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