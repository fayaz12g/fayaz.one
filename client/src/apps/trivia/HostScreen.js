import React, { useState, useEffect } from 'react';
import Leaderboard from './HostScreen/Leaderboard';
import Lobby from './HostScreen/Lobby';
import GuessingAudio from './GuessingAudio';

const HostScreen = ({
  socket,
  sessionId,
  players,
  removePlayer,
  gameMode,
  setGameMode,
  setForceRemove,
  setLeaderboard,
  leaderboard,
}) => {
  const [gameState, setGameState] = useState({
    phase: 'lobby',
    players: [],
    currentQuestion: null,
    currentPlayer: null,
    color: "green",
    answer: null,
    categories: [],
    logos: {},
    count: 4,
    allowStealing: false,
    random: false,
  });
  
  const [showOptions, setShowOptions] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    socket.on('gameStartedTrivia', (categories, logos, allowStealing) => {
      const logosMap = logos.reduce((acc, logo) => {
          acc[logo.name] = logo.imagePath;
          return acc;
      }, {});

      setGameState(prevState => ({
          ...prevState,
          phase: 'category-selection',
          categories: categories,
          logos: logosMap,
          allowStealing: allowStealing,
          color: "green"
      }));
  });

    socket.on('newQuestionTrivia', (questionData) => {
      setGameState(prevState => ({ 
        ...prevState, 
        phase: 'question', 
        currentQuestion: questionData,
        color: questionData.color,
        random: questionData.random,
      }));
    });

    socket.on('newHint', ({ hints }) => {
      console.log('New hint event received', hints);
      setGameState(prevState => ({
        ...prevState,
        currentQuestion: { ...prevState.currentQuestion, hints }
      }));
    });
    
    socket.on('updateLeaderboardTrivia', (leaderboard) => {
      setGameState(prevState => ({ ...prevState, leaderboard }));
    });
    socket.on('makingGuessTrivia', (leaderboard) => {
      setShowOptions(true);
    });

    socket.on('nextPlayerTrivia', (playerName) => {
      setGameState(prevState => ({ ...prevState, currentPlayer: playerName, phase: 'category-selection' }));
    });

    socket.on('updateCategories', (categories) => {
      console.log("Categories updated to:", categories)
      setGameState(prevState => ({ ...prevState, categories: categories }));
    });

    socket.on('correctAnswerTrivia', ({ answeringPlayer, pointsEarned, answer }) => {
      console.log(`${answeringPlayer} answered correctly! They earned ${pointsEarned} points. The answer was: ${answer}`);
      setShowOptions(false);
      setGameState(prevState => ({ ...prevState, answer: answer, color: "green" }));
    });
    socket.on('updatePointsTrivia', ({ points }) => {
      setLeaderboard(prevLeaderboard => ({
          ...prevLeaderboard,
          ...points
      }));
      console.log("Updating leaderboard to be", points);
  });
    socket.on('incorrectAnswerTrivia', ({ answeringPlayer, answer }) => {
      console.log(`${answeringPlayer} answered incorrectly with: ${answer}`);
      setShowOptions(false);
      setGameState(prevState => ({ ...prevState, answer: answer, color: "green" }));
    });

    return () => {
    };
  }, [socket]);

  const renderLobby = () => (
    <Lobby
      socket={socket}
      sessionId={sessionId}
      players={players}
      removePlayer={removePlayer}
      setForceRemove={setForceRemove}
      categories={gameState.categories}
      gameState={gameState}
      setGameState={setGameState}
      showAnswers={showAnswers}
      setShowAnswers={setShowAnswers}
    />
  );

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'lobby':
        return renderLobby();
      case 'category-selection':
        return (
          <div className='App'>
            {gameState.answer && <h1>The answer was {gameState.answer}</h1>}
            <h2>Waiting for {gameState.currentPlayer} to select a category...</h2>
          </div>
        );
      case 'question':
        return (
          <div className='App' style={{ backgroundColor: gameState.color }}>
            {gameState.currentQuestion && (
                <>   
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
                    {showOptions && (
                        <div>
                            <h4>Options:</h4>
                            <ul>
                                {gameState.currentQuestion.options.map((option, index) => (
                                    <li key={index}>{option}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </div>
        );
      default:
        return null;
    }
  };

  return (
<div>
<div className="content-container">
    <GuessingAudio color={gameState.color} />
    <div>
      {renderGameContent()}
    </div>
    {(gameState.phase !== 'lobby') && (
      <div className="leaderboard-content">
        <Leaderboard leaderboard={leaderboard} players={players} />
      </div>
    )}
</div>
</div>
  );
};

export default HostScreen;