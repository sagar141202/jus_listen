"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
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

      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, "#fa2d48");
      gradient.addColorStop(1, "#ff6b8a");

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
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 bg-background z-50 flex flex-col"
      >
        {/* Background Blur */}
        {currentSong && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Image
              src={currentSong.thumbnail}
              alt=""
              fill
              className="object-cover opacity-30 blur-[120px] scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" />
          </div>
        )}

        {/* Header */}
        <div className="relative flex items-center justify-between px-8 py-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFullscreenPlayer}
            className="p-3 rounded-full bg-surface-elevated/50 backdrop-blur-sm hover:bg-surface-elevated transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>

          <div className="text-xs font-medium text-text-secondary uppercase tracking-widest">
            Now Playing
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleLyrics}
              className={`p-3 rounded-full transition-colors ${
                lyricsOpen ? "bg-accent-muted text-accent" : "bg-surface-elevated/50 hover:bg-surface-elevated"
              }`}
            >
              <Mic2 className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleQueue}
              className={`p-3 rounded-full transition-colors ${
                queueOpen ? "bg-accent-muted text-accent" : "bg-surface-elevated/50 hover:bg-surface-elevated"
              }`}
            >
              <ListMusic className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative flex-1 flex items-center justify-center gap-16 px-16 max-w-7xl mx-auto w-full">
          {/* Album Art */}
          <motion.div
            initial={{ opacity: 0, x: -60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-[450px] h-[450px] rounded-3xl overflow-hidden shadow-2xl shadow-black/40"
          >
            {currentSong ? (
              <>
                <Image
                  src={currentSong.thumbnail}
                  alt={currentSong.title}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Subtle overlay for depth */}
                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.3)]" />
              </>
            ) : (
              <div className="w-full h-full bg-surface-elevated flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-surface flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-text-tertiary/30 rounded-full" />
                </div>
              </div>
            )}
          </motion.div>

          {/* Song Info & Controls */}
          <div className="flex flex-col gap-10 max-w-lg flex-1">
            {/* Song Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold mb-3 tracking-tight line-clamp-2">
                {currentSong?.title || "No song playing"}
              </h1>
              <p className="text-lg text-text-secondary">
                {currentSong?.artist || "Select a song to play"}
              </p>
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
                width={450}
                height={100}
                className="w-full h-full"
              />
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <div
                onClick={handleProgressClick}
                className="h-1.5 bg-surface-elevated rounded-full cursor-pointer group relative"
              >
                <motion.div
                  className="absolute top-0 left-0 h-full bg-text-primary rounded-full group-hover:bg-accent transition-colors"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progressPercent}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-tertiary font-medium tabular-nums">
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
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleShuffle}
                className={`p-3 rounded-full transition-colors ${
                  shuffle ? "text-accent bg-accent-muted" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                <Shuffle className="w-5 h-5" />
              </motion.button>

              {/* Previous */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={playPrevious}
                disabled={!hasPrevious}
                className="p-3 rounded-full text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <SkipBack className="w-7 h-7" />
              </motion.button>

              {/* Play/Pause */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                disabled={!currentSong}
                className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xl shadow-accent/30"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </motion.button>

              {/* Next */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={playNext}
                disabled={!hasNext}
                className="p-3 rounded-full text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward className="w-7 h-7" />
              </motion.button>

              {/* Repeat */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleRepeat}
                className={`p-3 rounded-full transition-colors ${
                  repeat !== "off" ? "text-accent bg-accent-muted" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                {repeat === "one" ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </motion.button>
            </motion.div>

            {/* Volume */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-4 max-w-xs mx-auto w-full"
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </motion.button>
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
