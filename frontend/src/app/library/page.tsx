"use client";

import { motion } from "framer-motion";
import { Heart, Clock, ListMusic } from "lucide-react";
import Link from "next/link";

const libraryItems = [
  {
    icon: Heart,
    label: "Liked Songs",
    description: "Your favorite tracks",
    href: "/liked",
    color: "text-red-400",
  },
  {
    icon: Clock,
    label: "History",
    description: "Recently played",
    href: "/history",
    color: "text-blue-400",
  },
  {
    icon: ListMusic,
    label: "Playlists",
    description: "Your custom playlists",
    href: "/library",
    color: "text-green-400",
  },
];

export default function LibraryPage() {
  return (
    <div className="p-8 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-section font-bold mb-8">Your Library</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {libraryItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className="flex items-center gap-4 p-6 bg-surface rounded-xl hover:bg-surface-elevated transition-colors group"
              >
                <div className={`w-14 h-14 rounded-xl bg-surface-elevated flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-title font-semibold">{item.label}</h3>
                  <p className="text-secondary text-text-secondary">
                    {item.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
