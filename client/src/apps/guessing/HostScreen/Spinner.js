import React, { useState, useEffect } from 'react';
import './Spinner.css';

const Spinner = ({ onSpinComplete, disabled, result }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const spin = () => {
    if (disabled) return;
    setSpinning(true);
    const newRotation = rotation + 720 + Math.floor(Math.random() * 360);
    setRotation(newRotation);
    
    setTimeout(() => {
      const spinResult = result || Math.floor(Math.random() * 6) + 1;
      setSpinning(false);
      onSpinComplete(spinResult);
    }, 3000);
  };

  useEffect(() => {
    if (result) {
      // If a result is provided, set the spinner to that position
      const newRotation = (result - 1) * 60 + 30; // 60 degrees per section, 30 degrees offset
      setRotation(newRotation);
    }
  }, [result]);

  return (
    <div className="spinner-container">
      <div 
        className={`spinner ${spinning ? 'spinning' : ''}`} 
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div key={num} className="spinner-section">
            {num}
          </div>
        ))}
        <div className="spinner-arrow"></div>
      </div>
      {!spinning && !disabled && <button onClick={spin} className="spin-button">
        {spinning ? 'Spinning...' : 'Spin'}
      </button>}
      {result && <p className="spin-result">You spun: {result}</p>}
    </div>
  );
};

export default Spinner;