"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Play, Heart, Plus } from "lucide-react";
import { SongCard } from "@/components/player/SongCard";
import { Song } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SongDetails {
  song: Song;
  queue: Song[];
  related: Song[];
}

export default function SongPage() {
  const params = useParams();
  const [songDetails, setSongDetails] = useState<SongDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/browse/song/${params.id}`
        );
        const data = await response.json();
        if (data.data) {
          setSongDetails(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch song:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-8 pb-32">
        <div className="animate-pulse space-y-8">
          <div className="h-64 w-64 bg-surface-elevated rounded" />
          <div className="h-8 w-64 bg-surface-elevated rounded" />
        </div>
      </div>
    );
  }

  if (!songDetails) {
    return (
      <div className="p-8 pb-32 text-center text-text-secondary">
        Song not found
      </div>
    );
  }

  const { song, related } = songDetails;

  return (
    <div className="pb-32">
      {/* Hero */}
      <div className="p-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end gap-8"
        >
          <div className="relative w-64 h-64 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl">
            <Image
              src={song.thumbnail}
              alt={song.title}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-secondary text-text-secondary mb-2">Song</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {song.title}
            </h1>
            <div className="flex items-center gap-4 text-text-secondary">
              <span className="text-body font-medium text-text-primary">
                {song.artist}
              </span>
              {song.album && (
                <>
                  <span>•</span>
                  <span>{song.album}</span>
                </>
              )}
              {song.year && (
                <>
                  <span>•</span>
                  <span>{song.year}</span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="p-8 pt-0">
        <div className="flex items-center gap-4 mb-8">
          <button className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent/90 transition-colors">
            <Play className="w-6 h-6 ml-1" />
          </button>
          <button className="p-3 rounded-full border border-text-secondary/30 text-text-secondary hover:text-text-primary hover:border-text-primary transition-colors">
            <Heart className="w-6 h-6" />
          </button>
          <button className="p-3 rounded-full border border-text-secondary/30 text-text-secondary hover:text-text-primary hover:border-text-primary transition-colors">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Related Songs */}
      {related?.length > 0 && (
        <div className="p-8">
          <h2 className="text-title font-bold mb-6">Related Songs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {related.slice(0, 6).map((relatedSong, index) => (
              <motion.div
                key={relatedSong.videoId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SongCard song={relatedSong} context="Related" />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
