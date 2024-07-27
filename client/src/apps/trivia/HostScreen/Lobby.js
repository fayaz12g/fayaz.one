import React, { useState } from 'react';
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
        allowStealing,
      });
    }
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
            <div className="App settings">
                <div>
                    <p style={{ fontFamily: 'Impact' }}>
                        Game Settings:
                    </p>
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
                    {(categories.length > 0) && <p style={{ fontFamily: 'Impact' }}>Select Categories:</p>}
                    {categories.length > 0 ? (
                        <div className="categories-scroll-box">
                            {/* Group categories by pack name */}
                            {Object.entries(groupByPack(categories)).map(([pack, categories]) => {
                                const packName = pack.split('/').pop(); 
                                return (
                                    <div key={pack}>
                                        <h4>{packName}</h4>
                                        {categories.map(category => (
                                            <div key={category.id}>
                                                <label style={{ color: category.color }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCategories.includes(category.color)}
                                                        onChange={() => handleCategoryToggle(category.color)}
                                                    />
                                                    {category.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
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
            {players.length > 1 && selectedCategories.length > 0 ? "Start Game" : "Waiting for more players and category selection..."}
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

}

export default Lobby;