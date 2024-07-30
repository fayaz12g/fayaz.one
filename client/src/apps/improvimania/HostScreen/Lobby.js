import React, { useState } from 'react';
import { useSpring, animated, config } from 'react-spring';
import './Lobby.css';
import AnimatedTitle from '../../AnimatedTitle';

const Lobby = ({
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
  const [isExiting, setIsExiting] = useState(false);

  const lobbyAnimation = useSpring({
    opacity: isExiting ? 0 : 1,
    transform: isExiting ? 'translate3d(-100%, 0, 0)' : 'translate3d(0, 0, 0)',
    config: config.gentle,
  });

  const handleRemovePlayer = (playerToRemove) => {
    setForceRemove(true);
    removePlayer(playerToRemove, true);
  };

  const toggleGameMode = () => {
    setGameMode(gameMode === 'freeforall' ? 'classic' : 'freeforall');
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
      setIsExiting(true);
      setTimeout(() => {
        socket.emit('startGameImprov', { 
          sessionId, 
          rounds, 
          gameMode,
          scriptFile
        });
      }, 500); // Delay to allow exit animation to play
    }
  };

  const isStartGameDisabled = (gameMode === 'classic' && players.length !== 4) || 
                              (gameMode === 'freeforall' && players.length < 3);

  const startGameButtonText = gameMode === 'classic' 
    ? (players.length === 4 ? "Start Game" : "Waiting for 4 players...")
    : (players.length >= 3 ? "Start Game" : "Waiting for at least 3 players...");

  return (
    <animated.div style={lobbyAnimation} className="lobby-container">
      <AnimatedTitle />
      <div className="app-container">
        <div className="App players-container">
          <h4>Players:</h4>
          <ul>
            {players.map((player) => (
              <PlayerListItem key={player.id} player={player} />
            ))}
          </ul>
        </div>
        <div className="App settings">
          <div>
            <h2 style={{ fontFamily: 'Alloy Ink'}}>
              Game Settings:
            </h2>
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
                <button onClick={toggleGameMode} className="game-mode-button">
                  {gameMode === 'freeforall' ? 'Party' : 'Classic'}
                </button>
              </div>
              <br />
            </label>
          </div>
        </div>
      </div>
      <button onClick={handleStartGame} disabled={isStartGameDisabled} className="start-game">
        {startGameButtonText}
      </button>
    </animated.div>
  );
};

export default Lobby;
