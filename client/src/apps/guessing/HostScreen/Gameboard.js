import React from 'react';
import './Gameboard.css';

const GameBoard = ({ players, currentPlayer }) => {
  // Define the board layout
  const boardLayout = [
    'start', 'yellow', 'blue', 'green', 'red', 'pick', 'yellow', 'blue', 'green', 'red',
    'warp', 'yellow', 'blue', 'green', 'red', 'pick', 'yellow', 'blue', 'green', 'red',
    'warp', 'yellow', 'blue', 'green', 'red', 'pick', 'yellow', 'blue', 'green', 'red',
    'warp', 'yellow', 'blue', 'green', 'red', 'pick', 'yellow', 'blue', 'green', 'finish'
  ];

  return (
    <div className="game-board">
      <div className="board-container">
        {boardLayout.map((type, index) => (
          <div
            key={index}
            className={`board-square ${type}`}
            style={{
              top: `${getSquarePosition(index).top}%`,
              left: `${getSquarePosition(index).left}%`,
            }}
          >
            {type === 'start' && 'START'}
            {type === 'finish' && 'FINISH'}
            {type === 'warp' && 'WARP ZONE'}
            {type === 'pick' && 'PICK'}
          </div>
        ))}
        {players.map(player => (
          <div
            key={player.id}
            className="player-token"
            style={{
              backgroundColor: player.color,
              top: `${getSquarePosition(player.position).top}%`,
              left: `${getSquarePosition(player.position).left}%`,
            }}
          />
        ))}
      </div>
      <div className="game-info">
        <h3>Current Player: {currentPlayer.name}</h3>
        <div className="options">
          <button className="option-button">Roll Dice</button>
          <button className="option-button">Use Card</button>
        </div>
      </div>
    </div>
  );
};

function getSquarePosition(index) {
  const boardSize = 10; // 10x10 grid
  const squareSize = 100 / boardSize;

  if (index === 0) return { top: 90, left: 0 }; // START
  if (index === 39) return { top: 45, left: 45 }; // FINISH

  let x, y;

  if (index <= 10) {
    x = index * squareSize;
    y = 90;
  } else if (index <= 20) {
    x = 90;
    y = 90 - (index - 10) * squareSize;
  } else if (index <= 30) {
    x = 90 - (index - 20) * squareSize;
    y = 0;
  } else {
    x = 0;
    y = (index - 30) * squareSize;
  }

  return { top: y, left: x };
}

export default GameBoard;