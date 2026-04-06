"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SongCard } from "@/components/player/SongCard";
import { Song } from "@/types";
import { Music, Sparkles, TrendingUp } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export default function Home() {
  const [sections, setSections] = useState<{ title: string; items: Song[]; type: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeFeed = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/browse/home`);
        const data = await response.json();
        if (data.data?.sections) {
          const mappedSections = data.data.sections
            .filter((section: { type: string }) => section.type === "quick_picks" || section.type === "trending")
            .map((section: { title: string; contents: Song[]; type: string }) => ({
              title: section.title,
              items: section.contents.filter((item): item is Song => "videoId" in item).slice(0, 6),
              type: section.type,
            }));
          setSections(mappedSections);
        }
      } catch (error) {
        console.error("Failed to fetch home feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeFeed();
  }, []);

  if (loading) {
    return (
      <div className="p-8 pb-32">
        <div className="animate-pulse space-y-12">
          {[1, 2].map((section) => (
            <div key={section}>
              <div className="h-8 w-56 bg-surface-elevated rounded-lg mb-6" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <div className="aspect-square bg-surface-elevated rounded-2xl" />
                    <div className="h-4 bg-surface-elevated rounded w-4/5" />
                    <div className="h-3 bg-surface-elevated rounded w-3/5" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-40 space-y-14 min-h-screen">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-bold mb-3 tracking-tight">
          Good <span className="text-text-secondary">evening</span>
        </h1>
        <p className="text-text-secondary text-base">
          Discover your next favorite song
        </p>
      </motion.div>

      {sections.map((section, sectionIndex) => (
        <motion.section
          key={section.title}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: sectionIndex * 0.15 }}
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {section.type === "quick_picks" ? (
                <div className="p-2 rounded-lg bg-accent/10">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-accent/10">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
              )}
              <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
            </div>
            <button className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              See all
            </button>
          </div>

          {/* Songs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8">
            {section.items.map((song, index) => (
              <motion.div
                key={song.videoId}
                variants={itemVariants}
                transition={{ delay: index * 0.05 }}
              >
                <SongCard song={song} context={section.title} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      ))}

      {sections.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-[60vh] text-text-secondary"
        >
          <div className="w-24 h-24 rounded-full bg-surface-elevated flex items-center justify-center mb-6">
            <Music className="w-10 h-10 text-text-tertiary" />
          </div>
          <p className="text-2xl font-semibold text-text-primary mb-2">Welcome to tuniq</p>
          <p className="text-base">Start exploring music by searching or browsing</p>
        </motion.div>
      )}
    </div>
  );
}
