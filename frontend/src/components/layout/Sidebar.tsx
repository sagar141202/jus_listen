"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Search,
  Library,
  Heart,
  History,
  PlusSquare,
  ChevronLeft,
  ChevronRight,
  Music,
  Disc,
  Mic2,
  ListMusic,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { usePlayerStore } from "@/stores/playerStore";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Search", href: "/search" },
];

const libraryItems = [
  { icon: Library, label: "Library", href: "/library" },
  { icon: Heart, label: "Liked Songs", href: "/liked" },
  { icon: History, label: "History", href: "/history" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Playlists will come from user store in Phase 6 - empty for now
  const playlists: { id: string; title: string }[] = [];

  return (
    <
      motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-full bg-surface border-r border-border flex flex-col"
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <motion.div
            animate={{ rotate: sidebarCollapsed ? 0 : 360 }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0"
          >
            <Music className="w-5 h-5 text-white" />
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xl font-bold whitespace-nowrap"
              >
                t<span className="text-accent">uniq</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
              }`}
            >
              <motion.div
                animate={{
                  scale: hoveredItem === item.href ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <item.icon
                  className={`w-5 h-5 ${isActive ? "text-accent" : ""}`}
                />
              </motion.div>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && !sidebarCollapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-2 w-1.5 h-1.5 rounded-full bg-accent"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-border" />

      {/* Library Section */}
      <div className="px-2 py-4">
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 text-metadata font-medium text-text-secondary uppercase tracking-wider mb-3"
            >
              Your Library
            </motion.h3>
          )}
        </AnimatePresence>
        <nav className="space-y-1">
          {libraryItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Playlists Section */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <AnimatePresence>
          {!sidebarCollapsed && playlists.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mx-4 h-px bg-border mb-3" />
              <h3 className="px-3 text-metadata font-medium text-text-secondary uppercase tracking-wider mb-3">
                Playlists
              </h3>
              <nav className="space-y-1">
                {playlists.map((playlist) => (
                  <Link
                    key={playlist.id}
                    href={`/playlist/${playlist.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <ListMusic className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium truncate">{playlist.title}</span>
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Playlist Button */}
      <div className="p-4 border-t border-border">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-elevated hover:bg-accent/10 hover:text-accent transition-all duration-200 group">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors"
          >
            <PlusSquare className="w-5 h-5 text-accent" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium whitespace-nowrap"
              >
                Create Playlist
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
