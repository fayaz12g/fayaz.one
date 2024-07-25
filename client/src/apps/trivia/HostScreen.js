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
    logos: {}
  });
  
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    socket.on('gameStartedTrivia', (categories, logos) => {
      const logosMap = logos.reduce((acc, logo) => {
          acc[logo.name] = logo.imagePath;
          return acc;
      }, {});

      setGameState(prevState => ({
          ...prevState,
          phase: 'category-selection',
          categories: categories,
          logos: logosMap
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

  const startGame = () => {
    socket.emit('startGameTrivia', sessionId);
  };

  const renderLobby = () => (
    <Lobby
      socket={socket}
      sessionId={sessionId}
      players={players}
      removePlayer={removePlayer}
      gameMode={gameMode}
      setGameMode={setGameMode}
      setForceRemove={setForceRemove}
      startGame={startGame}
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
<div className="host-screen">
  <div className="content-container">
    <div className="game-content">
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