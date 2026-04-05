"use client";

import { useState, useRef, useEffect } from "react";
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
  const [showVolumeTooltip, setShowVolumeTooltip] = useState(false);
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

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="h-24 bg-surface border-t border-border flex items-center px-4 gap-4"
    >
      {/* Song Info */}
      <div className="w-[30%] min-w-[200px] flex items-center gap-4">
        <AnimatePresence mode="wait">
          {currentSong ? (
            <motion.div
              key={currentSong.videoId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4"
            >
              {/* Thumbnail */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={currentSong.thumbnail}
                  alt={currentSong.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Song Details */}
              <div className="min-w-0">
                <Link
                  href={`/song/${currentSong.videoId}`}
                  className="text-body font-medium truncate hover:underline block"
                >
                  {currentSong.title}
                </Link>
                <Link
                  href={`/artist/${currentSong.artistId || ""}`}
                  className="text-secondary text-text-secondary truncate hover:underline"
                >
                  {currentSong.artist}
                </Link>
              </div>

              {/* Like Button */}
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2 rounded-full transition-colors ${
                  isLiked ? "text-accent" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
              </button>
            </motion.div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-surface-elevated" />
              <div>
                <div className="text-body font-medium">No song playing</div>
                <div className="text-secondary text-text-secondary">Select a song to play</div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Player Controls */}
      <div className="flex-1 flex flex-col items-center gap-2 max-w-[40%]">
        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-lg transition-colors ${
              shuffle ? "text-accent" : "text-text-secondary hover:text-text-primary"
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button
            onClick={playPrevious}
            disabled={!hasPrevious}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={!currentSong}
            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            disabled={!hasNext}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-lg transition-colors relative ${
              repeat !== "off" ? "text-accent" : "text-text-secondary hover:text-text-primary"
            }`}
            title="Repeat"
          >
            {repeat === "one" ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-metadata text-text-secondary w-10 text-right">
            {formatTime(progress)}
          </span>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="flex-1 h-1 bg-surface-elevated rounded-full cursor-pointer group"
          >
            <motion.div
              className="h-full bg-text-primary rounded-full relative"
              style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-text-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          </div>
          <span className="text-metadata text-text-secondary w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume & Extra Controls */}
      <div className="w-[30%] min-w-[200px] flex items-center justify-end gap-2">
        {/* Lyrics */}
        <button
          onClick={toggleLyrics}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          title="Lyrics"
        >
          <Mic2 className="w-5 h-5" />
        </button>

        {/* Queue */}
        <button
          onClick={toggleQueue}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          title="Queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>

        {/* Volume Control */}
        <div
          className="flex items-center gap-2 group"
          onMouseEnter={() => setShowVolumeTooltip(true)}
          onMouseLeave={() => setShowVolumeTooltip(false)}
        >
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
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
            className="w-24"
          />
        </div>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreenPlayer}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
