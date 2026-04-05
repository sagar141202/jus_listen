"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search as SearchIcon, Disc, Mic2, ListMusic, Music } from "lucide-react";
import { SongCard } from "@/components/player/SongCard";
import { Song, Album, Artist, Playlist } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type SearchType = "all" | "songs" | "albums" | "artists" | "playlists";

interface SearchResults {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&type=${searchType}`
      );
      const data = await response.json();
      if (data.data) {
        setResults(data.data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const filters: { type: SearchType; label: string; icon: typeof Music }[] = [
    { type: "all", label: "All", icon: Music },
    { type: "songs", label: "Songs", icon: Disc },
    { type: "albums", label: "Albums", icon: Disc },
    { type: "artists", label: "Artists", icon: Mic2 },
    { type: "playlists", label: "Playlists", icon: ListMusic },
  ];

  return (
    <div className="p-8 pb-32">
      {/* Search Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-section font-bold mb-6">Search</h1>

        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for songs, artists, albums..."
            className="w-full pl-12 pr-4 py-4 bg-surface rounded-xl border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors"
          />
        </form>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4">
          {filters.map((filter) => (
            <button
              key={filter.type}
              onClick={() => setSearchType(filter.type)}
              className={`px-4 py-2 rounded-full text-secondary font-medium transition-colors ${
                searchType === filter.type
                  ? "bg-accent text-white"
                  : "bg-surface-elevated text-text-secondary hover:text-text-primary"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      {loading ? (
        <div className="text-center text-text-secondary py-12">Searching...</div>
      ) : results ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Songs */}
          {(searchType === "all" || searchType === "songs") &&
            results.songs?.length > 0 && (
              <section>
                <h2 className="text-title font-semibold mb-4">Songs</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {results.songs.slice(0, 6).map((song, index) => (
                    <motion.div
                      key={song.videoId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SongCard song={song} context="Search" />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

          {/* Empty State */}
          {!results.songs?.length &&
            !results.albums?.length &&
            !results.artists?.length &&
            !results.playlists?.length && (
              <div className="text-center text-text-secondary py-12">
                No results found for &quot;{query}&quot;
              </div>
            )}
        </motion.div>
      ) : (
        /* Initial State */
        <div className="text-center text-text-secondary py-12">
          <p className="text-xl mb-2">Start searching</p>
          <p className="text-secondary">
            Find your favorite songs, artists, and albums
          </p>
        </div>
      )}
    </div>
  );
}
