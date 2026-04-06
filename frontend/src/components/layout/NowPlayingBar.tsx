"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  Mic2,
  Maximize2,
  Heart,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useUIStore } from "@/stores/uiStore";
import { useAudioPlayer } from "@/lib/audio/useAudioPlayer";
import { Slider } from "@/components/ui/Slider";

export function NowPlayingBar() {
  const [isLiked, setIsLiked] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

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

  const { toggleQueue, toggleLyrics, toggleFullscreenPlayer } = useUIStore();
  const { seek } = useAudioPlayer();

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const hasNext = queue.length > 0 && queueIndex < queue.length - 1;
  const hasPrevious = queue.length > 0 && queueIndex > 0;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="h-24 bg-surface/95 backdrop-blur-xl border-t border-border flex items-center px-6 gap-4"
    >
      {/* Song Info */}
      <div className="w-[30%] min-w-[240px] flex items-center gap-4">
        <AnimatePresence mode="wait">
          {currentSong ? (
            <motion.div
              key={currentSong.videoId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-4"
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md group cursor-pointer">
                <Image
                  src={currentSong.thumbnail}
                  alt={currentSong.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Song Details */}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/song/${currentSong.videoId}`}
                  className="text-sm font-semibold text-text-primary hover:text-accent transition-colors truncate block"
                  title={currentSong.title}
                >
                  {currentSong.title}
                </Link>
                <Link
                  href={`/artist/${currentSong.artistId || ""}`}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors truncate block"
                  title={currentSong.artist}
                >
                  {currentSong.artist}
                </Link>
              </div>

              {/* Like Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2.5 rounded-full transition-colors ${
                  isLiked ? "text-accent" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              </motion.button>
            </motion.div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-surface-elevated flex items-center justify-center">
                <ListMusic className="w-6 h-6 text-text-tertiary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">No song playing</div>
                <div className="text-xs text-text-secondary">Select a song to play</div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Player Controls */}
      <div className="flex-1 flex flex-col items-center gap-2 max-w-[40%]">
        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Shuffle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleShuffle}
            className={`p-2.5 rounded-full transition-colors ${
              shuffle ? "text-accent bg-accent-muted" : "text-text-tertiary hover:text-text-primary hover:bg-surface-elevated"
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </motion.button>

          {/* Previous */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={playPrevious}
            disabled={!hasPrevious}
            className="p-2.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous"
          >
            <SkipBack className="w-5 h-5" />
          </motion.button>

          {/* Play/Pause */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={togglePlay}
            disabled={!currentSong}
            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-accent/20"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </motion.button>

          {/* Next */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={playNext}
            disabled={!hasNext}
            className="p-2.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next"
          >
            <SkipForward className="w-5 h-5" />
          </motion.button>

          {/* Repeat */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleRepeat}
            className={`p-2.5 rounded-full transition-colors relative ${
              repeat !== "off" ? "text-accent bg-accent-muted" : "text-text-tertiary hover:text-text-primary hover:bg-surface-elevated"
            }`}
            title="Repeat"
          >
            {repeat === "one" ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </motion.button>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs text-text-tertiary w-10 text-right tabular-nums">
            {formatTime(progress)}
          </span>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="flex-1 h-1 bg-surface-elevated rounded-full cursor-pointer group relative"
          >
            {/* Background track */}
            <div className="absolute inset-0 bg-surface-elevated rounded-full" />
            {/* Progress */}
            <motion.div
              className="absolute top-0 left-0 h-full bg-text-primary rounded-full group-hover:bg-accent transition-colors"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Hover handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>
          <span className="text-xs text-text-tertiary w-10 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume & Extra Controls */}
      <div className="w-[30%] min-w-[240px] flex items-center justify-end gap-1">
        {/* Lyrics */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleLyrics}
          className="p-2.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          title="Lyrics"
        >
          <Mic2 className="w-5 h-5" />
        </motion.button>

        {/* Queue */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleQueue}
          className="p-2.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          title="Queue"
        >
          <ListMusic className="w-5 h-5" />
        </motion.button>

        {/* Volume Control */}
        <div className="flex items-center gap-2 group mx-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className="p-2 rounded-full text-text-tertiary hover:text-text-primary transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </motion.button>
          <div className="w-24 opacity-70 group-hover:opacity-100 transition-opacity">
            <Slider
              value={isMuted ? 0 : volume}
              onChange={setVolume}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
        </div>

        {/* Fullscreen */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleFullscreenPlayer}
          className="p-2.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
