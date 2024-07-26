import React, { useState } from 'react';
import ImprovPlayer from './improvimania/PlayerScreen';
import GuessingPlayer from './guessing/PlayerScreen';
import TriviaPlayer from './trivia/PlayerScreen';

const Players = ({
  socket,
  isEndGame,
  joinedSession,
  sessionId,
  setSessionId,
  playerName,
  setPlayerName,
  joinSession,
  gameStarted,
  setGameStarted,
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
  setLeaderboard
}) => {
  const [noName, setNoName] = useState(false);

  const [inputSessionId, setInputSessionId] = useState('');

  const handleInputChange = (e) => {
    setInputSessionId(e.target.value);
  };

  const handleJoinById = () => {
    if (inputSessionId) {
      handleJoinClick(inputSessionId);
    }
  };
  
  const handleJoinClick = (sessionIds) => {
    if (!playerName) {
      setNoName(true);
    } else {
      joinSession(sessionIds);
    }
  };

  const renderImprovPlayerScreen = () => (
    <ImprovPlayer
      socket={socket}
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

  const renderGuessingPlayerScreen = () => (
    <GuessingPlayer
      socket={socket}
      isEndGame={isEndGame}
      joinedSession={joinedSession}
      sessionId={sessionId}
      setSessionId={setSessionId}
      playerName={playerName}
      setPlayerName={setPlayerName}
      joinSession={joinSession}
      gameStarted={gameStarted}
      setGameStarted={setGameStarted}
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

  const renderTriviaPlayerScreen = () => (
    <TriviaPlayer
      socket={socket}
      isEndGame={isEndGame}
      joinedSession={joinedSession}
      sessionId={sessionId}
      setSessionId={setSessionId}
      playerName={playerName}
      setPlayerName={setPlayerName}
      joinSession={joinSession}
      gameStarted={gameStarted}
      setGameStarted={setGameStarted}
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
      setLeaderboard={setLeaderboard}
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
                sessionList.length <= 4 ? (
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
                  <div>
                    <input
                      type="text"
                      value={inputSessionId}
                      onChange={handleInputChange}
                      placeholder="Enter session ID"
                    />
                    <button
                      style={{ fontWeight: 'bold' }}
                      onClick={handleJoinById}
                    >
                      Join Session
                    </button>
                  </div>
                )
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
        renderGuessingPlayerScreen()
    ) : game === 'trivia' ? (
        renderTriviaPlayerScreen()
      ) :null}
    </div>
  );
};

export default Players;
