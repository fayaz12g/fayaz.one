import React, { useState, useEffect } from 'react';
import AnimatedTitle from '../AnimatedTitle';
import Lobby from './HostScreen/Lobby';
import GameBoard from './HostScreen/Gameboard';

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
  const [currentSpace, setCurrentSpace] = useState(null);
  const [cardDecks, setCardDecks] = useState(null);

  useEffect(() => {
    if (gameStarted) {
      // Load card decks from JSON files
      const loadCardDecks = async () => {
        const decks = {
          red: await import('../../data/redCards.json'),
          blue: await import('../../data/blueCards.json'),
          green: await import('../../data/greenCards.json'),
          yellow: await import('../../data/yellowCards.json'),
        };
        setCardDecks(decks);
      };
      loadCardDecks();

      // Set up socket listeners for game events
      socket.on('playerTurn', ({ player, space }) => {
        setCurrentPlayer(player);
        setCurrentSpace(space);
      });

      return () => {
        socket.off('playerTurn');
      };
    }
  }, [gameStarted, socket]);

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
    <div>
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
      {!gameStarted ? (
        renderLobby()
      ) : (
        <GameBoard
          socket={socket}
          players={players}
          currentPlayer={currentPlayer}
          currentSpace={currentSpace}
          cardDecks={cardDecks}
        />
      )}
    </div>
  );
};

export default HostScreen;