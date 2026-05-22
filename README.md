# Blogs App — Backend

A production-shaped blogging platform API built with **NestJS**. It started as a
CRUD blog and grew into a system that demonstrates real backend engineering:
real-time updates, caching, background jobs, AI features, semantic search and a
full observability stack.

---

## Table of contents

- [Feature overview](#feature-overview)
- [Tech stack](#tech-stack)
- [System design & request flow](#system-design--request-flow)
- [Module map](#module-map)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Running locally](#running-locally)
- [Seeding 2000 blogs](#seeding-2000-blogs)
- [API surface](#api-surface)
- [npm scripts](#npm-scripts)

---

## Feature overview

| Area | What it does |
|---|---|
| **Auth** | JWT auth, role-based access (Reader / Writer / Admin), OTP password reset, `tokenVersion`-based revocation |
| **Blogs & content** | CRUD for blogs, categories, comments, reactions; image upload via Cloudinary |
| **Real-time** | WebSocket gateways for live comments, live reaction counts and typing indicators — scaled across instances with a Redis adapter |
| **Caching** | Cache-aside with Redis on hot reads (single blog, blog list, categories) with TTL + explicit invalidation |
| **Background jobs** | BullMQ on Redis — OTP email is enqueued, not sent inline, with retries and backoff |
| **AI** | Provider-agnostic LLM integration (Gemini / Hugging Face / OpenAI-compatible) for blog summarisation and category suggestion |
| **Semantic search** | Blog content is embedded and stored in Qdrant; `/blogs/:id/related` returns nearest-neighbour recommendations |
| **Observability** | Structured JSON logging (pino + request IDs), Prometheus metrics, OpenTelemetry tracing, health probes |

---

## Tech stack

- **Framework** — NestJS 10 (Express platform)
- **Database** — MongoDB via Mongoose
- **Cache / pub-sub / queue backend** — Redis
- **Queue** — BullMQ
- **Vector store** — Qdrant
- **Real-time** — Socket.IO + `@socket.io/redis-adapter`
- **AI** — OpenAI-compatible SDK (works against Gemini, Hugging Face, OpenAI, OpenRouter, Ollama)
- **Observability** — pino, Prometheus (`prom-client`), OpenTelemetry, `@nestjs/terminus`

---

## System design & request flow

The app is a single NestJS process today, but every component is designed so it
can scale horizontally. Redis is the backbone — it serves **three independent
jobs**: cache, pub/sub for WebSockets, and the BullMQ queue backend.

```
                              ┌──────────────┐
                              │   Clients    │  (Next.js frontend, etc.)
                              └──────┬───────┘
                          HTTP      │      WebSocket
              ┌──────────────────────┴──────────────────────┐
              ▼                                              ▼
   ┌─────────────────────┐                       ┌─────────────────────┐
   │  NestJS HTTP layer  │                       │  Socket.IO gateways │
   │  controllers,       │                       │  comments / react / │
   │  guards, pipes      │                       │  typing             │
   └──────────┬──────────┘                       └──────────┬──────────┘
              │                                              │
              ▼                                              ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                        Service layer                            │
   │   BlogsService · CommentsService · ReactionsService · Auth · …   │
   └───┬───────────┬────────────┬─────────────┬───────────┬──────────┘
       │           │            │             │           │
       ▼           ▼            ▼             ▼           ▼
  ┌─────────┐ ┌─────────┐  ┌─────────┐  ┌──────────┐ ┌──────────┐
  │ MongoDB │ │  Redis  │  │  Redis  │  │  Redis   │ │  Qdrant  │
  │ (source │ │ (cache) │  │(pub/sub)│  │ (BullMQ) │ │ (vectors)│
  │of truth)│ └─────────┘  └────┬────┘  └────┬─────┘ └──────────┘
  └─────────┘                   │            │
                                │            ▼
                      cross-instance     ┌──────────┐
                      broadcast fanout   │  Worker  │  email, etc.
                                         └──────────┘
```

**Key principles applied:**

- **Stateless HTTP** — any instance can serve any request; state lives in Mongo / Redis.
- **DB is the source of truth, the socket is a hint** — clients refetch on reconnect; broadcasts carry full state, not deltas, so a missed event self-heals.
- **Slow work leaves the request path** — email goes through BullMQ; the request returns in milliseconds.
- **Cache-aside everywhere it pays** — hot reads check Redis first, fall back to Mongo, and the cache layer fails open (a Redis outage degrades to slower, not broken).
- **Observability is built in** — every request has a correlation ID; metrics and traces are emitted, not bolted on.

### Request lifecycle example — posting a comment

1. `POST /comments` hits the HTTP layer; JWT guard + roles guard authorise it.
2. `CommentsService` writes the comment to MongoDB and pushes its id onto the blog.
3. The blog's cache keys are invalidated in Redis.
4. `CommentsGateway` broadcasts `commentCreated` — the Redis adapter publishes it so **every** server instance delivers it to its connected clients.
5. A Prometheus counter increments; the whole request is traced and logged with a request id.

---

## Module map

```
src/
├── auth/            JWT auth, roles, OTP, WebSocket auth service
├── blogs/           blog CRUD + AI summarise/auto-tag + semantic related
├── category/        category CRUD (cached)
├── comments/        comment CRUD + live-comment gateway + typing
├── reactions/       reactions + live reaction-count gateway
├── cloudinary/      image upload
├── mail/            BullMQ mail queue + worker
├── cache/           Redis-backed CacheService (global)
├── search/          Qdrant vector-search service (global)
├── ai/              provider-agnostic LLM service (global)
├── metrics/         Prometheus /metrics + custom counters (global)
├── health/          /health/live and /health/ready probes
├── admin/           /admin/dashboard observability snapshot
├── redis-io.adapter.ts   Socket.IO ↔ Redis adapter
├── tracing.ts            OpenTelemetry bootstrap
└── logger.config.ts      pino structured-logging config
```

---

## Prerequisites

- **Node.js 20.x**
- **MongoDB** — local or Atlas
- **Redis** — `brew install redis && brew services start redis`, or `docker run -p 6379:6379 redis`
- **Qdrant** (for semantic search) — `docker run -p 6333:6333 -v ~/qdrant-data:/qdrant/storage qdrant/qdrant`

---

## Environment variables

Create a `.env` in the project root:

```dotenv
# Core
DBURI=mongodb://localhost:27017/blogs-app
PORT=3002
JWT_SECRET=replace-with-a-long-random-secret

# CORS
LOCALHOST=http://localhost:3000
DEPLOYMENTLINK=https://your-frontend-url

# Email (Gmail app password)
EMAIL=you@gmail.com
PASSWORD=your-gmail-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Redis — cache, pub/sub, BullMQ
REDIS_URL=redis://localhost:6379

# Qdrant — vector search
QDRANT_URL=http://localhost:6333

# AI — any OpenAI-compatible provider
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
AI_API_KEY=your-provider-key
AI_MODEL=gemini-2.0-flash
AI_EMBEDDING_MODEL=text-embedding-004

# Observability (optional — traces export here)
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
LOG_LEVEL=debug
```

The app boots even if Redis, Qdrant or the AI provider are unavailable — those
features degrade gracefully rather than crashing the process.

---

## Running locally

```bash
npm install
npm run start:dev          # http://localhost:3002
```

To exercise horizontal scaling (Redis pub/sub + adapter), run two instances:

```bash
PORT=3002 npm run start:dev
PORT=3003 npm run start:dev
```

A comment posted to one is broadcast to clients on the other, via Redis.

---

## Seeding 2000 blogs

`scripts/seed-blogs.ts` generates 2000 topical posts — programming languages,
the MERN stack, Redis, BullMQ and system design — with real, multi-section
content, spread across categories, owned by a dedicated `seed-bot` author.

```bash
npm run seed
```

It is idempotent: it wipes previously seeded posts before inserting fresh ones.
After seeding, populate the vector index so semantic search works:

```
POST /blogs/reindex      (admin JWT required)
```

---

## API surface

| Group | Routes |
|---|---|
| Auth | `POST /auth/login` · `POST /auth/register` · `POST /auth/generateOtp` · `PATCH /auth/verifyOtp` · `POST /auth/changePassword` · `GET /auth/users` · `PATCH /auth/users/:id/role` |
| Blogs | `GET /blogs` · `GET /blogs/admin` · `GET /blogs/userblogs` · `GET /blogs/:id` · `POST /blogs` · `PUT /blogs/:id` · `DELETE /blogs/:id` · `PUT /blogs/approved/:id` · `PUT /blogs/disapproved/:id` |
| Blogs — AI | `POST /blogs/:id/summarize` · `POST /blogs/:id/auto-tag` · `GET /blogs/:id/related` · `POST /blogs/reindex` |
| Categories | `GET /blogscategories` · `POST /blogscategories` · `GET /blogscategories/:id` · `PUT /blogscategories/:id` · `DELETE /blogscategories/:id` |
| Comments | `GET /comments` · `POST /comments` · `PUT /comments/:id` |
| Reactions | `POST /reactions` |
| Ops | `GET /health/live` · `GET /health/ready` · `GET /metrics` · `GET /admin/dashboard` |
| Real-time | Socket.IO gateways: `commentCreated`, `reactionUpdated`, `userTyping` |

---

## npm scripts

| Script | Purpose |
|---|---|
| `npm run start:dev` | Run with hot reload |
| `npm run start:prod` | Run the compiled build |
| `npm run build` | Compile to `dist/` |
| `npm run seed` | Generate 2000 blog posts |
| `npm run lint` | ESLint with autofix |
| `npm test` | Unit tests |

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
