"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  MoreVertical,
  Plus,
  Heart,
  ListMusic,
  Share,
  ExternalLink,
  Disc,
  Mic2,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { Song } from "@/types";

interface SongCardProps {
  song: Song;
  variant?: "default" | "compact" | "row";
  showArtist?: boolean;
  showAlbum?: boolean;
  index?: number;
  context?: string;
  onPlay?: () => void;
}

export function SongCard({
  song,
  variant = "default",
  showArtist = true,
  showAlbum = false,
  index,
  context = "",
  onPlay,
}: SongCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    currentSong,
    isPlaying,
    playSong,
    addToQueue,
    setQueue,
    togglePlay,
  } = usePlayerStore();

  const isCurrentSong = currentSong?.videoId === song.videoId;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;

  const handlePlay = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song, context);
      if (onPlay) onPlay();
    }
  };

  const handleAddToQueue = () => {
    addToQueue(song);
    setShowMenu(false);
  };

  const handlePlayNext = () => {
    // Add to queue at position 1 (after current)
    addToQueue(song);
    setShowMenu(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (variant === "row") {
    return (
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group flex items-center gap-4 px-4 py-2 rounded-xl cursor-pointer
          ${isCurrentSong ? "bg-accent/10" : "hover:bg-surface-elevated"}
          transition-colors
        `}
      >
        {/* Index / Play Button */}
        <div className="w-8 flex justify-center">
          {isHovered ? (
            <button
              onClick={handlePlay}
              className="p-1.5 rounded-full bg-accent text-white"
            >
              {isCurrentlyPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
          ) : (
            <span
              className={`text-metadata ${
                isCurrentSong ? "text-accent" : "text-text-secondary"
              }`}
            >
              {isCurrentlyPlaying ? (
                <div className="flex items-center justify-center gap-0.5 h-4">
                  <motion.div
                    animate={{ height: [4, 12, 4] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-1 bg-accent rounded-full"
                  />
                  <motion.div
                    animate={{ height: [8, 4, 8] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-1 bg-accent rounded-full"
                  />
                  <motion.div
                    animate={{ height: [4, 8, 4] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-1 bg-accent rounded-full"
                  />
                </div>
              ) : (
                (index ?? 0) + 1
              )}
            </span>
          )}
        </div>

        {/* Thumbnail */}
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={song.thumbnail}
            alt={song.title}
            fill
            className="object-cover"
          />
          {isHovered && !isCurrentlyPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <Play className="w-5 h-5 text-white ml-0.5" />
            </motion.div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <div
            className={`text-body font-medium truncate ${
              isCurrentSong ? "text-accent" : "text-text-primary"
            }`}
          >
            {song.title}
            {song.isExplicit && (
              <span className="ml-2 px-1.5 py-0.5 text-metadata border border-text-secondary/30 rounded text-text-secondary">
                E
              </span>
            )}
          </div>
          <div className="text-secondary text-text-secondary truncate">
            {showArtist && song.artist}
            {showArtist && showAlbum && song.album && " • "}
            {showAlbum && song.album}
          </div>
        </div>

        {/* Duration */}
        <div className="text-metadata text-text-secondary">
          {formatDuration(song.duration)}
        </div>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg text-text-secondary opacity-0 group-hover:opacity-100 hover:text-text-primary transition-all"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated rounded-xl border border-border shadow-xl z-50 py-1"
              >
                <MenuItem
                  icon={Plus}
                  label="Add to queue"
                  onClick={handleAddToQueue}
                />
                <MenuItem
                  icon={ListMusic}
                  label="Play next"
                  onClick={handlePlayNext}
                />
                <div className="h-px bg-border my-1" />
                <MenuItem icon={Heart} label="Add to liked songs" />
                <MenuItem icon={Disc} label="Go to album" />
                <MenuItem icon={Mic2} label="Go to artist" />
                <div className="h-px bg-border my-1" />
                <MenuItem icon={Share} label="Share" />
                <MenuItem icon={ExternalLink} label="Open in YouTube" />
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  // Default and compact variants
  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePlay}
      whileHover={{ y: -4 }}
      className="group cursor-pointer"
    >
      {/* Thumbnail Container */}
      <div
        className={`
          relative rounded-xl overflow-hidden mb-3
          ${variant === "compact" ? "w-32 h-32" : "w-full aspect-square"}
        `}
      >
        <Image
          src={song.thumbnail}
          alt={song.title}
          fill
          className="object-cover"
        />

        {/* Hover Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-black/40 flex items-center justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white shadow-lg"
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </motion.button>
        </motion.div>

        {/* Explicit Badge */}
        {song.isExplicit && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-metadata text-white">
            E
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="space-y-1">
        <div
          className={`font-medium truncate ${
            isCurrentSong ? "text-accent" : "text-text-primary"
          }`}
        >
          {song.title}
        </div>
        {showArtist && (
          <div className="text-secondary text-text-secondary truncate">
            {song.artist}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

function MenuItem({ icon: Icon, label, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-secondary text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
