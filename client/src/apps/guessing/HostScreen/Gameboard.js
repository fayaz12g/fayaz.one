import React from 'react';
import './GameBoard.css'; // We'll create this file for styling

const GameBoard = ({ players, currentPlayer }) => {
  // Define the board layout
  const boardLayout = [
    'start', 'yellow', 'blue', 'green', 'red', 'pick', 'yellow', 'blue', 'green', 'red',
    'warp1', 'yellow', 'blue', 'green', 'red', 'pick', 'yellow', 'blue', 'green', 'red',
    'warp2', 'yellow', 'blue', 'green', 'red', 'pick', 'yellow', 'blue', 'green', 'red',
    'warp3', 'yellow', 'blue', 'green', 'red', 'pick', 'yellow', 'blue', 'green', 'finish'
  ];

  return (
    <div className="game-board">
      {boardLayout.map((type, index) => (
        <div key={index} className={`board-space ${type}`}>
          {players.map(player => 
            player.position === index && (
              <div key={player.id} className="player-piece" style={{backgroundColor: player.color}}></div>
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;