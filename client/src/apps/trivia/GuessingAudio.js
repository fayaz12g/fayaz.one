import React, { useEffect, useRef, useState } from 'react';

const GuessingAudio = ({ color }) => {
  const [currentAudio, setCurrentAudio] = useState(null);
  const [nextAudio, setNextAudio] = useState(null);
  const currentAudioRef = useRef(null);
  const nextAudioRef = useRef(null);

  useEffect(() => {
    const loadAudio = async (audioColor) => {
      try {
        const audioPath = `/sound/guessing/${audioColor}.m4a`;
        const audio = new Audio(audioPath);
        await audio.load();
        return audio;
      } catch (error) {
        console.error(`Failed to load audio for color ${audioColor}:`, error);
        return new Audio('/sound/guessing/green.m4a');
      }
    };

    const setupNewAudio = async () => {
      const newAudio = await loadAudio(color);
      if (currentAudio) {
        setNextAudio(newAudio);
      } else {
        setCurrentAudio(newAudio);
        newAudio.loop = true;
        newAudio.play();
      }
    };

    setupNewAudio();

    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
      if (nextAudio) {
        nextAudio.pause();
        nextAudio.src = '';
      }
    };
  }, [color]);

  useEffect(() => {
    if (currentAudio) {
      currentAudioRef.current = currentAudio;
    }
    if (nextAudio) {
      nextAudioRef.current = nextAudio;
    }
  }, [currentAudio, nextAudio]);

  useEffect(() => {
    if (nextAudio && currentAudio) {
      const fadeOutDuration = 3000; // 3 seconds
      const fadeInDuration = 3000; // 3 seconds
      const fadeInterval = 50; // Update every 50ms

      let fadeOutTimer;
      let fadeInTimer;

      const startTime = currentAudio.currentTime;
      nextAudio.currentTime = startTime;
      nextAudio.loop = true;
      nextAudio.volume = 0;
      nextAudio.play();

      const fadeOut = () => {
        const elapsedTime = Date.now() - fadeOutStartTime;
        const newVolume = Math.max(0, 1 - elapsedTime / fadeOutDuration);
        
        if (currentAudioRef.current) {
          currentAudioRef.current.volume = newVolume;
        }

        if (elapsedTime < fadeOutDuration) {
          fadeOutTimer = setTimeout(fadeOut, fadeInterval);
        } else {
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.src = '';
          }
          setCurrentAudio(null);
        }
      };

      const fadeIn = () => {
        const elapsedTime = Date.now() - fadeInStartTime;
        const newVolume = Math.min(1, elapsedTime / fadeInDuration);
        
        if (nextAudioRef.current) {
          nextAudioRef.current.volume = newVolume;
        }

        if (elapsedTime < fadeInDuration) {
          fadeInTimer = setTimeout(fadeIn, fadeInterval);
        } else {
          setCurrentAudio(nextAudio);
          setNextAudio(null);
        }
      };

      const fadeOutStartTime = Date.now();
      const fadeInStartTime = Date.now();
      fadeOut();
      fadeIn();

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(fadeInTimer);
      };
    }
  }, [nextAudio]);

  return null; // This component doesn't render anything visible
};

export default GuessingAudio;