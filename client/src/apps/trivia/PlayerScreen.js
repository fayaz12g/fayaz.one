import React, { useState, useEffect } from 'react';
import LeaderboardOverlay from './HostScreen/LeaderboardOverlay';
import { motion } from 'framer-motion'
import random from './HostScreen/random.png'

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
    color: null,
    count: 4,
    allowStealing: false,
    answer: null,
    showAnswers: false,
    random: false,
  });
  const [showOptions, setShowOptions] = useState(false);
  const [steal, setSteal] = useState(false);
  const [canSteal, setCanSteal] = useState(false);
  const [double, setDouble] = useState(false);

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

  const selectRandomCategory = () => {
    console.log('Selecting random category');
    socket.emit('randomCategoryTrivia', sessionId, gameState.count);
    setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: true }));
  };

  useEffect(() => {
    socket.on('gameStartedTrivia', (categories, logos, allowStealing, count, showAnswers) => {
      console.log('Game started event received', categories);
      const logosMap = logos.reduce((acc, logo) => {
          acc[logo.name] = logo.imagePath;
          return acc;
      }, {});

      setGameState(prevState => ({
          ...prevState,
          phase: 'game',
          categories: categories,
          logos: logosMap,
          allowStealing: allowStealing,
          count: count,
          color: null,
          showAnswers: showAnswers
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
        color: questionData.color,
        random: questionData.random,
        answer: questionData.answer
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
      setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false, color: null }));
      setShowOptions(false);
      setSteal(false);
      setCanSteal(false);
    });

    socket.on('incorrectAnswerTrivia', ({ answeringPlayer, answer }) => {
      console.log(`${answeringPlayer} answered incorrectly with: ${answer}`);
      if (playerName !== answeringPlayer) {
        console.log(`${playerName} can steal from ${answeringPlayer}!`);
        setGameState(prevState => ({ ...prevState, phase: 'question', isMyTurn: true, color: null }));
        setShowOptions(true);
        setCanSteal(true);
      } else {
        setShowOptions(false);
        setSteal(false);
        setCanSteal(false);
        setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: false, color: null }));
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
    socket.emit('selectCategoryTrivia', category, sessionId, gameState.count);
    setGameState(prevState => ({ ...prevState, phase: 'waiting', isMyTurn: true }));
  };

  const requestHint = () => {
    console.log('Requesting hint');
    socket.emit('requestHintTrivia', sessionId);
  };

  const submitAnswer = (answer) => {
    console.log('Submitting answer', answer, 'stolen?', canSteal);
    socket.emit('submitAnswerTrivia', answer, sessionId, canSteal, double);
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
          <div className="category-selection-container">
            <h2 className="text-2xl font-bold mb-4">It's your turn! Select a category:</h2>
            <div className="category-grid">
              {gameState.categories.map(category => (
                <motion.button 
                  key={category.id} 
                  onClick={() => selectCategory(category.key)}
                  className="category-button"
                  style={{ backgroundColor: category.color }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img 
                    src={gameState.logos[category.name]} 
                    alt={`${category.name} logo`}
                    className="category-image"
                  />
                  <span className="category-name">{category.name}</span>
                </motion.button>
              ))}
              <motion.button 
                onClick={selectRandomCategory}
                className="category-button"
                style={{ background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img 
                  src={random}
                  alt="Random category"
                  className="category-image"
                />
                <span className="category-name">Random</span>
              </motion.button>
            </div>
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
            <br/>
            <i>{gameState.currentQuestion.deckName}</i>
            {gameState.random && <h2>Double Points for RANDOM Category</h2>}
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
          {canSteal && gameState.allowStealing && <h4>This is your chance to steal!</h4>}
          {canSteal && gameState.allowStealing && !steal && gameState.isMyTurn && (
            <button onClick={handleStealClick}>STEAL</button>
          )}
          {canSteal && gameState.allowStealing && !steal && gameState.isMyTurn && (
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
          {!gameState.isMyTurn && gameState.showAnswers && <h4>Answer: {gameState.answer}</h4>}
        </div>
        );
      default:
        return (
        <div>
        <h2>Welcome, {playerName}!</h2>
        <h4>Waiting for the host to start the game...</h4>
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