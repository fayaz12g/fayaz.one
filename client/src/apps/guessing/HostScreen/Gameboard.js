import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Grid } from '@/components/ui/card';

const Gameboard = ({ socket, players, currentPlayer, currentSpace, cardDecks }) => {
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
      <Grid container spacing={2}>
        <Grid item xs={8}>
          {/* Placeholder for the spiral board game map */}
          <div className="board-map">
            {/* You'll need to implement the actual board rendering logic here */}
            <Typography variant="h6">Board Game Map</Typography>
          </div>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Current Player: {currentPlayer?.name}</Typography>
              <Typography variant="body1">Current Space: {currentSpace?.color}</Typography>
              {currentCard && (
                <>
                  <Typography variant="h6">Question:</Typography>
                  {[...Array(revealedHints)].map((_, index) => (
                    <Typography key={index} variant="body1">
                      Hint #{index + 1}: {currentCard[`hint${index + 1}`]}
                    </Typography>
                  ))}
                  {revealedHints < 3 && (
                    <Button onClick={revealNextHint}>Reveal Next Hint</Button>
                  )}
                  <Typography variant="h6">Answer Options:</Typography>
                  {answerOptions.map((option, index) => (
                    <Button key={index} fullWidth variant="outlined" style={{ margin: '5px 0' }}>
                      {option}
                    </Button>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Gameboard;