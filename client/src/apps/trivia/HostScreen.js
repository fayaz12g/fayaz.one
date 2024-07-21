import React, { useState, useEffect } from 'react';
import Leaderboard from './HostScreen/Leaderboard';
import Lobby from './HostScreen/Lobby';

const HostScreen = ({
  socket,
  ipAddress,
  sessionCreated,
  createSession,
  gameStarted,
  sessionId,
  players,
  setPlayers,
  rounds,
  setRounds,
  currentRound,
  sessionList,
  leaderboard,
  removePlayer,
  titleTheme,
  AudioPlayer,
  isEndScene,
  speakingTheme,
  guessingTheme,
  gameMode,
  setGameMode,
  currentLine,
  isEndGame,
  scriptFile,
  setForceRemove,
  forceRemove,
}) => {
  const [gameState, setGameState] = useState({
    phase: 'lobby',
    players: [],
    currentQuestion: null,
    leaderboard: {}
  });

  useEffect(() => {
    socket.on('updatePlayers', (players) => {
      setGameState(prevState => ({ ...prevState, players }));
      setPlayers(players);
      console.log("someone joined")
    });

    socket.on('gameStartedTrivia', (categories) => {
      setGameState(prevState => ({ ...prevState, phase: 'category-selection', categories }));
    });

    socket.on('newQuestionTrivia', (questionData) => {
      setGameState(prevState => ({ ...prevState, phase: 'question', currentQuestion: questionData }));
    });

    socket.on('updateLeaderboardTrivia', (leaderboard) => {
      setGameState(prevState => ({ ...prevState, leaderboard }));
    });

    return () => {
      socket.off('updatePlayers');
      socket.off('gameStartedTrivia');
      socket.off('newQuestionTrivia');
      socket.off('updateLeaderboardTrivia');
    };
  }, [socket]);


  const renderLobby = () => (
    <Lobby
      socket={socket}
      ipAddress={ipAddress}
      sessionCreated={sessionCreated}
      createSession={createSession}
      gameStarted={gameStarted}
      sessionId={sessionId}
      players={players}
      rounds={rounds}
      setRounds={setRounds}
      currentRound={currentRound}
      sessionList={sessionList}
      leaderboard={leaderboard}
      removePlayer={removePlayer}
      titleTheme={titleTheme}
      AudioPlayer={AudioPlayer}
      isEndScene={isEndScene}
      speakingTheme={speakingTheme}
      guessingTheme={guessingTheme}
      gameMode={gameMode}
      setGameMode={setGameMode}
      currentLine={currentLine}
      isEndGame={isEndGame}
      scriptFile={scriptFile}
      setForceRemove={setForceRemove}
      forceRemove={forceRemove}
    />
  );


  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'lobby':
        return renderLobby();
      case 'category-selection':
        return (
          <div>
            <h2>Waiting for player to select a category...</h2>
          </div>
        );
      case 'question':
        return (
          <div>
            <h2>Current Question</h2>
            <h3>Category: {gameState.currentQuestion.deckName}</h3>
            <h4>Hints:</h4>
            <ul>
              {gameState.currentQuestion.hints.map((hint, index) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
            <h4>Options:</h4>
            <ul>
              {gameState.currentQuestion.options.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="host-screen">
      {renderGameContent()}
      <Leaderboard leaderboard={leaderboard} players={players} />
    </div>
  );
};

export default HostScreen;