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
  const [gameState, setGameState] = useState({
    phase: 'lobby',
    currentPlayerIndex: 0,
    players: [],
    gameBoard: [],
    currentQuestion: null,
    initialSpins: [],
  });

  useEffect(() => {
    if (gameStarted) {
      socket.on('gameStarted', ({ gameBoard, players }) => {
        setGameState(prev => ({
          ...prev,
          phase: 'initial-spin',
          gameBoard,
          players: players.map(p => ({ ...p, position: 0 })),
          initialSpins: [],
        }));
      });

      socket.on('playerSpun', ({ playerId, spinResult }) => {
        setGameState(prev => ({
          ...prev,
          initialSpins: [...prev.initialSpins, { playerId, spinResult }],
        }));
      });

      socket.on('gamePhaseChanged', ({ phase, players, currentPlayer }) => {
        setGameState(prev => ({
          ...prev,
          phase,
          players,
          currentPlayerIndex: players.findIndex(p => p.id === currentPlayer.id),
        }));
      });
  
      socket.on('questionAsked', ({ question, options, deckId, deckName, currentPlayer }) => {
        setGameState(prev => ({
          ...prev,
          currentQuestion: { question, options, deckId, deckName },
          currentPlayerIndex: prev.players.findIndex(p => p.id === currentPlayer),
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
        socket.off('gamePhaseChanged');
        socket.off('questionAsked');
        socket.off('playerMoved');
        socket.off('gameEnded');
      };
    }
  }, [gameStarted, socket]);

  const renderInitialSpinPhase = () => (
    <div className="initial-spin-phase">
      <h2>Spin Your Wheel To Determine Player Order!</h2>
      <div className="spinners-container">
        {gameState.players.map(player => (
          <div key={player.id} className="player-spinner">
            <h5>{player.name}</h5>
            <Spinner
              onSpinComplete={() => {}} // Host doesn't trigger spins
              disabled={true}
              result={gameState.initialSpins.find(s => s.playerId === player.id)?.spinResult}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'lobby':
        return renderLobby();
      case 'initial-spin':
        return (
        <div className="App">
          {renderInitialSpinPhase()}
          </div>
          );
        case 'playing':
          return (
            <div className="game-board">
              <GameBoard
                gameBoard={gameState.gameBoard}
                players={gameState.players}
                currentPlayer={gameState.players[gameState.currentPlayerIndex]}
              />
              {gameState.currentQuestion && (
                <div className="question-container">
                  <h3>Current Question:</h3>
                  <h5>{gameState.currentQuestion.question}</h5>
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