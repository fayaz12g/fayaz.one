import React, { useState, useEffect } from 'react';
import { useTransition, animated, config } from 'react-spring';
import Lobby from './HostScreen/Lobby';
import Leaderboard from './Leaderboard';
import './HostScreen.css';

const HostScreen = ({
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
  guessesMade
}) => {
  const [activeScreen, setActiveScreen] = useState('lobby');

  useEffect(() => {
    if (!gameStarted) {
      setActiveScreen('lobby');
    } else if (isEndScene) {
      setActiveScreen('guessing');
    } else {
      setActiveScreen('speaking');
    }
  }, [gameStarted, isEndScene]);

  const transitions = useTransition(activeScreen, {
    from: { opacity: 0, transform: 'translate3d(100%,0,0)' },
    enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
    leave: { opacity: 0, transform: 'translate3d(-50%,0,0)' },
    config: config.gentle,
  });

  const renderSpeakerScreen = () => (
    <div className="App">
      <h2>Current Speaker</h2>
      <p>{currentLine?.text}</p>
    </div>
  );

  const renderGuessingScreen = () => (
    <div className="App">
        <h2>Guess the Adlibber!</h2>
        <div className="guesses-container">
            {guessesMade.map((guess, index) => (
                <div key={index} className="guess-block">
                    <span>{guess.guess}</span>
                    <div className="voters">
                        <span className={guess.correct ? 'correct' : 'incorrect'}>
                            {guess.name}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

  return (
    <div className="host-screen">
      <div className="title-bar">
        <div className="join-message">
          <h2>Join at <span className="red-text">Fayaz.One</span> in your browser!</h2>
        </div>
        <div className="room-info">
          <h2>Room Code: {serverIP}</h2>
          <h4>Session: {sessionId}</h4>
        </div>
      </div>

      {transitions((style, item) => (
        <animated.div style={style} className="screen-container">
          {item === 'lobby' && (
            <Lobby
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
          )}
          {item === 'speaking' && renderSpeakerScreen()}
          {item === 'guessing' && renderGuessingScreen()}
        </animated.div>
      ))}

      {activeScreen !== 'lobby' && (
        <div className="leaderboard-container">
          <Leaderboard leaderboard={leaderboard}  players={players} />
        </div>
      )}
    </div>
  );
};

export default HostScreen;