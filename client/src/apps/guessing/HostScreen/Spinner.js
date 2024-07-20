import React, { useState, useEffect } from 'react';
import './Spinner.css'; 

const Spinner = ({ onSpinComplete, disabled }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);

  const spin = () => {
    if (disabled) return;
    setSpinning(true);
    const newRotation = rotation + 720 + Math.floor(Math.random() * 360);
    setRotation(newRotation);
    
    setTimeout(() => {
      const spinResult = Math.floor(Math.random() * 6) + 1;
      setResult(spinResult);
      setSpinning(false);
      onSpinComplete(spinResult);
    }, 3000); 
  };

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
      <button onClick={spin} disabled={spinning || disabled} className="spin-button">
        {spinning ? 'Spinning...' : 'Spin'}
      </button>
      {result && <p className="spin-result">You spun: {result}</p>}
    </div>
  );
};

export default Spinner;