"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Song, QueueItem } from "@/types";

interface PlayerState {
  // Current playback
  currentSong: Song | null;
  queue: QueueItem[];
  queueIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;

  // Playback modes
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  crossfadeSeconds: number;

  // Context
  playingFromContext: string;
  dominantColor: string | null;

  // Actions
  setCurrentSong: (song: Song | null) => void;
  setQueue: (songs: Song[], context?: string) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  setQueueIndex: (index: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setCrossfadeSeconds: (seconds: number) => void;
  setDominantColor: (color: string | null) => void;
  playSong: (song: Song, context?: string) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSong: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      progress: 0,
      duration: 0,
      volume: 0.7,
      isMuted: false,
      shuffle: false,
      repeat: "off",
      crossfadeSeconds: 0,
      playingFromContext: "",
      dominantColor: null,

      // Set current song
      setCurrentSong: (song) => set({ currentSong: song }),

      // Set queue with songs
      setQueue: (songs, context = "") => {
        const queue: QueueItem[] = songs.map((song, index) => ({
          ...song,
          queueId: `${song.videoId}-${Date.now()}-${index}`,
        }));
        set({ queue, playingFromContext: context });
      },

      // Add to queue
      addToQueue: (song) => {
        const { queue } = get();
        const queueItem: QueueItem = {
          ...song,
          queueId: `${song.videoId}-${Date.now()}`,
        };
        set({ queue: [...queue, queueItem] });
      },

      // Remove from queue
      removeFromQueue: (index) => {
        const { queue, queueIndex } = get();
        const newQueue = queue.filter((_, i) => i !== index);
        // Adjust queue index if needed
        let newQueueIndex = queueIndex;
        if (index < queueIndex) {
          newQueueIndex = queueIndex - 1;
        } else if (index === queueIndex) {
          newQueueIndex = -1;
        }
        set({ queue: newQueue, queueIndex: newQueueIndex });
      },

      // Move queue item (drag and drop)
      moveQueueItem: (fromIndex, toIndex) => {
        const { queue } = get();
        if (fromIndex === toIndex) return;

        const newQueue = [...queue];
        const [movedItem] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, movedItem);
        set({ queue: newQueue });
      },

      // Clear queue
      clearQueue: () => set({ queue: [], queueIndex: -1 }),

      // Set queue index
      setQueueIndex: (index) => set({ queueIndex: index }),

      // Play next
      playNext: () => {
        const { queue, queueIndex, shuffle, repeat } = get();

        if (queue.length === 0) return;

        let nextIndex: number;

        if (shuffle) {
          // Random index different from current
          do {
            nextIndex = Math.floor(Math.random() * queue.length);
          } while (nextIndex === queueIndex && queue.length > 1);
        } else {
          nextIndex = queueIndex + 1;
        }

        if (nextIndex >= queue.length) {
          if (repeat === "all") {
            nextIndex = 0;
          } else {
            set({ isPlaying: false, progress: 0 });
            return;
          }
        }

        const nextSong = queue[nextIndex];
        set({
          currentSong: nextSong,
          queueIndex: nextIndex,
          isPlaying: true,
          progress: 0,
        });
      },

      // Play previous
      playPrevious: () => {
        const { queue, queueIndex, shuffle } = get();

        if (queue.length === 0) return;

        let prevIndex: number;

        if (shuffle) {
          do {
            prevIndex = Math.floor(Math.random() * queue.length);
          } while (prevIndex === queueIndex && queue.length > 1);
        } else {
          prevIndex = queueIndex - 1;
        }

        if (prevIndex < 0) {
          prevIndex = queue.length - 1;
        }

        const prevSong = queue[prevIndex];
        set({
          currentSong: prevSong,
          queueIndex: prevIndex,
          isPlaying: true,
          progress: 0,
        });
      },

      // Toggle play
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

      // Set playing state
      setIsPlaying: (playing) => set({ isPlaying: playing }),

      // Set progress
      setProgress: (progress) => set({ progress }),

      // Set duration
      setDuration: (duration) => set({ duration }),

      // Set volume
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

      // Toggle mute
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      // Toggle shuffle
      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

      // Toggle repeat
      toggleRepeat: () =>
        set((state) => ({
          repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off",
        })),

      // Set crossfade seconds
      setCrossfadeSeconds: (seconds) => set({ crossfadeSeconds: seconds }),

      // Set dominant color
      setDominantColor: (color) => set({ dominantColor: color }),

      // Play a song
      playSong: (song, context = "") => {
        set({
          currentSong: song,
          isPlaying: true,
          progress: 0,
          playingFromContext: context,
        });
      },
    }),
    {
      name: "tuniq-player",
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        shuffle: state.shuffle,
        repeat: state.repeat,
        crossfadeSeconds: state.crossfadeSeconds,
      }),
    }
  )
);
