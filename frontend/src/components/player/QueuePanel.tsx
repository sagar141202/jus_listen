"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  GripVertical,
  Trash2,
  Play,
  Pause,
  ListMusic,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useUIStore } from "@/stores/uiStore";
import { QueueItem } from "@/types";

export function QueuePanel() {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  const {
    queue,
    queueIndex,
    currentSong,
    isPlaying,
    setQueueIndex,
    removeFromQueue,
    moveQueueItem,
    togglePlay,
    clearQueue,
  } = usePlayerStore();

  const { queueOpen, setQueueOpen } = useUIStore();

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem !== null && draggedItem !== index) {
      setDragOverItem(index);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem !== null) {
      moveQueueItem(draggedItem, index);
      setDraggedItem(null);
      setDragOverItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {queueOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-24 w-80 bg-surface border-l border-border z-40 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-text-secondary" />
              <h2 className="text-title font-semibold">Queue</h2>
              <span className="text-metadata text-text-secondary">
                {queue.length} songs
              </span>
            </div>
            <div className="flex items-center gap-2">
              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="p-2 rounded-lg text-text-secondary hover:text-red-400 transition-colors"
                  title="Clear queue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setQueueOpen(false)}
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-secondary p-8 text-center">
                <ListMusic className="w-12 h-12 mb-4 opacity-50" />
                <p>Your queue is empty</p>
                <p className="text-metadata mt-1">
                  Add songs to your queue to see them here
                </p>
              </div>
            ) : (
              <div className="py-2">
                {queue.map((item, index) => (
                  <QueueItemRow
                    key={item.queueId}
                    item={item}
                    index={index}
                    isCurrent={index === queueIndex}
                    isPlaying={isPlaying && index === queueIndex}
                    onPlay={() => setQueueIndex(index)}
                    onRemove={() => removeFromQueue(index)}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    isDraggedOver={dragOverItem === index}
                    formatDuration={formatDuration}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Now Playing Section */}
          {currentSong && (
            <div className="p-4 border-t border-border bg-surface-elevated">
              <div className="text-metadata text-text-secondary uppercase tracking-wider mb-3">
                Now Playing
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                  <Image
                    src={currentSong.thumbnail}
                    alt={currentSong.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-body font-medium truncate">
                    {currentSong.title}
                  </div>
                  <div className="text-secondary text-text-secondary truncate">
                    {currentSong.artist}
                  </div>
                </div>
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface QueueItemRowProps {
  item: QueueItem;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDraggedOver: boolean;
  formatDuration: (seconds: number) => string;
}

function QueueItemRow({
  item,
  index,
  isCurrent,
  isPlaying,
  onPlay,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDraggedOver,
  formatDuration,
}: QueueItemRowProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`
        group flex items-center gap-3 px-4 py-2 cursor-pointer
        ${isCurrent ? "bg-accent/10" : "hover:bg-surface-elevated"}
        ${isDraggedOver ? "border-t-2 border-accent" : ""}
        transition-colors
      `}
    >
      {/* Drag Handle */}
      <div className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Index / Play Indicator */}
      <div
        onClick={onPlay}
        className="w-6 text-center text-metadata text-text-secondary flex-shrink-0"
      >
        {isCurrent && isPlaying ? (
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
          index + 1
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0" onClick={onPlay}>
        <div
          className={`text-body truncate ${
            isCurrent ? "text-accent" : "text-text-primary"
          }`}
        >
          {item.title}
        </div>
        <div className="text-secondary text-text-secondary truncate">
          {item.artist}
        </div>
      </div>

      {/* Duration */}
      <div className="text-metadata text-text-secondary">
        {formatDuration(item.duration)}
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-1.5 rounded text-text-secondary opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
