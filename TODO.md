# tuniq Development Checklist

## Phase 0: Documentation
- [x] README.md
- [x] TODO.md
- [x] PRD.md
- [x] TECHSTACK.md
- [x] PROJECT_OVERVIEW.md

## Phase 1: Project Scaffold, Docker Setup, Base Layout
- [x] Initialize monorepo structure
- [x] Create docker-compose.yml with 5 services (nginx, frontend, backend, redis, postgres)
- [x] Create docker-compose.dev.yml with hot reload
- [x] Write nginx.conf for reverse proxy
- [x] Create .env.example
- [x] Create .gitignore
- [x] Frontend: Initialize Next.js 15 with TypeScript
- [x] Frontend: Install and configure Tailwind CSS v4
- [x] Frontend: Install shadcn/ui and base components
- [x] Frontend: Install Framer Motion, Zustand, TanStack Query
- [x] Backend: Create FastAPI project structure
- [x] Backend: Write requirements.txt with all dependencies
- [x] Backend: Configure pyproject.toml
- [x] Backend: Set up basic FastAPI main.py with health check
- [x] Test: docker compose up --build works end-to-end
- [x] Commit Phase 1

## Phase 2: Audio Streaming Pipeline (yt-dlp + FastAPI proxy)
- [x] Create ytdlp_service.py with ThreadPoolExecutor
- [x] Implement GET /api/stream/{video_id} with Redis caching (6h TTL)
- [x] Handle edge cases: geo-blocked (451), deleted (404), rate limit (429)
- [x] Add Range header support for seeking via /api/stream/{video_id}/proxy
- [x] Add StreamInfo dataclass with metadata (title, artist, thumbnail, duration)
- [x] Add stream health check endpoint /api/stream/{video_id}/health
- [x] Test stream extraction and playback in browser
- [x] Commit Phase 2

## Phase 3: YT Music API Integration (search, browse, recommendations)
- [x] Create ytmusic_service.py wrapper for ytmusicapi
- [x] Implement GET /api/search with caching (10min)
- [x] Implement GET /api/browse/home (quick picks, listen again)
- [x] Implement GET /api/browse/song/{video_id} with queue suggestions
- [x] Implement GET /api/browse/artist/{artist_id}
- [x] Implement GET /api/browse/album/{album_id}
- [x] Implement GET /api/browse/playlist/{playlist_id}
- [x] Implement GET /api/lyrics/{video_id}
- [x] Add rate limiting (slowapi, 60 req/min per IP)
- [ ] Commit Phase 3

## Phase 4: Player UI (waveform, controls, queue, progress)
- [ ] Create base layout (Sidebar + Main + Now Playing Bar)
- [ ] Build Song Card component with context menu
- [ ] Build Now Playing Bar with controls
- [ ] Build Full Screen Player with wave visualizer
- [ ] Build Queue Panel with drag-to-reorder
- [ ] Build Lyrics component with auto-scroll
- [ ] Create audioEngine module (HTMLAudioElement, Web Audio API)
- [ ] Implement playerStore (Zustand)
- [ ] Implement uiStore (Zustand)
- [ ] Test: Play, pause, seek, queue, lyrics all working
- [ ] Commit Phase 4

## Phase 5: Auth (Google OAuth + JWT + guest mode)
- [ ] Set up NextAuth.js with Google OAuth provider
- [ ] Implement POST /api/auth/google
- [ ] Implement GET /api/auth/me
- [ ] Implement POST /api/auth/logout
- [ ] Create userStore (Zustand)
- [ ] Build login/guest mode UI
- [ ] Protect user-specific routes
- [ ] **ASK USER:** Confirm Google OAuth credentials ready before proceeding
- [ ] Commit Phase 5

## Phase 6: Library, Playlists, Liked Songs, History
- [ ] Set up PostgreSQL with SQLAlchemy 2.0 async
- [ ] Create User, Playlist, LikedSong, History models
- [ ] Run initial Alembic migration
- [ ] Implement GET /api/user/liked
- [ ] Implement POST /api/user/like/{video_id}
- [ ] Implement GET /api/user/history
- [ ] Implement GET /api/user/playlists
- [ ] Implement POST /api/user/playlists
- [ ] Implement playlist track add/remove endpoints
- [ ] Build Library page with tabs
- [ ] Build Playlist page (view/edit)
- [ ] Commit Phase 6

## Phase 7: Lyrics, Sleep Timer, Crossfade, Equalizer
- [ ] Implement crossfade in audioEngine (dual Audio elements)
- [ ] Build Sleep Timer UI and logic
- [ ] Implement 5-band equalizer using Web Audio API
- [ ] Add EQ presets (Pop, Rock, Classical, Bass boost, Vocal boost)
- [ ] Build Settings page with all audio options
- [ ] Test crossfade with various song transitions
- [ ] Commit Phase 7

## Phase 8: PWA, Offline Caching, Service Worker
- [ ] Configure next-pwa
- [ ] Create manifest.json
- [ ] Set up service worker caching strategies
- [ ] Implement offline banner
- [ ] Implement background sync for queued actions
- [ ] Test install prompt and offline playback
- [ ] Commit Phase 8

## Phase 9: Performance, Error Boundaries, Accessibility
- [ ] Add error boundaries with React Error Boundary
- [ ] Implement virtual scrolling for long lists (react-virtual)
- [ ] Add proper ARIA labels and keyboard navigation
- [ ] Ensure color contrast ratios (WCAG 2.1 AA)
- [ ] Add loading skeletons for all async content
- [ ] Run Lighthouse audit (target: 90+)
- [ ] Commit Phase 9

## Phase 10: Polish, Animations, Final QA
- [ ] Fine-tune liquid glass background animation
- [ ] Add remaining Framer Motion transitions
- [ ] Polish mobile responsive design
- [ ] Add keyboard shortcuts reference modal
- [ ] Write integration tests for critical paths
- [ ] Final end-to-end QA testing
- [ ] Update all documentation with final screenshots
- [ ] Commit Phase 10
- [ ] Create v1.0.0 tag

## Nice to Have (Post-MVP)
- [ ] Cast to device (Chromecast)
- [ ] Last.fm scrobbling
- [ ] Import Spotify/Apple Music playlists
- [ ] Collaborative playlists
- [ ] Audio normalization
- [ ] Smart playlists (auto-generated)
- [ ] Podcast support
- [ ] Multi-language support
