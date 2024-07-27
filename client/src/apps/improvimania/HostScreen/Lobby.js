import React, { useState, useEffect } from 'react';
import './Lobby.css';
import AnimatedTitle from '../../AnimatedTitle';

const Lobby = ({
  socket,
  sessionId,
  players,
  removePlayer,
  setForceRemove,
  categories,
}) => {
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    socket.on('updateCategories', (updatedCategories) => {
      setSelectedCategories([]); // Reset selections when categories update
    });

    return () => {
      socket.off('updateCategories');
    };
  }, [socket]);

  const handleRemovePlayer = (playerToRemove) => {
    setForceRemove(true);
    removePlayer(playerToRemove, true);
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleStartGame = () => {
    if (socket && selectedCategories.length > 0) {
      console.log('Starting game for Session', sessionId, 'with categories', selectedCategories);
      socket.emit('startGameTrivia', { 
        sessionId, 
        selectedCategories,
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
              <li
                key={player.id}
                style={{
                  textDecoration: player.removed ? 'line-through' : 'none',
                  cursor: 'pointer'
                }}
                onClick={() => handleRemovePlayer(player.socketId)}
              >
                {player.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="App settings">
          <div>
            <p style={{ fontFamily: 'Impact' }}>
              Game Settings:
            </p>
            <div>
              <h4>Select Categories:</h4>
              {categories.map((category) => (
                <label key={category.id}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.color)}
                    onChange={() => handleCategoryToggle(category.color)}
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      <button 
        onClick={handleStartGame} 
        disabled={players.length < 2 || selectedCategories.length === 0} 
        className="start-game"
      >
        {players.length > 1 && selectedCategories.length > 0 ? "Start Game" : "Waiting for more players and category selection..."}
      </button>
    </div>
  );
};

export default Lobby;