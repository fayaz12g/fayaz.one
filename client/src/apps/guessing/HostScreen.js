import React, { useState, useEffect } from 'react';
import AnimatedTitle from '../AnimatedTitle';
import Lobby from './HostScreen/Lobby';
import GameBoard from './HostScreen/Gameboard';
import Spinner from './HostScreen/Spinner';

const HostScreen = ({
  socket,
  ipAddress,
  sessionCreated,
  createSession,
  gameStarted,
  sessionId,
  players,
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

const [spinResults, setSpinResults] = useState([]);

const [gameState, setGameState] = useState({
    phase: 'lobby', // 'lobby', 'determining-order', 'playing'
    currentPlayerIndex: 0,
    players: [],
    gameBoard: [],
    currentQuestion: null,
  });

  useEffect(() => {
    if (gameStarted) {
      socket.on('gameStarted', ({ gameBoard, players }) => {
        setGameState(prev => ({
          ...prev,
          phase: 'determining-order',
          gameBoard,
          players: players.map(p => ({ ...p, position: 0 })),
        }));
      });

      socket.on('playerSpun', ({ playerId, spinResult }) => {
              setSpinResults(prev => [...prev, { playerId, spinResult }]);
            });

      socket.on('orderDetermined', ({ players }) => {
        setGameState(prev => ({
          ...prev,
          phase: 'playing',
          players,
          currentPlayerIndex: 0,
        }));
      });

      socket.on('questionAsked', ({ question, options }) => {
        setGameState(prev => ({
          ...prev,
          currentQuestion: { question, options },
        }));
      });

      socket.on('playerMoved', ({ playerId, newPosition }) => {
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === playerId ? { ...p, position: newPosition } : p
          ),
          currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        }));
      });

      socket.on('gameEnded', ({ winnerId }) => {
        setGameState(prev => ({
          ...prev,
          phase: 'ended',
          winner: prev.players.find(p => p.id === winnerId),
        }));
      });

      return () => {
        socket.off('gameStarted');
        socket.off('playerSpun');
        socket.off('orderDetermined');
        socket.off('questionAsked');
        socket.off('playerMoved');
        socket.off('gameEnded');
      };
    }
  }, [gameStarted, socket]);

  const renderSpinningPhase = () => (
    <div className="App">
      <h2>Determining Player Order</h2>
      <p>Current Player: {gameState.players[gameState.currentPlayerIndex].name}</p>
      <div className="spin-results">
        {spinResults.map(({ playerId, spinResult }, index) => (
          <p key={index}>{gameState.players.find(p => p.id === playerId).name} spun: {spinResult}</p>
        ))}
      </div>
    </div>
  );

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'lobby':
        return renderLobby();
      case 'determining-order':
        return renderSpinningPhase();
      case 'playing':
        return (
          <div>
            <GameBoard
              gameBoard={gameState.gameBoard}
              players={gameState.players}
              currentPlayer={gameState.players[gameState.currentPlayerIndex]}
            />
            {gameState.currentQuestion && (
              <div className="question-container">
                <h3>Current Question:</h3>
                <p>{gameState.currentQuestion.question}</p>
                <ul>
                  {gameState.currentQuestion.options.map((option, index) => (
                    <li key={index}>{option}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case 'ended':
        return <h2>Game Ended! Winner: {gameState.winner.name}</h2>;
      default:
        return null;
    }
  };

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

  return (
    <div className="host-screen">
      <div className="title-bar">
        <div className="join-message">
          <h2>Join at <span className="red-text">Fayaz.One</span> in your browser!</h2>
        </div>
        <div className="room-info">
          <h2>Room Code: {ipAddress}</h2>
          <h4>Session: {sessionId}</h4>
        </div>
      </div>
      {renderGameContent()}
    </div>
  );
};

export default HostScreen;