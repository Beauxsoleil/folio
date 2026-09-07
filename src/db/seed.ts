import fs from "node:fs";
import path from "node:path";

// Load .env when executed as a standalone script (`npx tsx src/db/seed.ts`).
if (!process.env.DATABASE_URL) {
  try {
    const env = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
    const line = env.split("\n").find((l) => l.startsWith("DATABASE_URL="));
    if (line) process.env.DATABASE_URL = line.slice("DATABASE_URL=".length).trim();
  } catch {
    // ignore — the db module will throw a helpful error if still missing
  }
}

import { sql } from "drizzle-orm";
import { books, readingLogs, users, type BookStatus } from "@/db/schema";
import { hashPassword } from "@/lib/crypto";
import { resolveCover } from "@/lib/openlibrary";
import { dayKey } from "@/lib/utils";

// The db client reads DATABASE_URL at import time, so load it lazily — the
// .env fallback above must execute first when this file runs standalone.
async function getDb() {
  const { db } = await import("@/db");
  return db;
}

export const DEMO_EMAIL = "demo@folio.app";
export const DEMO_PASSWORD = "bookworm";

/**
 * Self-healing DDL so a brand-new database is provisioned on first boot even
 * before `drizzle-kit push` has run. Mirrors src/db/schema.ts exactly.
 */
async function ensureTables() {
  const db = await getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      name text NOT NULL,
      password_hash text NOT NULL,
      reading_goal integer NOT NULL DEFAULT 24,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS books (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title text NOT NULL,
      author text NOT NULL,
      isbn text,
      cover_url text,
      open_library_key text,
      status text NOT NULL DEFAULT 'want_to_read',
      rating integer NOT NULL DEFAULT 0,
      genre text NOT NULL DEFAULT 'General',
      current_page integer NOT NULL DEFAULT 0,
      total_pages integer,
      notes text,
      started_at timestamptz,
      finished_at timestamptz,
      position integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS reading_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      day text NOT NULL,
      pages integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS books_user_idx ON books(user_id, position);
    CREATE INDEX IF NOT EXISTS reading_logs_user_idx ON reading_logs(user_id, day);
  `);
}

type SeedBook = {
  title: string;
  author: string;
  genre: string;
  pages: number;
  status: BookStatus;
  rating?: number;
  progress?: number; // 0..1 for reading/paused
  finishedDaysAgo?: number;
  startedDaysAgo?: number;
  notes?: string;
};

const SEED_BOOKS: SeedBook[] = [
  { title: "Project Hail Mary", author: "Andy Weir", genre: "Sci-Fi", pages: 476, status: "reading", progress: 0.62, startedDaysAgo: 9, notes: "Ryland Grace is such a fun narrator. The science puzzles feel earned." },
  { title: "Piranesi", author: "Susanna Clarke", genre: "Fantasy", pages: 245, status: "reading", progress: 0.38, startedDaysAgo: 5 },
  { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", genre: "Sci-Fi", pages: 304, status: "reading", progress: 0.81, startedDaysAgo: 16 },
  { title: "Klara and the Sun", author: "Kazuo Ishiguro", genre: "Literary", pages: 303, status: "paused", progress: 0.45, startedDaysAgo: 40 },
  { title: "Dune", author: "Frank Herbert", genre: "Sci-Fi", pages: 688, status: "finished", rating: 5, finishedDaysAgo: 18, startedDaysAgo: 45, notes: "Lived up to the hype. The ecology-as-worldbuilding is unmatched." },
  { title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "Fantasy", pages: 662, status: "finished", rating: 5, finishedDaysAgo: 52, startedDaysAgo: 74 },
  { title: "Circe", author: "Madeline Miller", genre: "Fantasy", pages: 393, status: "finished", rating: 5, finishedDaysAgo: 88, startedDaysAgo: 102, notes: "Gorgeous prose. Best myth retelling I've read." },
  { title: "The Midnight Library", author: "Matt Haig", genre: "Literary", pages: 288, status: "finished", rating: 4, finishedDaysAgo: 120, startedDaysAgo: 130 },
  { title: "Educated", author: "Tara Westover", genre: "Memoir", pages: 334, status: "finished", rating: 5, finishedDaysAgo: 151, startedDaysAgo: 165 },
  { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", genre: "History", pages: 443, status: "finished", rating: 4, finishedDaysAgo: 190, startedDaysAgo: 214 },
  { title: "The Silent Patient", author: "Alex Michaelides", genre: "Thriller", pages: 325, status: "finished", rating: 4, finishedDaysAgo: 228, startedDaysAgo: 237 },
  { title: "Atomic Habits", author: "James Clear", genre: "Self-Help", pages: 320, status: "finished", rating: 4, finishedDaysAgo: 262, startedDaysAgo: 276 },
  { title: "The Song of Achilles", author: "Madeline Miller", genre: "Fantasy", pages: 378, status: "finished", rating: 5, finishedDaysAgo: 300, startedDaysAgo: 316 },
  { title: "The Martian", author: "Andy Weir", genre: "Sci-Fi", pages: 369, status: "finished", rating: 4, finishedDaysAgo: 340, startedDaysAgo: 352 },
  { title: "1984", author: "George Orwell", genre: "Classics", pages: 328, status: "finished", rating: 5, finishedDaysAgo: 390, startedDaysAgo: 405 },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Classics", pages: 180, status: "finished", rating: 3, finishedDaysAgo: 420, startedDaysAgo: 428, notes: "Short and sharp. The green light stays with you." },
  { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", genre: "Literary", pages: 389, status: "want_to_read" },
  { title: "Babel", author: "R. F. Kuang", genre: "Fantasy", pages: 545, status: "want_to_read" },
  { title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", genre: "Literary", pages: 401, status: "want_to_read" },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", genre: "Psychology", pages: 499, status: "want_to_read" },
  { title: "The Hobbit", author: "J. R. R. Tolkien", genre: "Fantasy", pages: 310, status: "want_to_read" },
  { title: "A Little Life", author: "Hanya Yanagihara", genre: "Literary", pages: 720, status: "want_to_read" },
];

/** Mulberry32 — deterministic PRNG so repeated seeds look identical. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Resolve all covers with a small concurrency pool (Open Library is slow). */
async function resolveAllCovers() {
  const results: Array<{ coverUrl: string | null; key: string | null; isbn: string | null }> =
    new Array(SEED_BOOKS.length);
  let cursor = 0;
  const POOL = 8;
  await Promise.all(
    Array.from({ length: POOL }, async () => {
      while (cursor < SEED_BOOKS.length) {
        const i = cursor++;
        const s = SEED_BOOKS[i];
        results[i] = await resolveCover(s.title, s.author);
      }
    })
  );
  return results;
}

export async function ensureSeed(): Promise<void> {
  await ensureTables();
  const db = await getDb();
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) return;

  console.log("[folio] empty database — resolving cover art…");
  const covers = await resolveAllCovers();

  console.log("[folio] seeding demo library…");
  const rand = rng(42);

  const [demo] = await db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      name: "Avery Quinn",
      passwordHash: hashPassword(DEMO_PASSWORD),
      readingGoal: 30,
    })
    .returning();

  const now = Date.now();
  const DAY = 1000 * 60 * 60 * 24;
  const logRows: Array<typeof readingLogs.$inferInsert> = [];

  for (let i = 0; i < SEED_BOOKS.length; i++) {
    const s = SEED_BOOKS[i];
    const { coverUrl, key, isbn } = covers[i] ?? { coverUrl: null, key: null, isbn: null };

    const currentPage =
      s.status === "finished"
        ? s.pages
        : s.progress
          ? Math.round(s.pages * s.progress)
          : 0;
    const startedAt = s.startedDaysAgo ? new Date(now - s.startedDaysAgo * DAY) : null;
    const finishedAt = s.finishedDaysAgo ? new Date(now - s.finishedDaysAgo * DAY) : null;
    const addedAt = new Date(now - (s.startedDaysAgo ?? s.finishedDaysAgo ?? 5 + i) * DAY - i * 3600_000);

    const [inserted] = await db
      .insert(books)
      .values({
        userId: demo.id,
        title: s.title,
        author: s.author,
        genre: s.genre,
        status: s.status,
        rating: s.rating ?? 0,
        coverUrl,
        isbn,
        openLibraryKey: key,
        totalPages: s.pages,
        currentPage,
        notes: s.notes ?? null,
        startedAt: s.status !== "want_to_read" ? startedAt : null,
        finishedAt: s.status === "finished" ? finishedAt : null,
        position: i + 1,
        createdAt: addedAt,
        updatedAt: new Date(now - rand() * 5 * DAY),
      })
      .returning();

    // Fabricate believable daily page logs leading up to now / finish date.
    if (s.status === "finished" || s.status === "reading" || s.status === "paused") {
      const endDay = s.status === "finished" ? (s.finishedDaysAgo ?? 30) : 0;
      const startDay = s.startedDaysAgo ?? endDay + 14;
      let pagesLeft = currentPage;
      let day = endDay;
      // Walk backwards from the end date, logging chunks on most days.
      while (pagesLeft > 0 && day <= startDay + 200) {
        if (rand() > 0.28) {
          const chunk = Math.min(pagesLeft, 12 + Math.floor(rand() * 38));
          pagesLeft -= chunk;
          const d = new Date(now - day * DAY);
          logRows.push({ userId: demo.id, bookId: inserted.id, day: dayKey(d), pages: chunk });
        }
        day += 1;
      }
    }
  }

  // Guarantee an active streak over the last three days.
  const anyReading = await db.select({ id: books.id, userId: books.userId }).from(books).limit(1);
  if (anyReading[0]) {
    for (let back = 0; back < 3; back++) {
      const d = new Date(now - back * DAY);
      logRows.push({ userId: demo.id, bookId: anyReading[0].id, day: dayKey(d), pages: 18 + Math.floor(rand() * 20) });
    }
  }

  await db.insert(readingLogs).values(logRows);
  console.log(`[folio] seeded ${SEED_BOOKS.length} books and ${logRows.length} reading logs`);
}

// Standalone execution: `npx tsx src/db/seed.ts`
if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  ensureSeed()
    .then(() => {
      console.log("[folio] seed complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[folio] seed failed", err);
      process.exit(1);
    });
}
