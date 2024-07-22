import React, { useEffect, useRef, useState } from 'react';

const AudioPlayer = ({ audioSrc, loopStart, loopEnd, isPlaying = true, loop = true }) => {
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const hasPlayedOnceRef = useRef(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const playAudio = () => {
    const audio = audioRef.current;
    if (audio && !isPlayingRef.current && isPlaying && (!hasPlayedOnceRef.current || loop) && userInteracted) {
      audio.play().then(() => {
        isPlayingRef.current = true;
        hasPlayedOnceRef.current = true;
      }).catch(error => {
        console.error("Error playing audio:", error);
        // Retry after a short delay
        setTimeout(playAudio, 1000);
      });
    }
  };

  useEffect(() => {
    const handleInteraction = () => {
      setUserInteracted(true);
      // Remove the event listeners once interaction has occurred
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

  useEffect(() => {
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (loopStart !== undefined && loopEnd !== undefined && audio.currentTime >= loopEnd) {
        audio.currentTime = loopStart;
      }
    };

    const handleEnded = () => {
      if (loop) {
        audio.currentTime = loopStart !== undefined ? loopStart : 0;
        if (isPlaying) {
          playAudio();
        }
      } else {
        isPlayingRef.current = false;
      }
    };

    const handleLoadedMetadata = () => {
      if (loopStart === undefined) audio.loopStart = 0;
      if (loopEnd === undefined) audio.loopEnd = audio.duration;
      if (isPlaying) {
        playAudio();
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Preload the audio
    audio.preload = 'auto';
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audioSrc, loopStart, loopEnd, isPlaying, loop]);

  useEffect(() => {
    if (isPlaying && userInteracted) {
      playAudio();
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        isPlayingRef.current = false;
      }
    }
  }, [isPlaying, loop, userInteracted]);

  useEffect(() => {
    if (!isPlaying) {
      hasPlayedOnceRef.current = false;
    }
  }, [isPlaying]);

  return null; // This component doesn't render anything
};

export default AudioPlayer;