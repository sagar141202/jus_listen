"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  // Theme
  theme: "dark" | "light" | "system";

  // Sidebar
  sidebarCollapsed: boolean;

  // Panels
  queueOpen: boolean;
  lyricsOpen: boolean;
  fullscreenPlayer: boolean;

  // Current view
  currentView: "home" | "search" | "library" | "playlist" | "artist" | "album";
  viewId: string | null;

  // Search
  searchQuery: string;
  searchType: "all" | "songs" | "albums" | "artists" | "playlists";

  // Modals
  activeModal: string | null;
  modalData: unknown;

  // Toast notifications
  toasts: Toast[];

  // Actions
  setTheme: (theme: "dark" | "light" | "system") => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleQueue: () => void;
  setQueueOpen: (open: boolean) => void;
  toggleLyrics: () => void;
  setLyricsOpen: (open: boolean) => void;
  toggleFullscreenPlayer: () => void;
  setFullscreenPlayer: (fullscreen: boolean) => void;
  setCurrentView: (view: UIState["currentView"], id?: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchType: (type: UIState["searchType"]) => void;
  openModal: (modal: string, data?: unknown) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: "dark",
      sidebarCollapsed: false,
      queueOpen: false,
      lyricsOpen: false,
      fullscreenPlayer: false,
      currentView: "home",
      viewId: null,
      searchQuery: "",
      searchType: "all",
      activeModal: null,
      modalData: null,
      toasts: [],

      // Theme
      setTheme: (theme) => {
        set({ theme });
        if (theme === "dark") {
          document.documentElement.setAttribute("data-theme", "dark");
        } else if (theme === "light") {
          document.documentElement.setAttribute("data-theme", "light");
        } else {
          // System theme
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
        }
      },

      // Sidebar
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Queue panel
      toggleQueue: () => set((state) => ({ queueOpen: !state.queueOpen })),
      setQueueOpen: (open) => set({ queueOpen: open }),

      // Lyrics panel
      toggleLyrics: () => set((state) => ({ lyricsOpen: !state.lyricsOpen })),
      setLyricsOpen: (open) => set({ lyricsOpen: open }),

      // Fullscreen player
      toggleFullscreenPlayer: () => set((state) => ({ fullscreenPlayer: !state.fullscreenPlayer })),
      setFullscreenPlayer: (fullscreen) => set({ fullscreenPlayer: fullscreen }),

      // Current view
      setCurrentView: (view, id = null) => set({ currentView: view, viewId: id }),

      // Search
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchType: (type) => set({ searchType: type }),

      // Modals
      openModal: (modal, data = null) => set({ activeModal: modal, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      // Toasts
      addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { ...toast, id };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        // Auto remove after duration
        if (toast.duration !== 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, toast.duration || 3000);
        }
      },
      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
      clearAllToasts: () => set({ toasts: [] }),
    }),
    {
      name: "tuniq-ui",
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        searchType: state.searchType,
      }),
    }
  )
);
