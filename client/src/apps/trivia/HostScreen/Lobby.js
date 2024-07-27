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
  const [allowStealing, setAllowStealing] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (categories.length === 0) {
      handleGetCategories();
    }
  }, [categories, socket, sessionId]);

  const handleRemovePlayer = (playerToRemove) => {
    setForceRemove(true);
    removePlayer(playerToRemove, true);
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
    if (!selectAll) {
      setSelectAll(true)
  }
  };

  const handleStartGame = () => {
    if (socket && selectedCategories.length > 0) {
      console.log('Starting game for Session', sessionId, 'with categories', selectedCategories);
      socket.emit('startGameTrivia', {
        sessionId,
        selectedCategories,
        allowStealing,
      });
    }
  };

  const handleSelectAll = () => {
    const allCategoryIds = categories.flat().map(cat => cat.id);
    if (selectAll) {
      // Deselect all
      setSelectedCategories([]);
    } else {
      // Select all
      setSelectedCategories(allCategoryIds);
    }
    setSelectAll(!selectAll);
  };

  const handleGetCategories = () => {
    if (socket) {
      console.log('Requesting categories for Session', sessionId);
      socket.emit('getCategories', sessionId);
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
                className="player-item"
                onClick={() => handleRemovePlayer(player.socketId)}
              >
                {player.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="App settings-trivia">
          <div>
            <p style={{ fontFamily: 'Impact' }}>Game Settings:</p>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={allowStealing}
                  onChange={(e) => setAllowStealing(e.target.checked)}
                />
                Allow Stealing
              </label>
            </div>
            {categories.length > 0 && (
              <p style={{ fontFamily: 'Impact' }}>Select Categories:</p>
            )}
            {categories.length > 0 ? (
              <div>
                <div className="categories-scroll-box">
                  {/* Group categories by pack name */}
                  {Object.entries(groupByPack(categories)).map(([pack, categories]) => {
                    const packName = pack.split('/').pop();
                    return (
                      <div key={pack}>
                        <h4 style={{
                                textShadow: '3px 2px 4px rgba(0, 0, 0, 0.9)'
                              }}>{packName}</h4>
                        {categories.map(category => (
                          <div key={category.id}>
                            <label
                              style={{
                                color: category.color,
                                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(category.id)}
                                onChange={() => handleCategoryToggle(category.id)}
                              />
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
                {/* Select All Button */}
                <button onClick={handleSelectAll}>
                  {selectAll ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            ) : (
              <div>
                <p>No categories available.</p>
                <button onClick={handleGetCategories}>Get Categories</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={handleStartGame}
        disabled={players.length < 2 || selectedCategories.length === 0}
        className="start-game"
      >
        {players.length > 1 && selectedCategories.length > 0 ? "Start Game" : "Waiting for more players or category selection..."}
      </button>
    </div>
  );

  function groupByPack(categories) {
    return categories.reduce((groups, category) => {
      const { pack } = category;
      if (!groups[pack]) {
        groups[pack] = [];
      }
      groups[pack].push(category);
      return groups;
    }, {});
  }
};

export default Lobby;
