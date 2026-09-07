# 📚 Folio — Personal Library & Book Tracker

Track the books you read, wrap them in official cover art, and arrange them on a
beautiful **3D wooden bookshelf**. Folio is a full-stack reading companion with
authentication, per-user libraries, reading statistics, and a seeded demo shelf
so it feels alive from the very first load.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-149eca)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-336791)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## ✨ Features

- **3D bookshelf** — books rendered as CSS-3D hardcovers: spine thickness follows
  the real page count, cover art wraps around the spine, hover pulls a book into
  the light
- **Official cover art** — live search resolves covers from the Open Library
  catalog; typographic cloth-binding fallback when a title has none
- **Full CRUD** — add via live book search or manually, edit, rate with stars,
  track page progress (auto reading logs), statuses, notes ("marginalia")
- **Book counter & insights** — animated counters, yearly reading-goal ring,
  12-month charts, 26-week pages heatmap, genre donut, day streaks
- **Authentication** — signup/login with scrypt-hashed passwords and 30-day
  httpOnly sessions, plus a one-click demo account
- **Feel** — sidebar dashboard, optimistic updates with rollback, toasts,
  per-page loading skeletons, crafted empty states, fully responsive

## 🚀 Demo account

| Email | Password |
|---|---|
| `demo@folio.app` | `bookworm` |

Or press **"Browse the demo shelf"** on the login page — no typing required.
(Seeded with 22 real titles, 192 reading logs, and 19 resolved covers.)

## 🧱 Tech stack

- **Next.js 16** (App Router, RSC, route handlers) + **React 19**
- **PostgreSQL** via **Drizzle ORM** (`pg` pool tuned for serverless/Neon)
- **Tailwind CSS 4** design system, Fraunces + Inter type, Lucide icons
- **Open Library** Search & Covers APIs (no key required)
- Self-provisioning: on boot, the instrumentation hook creates tables and seeds
  the demo library **if the database is empty** (idempotent DDL)

## 🛠️ Run locally

```bash
# 1. install dependencies
npm install

# 2. configure the database
cp .env.example .env
#    → paste your Postgres URL into DATABASE_URL (Neon pooled string works great)

# 3. apply the schema (optional — the app self-creates tables on first boot too)
npx drizzle-kit push

# 4. start developing
npm run dev          # http://localhost:3000
```

Production: `npm run build && npm run start` · Health check: `GET /api/health`

## 🔐 Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string. Neon: use the **pooled** endpoint (`-pooler` host, includes `?sslmode=require`). |
| `FOLIO_DISABLE_SEED` | — | Set to `1` to skip demo-library seeding on a fresh database. |

## ☁️ Deploy (free)

> **New to Git/GitHub?** Start with [`GITHUB_SETUP.md`](GITHUB_SETUP.md) — a
> complete step-by-step walkthrough from installing Git to auto-deploys.

- **App**: [Vercel](https://vercel.com) — import this repo, add `DATABASE_URL`, deploy. Every push to `main` auto-deploys; PRs get preview URLs.
- **Database**: [Neon](https://neon.tech) — free tier (0.5 GB) is effectively
  unlimited for this app's text data. First boot auto-creates tables + seed.

Docker is supported too (`Dockerfile`, `docker-compose.yml` included):
`docker compose up -d --build`.

## 📁 Project map

```
src/
├── app/
│   ├── (auth)/           # login / signup (split-panel layout)
│   ├── (app)/            # guarded app: dashboard, library, 3D shelf, insights, settings
│   └── api/              # auth, books CRUD, cover search proxy, settings, health
├── components/           # shelf-scene (3D), drawer, dialogs, charts, ui kit
├── db/                   # schema, pg pool, self-healing seeder
└── lib/                  # auth sessions, queries/stats, Open Library, utils
```

## 🙏 Credits

Cover art and book metadata: [Open Library](https://openlibrary.org) ·
Auth page photography: Pexels · Icons: [Lucide](https://lucide.dev)
