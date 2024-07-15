import React, { useState } from 'react';
import ImprovPlayer from './improvimania/PlayerScreen';

const Players = ({
  isEndGame,
  joinedSession,
  sessionId,
  setSessionId,
  playerName,
  setPlayerName,
  joinSession,
  gameStarted,
  players,
  playerRole,
  isEndScene,
  currentLine,
  isSpeaker,
  nextLine,
  guessAdlibber,
  sessionList,
  leaderboard,
  kicked,
  titleTheme,
  BackgroundMusic,
  speakingTheme,
  guessingTheme,
  sentGuess,
  game,
}) => {
  const [noName, setNoName] = useState(false);

  const handleJoinClick = (sessionIds) => {
    if (!playerName) {
      setNoName(true);
    } else {
      joinSession(sessionIds);
    }
  };

  const renderImprovPlayerScreen = () => (
    <ImprovPlayer
      isEndGame={isEndGame}
      joinedSession={joinedSession}
      sessionId={sessionId}
      setSessionId={setSessionId}
      playerName={playerName}
      setPlayerName={setPlayerName}
      joinSession={joinSession}
      gameStarted={gameStarted}
      players={players}
      playerRole={playerRole}
      isEndScene={isEndScene}
      currentLine={currentLine}
      isSpeaker={isSpeaker}
      nextLine={nextLine}
      guessAdlibber={guessAdlibber}
      sessionList={sessionList}
      leaderboard={leaderboard}
      kicked={kicked}
      titleTheme={titleTheme}
      Audio={Audio}
      speakingTheme={speakingTheme}
      guessingTheme={guessingTheme}
      sentGuess={sentGuess}
      game={game}
    />
  );

  return (
    <div>
      {!game ? (
        <>
          <div className="App">
            {sessionList.length > 0 && <h2>Join a Game</h2>}
            {sessionList.length > 0 && (
              <div>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Your Name"
                />
              </div>
            )}
            <div>
              {Array.isArray(sessionList) && sessionList.length > 0 ? (
                sessionList.map((sessionIds) => (
                  <button
                    style={{ fontWeight: 'bold' }}
                    key={sessionIds}
                    onClick={() => handleJoinClick(sessionIds)}
                  >
                    {sessionList.length === 1 ? (
                      "Join Session"
                    ) : (
                      <>
                        Join Session <br />
                        {sessionIds}
                      </>
                    )}
                  </button>
                ))
              ) : (
                <p>No active sessions available.</p>
              )}
            </div>
            {noName && (
              <p style={{ color: 'red' }}>
                First enter a name to join Session {sessionId}
              </p>
            )}
          </div>
        </>
      ) : game === 'improv' ? (
        renderImprovPlayerScreen()
      ) : game === 'guessing' ? (
        <div>Coming Soon</div>
    ) : game === 'soon' ? (
        <div>Coming Soon</div>
      ) :null}
    </div>
  );
};

export default Players;
