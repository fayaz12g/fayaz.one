import React, { useState } from 'react';
import AnimatedTitle from '../AnimatedTitle';
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

  const handleRemovePlayer = (playerToRemove) => {
    setForceRemove(true);
    removePlayer(playerToRemove, true);
  };

  const toggleGameMode = () => {
    setGameMode(gameMode === 'classic' ? 'freeforall' : 'classic');
  };

  const PlayerListItem = ({ player }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <li
        key={player.id}
        style={{
          textDecoration: player.removed ? 'line-through' : 
            (isHovered ? 'line-through' : 'none'),
          cursor: 'pointer'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => handleRemovePlayer(player.socketId)}
      >
        {player.name}
      </li>
    );
  };

  const handleStartGame = () => {
    if (socket) {
        console.log(`Starting game with script file: ${scriptFile}`);
        socket.emit('startGame', { 
            sessionId, 
            rounds, 
            gameMode,
            scriptFile
        });
    }
  };

  return (
    <div className="App">
        <div>
        <AnimatedTitle />
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
              <h2>Room Code: {ipAddress}</h2>
              <h4>Players:</h4>
              <ul>
                {players.map((player) => (
                  <PlayerListItem key={player.id} player={player} />
                ))}
              </ul>
              <div>
                <p style={{ fontFamily: 'Alloy Ink' }}>
                  Game Settings:
                </p>
                <label>
                  Number of rounds:
                  <br />
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={rounds}
                    onChange={(e) => setRounds(parseInt(e.target.value))}
                  />
                </label>
                <label>
                  <br />
                  Game Mode:
                  <div className="button-wrapper">
                    <game-mode-button onClick={toggleGameMode} className="game-mode-button">
                      {gameMode === 'classic' ? 'Classic' : 'Free for All'}
                    </game-mode-button>
                  </div>
                  <br />
                </label>
                <button onClick={handleStartGame} disabled={players.length !== 4}>
                  {players.length === 4 ? "Start Game" : "Waiting for 4 players..."}
                </button>
              </div>
            </div>
          ) : !isEndScene ? (
            <div>
              <h3>Round: {currentRound}/{rounds}</h3>
              <h3>{currentLine?.text}</h3>
              <h4>Leaderboard:</h4>
              <ul>
                {Object.entries(leaderboard)
                  .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                  .map(([name, score]) => (
                    <li key={name}>{name}: {score}</li>
                  ))}
              </ul>
            </div>
          ) : (
            <div>
              <h3>Round: {currentRound}/{rounds}</h3>
              <h3>The Guesser is Guessing</h3>
              <h4>Leaderboard:</h4>
              <ul>
                {Object.entries(leaderboard)
                  .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                  .map(([name, score]) => (
                    <li key={name}>{name}: {score}</li>
                  ))}
              </ul>
            </div>
          )}
        </div>
    </div>
  );
};

export default HostScreen;