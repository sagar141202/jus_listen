"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function LikedSongsPage() {
  return (
    <div className="p-8 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-section font-bold">Liked Songs</h1>
            <p className="text-secondary text-text-secondary">
              Your favorite tracks in one place
            </p>
          </div>
        </div>

        <div className="text-center text-text-secondary py-12">
          <p className="text-xl mb-2">No liked songs yet</p>
          <p className="text-secondary">
            Start liking songs to see them here
          </p>
        </div>
      </motion.div>
    </div>
  );
}
