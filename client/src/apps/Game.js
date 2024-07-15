import React, { useState } from 'react';
import ImprovPlayer from './improvimania/PlayerScreen';
import GuessingPlayer from './guessing/PlayerScreen';
import Players from './Players';
import PickGame from './PickGame';

const Game = ({
    isEndGame,
    joinedSession,
    sessionId,
    setSessionId,
    playerName,
    setPlayerName,
    joinSession,
    gameStarted,
    players,
    playerRole,
    isEndScene,
    currentLine,
    isSpeaker,
    nextLine,
    guessAdlibber,
    sessionList,
    leaderboard,
    kicked,
    titleTheme,
    AudioPlayer,
    speakingTheme,
    guessingTheme,
    sentGuess,
    game,
    socket,
    serverIP,
    sessionCreated,
    createSession,
    rounds,
    setRounds,
    currentRound,
    removePlayer,
    gameMode,
    setGameMode,
    scriptFile,
    setForceRemove,
    forceRemove,
    setGame,
    theme,
    role
    
}) => {
  
    const renderPickGame = () => (
        <PickGame
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
          game={game}
          setGame={setGame}
          theme={theme}
        />
      );
  
      const renderPlayerScreen = () => (
        <Players
          isEndGame={isEndGame}
          joinedSession={joinedSession}
          sessionId={sessionId}
          setSessionId={setSessionId}
          playerName={playerName}
          setPlayerName={setPlayerName}
          joinSession={joinSession}
          gameStarted={gameStarted}
          players={players}
          playerRole={playerRole}
          isEndScene={isEndScene}
          currentLine={currentLine}
          isSpeaker={isSpeaker}
          nextLine={nextLine}
          guessAdlibber={guessAdlibber}
          sessionList={sessionList}
          leaderboard={leaderboard}
          kicked={kicked}
          titleTheme={titleTheme}
          Audio={Audio}
          speakingTheme={speakingTheme}
          guessingTheme={guessingTheme}
          sentGuess={sentGuess}
          game={game}
        />
      );

  return (
    <div>
      {role==='host' && renderPickGame()}
      {role==='player' && renderPlayerScreen()}
    </div>
  );
};

export default Game;
