"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handlePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
          group flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer
          ${isCurrentSong ? "bg-accent-muted" : "hover:bg-surface-elevated"}
          transition-all duration-200
        `}
      >
        {/* Index / Play Button */}
        <div className="w-10 flex justify-center items-center">
          {isHovered ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handlePlay}
              className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shadow-lg"
            >
              {isCurrentlyPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </motion.button>
          ) : (
            <span
              className={`text-sm font-medium ${
                isCurrentSong ? "text-accent" : "text-text-tertiary"
              }`}
            >
              {isCurrentlyPlaying ? (
                <div className="flex items-center justify-center gap-0.5 h-4">
                  <motion.div
                    animate={{ height: [4, 14, 4] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-1 bg-accent rounded-full"
                  />
                  <motion.div
                    animate={{ height: [8, 4, 8] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }}
                    className="w-1 bg-accent rounded-full"
                  />
                  <motion.div
                    animate={{ height: [4, 10, 4] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }}
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
        <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 group/image">
          <Image
            src={song.thumbnail}
            alt={song.title}
            fill
            className="object-cover transition-transform duration-300 group-hover/image:scale-110"
          />
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <div
            className={`font-medium truncate text-sm ${
              isCurrentSong ? "text-accent" : "text-text-primary"
            }`}
          >
            {song.title}
            {song.isExplicit && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] border border-text-secondary/20 rounded text-text-tertiary">
                E
              </span>
            )}
          </div>
          <div className="text-xs text-text-secondary truncate">
            {showArtist && song.artist}
            {showArtist && showAlbum && song.album && " • "}
            {showAlbum && song.album}
          </div>
        </div>

        {/* Duration */}
        <div className="text-xs text-text-tertiary w-12 text-right">
          {formatDuration(song.duration)}
        </div>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </motion.button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-surface-elevated rounded-xl border border-border shadow-xl z-50 py-1.5"
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
                  <div className="h-px bg-border my-1.5 mx-2" />
                  <MenuItem icon={Heart} label="Add to liked songs" />
                  <MenuItem icon={Disc} label="Go to album" />
                  <MenuItem icon={Mic2} label="Go to artist" />
                  <div className="h-px bg-border my-1.5 mx-2" />
                  <MenuItem icon={Share} label="Share" />
                  <MenuItem icon={ExternalLink} label="Open in YouTube" />
                </motion.div>
              </>
            )}
          </AnimatePresence>
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
      className="group cursor-pointer"
    >
      {/* Thumbnail Container */}
      <div
        className={`
          relative rounded-xl overflow-hidden mb-4 bg-surface-elevated
          ${variant === "compact" ? "w-32 h-32" : "w-full aspect-square"}
          shadow-md
        `}
      >
        <Image
          src={song.thumbnail}
          alt={song.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover Play Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/30 backdrop-blur-sm"
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
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white/90 font-medium">
            E
          </div>
        )}

        {/* Now Playing Indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1.5 bg-accent/90 backdrop-blur-sm rounded-lg">
            <div className="flex items-end gap-0.5 h-3">
              <motion.div
                animate={{ height: [3, 10, 3] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="w-0.5 bg-white rounded-full"
              />
              <motion.div
                animate={{ height: [6, 3, 6] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="w-0.5 bg-white rounded-full"
              />
              <motion.div
                animate={{ height: [3, 8, 3] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="w-0.5 bg-white rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="space-y-1.5 px-1">
        <div
          className={`font-semibold text-sm leading-tight truncate ${
            isCurrentSong ? "text-accent" : "text-text-primary"
          }`}
          title={song.title}
        >
          {song.title}
        </div>
        {showArtist && (
          <div className="text-xs text-text-secondary truncate" title={song.artist}>
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
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
