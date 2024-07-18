import React, { useState } from 'react';
import AnimatedTitle from './AnimatedTitle.js';
import ImprovHost from './improvimania/HostScreen.js';
import GuessingHost from './guessing/HostScreen.js';

const Hosts = ({
  socket,
  serverIP,
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
  game,
  setGame,
  guessesMade
}) => {

  const renderImprovHost = () => (
    <ImprovHost
      socket={socket}
      serverIP={serverIP}
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
      guessesMade={guessesMade}
    />
  );

  const renderGuessingHost = () => (
    <GuessingHost
      socket={socket}
      ipAddress={serverIP}
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
      {!sessionCreated ? (
        <div className="App">
          <h3>Pick a Game:</h3>
          <button
            onClick={() => {
              setGame('improv');
              sessionStorage.setItem('game', 'improv');
              createSession('improv');
            }}
          >
            <AnimatedTitle />
          </button>
          <br />
          <button
            onClick={() => {
              setGame('guessing');
              sessionStorage.setItem('game', 'guessing');
              createSession('guessing');
            }}
          >
            <AnimatedTitle title="Guessing" />
          </button>
          <br />
          <button
            onClick={() => {
              setGame('soon');
              createSession('soon');
            }}
          >
            <AnimatedTitle title="cOming soon..." />
          </button>
        </div>
      ) : game === 'improv' ? (
        <div>{renderImprovHost()}</div>
      ) : game === 'guessing' ? (
        <div>{renderGuessingHost()}</div>
      ) : game === 'soon' ? (
        <div>Coming Soon</div>
      ) : null}
    </div>
  );
};

export default Hosts;