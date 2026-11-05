# VADO — Short-form Video Social Network

A fully functional, TikTok-inspired short-form video platform with its own futuristic **dark glassmorphism** identity. Built with Next.js (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide, PostgreSQL + Drizzle ORM, and a local object-storage adapter with HTTP-Range video delivery.

## Quick start

```bash
npm install
npx drizzle-kit push          # apply schema to PostgreSQL
npx tsx --env-file=.env scripts/seed.ts   # optional: real demo footage + records (idempotent)
npm run build && npm start
```

### Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `STORAGE_DIR` | Object-storage directory for media | `./storage` |
| `MAX_VIDEO_BYTES` | Upload size cap | `157286400` (150 MB) |
| `SMTP_URL` | When set, mail links are emailed instead of surfaced via the dev outbox | unset |

### Seeded accounts (real DB records, created by `scripts/seed.ts`)

- **Admin** — `admin@vado.app` / `VadoAdmin#2026` (moderation console at `/admin`; no public admin registration exists)
- **Demo viewer** — `demo@vado.app` / `vadodemo123` (also available via the “Explore with the demo account” button)
- Creators (`nova.frames`, `kai.motion`, `tide.loops`, `lumiere.kitchen`, `drift.city`, `aria.waves`) — password `vadocreator123`

All feeds, counts, trends and analytics are computed live from the database — nothing is hardcoded in the UI. Footage is licensed Pexels stock downloaded into object storage by the seed script.

## Phase 1 — delivered

- **Guest-first onboarding** with atmospheric landing page, live platform stats, and open browsing
- **Auth**: registration (with interest selection), login, logout, scrypt password hashing, httpOnly session cookies, email verification + password recovery (token flows with a dev mail outbox when SMTP is absent), session management/revocation
- **Feeds**: For You (transparent heuristic ranker: engagement + completion + interests + watch history + follows + recency − seen penalty) and Following; vertical snap scrolling, autoplay, tap pause, double-tap like, seek bar, mute, keyboard control (↑ ↓ Space M L)
- **Create**: device upload with drag & drop + progress, camera recording (MediaRecorder), preview, cover-frame extraction/picker/custom cover, captions & hashtags, categories, sound titles, visibility (public/followers/private), drafts (save/resume/delete), publish
- **Social**: likes, comments + threaded replies + deletion rights, follows, saves, reposts, shares (copy/native/in-app DM), hashtag pages, watch-event tracking
- **Profiles**: avatar upload, bio, interests, stats, tabs (Videos/Liked/Saved/Reposts) with privacy locking, block & report
- **Discover**: live search (videos/users/hashtags/sounds) with suggestions & recent searches, trending hashtags (7-day window), categories with real counts, creator suggestions
- **Inbox**: real notifications (like/comment/reply/follow/mention/message/system) with unread badges + optional desktop notifications; **1-to-1 messaging** with polling, read receipts and video sharing (Phase 2 core started early)
- **Moderation**: reports on videos/comments/users, admin console (analytics from real events, user suspend/restore, content removal, report queue, audit log)
- **Security**: server-side validation everywhere, ownership checks on media assets, rate limiting, path-traversal-safe streaming, block enforcement in every feed query, no admin self-registration

## Architecture

```
src/app/api/*        REST route handlers (auth, feed, videos, comments, users,
                     search, discover, notifications, conversations, admin, media)
src/lib/auth.ts      scrypt hashing, sessions, one-time tokens, mail adapter
src/lib/videos.ts    feed queries + recommendation module (isolated, replaceable)
src/lib/storage.ts   object-storage adapter (save/stream/remove) + ffmpeg hook
src/lib/notify.ts    notification + audit-log pipeline
src/db/schema.ts     20 tables: users, sessions, auth_tokens, media_assets, videos,
                     categories, hashtags, likes, saves, reposts, comments, follows,
                     blocks, watch_events, notifications, reports, audit_logs,
                     conversations, participants, messages (+ email outbox)
storage/             media objects, delivered via /api/media?key=… with Range support
scripts/seed.ts      idempotent real-data seed (downloads footage, inserts records)
```

**Video processing**: when `ffmpeg` is available on the host, uploads are normalized to H.264 MP4 (≤720p, faststart) and posters are extracted server-side. Without ffmpeg, browser-compatible originals are stored and the client-extracted cover frame is used — playback and seeking work in both modes.

## Known limitations / next phases

- Messaging is text + video-share with 5s polling; voice notes, calls and WebSocket transport are Phase 2.
- Email delivery uses a dev outbox unless `SMTP_URL` is configured; links are surfaced in-product.
- Rate limiting is in-memory (single instance); swap for Redis when scaling horizontally.
- Recommendation ranking is a transparent heuristic, not a learned model.
- No live streaming, billing or payouts (explicitly out of scope for Phase 1).

## Validation

`npx next typegen`, `tsc --noEmit`, and `next build` all pass; `/api/health` reports database connectivity.