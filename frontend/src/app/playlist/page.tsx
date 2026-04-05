"use client";

import { motion } from "framer-motion";
import { ListMusic } from "lucide-react";

export default function PlaylistsPage() {
  return (
    <div className="p-8 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-section font-bold mb-8">Your Playlists</h1>

        <div className="text-center text-text-secondary py-12">
          <ListMusic className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl mb-2">No playlists yet</p>
          <p className="text-secondary">
            Create playlists to organize your music
          </p>
        </div>
      </motion.div>
    </div>
  );
}
