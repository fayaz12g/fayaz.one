import React, { useState } from 'react';
import { X } from 'lucide-react';
import Leaderboard from './Leaderboard';

const LeaderboardOverlay = ({ gameState, leaderboard, setLeaderboard }) => {
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
      <button
        className={buttonStyle}
        onClick={() => setShowLeaderboard(true)}
      >
        📊
      </button>
      
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowLeaderboard(false)}
            >
              <X size={24} />
            </button>
            <div className="overlay-content">
              <Leaderboard leaderboard={leaderboard} setLeaderboard={setLeaderboard} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaderboardOverlay;