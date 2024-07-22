import React, { useEffect, useRef, useState } from 'react';

const AudioPlayer = ({ audioSrc, loopStart = 0, loopEnd, isPlaying = true, loop = true }) => {
  const audioContextRef = useRef(null);
  const bufferRef = useRef(null);
  const sourceRef = useRef(null);
  const [userInteracted, setUserInteracted] = useState(false);

  const fetchAudioBuffer = async () => {
    const response = await fetch(audioSrc);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
    bufferRef.current = audioBuffer;
  };

  const playAudio = () => {
    const audioContext = audioContextRef.current;
    const buffer = bufferRef.current;
    if (audioContext && buffer) {
      sourceRef.current = audioContext.createBufferSource();
      sourceRef.current.buffer = buffer;
      sourceRef.current.connect(audioContext.destination);

      const startLoop = () => {
        sourceRef.current = audioContext.createBufferSource();
        sourceRef.current.buffer = buffer;
        sourceRef.current.loop = loop;
        sourceRef.current.loopStart = loopStart;
        sourceRef.current.loopEnd = loopEnd;
        sourceRef.current.connect(audioContext.destination);
        sourceRef.current.start(0, loopStart);
      };

      sourceRef.current.onended = startLoop;
      sourceRef.current.start(0);
    }
  };

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    fetchAudioBuffer();

    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      }
      audioContextRef.current.close();
    };
  }, [audioSrc]);

  useEffect(() => {
    if (isPlaying && userInteracted) {
      playAudio();
    } else if (sourceRef.current) {
      sourceRef.current.stop();
    }
  }, [isPlaying, userInteracted]);

  useEffect(() => {
    const handleInteraction = () => {
      setUserInteracted(true);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default AudioPlayer;
