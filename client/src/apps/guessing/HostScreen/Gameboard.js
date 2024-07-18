import React from 'react';
import { Stage, Layer, Rect, Text, Circle, Line } from 'react-konva';

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
        <Rect
          key={i}
          x={x}
          y={y}
          width={squareSize}
          height={squareSize}
          fill={colorMap[gameBoard[i]]}
          stroke="black"
          strokeWidth={1}
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
        <Circle
          key={player.socketId}
          x={x + squareSize / 2}
          y={y + squareSize / 2}
          radius={15}
          fill={player.color || `hsl(${index * 137.5}, 50%, 60%)`}
          stroke="black"
          strokeWidth={2}
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
      <Stage width={boardSize} height={boardSize}>
        <Layer>
          {createSpiralBoard()}
          {createPlayerTokens()}
          <Rect
            x={centerX - squareSize / 2}
            y={centerY - squareSize / 2}
            width={squareSize}
            height={squareSize}
            fill="gold"
            stroke="black"
            strokeWidth={2}
          />
          <Text
            x={centerX - 25}
            y={centerY - 10}
            text="FINISH"
            fontSize={12}
            fontStyle="bold"
          />
        </Layer>
      </Stage>
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