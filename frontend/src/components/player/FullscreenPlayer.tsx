"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  Mic2,
  Volume2,
  VolumeX,
  Heart,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useUIStore } from "@/stores/uiStore";
import { useAudioPlayer } from "@/lib/audio/useAudioPlayer";
import { Slider } from "@/components/ui/Slider";

export function FullscreenPlayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    queue,
    queueIndex,
    togglePlay,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    toggleMute,
    setVolume,
  } = usePlayerStore();

  const { lyricsOpen, toggleLyrics, queueOpen, toggleQueue, toggleFullscreenPlayer } = useUIStore();
  const { seek, getWaveformData } = useAudioPlayer();

  // Waveform visualization
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = getWaveformData();
    if (!data) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / data.length;
    const barGap = 1;

    ctx.clearRect(0, 0, width, height);

    data.forEach((value, i) => {
      const barHeight = (value / 255) * height * 0.8;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, "#ff4444");
      gradient.addColorStop(1, "#ff6666");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - barGap, barHeight);
    });
  }, [getWaveformData]);

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        drawWaveform();
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, drawWaveform]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const hasNext = queue.length > 0 && queueIndex < queue.length - 1;
  const hasPrevious = queue.length > 0 && queueIndex > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-surface z-50 flex flex-col"
      >
        {/* Background Blur */}
        {currentSong && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Image
              src={currentSong.thumbnail}
              alt=""
              fill
              className="object-cover opacity-20 blur-[100px]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface/50 via-surface/80 to-surface" />
          </div>
        )}

        {/* Header */}
        <div className="relative flex items-center justify-between p-6">
          <button
            onClick={toggleFullscreenPlayer}
            className="p-2 rounded-full hover:bg-surface-elevated transition-colors"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="text-metadata text-text-secondary uppercase tracking-wider">
            Now Playing
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLyrics}
              className={`p-2 rounded-full transition-colors ${
                lyricsOpen ? "bg-accent/20 text-accent" : "hover:bg-surface-elevated"
              }`}
            >
              <Mic2 className="w-5 h-5" />
            </button>
            <button
              onClick={toggleQueue}
              className={`p-2 rounded-full transition-colors ${
                queueOpen ? "bg-accent/20 text-accent" : "hover:bg-surface-elevated"
              }`}
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative flex-1 flex items-center justify-center gap-12 px-12"
        >
          {/* Album Art */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="relative w-[400px] h-[400px] rounded-2xl overflow-hidden shadow-2xl"
          >
            {currentSong ? (
              <Image
                src={currentSong.thumbnail}
                alt={currentSong.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-elevated flex items-center justify-center"
              >
                <div className="w-32 h-32 rounded-full bg-surface flex items-center justify-center"
                >
                  <div className="w-12 h-12 border-4 border-text-secondary/30 rounded-full" />
                </div>
              </div>
            )}
          </motion.div>

          {/* Song Info & Controls */}
          <div className="flex flex-col gap-8 max-w-md">
            {/* Song Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-3xl font-bold mb-2">
                {currentSong?.title || "No song playing"}
              </div>
              <div className="text-xl text-text-secondary">
                {currentSong?.artist || "Select a song to play"}
              </div>
            </motion.div>

            {/* Waveform */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="h-24"
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={100}
                className="w-full h-full"
              />
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <div
                onClick={handleProgressClick}
                className="h-2 bg-surface-elevated rounded-full cursor-pointer group"
              >
                <motion.div
                  className="h-full bg-accent rounded-full relative"
                  style={{
                    width: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
                  }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              </div>
              <div className="flex justify-between text-metadata text-text-secondary"
              >
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-6"
            >
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className={`p-3 rounded-full transition-colors ${
                  shuffle ? "text-accent" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              {/* Previous */}
              <button
                onClick={playPrevious}
                disabled={!hasPrevious}
                className="p-3 rounded-full text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <SkipBack className="w-8 h-8" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                disabled={!currentSong}
                className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={playNext}
                disabled={!hasNext}
                className="p-3 rounded-full text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward className="w-8 h-8" />
              </button>

              {/* Repeat */}
              <button
                onClick={toggleRepeat}
                className={`p-3 rounded-full transition-colors ${
                  repeat !== "off" ? "text-accent" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {repeat === "one" ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </button>
            </motion.div>

            {/* Volume */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-4"
            >
              <button
                onClick={toggleMute}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <Slider
                value={isMuted ? 0 : volume}
                onChange={setVolume}
                min={0}
                max={1}
                step={0.01}
                className="flex-1"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
