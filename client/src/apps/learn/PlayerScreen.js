import React, { useState, useEffect } from 'react';
import LeaderboardOverlay from './HostScreen/LeaderboardOverlay';

const PlayerScreen = ({
  socket,
  sessionId,
  playerName,
  setLeaderboard,
  leaderboard,
  players,
}) => {
  const [gameState, setGameState] = useState({
    phase: 'lobby',
    currentQuestion: null,
    isMyTurn: false,
    isJudge: false,
    color: null,
    answer: null,
    buzzer: null,
    needBuzz: true,
    buzzedIn: false,
    someoneElse: false,
  });

  const handleMakeGuessClick = () => {
    socket.emit('buzzInLearn', sessionId);
    setGameState(prevState => ({
      ...prevState,
      buzzedIn: true,
    }));
  };

  const submitJudgeDecision = (correct) => {
    socket.emit('judgeDecisionLearn', correct, sessionId);
  };

  useEffect(() => {
    socket.on('gameStartedLearn', (categories, logos) => {
      setGameState(prevState => ({
        ...prevState,
        phase: 'game',
      }));
      console.log("The game started!");
    });

    socket.on('yourTurnLearn', (question) => {
      setGameState(prevState => ({
        ...prevState,
        phase: 'question',
        currentQuestion: question,
        isMyTurn: true,
        isJudge: false,
        buzzer: null, // Reset buzzer for a new turn
        needBuzz: false,
      }));      
      console.log("It is my turn! The hint is ", question);
    });

    socket.on('youCanBuzzLearn', (question) => {
      setGameState(prevState => ({
        ...prevState,
        phase: 'question',
        currentQuestion: question,
        isMyTurn: true,
        isJudge: false,
        buzzer: null, // Reset buzzer for a new turn
        needBuzz: true,
      }));      
      console.log("It is my turn! The hint is ", question);
    });

    socket.on('judgingLearn', (question) => {
      setGameState(prevState => ({
        ...prevState,
        phase: 'judging',
        currentQuestion: question,
        isMyTurn: false,
        isJudge: true,
      }));
      console.log("I am the judge! The hint is ", question.hint);
    });

    socket.on('playerBuzzedInLearn', ({ name }) => {
      setGameState(prevState => ({
        ...prevState,
        buzzer: name,
        isMyTurn: false,
        someoneElse: true,
      }));
      console.log(`${name} buzzed in!`);
    });

    socket.on('correctAnswerLearn', ({ answer }) => {
      setGameState(prevState => ({
        ...prevState,
        phase: 'waiting',
        isMyTurn: false,
        isJudge: false,
        color: null,
        answer: answer,
      }));
    });

    socket.on('incorrectAnswerLearn', ({ answer }) => {
      setGameState(prevState => ({
        ...prevState,
        phase: 'waiting',
        isMyTurn: false,
        isJudge: false,
        color: null,
        answer: answer,
      }));
    });

    socket.on('updatePointsLearn', ({ points }) => {
      setLeaderboard(prevLeaderboard => ({
        ...prevLeaderboard,
        ...points,
      }));
    });

    socket.on('updateLeaderboardLearn', (leaderboard) => {
      setLeaderboard(leaderboard);
      setGameState(prevState => ({
        ...prevState,
        buzzedIn: false,
        someoneElse: false,
        buzzer: null,
      }));
    });

    return () => {
      console.log('PlayerScreen unmounting');
    };
  }, [socket, setLeaderboard]);

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'waiting':
        return <h2>Waiting for the next question...</h2>;
      case 'question':
        return (
          <div>
            <h4 style={{ fontSize: '2rem' }}>{gameState.currentQuestion.deckName}</h4>
            <p style={{ fontSize: '2rem' }}>{gameState.currentQuestion.hint}</p>
            {gameState.someoneElse && <p>{gameState.buzzer} buzzed in!</p>}
            {gameState.isMyTurn && !gameState.buzzedIn && (
              <button style={{ fontSize: '2rem' }} onClick={handleMakeGuessClick}>Buzz in and Answer</button>
            )}
          </div>
        );
      case 'judging':
        return (
          <div>
            <h4 style={{ fontSize: '2rem' }}>{gameState.currentQuestion.deckName}</h4>
            <p style={{ fontSize: '2rem' }}>{gameState.currentQuestion.hint}</p>
            <p style={{ fontSize: '1rem' }}><strong>Answer:</strong> {gameState.currentQuestion.answer}</p>
            {gameState.buzzer && (
              <div>
                <p style={{ fontSize: '1rem' }}>{gameState.buzzer} buzzed in! Is the answer correct?</p>
                <button style={{ fontSize: '1rem' }} onClick={() => submitJudgeDecision(true)}>Correct</button>
                <button style={{ fontSize: '1rem' }} onClick={() => submitJudgeDecision(false)}>Incorrect</button>
              </div>
            )}
          </div>
        );
      case 'game':
        return <h2>The game is on! Waiting for the next turn...</h2>;
      default:
        return (
          <div>
            <h2>Welcome, {playerName}!</h2>
            <h4>Waiting for the host to start the game...</h4>
          </div>
        );
    }
  };

  return (
    <div className="App" style={{ backgroundColor: gameState.color }}>
      {renderGameContent()}
      <LeaderboardOverlay
        gameState={gameState}
        leaderboard={leaderboard}
        players={players}
      />
    </div>
  );
};

export default PlayerScreen;
