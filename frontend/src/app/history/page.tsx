"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="p-8 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-section font-bold">Listening History</h1>
            <p className="text-secondary text-text-secondary">
              Recently played tracks
            </p>
          </div>
        </div>

        <div className="text-center text-text-secondary py-12">
          <p className="text-xl mb-2">No history yet</p>
          <p className="text-secondary">
            Start playing songs to see your history
          </p>
        </div>
      </motion.div>
    </div>
  );
}
