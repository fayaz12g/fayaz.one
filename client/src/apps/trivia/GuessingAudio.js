import React, { useEffect, useRef, useState } from 'react';

const GuessingAudio = ({ color }) => {
  const [currentAudio, setCurrentAudio] = useState(null);
  const [nextAudio, setNextAudio] = useState(null);
  const currentAudioRef = useRef(null);
  const nextAudioRef = useRef(null);
  const validColors = ['green', 'yellow', 'blue', 'red', 'pink', 'indigo', 'orange', 'violet'];

  useEffect(() => {
    const loadAudio = async (audioColor) => {
      const colorToLoad = validColors.includes(audioColor) ? audioColor : 'green';

      try {
        const audioPath = `/sound/guessing/${colorToLoad}.m4a`;
        const audio = new Audio(audioPath);
        await audio.load();
        return audio;
      } catch (error) {
        console.error(`Failed to load audio for color ${colorToLoad}:`, error);
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
      const fadeDuration = 1000; // 1 second
      const fadeInterval = 50; // Update every 50ms
      const maxDuration = 44000; // 44 seconds in milliseconds

      let fadeOutTimer;
      let fadeInTimer;

      const fadeOut = () => {
        const startTime = Date.now();
        const fadeOutStep = () => {
          const elapsedTime = Date.now() - startTime;
          const newVolume = Math.max(0, 1 - elapsedTime / fadeDuration);

          if (currentAudioRef.current) {
            currentAudioRef.current.volume = newVolume;
          }

          if (elapsedTime < fadeDuration) {
            fadeOutTimer = setTimeout(fadeOutStep, fadeInterval);
          } else {
            if (currentAudioRef.current) {
              currentAudioRef.current.pause();
              currentAudioRef.current.src = '';
            }
            setCurrentAudio(null);
          }
        };
        fadeOutStep();
      };

      const fadeIn = () => {
        const startTime = Date.now();
        nextAudio.currentTime = (currentAudioRef.current ? currentAudioRef.current.currentTime : 0) % maxDuration;
        nextAudio.volume = 0;
        nextAudio.play();

        const fadeInStep = () => {
          const elapsedTime = Date.now() - startTime;
          const newVolume = Math.min(1, elapsedTime / fadeDuration);

          if (nextAudioRef.current) {
            nextAudioRef.current.volume = newVolume;
          }

          if (elapsedTime < fadeDuration) {
            fadeInTimer = setTimeout(fadeInStep, fadeInterval);
          } else {
            setCurrentAudio(nextAudio);
            setNextAudio(null);
          }
        };
        fadeInStep();
      };

      fadeOut();
      setTimeout(fadeIn, fadeDuration); // Start fade-in after fade-out has started

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(fadeInTimer);
      };
    }
  }, [nextAudio]);

  useEffect(() => {
    const updateAudioLoop = (audio) => {
      if (audio) {
        audio.addEventListener('timeupdate', () => {
          if (audio.currentTime >= 44) {
            audio.currentTime = 0;
          }
        });
      }
    };

    updateAudioLoop(currentAudio);
    updateAudioLoop(nextAudio);
  }, [currentAudio, nextAudio]);

  return null; // This component doesn't render anything visible
};

export default GuessingAudio;
