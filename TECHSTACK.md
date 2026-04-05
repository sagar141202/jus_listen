# Technology Stack Document: tuniq

This document outlines all technology choices for tuniq and the reasoning behind each decision.

---

## Frontend Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.x | React framework with App Router |
| **React** | 19.x | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |

**Why Next.js 15?**
- App Router for server-side rendering and streaming
- Built-in optimizations (images, fonts, scripts)
- API routes for serverless functions
- Excellent developer experience with fast refresh
- Mature ecosystem with strong community support

**Why React 19?**
- Latest features including Server Components
- Concurrent rendering for smooth UI
- Actions and transitions for better UX

---

### Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | v4.x | Utility-first CSS framework |
| **shadcn/ui** | Latest | Pre-built accessible components |
| **Lucide React** | Latest | Icon library |

**Why Tailwind CSS v4?**
- Rapid UI development with utility classes
- Consistent design system via configuration
- Tree-shaking removes unused styles
- v4 offers improved performance and new features
- Native CSS cascade layers support

**Why shadcn/ui?**
- Copy-paste components (not a dependency)
- Full control over styling
- Built on Radix UI for accessibility
- Works seamlessly with Tailwind

---

### State Management
| Technology | Purpose |
|------------|---------|
| **Zustand** | Global client state |
| **TanStack Query v5** | Server state caching |
| **Zustand Persist** | LocalStorage persistence |

**Why Zustand over Redux/Context?**
- Minimal boilerplate
- Excellent TypeScript support
- No provider wrapping required
- Small bundle size (~1KB)
- Easy to learn and debug

**Why TanStack Query?**
- Automatic caching and background updates
- Stale-while-revalidate pattern
- Optimistic updates for mutations
- Built-in loading/error states
- DevTools for debugging

---

### Animation
| Technology | Purpose |
|------------|---------|
| **Framer Motion** | React animations |

**Why Framer Motion?**
- Declarative animation API
- Layout animations for smooth transitions
- Gesture support (drag, hover, tap)
- AnimatePresence for mount/unmount
- Hardware-accelerated transforms

---

### Form Handling
| Technology | Purpose |
|------------|---------|
| **React Hook Form** | Form state management |
| **Zod** | Schema validation |

**Why React Hook Form + Zod?**
- Performance (minimizes re-renders)
- Type-safe form handling
- Excellent validation with Zod
- Small bundle size

---

### Audio Visualization
| Technology | Purpose |
|------------|---------|
| **Web Audio API** | Audio analysis and processing |
| **Canvas API** | Waveform rendering |
| **fast-average-color** | Album art color extraction |

---

## Backend Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.12 | Programming language |
| **FastAPI** | 0.115+ | Web framework |
| **Uvicorn** | Latest | ASGI server |

**Why FastAPI?**
- Async/await native support
- Automatic API documentation (OpenAPI/Swagger)
- Type hints with Pydantic validation
- High performance (Starlette foundation)
- Excellent error handling

**Why Python 3.12?**
- Latest language features (improved f-strings, generics)
- Performance improvements
- yt-dlp and ytmusicapi compatibility

---

### Database
| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 16 | Primary database |
| **SQLAlchemy** | 2.0 | ORM |
| **Alembic** | Latest | Database migrations |
| **asyncpg** | Latest | Async PostgreSQL driver |

**Why PostgreSQL?**
- Robust, production-proven
- Excellent JSON support for flexible schemas
- Full-text search capabilities
- ACID compliance for data integrity

**Why SQLAlchemy 2.0?**
- Modern async support
- Type-safe ORM queries
- Powerful query builder
- Migration support via Alembic

---

### Caching & Sessions
| Technology | Version | Purpose |
|------------|---------|---------|
| **Redis** | 7 | Cache and session store |
| **redis-py** | Latest | Redis client |

**Why Redis?**
- Sub-millisecond latency
- Built-in TTL for automatic expiration
- Perfect for stream URL caching (6h TTL)
- Session storage with expiration
- Lightweight and fast

---

### YouTube Integration
| Technology | Purpose |
|------------|---------|
| **yt-dlp** | Audio stream extraction |
| **ytmusicapi** | YouTube Music metadata |

**Why yt-dlp?**
- Most actively maintained youtube-dl fork
- Best audio extraction quality
- Frequent updates for site changes
- Format selection options
- Rate limiting and retry support

**Why ytmusicapi?**
- Unofficial but reliable YTMusic API
- No API key required
- Search, browse, recommendations
- Playlist and library access
- Cookie-based authentication

---

### Security
| Technology | Purpose |
|------------|---------|
| **python-jose** | JWT token handling |
| **passlib** | Password hashing (if needed) |
| **slowapi** | Rate limiting |
| **httpx** | Async HTTP client |

---

## Infrastructure

### Containerization
| Technology | Purpose |
|------------|---------|
| **Docker** | Container runtime |
| **Docker Compose** | Multi-container orchestration |

**Services:**
1. **nginx** — Reverse proxy, static file serving
2. **frontend** — Next.js development server
3. **backend** — FastAPI application
4. **redis** — Cache and session store
5. **postgres** — User data persistence

### Reverse Proxy
| Technology | Purpose |
|------------|---------|
| **nginx** | Load balancing, SSL termination, routing |

**nginx responsibilities:**
- Route `/api/*` to FastAPI backend
- Route `/` to Next.js frontend
- Serve static files efficiently
- WebSocket support for real-time features

---

## Development Tools

### Code Quality
| Tool | Purpose |
|------|---------|
| **ESLint** | JavaScript/TypeScript linting |
| **Prettier** | Code formatting |
| **Ruff** | Python linting (replaces flake8, black, isort) |
| **TypeScript** | Static type checking |

### Git Hooks
| Tool | Purpose |
|------|---------|
| **pre-commit** | Automated checks before commits |

### Testing (Future)
| Tool | Purpose |
|------|---------|
| **Vitest** | Unit testing (frontend) |
| **React Testing Library** | Component testing |
| **pytest** | Python testing |
| **Playwright** | E2E testing |

### CI/CD (Future)
| Tool | Purpose |
|------|---------|
| **GitHub Actions** | Automated testing and deployment |

---

## Dependencies Summary

### Frontend Dependencies
```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^4.0.0",
  "framer-motion": "^11.0.0",
  "zustand": "^5.0.0",
  "@tanstack/react-query": "^5.0.0",
  "axios": "^1.7.0",
  "lucide-react": "latest",
  "fast-average-color": "^9.0.0",
  "zod": "^3.0.0",
  "react-hook-form": "^7.0.0",
  "@hookform/resolvers": "latest"
}
```

### Backend Dependencies
```txt
fastapi==0.115.0
uvicorn[standard]==0.32.0
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
alembic==1.14.0
redis==5.2.0
yt-dlp==2024.12.0
ytmusicapi==1.9.0
pydantic==2.10.0
pydantic-settings==2.6.0
python-jose[cryptography]==3.3.0
slowapi==0.1.9
httpx==0.28.0
python-multipart==0.0.19
```

---

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 120+ |
| Firefox | 121+ |
| Safari | 17+ |
| Edge | 120+ |

**Requirements:**
- ES2022 support
- Web Audio API
- ResizeObserver API
- IntersectionObserver API

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Bundle size (initial) | < 500KB gzipped |
| Time to First Byte | < 200ms |
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Cumulative Layout Shift | < 0.1 |

---

## Security Considerations

1. **CORS** — Strict origin validation
2. **CSRF** — Token-based protection for mutations
3. **XSS** — Output encoding, Content Security Policy
4. **SQL Injection** — Parameterized queries via SQLAlchemy
5. **Rate Limiting** — 60 req/min per IP
6. **Authentication** — JWT with httpOnly cookies
7. **Secrets** — Environment variables only, never committed

---

## Scalability Notes

While tuniq is designed for self-hosted single-user or small-team use:

- **Horizontal:** Multiple instances behind load balancer
- **Caching:** Redis cluster for distributed caching
- **Database:** Read replicas for query scaling
- **CDN:** CloudFront/Cloudflare for static assets

---

*Last updated: 2026-04-05*
