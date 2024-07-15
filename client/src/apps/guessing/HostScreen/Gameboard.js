import React, { useState, useEffect } from 'react';

const GameBoard = ({ socket, players, currentPlayer, currentSpace, cardDecks }) => {
  const [currentCard, setCurrentCard] = useState(null);
  const [revealedHints, setRevealedHints] = useState(1);
  const [answerOptions, setAnswerOptions] = useState([]);

  useEffect(() => {
    if (currentSpace) {
      const deck = cardDecks[currentSpace.color];
      const randomCard = deck[Math.floor(Math.random() * deck.length)];
      setCurrentCard(randomCard);
      setRevealedHints(1);
      generateAnswerOptions(randomCard, deck);
    }
  }, [currentSpace, cardDecks]);

  const generateAnswerOptions = (correctCard, deck) => {
    const options = [correctCard.answer];
    while (options.length < 4) {
      const randomCard = deck[Math.floor(Math.random() * deck.length)];
      if (!options.includes(randomCard.answer)) {
        options.push(randomCard.answer);
      }
    }
    setAnswerOptions(shuffleArray(options));
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const revealNextHint = () => {
    if (revealedHints < 3) {
      setRevealedHints(revealedHints + 1);
      socket.emit('revealHint', { hintNumber: revealedHints + 1 });
    }
  };

  return (
    <div className="game-board">
    </div>
  );
};

export default GameBoard;