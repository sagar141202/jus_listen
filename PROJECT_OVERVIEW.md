# Project Overview: tuniq Architecture

This document provides a comprehensive overview of tuniq's system architecture, data flows, and component organization.

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                    User                                      │
│                          (Browser/Client)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP/HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              nginx (Port 80)                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Static Files  │    │   /api Proxy    │    │  WebSocket WS   │         │
│  │   (/_next/*)     │    │   (→ backend)   │    │  (real-time)    │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
           │                         │                         │
           ▼                         ▼                         ▼
┌──────────────────┐        ┌──────────────────┐      ┌──────────────────┐
│  Next.js (3000)  │        │  FastAPI (8000)  │      │   Future: WS     │
│  ─────────────   │        │  ─────────────   │      │   Gateway        │
│  ┌────────────┐  │        │  ┌────────────┐  │      └──────────────────┘
│  │ App Router │  │        │  │   Routers  │  │
│  │ (RSC/SSC)  │  │        │  │            │  │
│  └────────────┘  │        │  │ • Stream   │  │
│  ┌────────────┐  │        │  │ • Search   │  │
│  │  Client    │  │        │  │ • Browse   │  │
│  │Components  │  │        │  │ • Auth     │  │
│  │ (Player)   │  │        │  │ • User     │  │
│  └────────────┘  │        │  │ • Lyrics   │  │
│                  │        │  └────────────┘  │
│  ┌────────────┐  │        │  ┌────────────┐  │
│  │   Stores   │  │        │  │  Services  │  │
│  │ • Player   │  │        │  │            │  │
│  │ • UI       │  │        │  │ • ytmusic  │  │
│  │ • User     │  │        │  │ • ytdlp    │  │
│  └────────────┘  │        │  │ • cache    │  │
│                  │        │  │ • auth     │  │
│  ┌────────────┐  │        │  └────────────┘  │
│  │    API     │  │        │  ┌────────────┐  │
│  │   Client   │  │        │  │   Models   │  │
│  │ (TanStack  │──┼────────┼─▶│ • User     │  │
│  │   Query)   │  │        │  │ • Playlist │  │
│  └────────────┘  │        │  │ • Like     │  │
└──────────────────┘        │  │ • History│  │
                            │  └────────────┘  │
                            └──────────────────┘
                                      │
                      ┌───────────────┴───────────────┐
                      ▼                               ▼
            ┌──────────────────┐          ┌──────────────────┐
            │   Redis (6379)   │          │ PostgreSQL (5432)│
            │  ─────────────── │          │  ──────────────  │
            │  • Stream URLs   │          │  • User accounts │
            │  • Search cache  │          │  • Playlists     │
            │  • Sessions      │          │  • Liked songs   │
            │  • Rate limiting │          │  • History       │
            │    counters      │          └──────────────────┘
            └──────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │  External APIs   │
            │  ──────────────  │
            │  • YouTube Music │
            │  • YouTube (CDN) │
            └──────────────────┘
```

---

## Request Lifecycle

### Example: User Clicks Play on a Song

```
1. USER CLICKS PLAY
   │
   ▼
2. Frontend: playerStore.play(song)
   │  • Add song to currentSong
   │  • Build queue from context
   │
   ▼
3. Frontend: TanStack Query fetches stream URL
   │  GET /api/stream/{video_id}
   │
   ▼
4. nginx routes to FastAPI
   │
   ▼
5. Backend: stream.py route
   │  • Check Redis cache for "stream:{video_id}"
   │
   ├── CACHE HIT ──▶ Return 302 redirect to cached URL
   │
   └── CACHE MISS ──▶
       │
       ▼
6. Backend: ytdlp_service.extract_audio()
   │  • Run yt-dlp in ThreadPoolExecutor
   │  • Extract best audio-only format
   │  • Get direct CDN URL
   │
       ▼
7. Backend: Store in Redis (6h TTL)
   │
       ▼
8. Backend: Return 302 redirect to CDN URL
   │
       ▼
9. Frontend: audioEngine loads URL
   │  • HTMLAudioElement.src = redirect_url
   │  • Audio starts streaming from YouTube CDN
   │
       ▼
10. Frontend: Extract dominant color from album art
    │  • Update liquid glass background
    │
       ▼
11. Frontend: Start playback progress tracking
    │  • Update playerStore.progress every 250ms
    │  • Sync waveform visualizer
```

---

## Data Flows

### 1. Home Feed Loading

```
User visits /
     │
     ▼
Next.js Server Component (app/page.tsx)
     │
     ▼
TanStack Query: ['home']
     │
     ▼
GET /api/browse/home
     │
     ▼
Backend: Check Redis (30min cache)
     │
     ├── CACHE HIT ──▶ Return JSON
     │
     └── CACHE MISS ──▶
         │
         ▼
    ytmusicapi.get_home()
         │
         ▼
    YouTube Music API
         │
         ▼
    Transform + Cache ──▶ Return JSON
```

### 2. Search Flow

```
User types query (debounced 300ms)
     │
     ▼
TanStack Query: ['search', query, type]
     │
     ▼
GET /api/search?q={query}
     │
     ▼
Backend: Check Redis (10min cache)
     │
     ▼
Query ytmusicapi.search()
     │
     ▼
Transform results ──▶ Return JSON
     │
     ▼
Frontend renders sections (Top, Songs, Albums, etc.)
```

### 3. Authentication Flow

```
User clicks "Sign in with Google"
     │
     ▼
NextAuth.js initiates OAuth flow
     │
     ▼
Google OAuth consent
     │
     ▼
Callback to /api/auth/callback/google
     │
     ▼
NextAuth creates session (JWT in httpOnly cookie)
     │
     ▼
Session synced to backend via /api/auth/me
     │
     ▼
UserStore populated with user data
     │
     ▼
Enable authenticated features (likes, playlists, history)
```

### 4. Like Song Flow

```
User clicks heart icon
     │
     ▼
Optimistic UI update (immediate)
     │
     ▼
POST /api/user/like/{video_id}
     │
     ▼
Backend: Verify JWT
     │
     ▼
Database: INSERT INTO liked_songs
     │
     ▼
Return 200 OK
     │
     ▼
userStore.likedSongs updated
     │
     ▼
Heart icon shows filled (red)
```

---

## Component Tree Overview

### Frontend Component Structure

```
app/
├── layout.tsx                    # Root layout (providers, fonts)
├── page.tsx                      # Home page (RSC)
├── globals.css                   # Global styles, Tailwind
│
├── (routes)/
│   ├── search/
│   │   └── page.tsx              # Search page
│   ├── artist/[id]/
│   │   └── page.tsx              # Artist detail
│   ├── album/[id]/
│   │   └── page.tsx              # Album detail
│   ├── playlist/[id]/
│   │   └── page.tsx              # Playlist detail
│   ├── library/
│   │   └── page.tsx              # Library (liked, playlists)
│   └── settings/
│       └── page.tsx              # Settings page
│
└── api/                          # Next.js API routes (auth)

components/
├── layout/
│   ├── Sidebar.tsx               # Navigation sidebar
│   ├── SidebarItem.tsx           # Individual nav item
│   ├── MainLayout.tsx            # Main content wrapper
│   └── NowPlayingBar.tsx         # Bottom player bar
│
├── player/
│   ├── PlayerControls.tsx        # Play/pause/next/prev
│   ├── SeekBar.tsx               # Progress slider
│   ├── VolumeControl.tsx         # Volume slider
│   ├── QueuePanel.tsx            # Slide-in queue
│   ├── FullScreenPlayer.tsx      # Expanded view
│   ├── WaveformVisualizer.tsx    # Canvas visualizer
│   └── LyricsPanel.tsx           # Lyrics display
│
├── cards/
│   ├── SongCard.tsx              # Song list/grid item
│   ├── AlbumCard.tsx             # Album card
│   ├── ArtistCard.tsx            # Artist card
│   ├── PlaylistCard.tsx          # Playlist card
│   └── SkeletonCard.tsx          # Loading placeholder
│
├── search/
│   ├── SearchInput.tsx           # Debounced search
│   ├── SearchResults.tsx         # Results container
│   └── SearchFilters.tsx         # Type filter chips
│
├── browse/
│   ├── QuickPicksSection.tsx     # Quick picks grid
│   ├── ListenAgainSection.tsx    # Horizontal scroll
│   ├── TrendingSection.tsx       # Trending songs
│   └── SectionHeader.tsx         # Section title + actions
│
├── modals/
│   ├── AddToPlaylistModal.tsx    # Add song to playlist
│   ├── CreatePlaylistModal.tsx   # New playlist
│   ├── KeyboardShortcutsModal.tsx# Help modal
│   └── ContextMenu.tsx           # Right-click menu
│
└── ui/                           # shadcn/ui components
    ├── button.tsx
    ├── slider.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    └── ...

hooks/
├── useAudioEngine.ts             # Audio playback management
├── useKeyboardShortcuts.ts       # Global keyboard handlers
├── useDominantColor.ts           # Album art color extraction
├── useMediaSession.ts            # Media keys support
└── useOffline.ts                 # Online/offline detection

store/
├── playerStore.ts                # Playback state
├── uiStore.ts                    # UI state
└── userStore.ts                  # User data state

lib/
├── api.ts                        # API client setup
├── utils.ts                      # Utility functions
├── constants.ts                  # App constants
└── types.ts                      # TypeScript types

types/
├── index.ts                      # Shared type definitions
├── song.ts                       # Song types
├── user.ts                       # User types
└── api.ts                        # API response types
```

### Backend Structure

```
app/
├── main.py                       # FastAPI app factory
├── config.py                     # Settings (Pydantic)
├── dependencies.py               # FastAPI dependencies
│
├── api/
│   └── routes/
│       ├── __init__.py
│       ├── stream.py             # /api/stream/*
│       ├── search.py             # /api/search
│       ├── browse.py             # /api/browse/*
│       ├── playlist.py           # /api/playlist/*
│       ├── auth.py               # /api/auth/*
│       ├── user.py               # /api/user/*
│       └── lyrics.py             # /api/lyrics/*
│
├── services/
│   ├── __init__.py
│   ├── ytmusic_service.py        # ytmusicapi wrapper
│   ├── ytdlp_service.py          # yt-dlp operations
│   ├── cache_service.py          # Redis operations
│   └── auth_service.py           # JWT handling
│
├── models/
│   ├── __init__.py
│   ├── base.py                   # SQLAlchemy base
│   ├── user.py                   # User model
│   ├── playlist.py               # Playlist model
│   ├── liked_song.py             # LikedSong model
│   └── history.py                # History model
│
├── schemas/
│   ├── __init__.py
│   ├── song.py                   # Song schemas
│   ├── user.py                   # User schemas
│   ├── playlist.py               # Playlist schemas
│   └── common.py                 # Shared schemas
│
├── db/
│   ├── __init__.py
│   ├── session.py                # Database session
│   └── migrations/               # Alembic migrations
│
└── core/
    ├── __init__.py
    ├── security.py               # Password/JWT utils
    ├── exceptions.py             # Custom exceptions
    └── logging.py                # Logging config
```

---

## State Management Philosophy

### Zustand Store Separation

We use multiple specialized stores instead of one global store for:

1. **Performance** — Only components subscribing to specific stores re-render
2. **Code organization** — Each store has clear responsibilities
3. **Maintainability** — Easier to debug and test isolated stores

### Store Responsibilities

| Store | State | Actions |
|-------|-------|---------|
| **playerStore** | currentSong, queue, isPlaying, progress | play(), pause(), next(), seekTo() |
| **uiStore** | theme, sidebarCollapsed, modals | toggleTheme(), openQueue() |
| **userStore** | user, likedSongs, playlists | likeSong(), createPlaylist() |

### State Flow Rules

1. **Server state** → TanStack Query (caching, background updates)
2. **Client state** → Zustand (UI interactions, ephemeral data)
3. **URL state** → Next.js router (filters, pagination)
4. **Persistent state** → localStorage (user preferences, settings)

---

## Caching Strategy

### Multi-Layer Caching

```
┌────────────────────────────────────────────────────────┐
│  Layer 1: Browser Cache (static assets, images)       │
│  • Next.js Image optimization                        │
│  • Browser HTTP cache for thumbnails                 │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│  Layer 2: TanStack Query (API response cache)         │
│  • Stale-while-revalidate pattern                      │
│  • Configurable staleTime per query                  │
│  • Automatic background refetching                   │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│  Layer 3: Redis (Backend cache)                       │
│  • Stream URLs: 6 hours TTL                           │
│  • Search results: 10 minutes TTL                    │
│  • Home feed: 30 minutes TTL                         │
│  • Lyrics: 24 hours TTL                            │
└────────────────────────────────────────────────────────┘
```

### Cache Invalidation

| Data Type | Stale Time | Cache Time | Invalidation Trigger |
|-----------|------------|------------|---------------------|
| Home feed | 5 min | 30 min | Manual refresh |
| Search | 2 min | 10 min | New search query |
| Song metadata | 1 hour | 6 hours | Never (static) |
| Stream URL | N/A | 6 hours | Song change (new fetch) |
| Lyrics | 24 hours | 7 days | Never (static) |
| User liked | 0 | N/A | Mutation success |
| Playlists | 30 sec | 5 min | CRUD operations |

---

## API Contract Summary

### Response Format

All API responses follow this structure:

```typescript
// Success
{
  "data": T,
  "meta"?: {
    "page": number,
    "limit": number,
    "total": number
  }
}

// Error
{
  "error": {
    "message": string,
    "code": string,
    "retryable": boolean
  }
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created (new resource) |
| 302 | Redirect (stream URLs) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing JWT) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (resource doesn't exist) |
| 429 | Too Many Requests (rate limited) |
| 451 | Unavailable For Legal Reasons (geo-blocked) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (yt-dlp outdated) |

---

## Security Architecture

### Authentication Flow

```
User Login
    │
    ▼
Google OAuth
    │
    ▼
JWT Token Generated (backend)
    │
    ▼
Token sent as httpOnly cookie
    │
    ▼
Frontend stores session in memory
    │
    ▼
Each API request includes cookie
    │
    ▼
Backend validates JWT signature
    │
    ▼
Request authorized
```

### Security Measures

1. **CORS** — Whitelist origins only
2. **Rate Limiting** — 60 req/min per IP
3. **Input Validation** — Pydantic schemas
4. **SQL Injection Prevention** — SQLAlchemy ORM
5. **XSS Prevention** — Content Security Policy
6. **CSRF Prevention** — SameSite cookies

---

## Deployment Architecture

### Docker Compose Setup

```yaml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80"]
    depends_on: [frontend, backend]

  frontend:
    build: ./frontend
    environment:
      - BACKEND_URL=http://backend:8000

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379

  redis:
    image: redis:7-alpine
    volumes: ["redis_data:/data"]

  postgres:
    image: postgres:16-alpine
    volumes: ["postgres_data:/var/lib/postgresql/data"]
```

---

*Last updated: 2026-04-05*
