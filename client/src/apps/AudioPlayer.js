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

  const playAudio = (start, end) => {
    const audioContext = audioContextRef.current;
    const buffer = bufferRef.current;
    if (audioContext && buffer) {
      sourceRef.current = audioContext.createBufferSource();
      sourceRef.current.buffer = buffer;
      sourceRef.current.connect(audioContext.destination);

      sourceRef.current.loop = loop;
      sourceRef.current.loopStart = loopStart;
      sourceRef.current.loopEnd = loopEnd;

      const duration = end ? end - start : undefined;
      sourceRef.current.start(0, start, duration);

      sourceRef.current.onended = () => {
        if (isPlaying && loop) {
          playAudio(loopStart, loopEnd);
        }
      };
    }
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.stop(0);
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
  };

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    fetchAudioBuffer();

    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioSrc]);

  useEffect(() => {
    if (isPlaying && userInteracted) {
      stopAudio(); // Stop any currently playing audio
      playAudio(loopStart, loopEnd);
    } else {
      stopAudio();
    }
  }, [isPlaying, userInteracted, loopStart, loopEnd, audioSrc]);

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