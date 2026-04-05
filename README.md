# tuniq

> Your music. No limits. No ads.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**tuniq** is a self-hosted, ad-free music streaming web application that mirrors YouTube Music's UI/UX and algorithm — but runs completely free with no ads, no paywalls, and all premium features unlocked. Stream millions of songs directly from YouTube Music without commercial interruption.

![tuniq screenshot](docs/screenshots/home.png)

## What is tuniq?

- **YouTube Music interface** — Quick picks, listen again, smart radio, related songs, queues, playlists, and lyrics
- **100% free** — No subscriptions, no ads, no data collection
- **Self-hosted** — Run it on your own server or localhost
- **Premium features unlocked** — Crossfade, sleep timer, equalizer, offline mode, and more
- **Privacy-first** — Your listening history stays on your own machine

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Zustand, TanStack Query v5, shadcn/ui |
| **Backend** | Python 3.12, FastAPI, yt-dlp, ytmusicapi, SQLAlchemy 2.0 |
| **Database** | PostgreSQL 16 (user data), Redis 7 (cache + sessions) |
| **Proxy** | nginx (reverse proxy) |
| **Deployment** | Docker Compose |

## Prerequisites

- **Docker Desktop** (Mac/Windows) or Docker Engine + Docker Compose (Linux)
- **Node.js 20+** (for local development)
- **Python 3.11+** (for local development)
- A **Google OAuth 2.0** client (for authentication — optional, app works in guest mode)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/sagar141202/jus_listen.git
cd jus_listen

# Copy environment file
cp .env.example .env

# Edit .env with your Google OAuth credentials (optional for guest mode)
# nano .env

# Start all services
docker compose up --build

# Open in browser
open http://localhost:3000
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Random string for JWT signing | (required) |
| `NEXTAUTH_URL` | Your app URL | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | (optional) |
| `POSTGRES_USER` | PostgreSQL username | `tuniq` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `tuniq` |
| `POSTGRES_DB` | PostgreSQL database name | `tuniq` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379/0` |
| `BACKEND_URL` | Internal backend URL | `http://backend:8000` |
| `YTM_COOKIE` | YouTube Music cookie (optional) | (optional) |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

## Features

### Core Experience
- ✅ **Home feed** — Quick picks, listen again, trending, new releases
- ✅ **Smart search** — Songs, albums, artists, playlists
- ✅ **Full player** — Play/pause, seek, shuffle, repeat, queue
- ✅ **Lyrics** — Time-synced with auto-scroll
- ✅ **Queue management** — Reorder, remove, add to queue

### Premium Features (All Free)
- ✅ **Crossfade** — Smooth transitions between songs (0-12s)
- ✅ **Sleep timer** — Stop playback after set time
- ✅ **5-band equalizer** — With presets (Pop, Rock, Classical, Bass boost, etc.)
- ✅ **Waveform visualizer** — Animated bars in fullscreen player
- ✅ **Gapless playback** — Preload next song for seamless transitions
- ✅ **Keyboard shortcuts** — Space, arrows, media keys support

### Library & Playlists
- ✅ **Liked songs** — Synced to your account
- ✅ **Listening history** — Track what you've played
- ✅ **Custom playlists** — Create, edit, reorder
- ✅ **Import/Export** — Share playlists as JSON

### PWA & Offline
- ✅ **Installable app** — Add to home screen
- ✅ **Offline caching** — Browse cached content when offline
- ✅ **Background sync** — Queue actions replay when back online

### UI/UX
- ✅ **Liquid glass background** — Animated color morphing from album art
- ✅ **Dark/Light themes** — System-aware with manual toggle
- ✅ **Responsive design** — Desktop, tablet, mobile
- ✅ **Smooth animations** — Framer Motion throughout

## Screenshots

| Home | Player | Queue |
|------|--------|-------|
| ![Home](docs/screenshots/home.png) | ![Player](docs/screenshots/player.png) | ![Queue](docs/screenshots/queue.png) |

| Search | Artist | Lyrics |
|--------|--------|--------|
| ![Search](docs/screenshots/search.png) | ![Artist](docs/screenshots/artist.png) | ![Lyrics](docs/screenshots/lyrics.png) |

## Architecture

```
┌─────────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   nginx     │────▶│   FastAPI       │
│   (Port 3000)   │◀────│  (Port 80)  │◀────│   (Port 8000)   │
└─────────────────┘     └─────────────┘     └────────┬────────┘
                                                     │
                            ┌──────────────────────┼────────┐
                            ▼                      ▼         ▼
                      ┌──────────┐           ┌────────┐ ┌──────────┐
                      │ PostgreSQL│           │ Redis  │ │ YouTube  │
                      │ (User    │           │ (Cache │ │ Music    │
                      │  Data)   │           │ + Sess)│ │ API      │
                      └──────────┘           └────────┘ └──────────┘
```

See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for detailed architecture documentation.

## Development

```bash
# Run in development mode with hot reload
docker compose -f docker-compose.dev.yml up

# Frontend only (requires backend running)
cd frontend
npm install
npm run dev

# Backend only (requires postgres + redis)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Legal Disclaimer

**This software is for personal and educational use only.**

- tuniq streams audio directly from YouTube Music using yt-dlp and ytmusicapi
- This project is not affiliated with, endorsed by, or sponsored by YouTube or Google
- Users are responsible for complying with YouTube's Terms of Service and applicable copyright laws
- The maintainers do not encourage or support piracy
- Self-hosting is intended for personal use within your own network

## License

[MIT](LICENSE) © Sagar Maddi

---

Built with ❤️ for music lovers everywhere.
