import React, { useState, useEffect } from 'react';
import Leaderboard from './HostScreen/Leaderboard';
import Lobby from './HostScreen/Lobby';
import GuessingAudio from './GuessingAudio';

const HostScreen = ({
  socket,
  sessionId,
  players,
  removePlayer,
  setForceRemove,
  setLeaderboard,
  leaderboard,
}) => {
  const [gameState, setGameState] = useState({
    phase: 'lobby',
    currentQuestion: null,
    currentPlayer: null,
    color: "green",
    answer: null,
    categories: [],
    buzzer: null,  // New state to track who buzzed in
    isJudging: false,  // New state to track if the judge is deciding
  });
  

  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    socket.on('gameStartedLearn', (color, showAnswers) => {
      setGameState(prevState => ({
        ...prevState,
        phase: 'game',
        color: color,
      }));
    });
  
    socket.on('newQuestionLearn', (questionData) => {
      setGameState(prevState => ({
        ...prevState,
        phase: 'question',
        currentQuestion: questionData,
        color: questionData.color,
        buzzer: null,  // Reset the buzzer when a new question starts
        isJudging: false,  // Reset judging state
      }));
    });
  
    socket.on('updateLeaderboardLearn', (leaderboard) => {
      setLeaderboard(leaderboard);
    });
  
    socket.on('updateCategoriesLearn', (categories) => {
      console.log("Categories updated to:", categories)
      setGameState(prevState => ({ ...prevState, categories: categories }));
    });
    
    socket.on('playerBuzzedInLearn', ({ name }) => {
      setGameState(prevState => ({
        ...prevState,
        buzzer: name,
        isJudging: true,  // Start judging when a player buzzes in
      }));
      console.log(`${name} buzzed in!`);
    });
  
    socket.on('correctAnswerLearn', ({ answer }) => {
      setGameState(prevState => ({
        ...prevState,
        phase: 'waiting',
        color: "green",
        answer: answer,
        buzzer: null,
        isJudging: false,  // Reset judging after a decision
      }));
    });
  
    socket.on('incorrectAnswerLearn', ({ answer }) => {
      setGameState(prevState => ({
        ...prevState,
        phase: 'waiting',
        color: "green",
        answer: answer,
        buzzer: null,
        isJudging: false,  // Reset judging after a decision
      }));
    });
  
    return () => {
      console.log('HostScreen unmounting');
    };
  }, [socket, setLeaderboard]);
  

  const renderLobby = () => (
    <Lobby
      socket={socket}
      sessionId={sessionId}
      players={players}
      removePlayer={removePlayer}
      setForceRemove={setForceRemove}
      categories={gameState.categories}
      gameState={gameState}
    />
  );

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'lobby':
        return renderLobby();
      case 'question':
        return (
          <div className='App' style={{ backgroundColor: gameState.color }}>
            {gameState.currentQuestion && (
              <>
                <h4>Question:</h4>
                <p>{gameState.currentQuestion.text}</p>
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
                {gameState.buzzer && (
                  <div>
                    <h4>{gameState.buzzer} buzzed in!</h4>
                    {gameState.isJudging && (
                      <div>
                        <p><strong>Waiting for judge's decision...</strong></p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      case 'game':
        return (
          <div className="App">
            <h2>The game is on! Waiting for the next turn...</h2>
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
