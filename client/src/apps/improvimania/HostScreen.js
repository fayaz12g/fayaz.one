import React, { useState } from 'react';
import AnimatedTitle from '../AnimatedTitle';
import Lobby from './HostScreen/Lobby';
import Leaderboard from './Leaderboard';
import finishTheme from '../../sound/improvimania/finish.m4a';

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
  )

  return (

        <div>
        <AnimatedTitle />
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
            <div>
              {renderLobby()}
            </div>
          ) : !isEndScene ? (
            <div>
              <h3>Round: {currentRound}/{rounds}</h3>
              <h3>{currentLine?.text}</h3>
              <Leaderboard />
            </div>
          ) : (
            <div>
              <h3>Round: {currentRound}/{rounds}</h3>
              <h3>The Guesser is Guessing</h3>
              <Leaderboard />
            </div>
          )}
        </div>
  );
};

export default HostScreen;