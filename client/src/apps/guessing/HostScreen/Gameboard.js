import React from 'react';

const GameBoard = ({
  gameBoard,
  players,
  playerPositions,
  currentPlayer,
  currentHint,
  currentOptions,
  spinResult
}) => {
  const boardSize = 600;
  const squareSize = 40;
  const centerX = boardSize / 2;
  const centerY = boardSize / 2;

  const colorMap = {
    red: '#FF6B6B',
    blue: '#4ECDC4',
    green: '#45B7D1',
    yellow: '#FFA400'
  };

  const createSpiralBoard = () => {
    const squares = [];
    let x = centerX - squareSize / 2;
    let y = centerY - squareSize / 2;
    let direction = 0;
    let stepsInDirection = 1;
    let stepsTaken = 0;

    for (let i = 0; i < gameBoard.length; i++) {
      squares.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: `${squareSize}px`,
            height: `${squareSize}px`,
            backgroundColor: colorMap[gameBoard[i]],
            border: '1px solid black',
          }}
        />
      );

      // Move to next position
      switch (direction) {
        case 0: x += squareSize; break; // Right
        case 1: y -= squareSize; break; // Up
        case 2: x -= squareSize; break; // Left
        case 3: y += squareSize; break; // Down
      }

      stepsTaken++;
      if (stepsTaken === stepsInDirection) {
        direction = (direction + 1) % 4;
        stepsTaken = 0;
        if (direction % 2 === 0) stepsInDirection++;
      }
    }

    return squares;
  };

  const createPlayerTokens = () => {
    return players.map((player, index) => {
      const position = playerPositions[player.socketId];
      const [x, y] = getCoordinatesForPosition(position);
      return (
        <div
          key={player.socketId}
          style={{
            position: 'absolute',
            left: `${x + squareSize / 2 - 15}px`,
            top: `${y + squareSize / 2 - 15}px`,
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: player.color || `hsl(${index * 137.5}, 50%, 60%)`,
            border: '2px solid black',
            zIndex: 10,
          }}
        />
      );
    });
  };

  const getCoordinatesForPosition = (position) => {
    let x = centerX - squareSize / 2;
    let y = centerY - squareSize / 2;
    let direction = 0;
    let stepsInDirection = 1;
    let stepsTaken = 0;

    for (let i = 0; i < position; i++) {
      switch (direction) {
        case 0: x += squareSize; break; // Right
        case 1: y -= squareSize; break; // Up
        case 2: x -= squareSize; break; // Left
        case 3: y += squareSize; break; // Down
      }

      stepsTaken++;
      if (stepsTaken === stepsInDirection) {
        direction = (direction + 1) % 4;
        stepsTaken = 0;
        if (direction % 2 === 0) stepsInDirection++;
      }
    }

    return [x, y];
  };

  return (
    <div className="game-board">
      <div style={{ position: 'relative', width: `${boardSize}px`, height: `${boardSize}px` }}>
        {createSpiralBoard()}
        {createPlayerTokens()}
        <div
          style={{
            position: 'absolute',
            left: `${centerX - squareSize / 2}px`,
            top: `${centerY - squareSize / 2}px`,
            width: `${squareSize}px`,
            height: `${squareSize}px`,
            backgroundColor: 'gold',
            border: '2px solid black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 'bold',
            fontSize: '12px',
          }}
        >
          FINISH
        </div>
      </div>
      <div className="game-info">
        <h3>Current Player: {currentPlayer ? currentPlayer.name : 'Waiting...'}</h3>
        <h4>Current Hint: {currentHint}</h4>
        {spinResult && <h4>Spin Result: {spinResult}</h4>}
        <div className="options">
          {currentOptions.map((option, index) => (
            <button key={index} className="option-button">{option}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;