"use client";

import { Song } from "@/types";

type AudioEventCallback = () => void;
type ProgressCallback = (currentTime: number, duration: number) => void;
type ErrorCallback = (error: Error) => void;

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private crossfadeAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private crossfadeGainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Event callbacks
  private onEndedCallbacks: AudioEventCallback[] = [];
  private onPlayCallbacks: AudioEventCallback[] = [];
  private onPauseCallbacks: AudioEventCallback[] = [];
  private onProgressCallbacks: ProgressCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];

  // State
  private currentSong: Song | null = null;
  private isPlaying = false;
  private crossfadeDuration = 0;
  private progressInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initAudio();
    }
  }

  private initAudio() {
    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
    this.audio.preload = "auto";

    // Set up event listeners
    this.audio.addEventListener("ended", () => this.handleEnded());
    this.audio.addEventListener("play", () => this.handlePlay());
    this.audio.addEventListener("pause", () => this.handlePause());
    this.audio.addEventListener("error", (e) => this.handleError(e));
    this.audio.addEventListener("loadedmetadata", () => this.handleLoadedMetadata());

    // Start progress tracking
    this.startProgressTracking();
  }

  private initAudioContext() {
    if (!this.audioContext && typeof window !== "undefined") {
      try {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        // Create analyser for waveform visualization
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;

        // Create gain nodes
        this.gainNode = this.audioContext.createGain();
        this.crossfadeGainNode = this.audioContext.createGain();

        // Connect audio element to context
        if (this.audio) {
          const source = this.audioContext.createMediaElementSource(this.audio);
          source.connect(this.gainNode);
          this.gainNode.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
        }
      } catch (error) {
        console.error("Failed to initialize AudioContext:", error);
      }
    }
  }

  // Getters
  getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  getDuration(): number {
    return this.audio?.duration || 0;
  }

  getVolume(): number {
    return this.audio?.volume || 1;
  }

  getAnalyserData(): Uint8Array | null {
    if (!this.analyser) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // Playback controls
  async load(song: Song, streamUrl: string): Promise<void> {
    this.currentSong = song;

    if (!this.audio) {
      this.initAudio();
    }

    // Initialize audio context on user interaction
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume();
    }

    this.audio!.src = streamUrl;
    this.audio!.load();
  }

  async play(): Promise<void> {
    if (!this.audio) return;

    // Initialize audio context if needed
    this.initAudioContext();
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume();
    }

    try {
      await this.audio.play();
      this.isPlaying = true;
    } catch (error) {
      console.error("Failed to play:", error);
      this.onErrorCallbacks.forEach((cb) => cb(error as Error));
    }
  }

  pause(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.isPlaying = false;
  }

  toggle(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(time: number): void {
    if (!this.audio) return;
    this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
  }

  seekBy(delta: number): void {
    if (!this.audio) return;
    this.seek(this.audio.currentTime + delta);
  }

  setVolume(volume: number): void {
    if (!this.audio) return;
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.audio.volume = clampedVolume;

    // Also update gain node if using Web Audio API
    if (this.gainNode) {
      this.gainNode.gain.value = clampedVolume;
    }
  }

  setMuted(muted: boolean): void {
    if (!this.audio) return;
    this.audio.muted = muted;
  }

  // Crossfade
  async startCrossfade(nextStreamUrl: string, duration: number): Promise<void> {
    if (!this.audioContext || !this.gainNode || !this.crossfadeGainNode) return;

    this.crossfadeDuration = duration;

    // Create crossfade audio element
    this.crossfadeAudio = new Audio(nextStreamUrl);
    this.crossfadeAudio.crossOrigin = "anonymous";

    const source = this.audioContext.createMediaElementSource(this.crossfadeAudio);
    source.connect(this.crossfadeGainNode);
    this.crossfadeGainNode.connect(this.audioContext.destination);

    // Start crossfade
    const now = this.audioContext.currentTime;
    this.gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    this.crossfadeGainNode.gain.setValueAtTime(0.01, now);
    this.crossfadeGainNode.gain.exponentialRampToValueAtTime(1, now + duration);

    await this.crossfadeAudio.play();

    // Swap after crossfade
    setTimeout(() => {
      if (this.audio && this.crossfadeAudio) {
        this.audio.pause();
        this.audio.src = "";
        this.audio = this.crossfadeAudio;
        this.crossfadeAudio = null;
      }
    }, duration * 1000);
  }

  // Event handlers
  private handleEnded(): void {
    this.isPlaying = false;
    this.onEndedCallbacks.forEach((cb) => cb());
  }

  private handlePlay(): void {
    this.isPlaying = true;
    this.onPlayCallbacks.forEach((cb) => cb());
  }

  private handlePause(): void {
    this.isPlaying = false;
    this.onPauseCallbacks.forEach((cb) => cb());
  }

  private handleError(event: ErrorEvent): void {
    const error = new Error(`Audio error: ${event.message}`);
    this.onErrorCallbacks.forEach((cb) => cb(error));
  }

  private handleLoadedMetadata(): void {
    // Metadata loaded, ready to play
  }

  private startProgressTracking(): void {
    this.progressInterval = setInterval(() => {
      if (this.audio && this.isPlaying) {
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration || 0;
        this.onProgressCallbacks.forEach((cb) => cb(currentTime, duration));
      }
    }, 100);
  }

  // Event subscription
  onEnded(callback: AudioEventCallback): () => void {
    this.onEndedCallbacks.push(callback);
    return () => {
      this.onEndedCallbacks = this.onEndedCallbacks.filter((cb) => cb !== callback);
    };
  }

  onPlay(callback: AudioEventCallback): () => void {
    this.onPlayCallbacks.push(callback);
    return () => {
      this.onPlayCallbacks = this.onPlayCallbacks.filter((cb) => cb !== callback);
    };
  }

  onPause(callback: AudioEventCallback): () => void {
    this.onPauseCallbacks.push(callback);
    return () => {
      this.onPauseCallbacks = this.onPauseCallbacks.filter((cb) => cb !== callback);
    };
  }

  onProgress(callback: ProgressCallback): () => void {
    this.onProgressCallbacks.push(callback);
    return () => {
      this.onProgressCallbacks = this.onProgressCallbacks.filter((cb) => cb !== callback);
    };
  }

  onError(callback: ErrorCallback): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter((cb) => cb !== callback);
    };
  }

  // Cleanup
  cleanup(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
    if (this.crossfadeAudio) {
      this.crossfadeAudio.pause();
      this.crossfadeAudio.src = "";
      this.crossfadeAudio = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();

// Hook for React components
export function useAudioEngine() {
  return audioEngine;
}
