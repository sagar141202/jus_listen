# Product Requirements Document: tuniq

## Document Information
- **Product Name:** tuniq
- **Version:** 1.0.0
- **Date:** 2026-04-05
- **Status:** Draft

---

## 1. Problem Statement

### Current Pain Points
1. **Advertisement overload** — YouTube Music Free has frequent audio and video ads that interrupt listening
2. **Paywall limitations** — Premium features (background play, downloads, offline mode) require subscription
3. **Privacy concerns** — Streaming platforms collect extensive listening data for profiling
4. **Platform dependency** — Users locked into ecosystems (Google, Spotify, Apple)
5. **No self-hosting option** — Users cannot run their own music server

### Target User Personas

**Persona 1: Privacy-Conscious Listener (Alex, 28)**
- Tech-savvy software developer
- Uses ad-blockers, cares about data privacy
- Wants music without algorithmic tracking
- Self-hosts other services (Nextcloud, Jellyfin)

**Persona 2: Cost-Conscious Student (Jordan, 21)**
- Cannot afford multiple streaming subscriptions
- Listens to music while studying (needs no interruptions)
- Uses YouTube Music but frustrated with ads
- Wants premium features without the cost

**Persona 3: Audio Enthusiast (Sam, 35)**
- Values audio quality and playback features
- Wants crossfade, equalizer, gapless playback
- Curates extensive playlists
- Wants full control over their library

---

## 2. Product Vision

**tuniq** is a self-hosted, ad-free music streaming application that provides a premium listening experience without subscription fees. It mirrors the familiar UI/UX of YouTube Music while giving users complete control over their data and playback experience.

**Tagline:** *Your music. No limits. No ads.*

---

## 3. Core Features

### P0 — Must Have (MVP)
| Feature | Description | Priority |
|---------|-------------|----------|
| Audio Streaming | Stream songs from YouTube Music via yt-dlp extraction | P0 |
| Search | Full-text search for songs, albums, artists, playlists | P0 |
| Player Controls | Play, pause, seek, next, previous, shuffle, repeat | P0 |
| Queue Management | Add, remove, reorder songs in queue | P0 |
| Home Feed | Quick picks, listen again, trending, new releases | P0 |
| Basic Auth | Google OAuth + Guest mode | P0 |
| Responsive UI | Works on desktop, tablet, mobile | P0 |

### P1 — High Priority (Post-MVP)
| Feature | Description | Priority |
|---------|-------------|----------|
| Lyrics | Time-synced lyrics display | P1 |
| Playlists | Create, edit, delete custom playlists | P1 |
| Liked Songs | Save and manage liked tracks | P1 |
| Listening History | Track and display play history | P1 |
| Crossfade | Smooth transitions (1-12s configurable) | P1 |
| Sleep Timer | Auto-pause after set duration | P1 |
| Equalizer | 5-band EQ with presets | P1 |
| Keyboard Shortcuts | Full keyboard navigation | P1 |

### P2 — Medium Priority (Enhancement)
| Feature | Description | Priority |
|---------|-------------|----------|
| Waveform Visualizer | Animated audio visualization | P2 |
| Gapless Playback | Seamless album playback | P2 |
| PWA Support | Installable app, offline caching | P2 |
| Smart Radio | Auto-generated recommendations | P2 |
| Mini Player | Floating compact player | P2 |
| Theme Customization | Dark/Light/System modes | P2 |

### P3 — Low Priority (Future)
| Feature | Description | Priority |
|---------|-------------|----------|
| Podcasts | Podcast browsing and playback | P3 |
| Import/Export | Spotify/Apple Music playlist import | P3 |
| Social Features | Share playlists, follow users | P3 |
| Collaborative Playlists | Multiple editors per playlist | P3 |

---

## 4. Non-Functional Requirements

### Performance
- **First Contentful Paint:** < 1.5 seconds
- **Time to Interactive:** < 3 seconds
- **Lighthouse Performance Score:** 90+
- **Audio Start Time:** < 2 seconds from click
- **Search Response Time:** < 500ms (cached)

### Accessibility
- **WCAG Compliance:** 2.1 Level AA
- **Keyboard Navigation:** All features accessible without mouse
- **Screen Reader Support:** ARIA labels, semantic HTML
- **Color Contrast:** Minimum 4.5:1 for normal text
- **Focus Indicators:** Visible focus states on all interactive elements

### Security
- **Authentication:** JWT with httpOnly cookies
- **Rate Limiting:** 60 requests/minute per IP
- **CORS:** Strict origin checking
- **Input Validation:** Sanitize all user inputs
- **No Credential Exposure:** YTM cookies never exposed to frontend

### Reliability
- **Uptime Target:** 99.9% (self-hosted dependent)
- **Graceful Degradation:** Works without auth, handles API failures
- **Error Recovery:** Auto-retry failed streams, queue continues on error
- **Browser Support:** Latest Chrome, Firefox, Safari, Edge

---

## 5. User Flows

### Flow 1: First-Time User
1. Lands on tuniq homepage
2. Sees Quick Picks and trending music
3. Clicks a song to play
4. Optional: Signs in with Google or continues as guest
5. Can like songs, create playlists (requires auth)

### Flow 2: Search and Play
1. User clicks search bar
2. Types query, sees suggestions
3. Presses Enter or clicks result
4. Song starts playing
5. Queue auto-populates with related songs

### Flow 3: Playlist Management
1. User goes to Library → Playlists
2. Clicks "New Playlist"
3. Names playlist, adds description
4. Adds songs via search within playlist
5. Reorders songs via drag-drop

### Flow 4: Settings Configuration
1. User clicks Settings
2. Adjusts theme, audio quality
3. Sets crossfade duration
4. Configures equalizer preset
5. Sets sleep timer

---

## 6. Technical Constraints

### Backend
- Must use yt-dlp for audio extraction (most reliable)
- Must cache stream URLs (expire ~6 hours)
- Must handle YouTube rate limiting gracefully
- Async operations for non-blocking I/O

### Frontend
- Next.js App Router required
- Server Components for initial data fetch
- Client Components for interactive elements
- Zustand for client state (not Redux)

### Infrastructure
- Docker Compose for single-command setup
- Hot reload in development mode
- Volume mounts for persistence

---

## 7. Out of Scope

The following features are explicitly **not** in scope for v1.0:

1. **Direct music uploads** — tuniq is a streaming frontend, not a music storage service
2. **Video playback** — Audio only (no music videos)
3. **Live radio stations** — On-demand content only
4. **Social features** — No following, commenting, or public profiles
5. **Mobile native apps** — PWA only for mobile
6. **High-res audio** — Limited by YouTube Music source quality
7. **Multi-user instances** — Single-user self-hosting (for now)

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first play | < 10s | From page load to audio start |
| Search success rate | > 95% | Successful searches / total searches |
| Stream reliability | > 98% | Successful stream starts / attempts |
| User retention | > 70% | Return within 7 days |
| Lighthouse score | > 90 | Performance audit |
| Bundle size | < 500KB | Initial JS bundle |

---

## 9. Edge Cases and Failure Modes

### Audio Stream Failures
| Scenario | Behavior |
|----------|----------|
| URL expired mid-playback | Detect 403, re-fetch stream, resume from position |
| Video geo-blocked | Show error: "This song is unavailable in your region" |
| Video deleted/removed | Show error: "This song is no longer available", skip to next |
| Network interruption | Pause, show "Reconnecting...", auto-retry every 3s |
| Rate limited by YouTube | Back off exponentially, show retry countdown |

### UI Edge Cases
| Scenario | Behavior |
|----------|----------|
| Very long song title | Truncate with ellipsis, show full on hover |
| Missing album art | Generate color placeholder with artist initial |
| No lyrics available | Show "Lyrics not available" with feedback option |
| Empty search results | Show "No results" with search tips |
| Guest mode limitations | Disable like/playlist buttons, show "Sign in to save" |

### Playback Edge Cases
| Scenario | Behavior |
|----------|----------|
| Rapid next/prev clicks | Debounce 300ms to prevent race conditions |
| Queue ends | Fetch auto-play suggestions from related songs |
| Browser autoplay blocked | Show "Click to start listening" overlay |
| Audio context suspended | Re-initialize on next user interaction |
| Multiple tabs open | Sync play state via BroadcastChannel API |

---

## 10. Legal and Compliance

### Disclaimer
- This software is for **personal and educational use only**
- Not affiliated with, endorsed by, or sponsored by YouTube/Google
- Users must comply with YouTube's Terms of Service
- Self-hosting intended for personal use only
- Do not distribute publicly or use for commercial purposes

### Data Privacy
- No analytics or tracking by default
- All user data stored locally (PostgreSQL)
- No data shared with third parties
- OAuth only for authentication (no Google API data access)

---

## 11. Release Criteria

### Alpha (Internal Testing)
- [ ] Basic streaming works
- [ ] Search functional
- [ ] Player controls working
- [ ] Auth flow complete

### Beta (Limited Release)
- [ ] All P0 features complete
- [ ] Lyrics working
- [ ] Playlists functional
- [ ] Mobile responsive
- [ ] Documentation complete

### v1.0 (Public Release)
- [ ] All P1 features complete
- [ ] PWA installable
- [ ] Lighthouse 90+
- [ ] Accessibility audit passed
- [ ] No critical bugs

---

## 12. Appendix

### Related Documents
- [TECHSTACK.md](TECHSTACK.md) — Technology decisions
- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) — Architecture details
- [TODO.md](TODO.md) — Development checklist

### References
- [yt-dlp documentation](https://github.com/yt-dlp/yt-dlp)
- [ytmusicapi documentation](https://ytmusicapi.readthedocs.io/)
- [YouTube Music](https://music.youtube.com/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

*Last updated: 2026-04-05*
