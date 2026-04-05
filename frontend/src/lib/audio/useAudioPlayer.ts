"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { audioEngine } from "./audioEngine";
import { Song } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useAudioPlayer() {
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    repeat,
    setIsPlaying,
    setProgress,
    setDuration,
    playNext,
    setVolume: setStoreVolume,
  } = usePlayerStore();

  const cleanupRef = useRef<(() => void)[]>([]);

  // Initialize audio engine listeners
  useEffect(() => {
    // Listen for ended
    const unsubscribeEnded = audioEngine.onEnded(() => {
      if (repeat === "one" && currentSong) {
        // Replay current song
        audioEngine.seek(0);
        audioEngine.play();
      } else {
        playNext();
      }
    });

    // Listen for progress
    const unsubscribeProgress = audioEngine.onProgress((currentTime, duration) => {
      setProgress(currentTime);
      if (duration > 0) {
        setDuration(duration);
      }
    });

    // Listen for play/pause
    const unsubscribePlay = audioEngine.onPlay(() => setIsPlaying(true));
    const unsubscribePause = audioEngine.onPause(() => setIsPlaying(false));

    cleanupRef.current = [
      unsubscribeEnded,
      unsubscribeProgress,
      unsubscribePlay,
      unsubscribePause,
    ];

    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
    };
  }, [repeat, currentSong, playNext, setIsPlaying, setProgress, setDuration]);

  // Handle song changes
  useEffect(() => {
    if (currentSong) {
      loadAndPlay(currentSong);
    }
  }, [currentSong?.videoId]);

  // Handle play/pause changes
  useEffect(() => {
    if (isPlaying) {
      audioEngine.play();
    } else {
      audioEngine.pause();
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  // Handle mute changes
  useEffect(() => {
    audioEngine.setMuted(isMuted);
  }, [isMuted]);

  const loadAndPlay = useCallback(async (song: Song) => {
    try {
      const streamUrl = `${API_BASE_URL}/api/stream/${song.videoId}`;
      await audioEngine.load(song, streamUrl);
      if (isPlaying) {
        await audioEngine.play();
      }
    } catch (error) {
      console.error("Failed to load song:", error);
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    audioEngine.seek(time);
  }, []);

  const seekBy = useCallback((delta: number) => {
    audioEngine.seekBy(delta);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setStoreVolume(vol);
    audioEngine.setVolume(vol);
  }, [setStoreVolume]);

  const getWaveformData = useCallback(() => {
    return audioEngine.getAnalyserData();
  }, []);

  return {
    seek,
    seekBy,
    setVolume,
    getWaveformData,
    currentTime: audioEngine.getCurrentTime(),
    duration: audioEngine.getDuration(),
  };
}
