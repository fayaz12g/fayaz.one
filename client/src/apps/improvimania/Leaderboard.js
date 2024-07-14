import React, { useState } from 'react';
import './Leaderboard.css';

const Leaderboard = ({
    leaderboard,
}) => {
    return (
        <div className="App">
        <h4>Leaderboard:</h4>
        <ul>
        {Object.entries(leaderboard)
          .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
          .map(([name, score]) => (
            <li key={name}>{name}: {score}</li>
          ))}
      </ul>
    </div>
);
};
export default Leaderboard;