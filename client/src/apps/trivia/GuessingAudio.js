import React, { useEffect, useRef, useState } from 'react';

const GuessingAudio = ({ color }) => {
  const [audioContext] = useState(() => new (window.AudioContext || window.webkitAudioContext)());
  const sourceRef = useRef(null);
  const gainNodeRef = useRef(null);
  const currentColorRef = useRef(null);
  const validColors = ['green', 'yellow', 'blue', 'red', 'pink', 'indigo', 'orange', 'violet'];

  useEffect(() => {
    const loadAndPlayAudio = async (audioColor) => {
      const colorToLoad = validColors.includes(audioColor) ? audioColor : 'green';
      const audioPath = `/sound/guessing/${colorToLoad}.m4a`;

      try {
        const response = await fetch(audioPath);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        if (sourceRef.current) {
          sourceRef.current.stop();
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);

        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        source.start();
        gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 3);

        sourceRef.current = source;
        gainNodeRef.current = gainNode;
        currentColorRef.current = audioColor;

      } catch (error) {
        console.error(`Failed to load audio for color ${colorToLoad}:`, error);
      }
    };

    if (color !== currentColorRef.current) {
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContext.currentTime + 3);
        setTimeout(() => {
          if (sourceRef.current) {
            sourceRef.current.stop();
          }
          loadAndPlayAudio(color);
        }, 3000);
      } else {
        loadAndPlayAudio(color);
      }
    }

    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
    };
  }, [color, audioContext]);

  return null;
};

export default GuessingAudio;