"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Mic2, Play } from "lucide-react";
import { SongCard } from "@/components/player/SongCard";
import { Song } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ArtistDetails {
  artist: {
    artistId: string;
    name: string;
    thumbnail: string;
    description?: string;
  };
  topSongs: Song[];
  albums: { albumId: string; title: string; thumbnail: string; year: number }[];
}

export default function ArtistPage() {
  const params = useParams();
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/browse/artist/${params.id}`
        );
        const data = await response.json();
        if (data.data) {
          setArtist(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch artist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-8 pb-32">
        <div className="animate-pulse space-y-8">
          <div className="h-40 w-40 bg-surface-elevated rounded-full" />
          <div className="h-8 w-64 bg-surface-elevated rounded" />
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-8 pb-32 text-center text-text-secondary">
        Artist not found
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
          <div className="relative w-40 h-40 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={artist.artist.thumbnail}
              alt={artist.artist.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-secondary text-text-secondary mb-2">Artist</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {artist.artist.name}
            </h1>
            {artist.artist.description && (
              <p className="text-text-secondary max-w-2xl line-clamp-3">
                {artist.artist.description}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top Songs */}
      {artist.topSongs?.length > 0 && (
        <div className="p-8">
          <h2 className="text-title font-bold mb-6">Popular</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {artist.topSongs.slice(0, 6).map((song, index) => (
              <motion.div
                key={song.videoId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SongCard song={song} context={`Artist: ${artist.artist.name}`} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Albums */}
      {artist.albums?.length > 0 && (
        <div className="p-8">
          <h2 className="text-title font-bold mb-6">Albums</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {artist.albums.map((album, index) => (
              <motion.div
                key={album.albumId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="cursor-pointer group"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                  <Image
                    src={album.thumbnail}
                    alt={album.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="text-body font-medium truncate">
                  {album.title}
                </div>
                <div className="text-secondary text-text-secondary">
                  {album.year}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
