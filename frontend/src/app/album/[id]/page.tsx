"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Play, Disc } from "lucide-react";
import { SongCard } from "@/components/player/SongCard";
import { Song } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AlbumDetails {
  album: {
    albumId: string;
    title: string;
    artist: string;
    thumbnail: string;
    year: number;
    trackCount: number;
  };
  tracks: Song[];
}

export default function AlbumPage() {
  const params = useParams();
  const [album, setAlbum] = useState<AlbumDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/browse/album/${params.id}`
        );
        const data = await response.json();
        if (data.data) {
          setAlbum(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch album:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
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

  if (!album) {
    return (
      <div className="p-8 pb-32 text-center text-text-secondary">
        Album not found
      </div>
    );
  }

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
              src={album.album.thumbnail}
              alt={album.album.title}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-secondary text-text-secondary mb-2">Album</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {album.album.title}
            </h1>
            <div className="flex items-center gap-4 text-text-secondary">
              <span className="text-body font-medium text-text-primary">
                {album.album.artist}
              </span>
              <span>•</span>
              <span>{album.album.year}</span>
              <span>•</span>
              <span>{album.album.trackCount} songs</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tracks */}
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <button className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent/90 transition-colors">
            <Play className="w-6 h-6 ml-1" />
          </button>
        </div>

        <div className="space-y-2">
          {album.tracks.map((track, index) => (
            <motion.div
              key={track.videoId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-elevated cursor-pointer group"
            >
              <span className="w-8 text-center text-text-secondary group-hover:hidden">
                {index + 1}
              </span>
              <Play className="w-4 h-4 hidden group-hover:block text-text-secondary" />
              <div className="flex-1">
                <div className="text-body font-medium">{track.title}</div>
                <div className="text-secondary text-text-secondary">
                  {track.artist}
                </div>
              </div>
              <div className="text-secondary text-text-secondary">
                {Math.floor(track.duration / 60)}:
                {String(Math.floor(track.duration % 60)).padStart(2, "0")}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
