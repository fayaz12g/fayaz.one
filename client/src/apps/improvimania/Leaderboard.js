import React from 'react';
import './Leaderboard.css';

const Leaderboard = ({ leaderboard, players }) => {
  // Combine leaderboard and players to ensure all players are included
  const combinedLeaderboard = players.reduce((acc, player) => {
    acc[player.name] = leaderboard[player.name] || 0;
    return acc;
  }, {});

  return (
    <div className="App">
      <h4>Leaderboard:</h4>
      <ul>
        {Object.entries(combinedLeaderboard)
          .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
          .map(([name, score]) => (
            <li key={name}>{name}: {score}</li>
          ))}
      </ul>
    </div>
  );
};

export default Leaderboard;