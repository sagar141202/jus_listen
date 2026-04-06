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
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-24 w-80 bg-surface border-l border-border z-40 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <ListMusic className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h2 className="text-base font-bold">Queue</h2>
                <p className="text-xs text-text-tertiary">
                  {queue.length} {queue.length === 1 ? "song" : "songs"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {queue.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={clearQueue}
                  className="p-2 rounded-lg text-text-tertiary hover:text-red-400 hover:bg-surface-elevated transition-colors"
                  title="Clear queue"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQueueOpen(false)}
                className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
                  <ListMusic className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-sm font-medium">Your queue is empty</p>
                <p className="text-xs mt-1 text-text-tertiary/70">
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
            <div className="p-4 border-t border-border bg-surface-elevated/50">
              <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
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
                  {/* Playing indicator overlay */}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                      <div className="flex items-end gap-0.5 h-3">
                        <motion.div
                          animate={{ height: [3, 8, 3] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className="w-0.5 bg-white rounded-full"
                        />
                        <motion.div
                          animate={{ height: [5, 3, 5] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className="w-0.5 bg-white rounded-full"
                        />
                        <motion.div
                          animate={{ height: [3, 6, 3] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className="w-0.5 bg-white rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate text-text-primary">
                    {currentSong.title}
                  </div>
                  <div className="text-xs text-text-secondary truncate">
                    {currentSong.artist}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </motion.button>
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
        group flex items-center gap-2 px-4 py-2.5 cursor-pointer
        ${isCurrent ? "bg-accent-muted" : "hover:bg-surface-elevated"}
        ${isDraggedOver ? "border-t-2 border-accent" : ""}
        transition-all duration-150
      `}
    >
      {/* Drag Handle */}
      <div className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Index / Play Indicator */}
      <div
        onClick={onPlay}
        className="w-6 text-center text-xs text-text-tertiary flex-shrink-0"
      >
        {isCurrent && isPlaying ? (
          <div className="flex items-center justify-center gap-0.5 h-4">
            <motion.div
              animate={{ height: [3, 10, 3] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-0.5 bg-accent rounded-full"
            />
            <motion.div
              animate={{ height: [6, 3, 6] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-0.5 bg-accent rounded-full"
            />
            <motion.div
              animate={{ height: [3, 8, 3] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-0.5 bg-accent rounded-full"
            />
          </div>
        ) : (
          <span className={isCurrent ? "text-accent" : ""}>{index + 1}</span>
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
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
          className={`text-sm font-medium truncate ${
            isCurrent ? "text-accent" : "text-text-primary"
          }`}
        >
          {item.title}
        </div>
        <div className="text-xs text-text-secondary truncate">
          {item.artist}
        </div>
      </div>

      {/* Duration */}
      <div className="text-xs text-text-tertiary flex-shrink-0">
        {formatDuration(item.duration)}
      </div>

      {/* Remove Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onRemove}
        className="p-1.5 rounded text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
