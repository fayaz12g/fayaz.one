import React, { useState } from 'react';
import './Lobby.css';
import AnimatedTitle from '../../AnimatedTitle';

const Lobby = ({
  socket,
  sessionId,
  players,
  removePlayer,
  gameMode,
  setGameMode,
  setForceRemove,

}) => {

  setGameMode('default');
  
  const handleRemovePlayer = (playerToRemove) => {
    setForceRemove(true);
    removePlayer(playerToRemove, true);
  };

  const toggleGameMode = () => {
    setGameMode(prevMode => {
      if (prevMode === 'default') {
        return 'fun';
      } else if (prevMode === 'fun') {
        return 'personal';
      } else {
        return 'default';
      }
    });
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
      console.log('Starting game for Session', sessionId, 'in game mode', gameMode)
      socket.emit('startGameTrivia', { 
        sessionId, 
        gameMode,
      });
    }
  };

  return (
    <div className="lobby-container">
      <AnimatedTitle title="Trivia" />
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
            <p style={{ fontFamily: 'Impact' }}>
              Game Settings:
            </p>
            <label>
              Game Mode:
              <div className="button-wrapper">
                <button onClick={toggleGameMode} className="game-mode-button">
                  {gameMode}
                </button>
              </div>
              <br />
            </label>
          </div>
        </div>
      </div>
      <button onClick={handleStartGame} disabled={players.length < 2} className="start-game">
        {players.length > 1 ? "Start Game" : "Waiting for more players..."}
      </button>
    </div>
  );
};

export default Lobby;
