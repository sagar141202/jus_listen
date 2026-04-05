"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SongCard } from "@/components/player/SongCard";
import { Song } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [sections, setSections] = useState<{ title: string; items: Song[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeFeed = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/browse/home`);
        const data = await response.json();
        if (data.data?.sections) {
          const mappedSections = data.data.sections
            .filter((section: { type: string }) => section.type === "quick_picks" || section.type === "trending")
            .map((section: { title: string; contents: Song[] }) => ({
              title: section.title,
              items: section.contents.filter((item): item is Song => "videoId" in item).slice(0, 6),
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
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-surface-elevated rounded" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-surface-elevated rounded-xl" />
                <div className="h-4 bg-surface-elevated rounded w-3/4" />
                <div className="h-3 bg-surface-elevated rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-32 space-y-12">
      {sections.map((section, sectionIndex) => (
        <motion.section
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1 }}
        >
          <h2 className="text-section font-bold mb-6">{section.title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {section.items.map((song, index) => (
              <motion.div
                key={song.videoId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SongCard song={song} context={section.title} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      ))}

      {sections.length === 0 && (
        <div className="flex flex-col items-center justify-center h-96 text-text-secondary">
          <p className="text-xl">Welcome to tuniq</p>
          <p className="text-secondary mt-2">Start exploring music</p>
        </div>
      )}
    </div>
  );
}
