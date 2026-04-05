"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { NowPlayingBar } from "@/components/layout/NowPlayingBar";
import { QueuePanel } from "@/components/player/QueuePanel";
import { LyricsPanel } from "@/components/player/LyricsPanel";
import { FullscreenPlayer } from "@/components/player/FullscreenPlayer";
import { useUIStore } from "@/stores/uiStore";
import { usePlayerStore } from "@/stores/playerStore";
import { audioEngine } from "@/lib/audio/audioEngine";

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { fullscreenPlayer } = useUIStore();

  // Cleanup audio engine on unmount
  useEffect(() => {
    return () => {
      audioEngine.cleanup();
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fullscreen Player */}
      {fullscreenPlayer && <FullscreenPlayer />}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>

        {/* Side Panels */}
        <QueuePanel />
        <LyricsPanel />
      </div>

      {/* Now Playing Bar */}
      <NowPlayingBar />
    </div>
  );
}
