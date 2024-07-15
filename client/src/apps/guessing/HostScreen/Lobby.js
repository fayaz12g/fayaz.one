import React, { useState } from 'react';
import './Lobby.css';

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
            socket.emit('startGameGuessing', { 
                sessionId, 
                gameMode,
            });
        }
      };

      return (
        <div className="lobby-container">
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
          <button onClick={handleStartGame} disabled={players.length !== 4} className="start-game">
            {players.length === 4 ? "Start Game" : "Waiting for 4 players..."}
          </button>
        </div>
      );
    };
    
    export default Lobby;