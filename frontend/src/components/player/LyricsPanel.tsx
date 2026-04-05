"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic2, Music } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useUIStore } from "@/stores/uiStore";
import { LyricsLine } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function LyricsPanel() {
  const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(Map<number, HTMLDivElement>)>(new Map());

  const { currentSong, progress, isPlaying } = usePlayerStore();
  const { lyricsOpen, setLyricsOpen } = useUIStore();

  // Fetch lyrics when song changes
  useEffect(() => {
    if (!currentSong?.videoId || !lyricsOpen) return;

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);
      setLyrics([]);
      setCurrentLineIndex(-1);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/lyrics/${currentSong.videoId}`
        );
        const data = await response.json();

        if (response.ok && data.data?.lines?.length > 0) {
          setLyrics(data.data.lines);
        } else {
          setError("No lyrics available for this song");
        }
      } catch (err) {
        setError("Failed to load lyrics");
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [currentSong?.videoId, lyricsOpen]);

  // Auto-scroll to current line
  useEffect(() => {
    if (!lyrics.length || !isPlaying) return;

    // Find current line based on progress
    const currentLine = lyrics.findIndex((line, index) => {
      const nextLine = lyrics[index + 1];
      return (
        progress >= line.startTime &&
        (!nextLine || progress < nextLine.startTime)
      );
    });

    if (currentLine !== -1 && currentLine !== currentLineIndex) {
      setCurrentLineIndex(currentLine);

      // Scroll to current line
      const lineElement = lineRefs.current.get(currentLine);
      if (lineElement && lyricsRef.current) {
        const container = lyricsRef.current;
        const lineRect = lineElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const scrollTop =
          lineElement.offsetTop -
          containerRect.height / 2 +
          lineRect.height / 2;

        container.scrollTo({
          top: scrollTop,
          behavior: "smooth",
        });
      }
    }
  }, [progress, lyrics, isPlaying, currentLineIndex]);

  const setLineRef = (index: number) => (el: HTMLDivElement | null) => {
    if (el) {
      lineRefs.current.set(index, el);
    }
  };

  return (
    <AnimatePresence>
      {lyricsOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-24 w-96 bg-surface border-l border-border z-40 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Mic2 className="w-5 h-5 text-text-secondary" />
              <h2 className="text-title font-semibold">Lyrics</h2>
            </div>
            <button
              onClick={() => setLyricsOpen(false)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Song Info */}
          {currentSong && (
            <div className="p-4 border-b border-border bg-surface-elevated">
              <div className="text-body font-medium truncate">{currentSong.title}</div>
              <div className="text-secondary text-text-secondary truncate">
                {currentSong.artist}
              </div>
            </div>
          )}

          {/* Lyrics Content */}
          <div
            ref={lyricsRef}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-text-secondary">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
                <p>Loading lyrics...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-text-secondary text-center p-8">
                <Music className="w-12 h-12 mb-4 opacity-50" />
                <p>{error}</p>
                <p className="text-metadata mt-2 opacity-70">
                  We couldn&apos;t find lyrics for this song
                </p>
              </div>
            ) : (
              lyrics.map((line, index) => (
                <motion.div
                  key={index}
                  ref={setLineRef(index)}
                  initial={{ opacity: 0.3 }}
                  animate={{
                    opacity: index === currentLineIndex ? 1 : 0.5,
                    scale: index === currentLineIndex ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`
                    text-center py-3 px-4 rounded-xl transition-all cursor-pointer
                    ${
                      index === currentLineIndex
                        ? "text-accent font-semibold text-section"
                        : "text-text-secondary text-body hover:text-text-primary"
                    }
                  `}
                  onClick={() => {
                    // Seek to this line if synced
                    if (line.startTime >= 0) {
                      // audioEngine.seek(line.startTime);
                    }
                  }}
                >
                  {line.text}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
