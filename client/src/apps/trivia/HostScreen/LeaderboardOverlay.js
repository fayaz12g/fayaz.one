import React, { useState } from 'react';
import { X } from 'lucide-react';
import Leaderboard from './Leaderboard';

const LeaderboardOverlay = ({ gameState, leaderboard, players }) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const buttonStyle = `
    fixed bottom-4 left-4 
    bg-blue-500 hover:bg-blue-600 
    text-white font-bold 
    py-2 px-4 
    rounded-full shadow-lg 
    z-10
  `;

  if (gameState.phase === 'lobby') return null;

  return (
    <>
      <button className='showl' onClick={() => setShowLeaderboard(true)}>📊</button>
      
      {showLeaderboard && (
        <div className="overlay">
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
            <button
              className="showl"
              onClick={() => setShowLeaderboard(false)}
            > X
            </button>
            <div>
              <Leaderboard leaderboard={leaderboard} players={players} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaderboardOverlay;