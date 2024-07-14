import React, { useEffect, useState, useMemo } from "react";
import { useSpring, animated, config } from "react-spring";
import styled, { keyframes } from "styled-components";
import "./AnimatedStyle.css";
import eyes from "../image/improvimania/eyes/eyes.png";
import eyesLeft from "../image/improvimania/eyes/eyesleft.png";
import eyesRight from "../image/improvimania/eyes/eyesright.png";
import discoBall from "../image/improvimania/disco.png";

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
`;

const colors = [
  'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet',
  'cyan', 'magenta', 'lime', 'pink', 'teal', 'lavender', 'brown'
];

const TitleChar = styled(animated.span)`
  display: inline-block;
  margin: 0 1px;
  font-family: 'Alloy Ink', 'Patrick Hand', 'Comic Sans MS', cursive, sans-serif;
  font-size: ${props => props.char === 'i' ? '2rem' : '6rem'};
  position: relative;
  animation: ${(props) => (props.bounce ? bounce : "none")} 1s infinite;
  z-index: 1; 

  @media (min-width: 320px) and (max-width: 480px) {
    font-size: ${props => props.char === 'i' ? '3rem' : '2rem'};
  }
  
  @media (min-width: 481px) and (max-width: 768px) {
    font-size: ${props => props.char === 'i' ? '4rem' : '3rem'};
  }
  
  @media (min-width: 769px) and (max-width: 1024px) {
    font-size: ${props => props.char === 'i' ? '3rem' : '4rem'};
  }
  
  @media (min-width: 1025px) {
    font-size: ${props => props.char === 'i' ? '3rem' : '5rem'};
  }

  /* 3D Gradient effect */
  color: ${props => props.color};
  text-shadow: 
    2px 2px 0px rgba(0,0,0,0.1),
    -2px -2px 0px rgba(255,255,255,0.3);
  background: linear-gradient(135deg, 
    ${props => props.color} 0%,
    ${props => props.color} 45%,
    ${props => lightenColor(props.color, 30, props.partyMode)} 95%, 
    ${props => props.color} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 1px rgba(0,0,0,0.1);
`;

// Helper function to lighten a color
const lightenColor = (color, percent, lighten = true) => {
  if (!lighten) {
    return color; // Return original color if lighten is false
  }

  const num = parseInt(color.replace("#",""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
  return `#${(0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1)}`;
};

const EyeImage = styled.img`
  width: 40px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -80%);
  z-index: 2;
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
`;

const DiscoBall = styled.img`
  width: 20px;
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
`;

const TitleContainer = styled.div`
  text-align: center;
  position: relative;
  white-space: nowrap;
  padding: 40px 0; // Increased vertical padding
  margin: 0;
  overflow: visible;
`;

const AnimatedTitleWrapper = styled.div`
  position: relative;
  display: inline-block; // Changed from block to inline-block
  padding: 0 20px; // Added horizontal padding
`;


const TitleScreen = ({ title = "IMPROViMANIA" }) => {
  const [bouncingLetters, setBouncingLetters] = useState(new Set());
  const [showEyes, setShowEyes] = useState(false);
  const [eyePosition, setEyePosition] = useState(eyes);
  const [initialAnimationComplete, setInitialAnimationComplete] = useState(false);
  const [partyMode, setPartyMode] = useState(false);

  const togglePartyMode = () => {
    const body = document.body;
    setPartyMode(!partyMode)
    if (partyMode) {
      // For body.dark
      body.classList.add('party-mode');
      // For body::before and body::after
      body.style.setProperty('--background-size', '20px 2px');
      body.style.setProperty('--animation-duration', '1s, 999s');
    } else {
      // Remove party mode classes and styles
      body.classList.remove('party-mode');
      body.style.removeProperty('--background-size');
      body.style.removeProperty('--animation-duration');
    }
  };

  const getRandomInt = (max) => Math.floor(Math.random() * max);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialAnimationComplete(true);
    }, title.length * 100 + 500);

    const bounceInterval = setInterval(() => {
      const newSet = new Set();
      newSet.add(getRandomInt(title.length));
      setBouncingLetters(newSet);
    }, 2000);

    const eyesInterval = setInterval(() => {
      setShowEyes(true);
      setEyePosition(eyes);
      setTimeout(() => {
        setEyePosition(eyesLeft);
        setTimeout(() => {
          setEyePosition(eyesRight);
          setTimeout(() => {
            setShowEyes(false);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(bounceInterval);
      clearInterval(eyesInterval);
    };
  }, [title]);


  const AnimatedLetter = ({ char, index, color, shade, bounce }) => {
    const springProps = useSpring({
      from: { transform: "scale(0) rotate(-180deg)" },
      to: { transform: "scale(1) rotate(0deg)" },
      config: config.wobbly,
      delay: index * 100,
      reset: !initialAnimationComplete,
      reverse: initialAnimationComplete,
    });

    return (
      <TitleChar
        style={initialAnimationComplete ? {} : springProps}
        color={color}
        shade={shade}
        bounce={bounce}
      >
        {char}
        {char === 'O' && (
          <EyeImage src={eyePosition} alt="Eyes" show={showEyes} />
        )}
        {char === 'i' && index === 6 && (
          <DiscoBall 
            src={discoBall} 
            alt="Disco Ball" 
            onClick={() => togglePartyMode()}
          />
        )}
      </TitleChar>
    );
  };

  const animatedTitle = useMemo(() => {
    return title.split('').map((char, index) => {
      const isBouncing = bouncingLetters.has(index);
      const gradientColors = {
        color: partyMode ? colors[getRandomInt(colors.length)] : colors[index % colors.length],
        shade: `${colors[index % colors.length]}80`
      };

      return (
        <AnimatedLetter
          key={index}
          char={char}
          index={index}
          {...gradientColors}
          bounce={isBouncing}
        />
      );
    });
  }, [bouncingLetters, initialAnimationComplete, partyMode, title]);

  return (
    <TitleContainer>
      <AnimatedTitleWrapper>
        <div className="animatedTitle">{animatedTitle}</div>
      </AnimatedTitleWrapper>
    </TitleContainer>
  );
};

const AnimatedTitle = ({ title = "IMPROViMANIA" }) => {
  return (
    <div className="AnimatedTitle">
      <TitleScreen title={title} />
    </div>
  );
};

export default AnimatedTitle;