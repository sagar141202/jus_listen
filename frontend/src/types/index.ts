// Song types
export interface Song {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  thumbnail: string;
  duration: number;
  durationText: string;
  isExplicit?: boolean;
  playCount?: number;
}

// Album types
export interface Album {
  id: string;
  browseId: string;
  title: string;
  artist: string;
  artistId?: string;
  thumbnail: string;
  year?: number;
  songCount?: number;
  duration?: string;
}

// Artist types
export interface Artist {
  id: string;
  name: string;
  thumbnail?: string;
  subscribers?: string;
}

// Playlist types
export interface Playlist {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  songCount: number;
  author?: string;
  isUserPlaylist?: boolean;
  tracks?: Song[];
}

// Search result types
export interface SearchResults {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  topResult?: Song | Album | Artist | Playlist;
}

// Home feed section types
export interface HomeSection {
  title: string;
  type: "quick_picks" | "listen_again" | "trending" | "new_releases" | "moods" | "generic";
  items: Song[] | Album[] | Playlist[];
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

// Queue types
export interface QueueItem extends Song {
  queueId: string;
}

// Lyrics types
export interface LyricsLine {
  text: string;
  startTime: number;
}

export interface Lyrics {
  videoId: string;
  synced: boolean;
  lines: LyricsLine[];
}

// Player state
export interface PlayerState {
  currentSong: Song | null;
  queue: QueueItem[];
  queueIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  crossfadeSeconds: number;
  playingFromContext: string;
}

// UI state
export interface UIState {
  theme: "dark" | "light" | "system";
  sidebarCollapsed: boolean;
  queueOpen: boolean;
  lyricsOpen: boolean;
  fullscreenPlayer: boolean;
  dominantColor: string | null;
}

// User state
export interface UserState {
  user: User | null;
  likedSongs: Set<string>;
  history: Song[];
  playlists: Playlist[];
}

// API response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiError {
  error: {
    message: string;
    code: string;
    retryable: boolean;
  };
}

// Stream response
export interface StreamResponse {
  url: string;
  expiresAt: number;
}
