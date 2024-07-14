import React, { useState } from 'react';
import './Quit.css'; 
import '../App.css';

const Quit = ({ playerName, forceRemove, removePlayer, setConfirmQuit, resetEverything }) => {
  const [showOverlay, setShowOverlay] = useState(false);

  const handleQuit = () => {
    setConfirmQuit(false);
    removePlayer(playerName, forceRemove);
    resetEverything();
  };

  return (
    <div>
        <div className="overlay">
          <div className="overlay-content">
            <h1>Quit Game</h1>
            <h2>Are you sure you want to quit the game?</h2>
            <button onClick={() => setConfirmQuit(false)}>Cancel</button>
            <button onClick={handleQuit}>Quit</button>
          </div>
        </div>
    </div>
  );
};

export default Quit;
