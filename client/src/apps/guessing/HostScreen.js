import React, { useState, useEffect } from 'react';
import AnimatedTitle from '../AnimatedTitle';
import Lobby from './HostScreen/Lobby';
import GameBoard from './HostScreen/GameBoard';

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
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameBoard, setGameBoard] = useState([]);
  const [currentHint, setCurrentHint] = useState('');
  const [currentOptions, setCurrentOptions] = useState([]);
  const [playerPositions, setPlayerPositions] = useState({});
  const [spinResult, setSpinResult] = useState(null);

  useEffect(() => {
    if (gameStarted) {
      socket.on('gameStarted', ({ gameBoard, players, currentPlayer }) => {
        setGameBoard(gameBoard);
        setCurrentPlayer(currentPlayer);
        setPlayerPositions(players.reduce((acc, player) => {
          acc[player.socketId] = 0;
          return acc;
        }, {}));
      });

      socket.on('spinResult', ({ playerId, result }) => {
        setSpinResult(result);
      });

      socket.on('questionAsked', ({ hint, options }) => {
        setCurrentHint(hint);
        setCurrentOptions(options);
      });

      socket.on('correctAnswer', ({ playerId, spacesToMove }) => {
        setPlayerPositions(prev => ({
          ...prev,
          [playerId]: prev[playerId] + spacesToMove
        }));
      });

      socket.on('newHint', ({ hint }) => {
        setCurrentHint(hint);
      });

      socket.on('nextTurn', ({ playerId }) => {
        setCurrentPlayer(players.find(p => p.socketId === playerId));
      });

      socket.on('gameEnded', ({ winnerId }) => {
        const winner = players.find(p => p.socketId === winnerId);
        // Display winner
      });

      return () => {
        socket.off('gameStarted');
        socket.off('spinResult');
        socket.off('questionAsked');
        socket.off('correctAnswer');
        socket.off('newHint');
        socket.off('nextTurn');
        socket.off('gameEnded');
      };
    }
  }, [gameStarted, socket, players]);

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

  const renderGameBoard = () => (
    <GameBoard
      gameBoard={gameBoard}
      players={players}
      playerPositions={playerPositions}
      currentPlayer={currentPlayer}
      currentHint={currentHint}
      currentOptions={currentOptions}
      spinResult={spinResult}
    />
  );

  return (
    <div className="host-screen">
      <AnimatedTitle title="Guessing" />
      <h2 className="room-code">Room Code: {ipAddress}</h2>
      <div className="title-bar">
        <div className="join-message">
          <h2>Join at <span className="red-text">Fayaz.One</span> in your browser!</h2>
        </div>
        <div className="room-info">
          <h2>Room Code: {ipAddress}</h2>
          <h4>Session: {sessionId}</h4>
        </div>
      </div>
      {!gameStarted ? renderLobby() : renderGameBoard()}
    </div>
  );
};

export default HostScreen;