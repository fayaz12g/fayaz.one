import React, { useState, useEffect } from 'react';
import Leaderboard from './HostScreen/Leaderboard';
import Lobby from './HostScreen/Lobby';

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
    color: null,
    answer: null,
    categories: [],
    logos: {},
    allowStealing: false
  });
  
  const [showOptions, setShowOptions] = useState(false);

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
          allowStealing: allowStealing
      }));
  });

    socket.on('newQuestionTrivia', (questionData) => {
      setGameState(prevState => ({ 
        ...prevState, 
        phase: 'question', 
        currentQuestion: questionData,
        color: questionData.color  
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
      setGameState(prevState => ({ ...prevState, answer: answer, color: 'white' }));
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
      setGameState(prevState => ({ ...prevState, answer: answer, color: 'white' }));
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
    />
  );

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'lobby':
        return renderLobby();
      case 'category-selection':
        return (
          <div className='App'>
            {gameState.answer && <b>The answer was {gameState.answer}</b>}
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
    <div>
      {renderGameContent()}
    </div>
    {(gameState.phase !== 'lobby') && (
      <div className="leaderboard-content">
        <Leaderboard leaderboard={leaderboard} players={players} />
      </div>
    )}
</div>
  );
};

export default HostScreen;