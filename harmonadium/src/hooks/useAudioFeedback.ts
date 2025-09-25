'use client';

import { useRef, useCallback, useEffect } from 'react';

interface UseAudioFeedbackReturn {
  playMovementSound: () => void;
  stopMovementSound: () => void;
  continueMovementSound: () => void;
  isPlaying: boolean;
  setVideoRef: (videoElement: HTMLVideoElement | null) => void;
}

export function useAudioFeedback(): UseAudioFeedbackReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    // Initialize audio element
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/Harry Potter Theme song On Harmonium.mp3');
      audioRef.current.loop = true; // Enable looping for continuous playback
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.7; // Start at 70% volume
      
      // Add error handling
      audioRef.current.onerror = (e) => {
        console.warn('Audio failed to load:', e);
      };

      audioRef.current.onloadeddata = () => {
        console.log('✅ Audio loaded successfully');
      };
    }

    return () => {
      // Cleanup
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const setVideoRef = useCallback((videoElement: HTMLVideoElement | null) => {
    videoRef.current = videoElement;
    if (videoElement) {
      console.log('🎥 Video element connected to audio hook');
    }
  }, []);

  const fadeOut = useCallback(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const video = videoRef.current;
    const initialVolume = audio.volume;
    const fadeSteps = 10; // Number of fade steps  
    const fadeInterval = 100; // ms between each step
    const volumeStep = initialVolume / fadeSteps;

    let currentStep = 0;

    const fadeInterval_id = setInterval(() => {
      currentStep++;
      const newVolume = Math.max(0, initialVolume - (volumeStep * currentStep));
      audio.volume = newVolume;

      if (currentStep >= fadeSteps || newVolume <= 0) {
        clearInterval(fadeInterval_id);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.7; // Reset volume for next play
        
        // Pause video when audio stops
        if (video && !video.paused) {
          video.pause();
          console.log('🎥 Video paused (audio fade complete)');
        }
        
        isPlayingRef.current = false;
        console.log('🔇 Audio faded out and stopped');
      }
    }, fadeInterval);

    fadeTimeoutRef.current = setTimeout(() => {
      clearInterval(fadeInterval_id);
    }, fadeSteps * fadeInterval + 100);
  }, []);

  const playMovementSound = useCallback(() => {
    if (!audioRef.current) {
      console.warn('Audio not initialized');
      return;
    }

    const audio = audioRef.current;
    const video = videoRef.current;

    // Clear any existing fade/stop timeouts (movement detected, cancel stopping)
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    // If already playing, just reset volume and continue (no restart)
    if (isPlayingRef.current && !audio.paused) {
      audio.volume = 0.7; // Ensure volume is at full
      console.log('🎵 Movement detected - continuing audio playback');
      
      // Ensure video is also playing
      if (video && video.paused) {
        video.play().catch((error) => {
          console.warn('Video play failed:', error);
        });
      }
      return;
    }

    // Start fresh playback if not playing
    audio.volume = 0.7;
    audio.currentTime = 0; // Start from beginning
    isPlayingRef.current = true;

    // Start audio
    audio.play().then(() => {
      console.log('🎵 Audio started playing (new movement)');
      
      // Start video playback when audio starts
      if (video) {
        video.currentTime = 0; // Reset video to start
        video.play().then(() => {
          console.log('🎥 Video started playing (synced with audio)');
        }).catch((error) => {
          console.warn('Video play failed:', error);
        });
      }
    }).catch((error) => {
      console.warn('Audio play failed:', error);
      isPlayingRef.current = false;
    });
  }, []);

  const continueMovementSound = useCallback(() => {
    if (!audioRef.current) return;

    // Clear any pending fade/stop timeouts (movement continues)
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    // Ensure audio continues at full volume
    if (isPlayingRef.current) {
      audioRef.current.volume = 0.7;
      console.log('🎵 Movement continues - maintaining audio');
    }
  }, []);

  const stopMovementSound = useCallback(() => {
    if (!audioRef.current) return;

    // Clear any existing timeouts
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    // Start 3-second timeout to fade out audio (movement stopped)
    console.log('🔇 Movement stopped - starting 3 second fade timeout');
    stopTimeoutRef.current = setTimeout(() => {
      console.log('🔇 3 seconds passed - fading out audio');
      fadeOut();
    }, 3000); // 3 second delay before fade
  }, [fadeOut]);

  return {
    playMovementSound,
    stopMovementSound,
    continueMovementSound,
    isPlaying: isPlayingRef.current,
    setVideoRef,
  };
}
