import React, { useEffect, useRef } from 'react';

const AudioPlayer = ({ audioSrc, loopStart, loopEnd, isPlaying = true, loop = true }) => {
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const hasPlayedOnceRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    const playAudio = () => {
      if (!isPlayingRef.current && isPlaying && (!hasPlayedOnceRef.current || loop)) {
        audio.play();
        isPlayingRef.current = true;
        hasPlayedOnceRef.current = true;
      }
    };

    const handleTimeUpdate = () => {
      if (loopStart !== undefined && loopEnd !== undefined && audio.currentTime >= loopEnd) {
        audio.currentTime = loopStart;
      }
    };

    const handleEnded = () => {
      if (loop) {
        audio.currentTime = loopStart !== undefined ? loopStart : 0;
        if (isPlaying) {
          audio.play();
        }
      } else {
        isPlayingRef.current = false;
      }
    };

    const handleLoadedMetadata = () => {
      if (loopStart === undefined) audio.loopStart = 0;
      if (loopEnd === undefined) audio.loopEnd = audio.duration;
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
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying && (!hasPlayedOnceRef.current || loop)) {
        audio.play().catch(error => console.error("Error playing audio:", error));
        isPlayingRef.current = true;
        hasPlayedOnceRef.current = true;
      } else {
        audio.pause();
        isPlayingRef.current = false;
      }
    }
  }, [isPlaying, loop]);

  useEffect(() => {
    if (!isPlaying) {
      hasPlayedOnceRef.current = false;
    }
  }, [isPlaying]);

  return null; // This component doesn't render anything
};

export default AudioPlayer;