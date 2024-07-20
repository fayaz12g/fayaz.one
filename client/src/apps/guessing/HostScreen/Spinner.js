import React, { useState } from 'react';

const Spinner = ({ onSpinComplete }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);

  const spin = () => {
    setSpinning(true);
    setTimeout(() => {
      const spinResult = Math.floor(Math.random() * 6) + 1;
      setResult(spinResult);
      setSpinning(false);
      onSpinComplete(spinResult);
    }, 2000); // Simulate spinning for 2 seconds
  };

  return (
    <div className="spinner">
      <button onClick={spin} disabled={spinning}>
        {spinning ? 'Spinning...' : 'Spin'}
      </button>
      {result && <p>Result: {result}</p>}
    </div>
  );
};

export default Spinner;