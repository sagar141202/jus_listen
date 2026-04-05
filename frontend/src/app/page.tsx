"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Background gradient effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] liquid-bg"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] liquid-bg"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-bold mb-4 tracking-tight">
            <span className="text-accent">t</span>uniq
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary">
            Your music. No limits. No ads.
          </p>
        </div>

        <div className="glass rounded-2xl p-8 mb-8">
          <h2 className="text-section font-semibold mb-4">Coming Soon</h2>
          <p className="text-text-secondary mb-6">
            We&apos;re building the ultimate self-hosted music streaming experience.
            Check back soon for updates.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Ad-free streaming
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Premium features
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Self-hosted
            </div>
          </div>
        </div>

        <footer className="text-text-secondary text-secondary">
          Built with ❤️ by Sagar Maddi
        </footer>
      </div>
    </div>
  );
}
