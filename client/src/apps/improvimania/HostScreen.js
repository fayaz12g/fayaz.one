import React, { useState } from 'react';
import AnimatedTitle from '../AnimatedTitle';
import SoundEffect from '../SoundEffect';
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
  BackgroundMusic,
  isEndScene,
  speakingTheme,
  guessingTheme,
  gameMode,
  setGameMode,
  currentLine,
  isEndGame,
  scriptFile,
}) => {

  const handleRemovePlayer = (playerToRemove) => {
    removePlayer(playerToRemove)
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
        onClick={() => handleRemovePlayer(player.name)}
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
      {!sessionCreated ? (
        <div>        
          <h3>Pick a Game:</h3>
          <button onClick={createSession}><AnimatedTitle /></button>
          <button onClick={createSession}><AnimatedTitle title="cOming soon..." /></button>
          <button onClick={createSession}><AnimatedTitle title="cOming soon..." /></button>
        </div>
      ) : (
        <div>
          <div className="animated-title-container">
            <AnimatedTitle />
            <h1>Join at <h1 class="red-text">Fayaz.One</h1> in your browser!</h1>
          </div>
          <h2>Room Code: {ipAddress}</h2>
          
          {!gameStarted ? (
            <div>
              {isEndGame && <SoundEffect audioSrc={finishTheme}/>}
              <h3>Session {sessionId}</h3>
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
      )}
    </div>
  );
};

export default HostScreen;