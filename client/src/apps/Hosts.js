import React, { useState } from 'react';
import AnimatedTitle from './AnimatedTitle.js';
import ImprovHost from './improvimania/HostScreen.js';
import GuessingHost from './guessing/HostScreen.js';
import TriviaHost from './trivia/HostScreen.js';
import LearnHost from './learn/HostScreen.js';

const Hosts = ({
  socket,
  serverIP,
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
  game,
  setGame,
  guessesMade,
  setLeaderboard
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

  const renderTriviaHost = () => (
    <TriviaHost
      socket={socket}
      ipAddress={serverIP}
      sessionCreated={sessionCreated}
      createSession={createSession}
      gameStarted={gameStarted}
      sessionId={sessionId}
      players={players}
      setPlayers={setPlayers}
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
      setLeaderboard={setLeaderboard}
    />
  );

  const renderLearnHost = () => (
    <LearnHost
      socket={socket}
      ipAddress={serverIP}
      sessionCreated={sessionCreated}
      createSession={createSession}
      gameStarted={gameStarted}
      sessionId={sessionId}
      players={players}
      setPlayers={setPlayers}
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
      setLeaderboard={setLeaderboard}
    />
  );

  return (
    <div>
      {!sessionCreated ? (
        <div className="App">
          <div className="game-categories">
            <div className="category">
              <h3>Acting</h3>
              <button
                onClick={() => {
                  setGame('improv');
                  sessionStorage.setItem('game', 'improv');
                  createSession('improv');
                }}
              >
                <AnimatedTitle title="Improvimania" />
              </button>
            </div>
            <div className="category">
              <h3>Trivia</h3>
              <button
                onClick={() => {
                  setGame('trivia');
                  createSession('trivia');
                }}
              >
                <AnimatedTitle title="Classic" />
              </button>
              <button
                onClick={() => {
                  setGame('guessing');
                  sessionStorage.setItem('game', 'guessing');
                  createSession('guessing');
                }}
              >
                <AnimatedTitle title="Guessing" />
              </button>
              <button
                onClick={() => {
                  setGame('learn');
                  createSession('learn');
                }}
              >
                <AnimatedTitle title="Learning" />
              </button>
            </div>
          </div>
        </div>
      ) : game === 'improv' ? (
        <div>{renderImprovHost()}</div>
      ) : game === 'guessing' ? (
        <div>{renderGuessingHost()}</div>
      ) : game === 'trivia' ? (
        <div>{renderTriviaHost()}</div>
      ) : game === 'learn' ? (
        <div>{renderLearnHost()}</div>
      ) : null}
    </div>
  );
};

export default Hosts;